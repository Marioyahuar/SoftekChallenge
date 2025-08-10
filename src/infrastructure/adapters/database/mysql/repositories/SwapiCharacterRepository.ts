import { StarWarsCharacter } from '../../../../../domain/entities/StarWarsCharacter';
import { MySQLConnection } from '../connection';

export interface ISwapiCharacterRepository {
  save(character: StarWarsCharacter): Promise<void>;
  findById(id: number): Promise<StarWarsCharacter | null>;
}

export class SwapiCharacterRepository implements ISwapiCharacterRepository {
  private db: MySQLConnection;

  constructor() {
    this.db = MySQLConnection.getInstance();
  }

  public async save(character: StarWarsCharacter): Promise<void> {
    // First, save the planet if it doesn't exist
    const planetQuery = `
      INSERT INTO swapi_planets (id, name, climate, terrain, population)
      SELECT ?, ?, ?, ?, ? FROM DUAL
      WHERE NOT EXISTS (SELECT 1 FROM swapi_planets WHERE id = ?)
    `;

    const homeworldId = this.extractHomeworldId(character);
    
    await this.db.execute(planetQuery, [
      homeworldId,
      character.homeworld?.name || 'Unknown',
      character.homeworld?.climate || 'unknown',
      character.homeworld?.terrain || 'unknown',
      'unknown', // population not available in the character data
      homeworldId
    ]);

    // Then save the character
    const characterQuery = `
      INSERT INTO swapi_characters (
        id, name, height, mass, birth_year, species, homeworld_id, gender
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        height = VALUES(height),
        mass = VALUES(mass),
        birth_year = VALUES(birth_year),
        species = VALUES(species),
        homeworld_id = VALUES(homeworld_id),
        gender = VALUES(gender)
    `;

    const params = [
      character.id,
      character.name || null,
      character.height || null,
      character.mass || null,
      character.birthYear || null,
      character.species || null,
      homeworldId,
      character.gender || null,
    ];

    await this.db.execute(characterQuery, params);
  }

  public async findById(id: number): Promise<StarWarsCharacter | null> {
    const query = `
      SELECT c.*, p.name as planet_name, p.climate, p.terrain
      FROM swapi_characters c
      LEFT JOIN swapi_planets p ON c.homeworld_id = p.id
      WHERE c.id = ?
    `;
    
    const rows = await this.db.query(query, [id]) as any[];

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    
    return StarWarsCharacter.create({
      id: row.id,
      name: row.name,
      height: row.height?.toString() || 'unknown',
      mass: row.mass || 'unknown',
      birth_year: row.birth_year || 'unknown',
      species: row.species || 'unknown',
      gender: row.gender || 'unknown',
      homeworld: {
        name: row.planet_name || 'Unknown',
        climate: row.climate || 'unknown',
        terrain: row.terrain || 'unknown',
      },
    });
  }


  private extractHomeworldId(character: StarWarsCharacter): number {
    // Since we don't have the homeworld ID in the character entity,
    // we'll need to generate one based on the planet name
    // This is a simple hash function - in a real app you'd want a better approach
    let hash = 0;
    const str = character.homeworld.name;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash % 1000) + 1; // Keep it positive and reasonable
  }
}