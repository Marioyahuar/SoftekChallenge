import { ICharacterTraitsRepository } from '../../../../../application/ports/repositories/ICharacterTraitsRepository';
import { CharacterTraits } from '../../../../../domain/entities/CharacterTraits';
import { MySQLConnection } from '../connection';

export class CharacterTraitsRepository implements ICharacterTraitsRepository {
  private db: MySQLConnection;

  constructor() {
    this.db = MySQLConnection.getInstance();
  }

  public async save(traits: CharacterTraits): Promise<void> {
    const query = `
      INSERT INTO character_traits (
        character_id, environment_traits, physical_traits, 
        personality_traits, archetype_traits
      ) VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        environment_traits = VALUES(environment_traits),
        physical_traits = VALUES(physical_traits),
        personality_traits = VALUES(personality_traits),
        archetype_traits = VALUES(archetype_traits),
        calculated_at = CURRENT_TIMESTAMP
    `;

    const params = [
      traits.characterId,
      JSON.stringify(traits.environmentTraits),
      JSON.stringify(traits.physicalTraits),
      JSON.stringify(traits.personalityTraits),
      JSON.stringify(traits.archetypeTraits),
    ];

    await this.db.execute(query, params);
  }

  public async findByCharacterId(characterId: number): Promise<CharacterTraits | null> {
    const query = `SELECT * FROM character_traits WHERE character_id = ?`;
    const rows = await this.db.query(query, [characterId]) as any[];

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToCharacterTraits(rows[0]);
  }

  public async update(traits: CharacterTraits): Promise<void> {
    const query = `
      UPDATE character_traits 
      SET environment_traits = ?, physical_traits = ?, 
          personality_traits = ?, archetype_traits = ?,
          calculated_at = CURRENT_TIMESTAMP
      WHERE character_id = ?
    `;

    const params = [
      JSON.stringify(traits.environmentTraits),
      JSON.stringify(traits.physicalTraits),
      JSON.stringify(traits.personalityTraits),
      JSON.stringify(traits.archetypeTraits),
      traits.characterId,
    ];

    await this.db.execute(query, params);
  }

  public async delete(characterId: number): Promise<void> {
    const query = `DELETE FROM character_traits WHERE character_id = ?`;
    await this.db.execute(query, [characterId]);
  }

  public async findAll(): Promise<CharacterTraits[]> {
    const query = `SELECT * FROM character_traits ORDER BY character_id`;
    const rows = await this.db.query(query) as any[];
    return rows.map(row => this.mapRowToCharacterTraits(row));
  }

  private mapRowToCharacterTraits(row: any): CharacterTraits {
    return CharacterTraits.create({
      characterId: row.character_id,
      environmentTraits: this.parseTraitField(row.environment_traits),
      physicalTraits: this.parseTraitField(row.physical_traits),
      personalityTraits: this.parseTraitField(row.personality_traits),
      archetypeTraits: this.parseTraitField(row.archetype_traits),
    });
  }

  private parseTraitField(field: any): string[] {
    if (!field) return [];
    
    // Si ya es un array, devolverlo directamente
    if (Array.isArray(field)) {
      return field;
    }
    
    // Si es string, intentar parsearlo como JSON
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        // Si no es array después del parse, tratarlo como string separado por comas
        return field.split(',').map(t => t.trim()).filter(t => t.length > 0);
      } catch (error) {
        // Si falla el parse, tratarlo como string separado por comas
        return field.split(',').map(t => t.trim()).filter(t => t.length > 0);
      }
    }
    
    return [];
  }
}