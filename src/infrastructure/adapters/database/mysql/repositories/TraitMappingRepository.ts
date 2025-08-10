import { ITraitMappingRepository, TraitPokemonMapping } from '../../../../../application/ports/repositories/ITraitMappingRepository';
import { MySQLConnection } from '../connection';

export class TraitMappingRepository implements ITraitMappingRepository {
  private db: MySQLConnection;

  constructor() {
    this.db = MySQLConnection.getInstance();
  }

  public async save(mapping: TraitPokemonMapping): Promise<void> {
    const query = `
      INSERT INTO trait_pokemon_mappings (
        trait_name, pokemon_id, weight, reasoning, category, active
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const params = [
      mapping.traitName,
      mapping.pokemonId,
      mapping.weight,
      mapping.reasoning,
      mapping.category,
      mapping.active
    ];

    await this.db.execute(query, params);
  }

  public async findByTraitName(traitName: string): Promise<TraitPokemonMapping[]> {
    const query = `SELECT * FROM trait_pokemon_mappings WHERE trait_name = ? ORDER BY weight DESC`;
    const rows = await this.db.query(query, [traitName]) as any[];
    return rows.map(row => this.mapRowToTraitMapping(row));
  }

  public async findActiveByTraitName(traitName: string): Promise<TraitPokemonMapping[]> {
    const query = `SELECT * FROM trait_pokemon_mappings WHERE trait_name = ? AND active = TRUE ORDER BY weight DESC`;
    const rows = await this.db.query(query, [traitName]) as any[];
    return rows.map(row => this.mapRowToTraitMapping(row));
  }

  public async findByPokemonId(pokemonId: number): Promise<TraitPokemonMapping[]> {
    const query = `SELECT * FROM trait_pokemon_mappings WHERE pokemon_id = ? ORDER BY weight DESC`;
    const rows = await this.db.query(query, [pokemonId]) as any[];
    return rows.map(row => this.mapRowToTraitMapping(row));
  }

  public async findAll(): Promise<TraitPokemonMapping[]> {
    const query = `SELECT * FROM trait_pokemon_mappings ORDER BY trait_name, weight DESC`;
    const rows = await this.db.query(query) as any[];
    return rows.map(row => this.mapRowToTraitMapping(row));
  }

  public async update(mapping: TraitPokemonMapping): Promise<void> {
    const query = `
      UPDATE trait_pokemon_mappings 
      SET trait_name = ?, pokemon_id = ?, weight = ?, reasoning = ?, category = ?, active = ?
      WHERE id = ?
    `;

    const params = [
      mapping.traitName,
      mapping.pokemonId,
      mapping.weight,
      mapping.reasoning,
      mapping.category,
      mapping.active,
      mapping.id
    ];

    await this.db.execute(query, params);
  }

  public async delete(id: number): Promise<void> {
    const query = `DELETE FROM trait_pokemon_mappings WHERE id = ?`;
    await this.db.execute(query, [id]);
  }

  public async deactivate(id: number): Promise<void> {
    const query = `UPDATE trait_pokemon_mappings SET active = FALSE WHERE id = ?`;
    await this.db.execute(query, [id]);
  }

  private mapRowToTraitMapping(row: any): TraitPokemonMapping {
    return {
      id: row.id,
      traitName: row.trait_name,
      pokemonId: row.pokemon_id,
      weight: parseFloat(row.weight),
      reasoning: row.reasoning,
      category: row.category,
      active: Boolean(row.active),
      createdAt: row.created_at
    };
  }
}