import { IFusedDataRepository } from "../../../../../application/ports/repositories/IFusedDataRepository";
import { FusedCharacter } from "../../../../../domain/entities/FusedCharacter";
import { StarWarsCharacter } from "../../../../../domain/entities/StarWarsCharacter";
import { Pokemon } from "../../../../../domain/entities/Pokemon";
import { CharacterTraits } from "../../../../../domain/entities/CharacterTraits";
import { FusionStrategy } from "../../../../../domain/value-objects/FusionStrategy";
import { MySQLConnection } from "../connection";

export class FusedDataRepository implements IFusedDataRepository {
  private db: MySQLConnection;

  constructor() {
    this.db = MySQLConnection.getInstance();
  }

  public async save(fusedCharacter: FusedCharacter): Promise<void> {
    const query = `
      INSERT INTO fused_data (
        id, swapi_character_id, pokemon_id, fusion_strategy, fusion_score,
        fusion_reason, matching_traits, compatibility_level, full_response,
        request_params, user_id, processing_time_ms, api_calls_made, cache_hit
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      fusedCharacter.id,
      fusedCharacter.starWarsCharacter.id,
      fusedCharacter.pokemonCompanion.id,
      fusedCharacter.fusionStrategy.toString(),
      fusedCharacter.fusionAnalysis.fusionScore,
      fusedCharacter.fusionAnalysis.fusionReason,
      JSON.stringify(fusedCharacter.fusionAnalysis.matchingTraits),
      fusedCharacter.fusionAnalysis.compatibilityLevel,
      JSON.stringify(fusedCharacter.toJSON()),
      JSON.stringify({}),
      null,
      fusedCharacter.metadata.processingTimeMs,
      fusedCharacter.metadata.apiCallsMade,
      fusedCharacter.metadata.cacheHit ? 1 : 0,
    ];

    await this.db.execute(query, params);
  }

  public async findById(id: string): Promise<FusedCharacter | null> {
    const query = `
      SELECT * FROM fused_data WHERE id = ?
    `;

    const rows = (await this.db.execute(query, [id])) as any[];

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToFusedCharacter(rows[0]);
  }

  public async findByUserId(
    userId: string,
    page: number,
    limit: number
  ): Promise<{
    data: FusedCharacter[];
    total: number;
    page: number;
    limit: number;
  }> {
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offsetNum = (pageNum - 1) * limitNum;
    console.log(userId, pageNum, limitNum, offsetNum);
    const countQuery = `
      SELECT COUNT(*) as total FROM fused_data WHERE user_id = ?
    `;

    const dataQuery = `
      SELECT * FROM fused_data 
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ${limitNum} OFFSET ${offsetNum}
    `;
    console.log("COUNT: ", countQuery);
    console.log("DATA: ", dataQuery);
    const [countRows, dataRows] = await Promise.all([
      this.db.execute(countQuery, [userId]),
      this.db.query(dataQuery, [userId]), // aquí uso query, no execute
    ]);

    const total = (countRows as any[])[0].total;
    const data = (dataRows as any[]).map((row) =>
      this.mapRowToFusedCharacter(row)
    );

    return { data, total, page, limit };
  }

  public async findAll(
    page: number,
    limit: number,
    sortBy = "created_at",
    order: "asc" | "desc" = "desc"
  ): Promise<{
    data: FusedCharacter[];
    total: number;
    page: number;
    limit: number;
  }> {
    const offset = (page - 1) * limit;
    const allowedSortFields = ["created_at", "fusion_score", "fusion_strategy"];
    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "created_at";
    const safeOrder = order === "asc" ? "ASC" : "DESC";

    const countQuery = `SELECT COUNT(*) as total FROM fused_data`;
    const dataQuery = `
      SELECT * FROM fused_data 
      ORDER BY ${safeSortBy} ${safeOrder}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [countRows, dataRows] = await Promise.all([
      this.db.query(countQuery),
      this.db.query(dataQuery),
    ]);

    const total = (countRows as any[])[0].total;
    const data = (dataRows as any[]).map((row) => {
      console.log("Fila raw:", row);
      return this.mapRowToFusedCharacter(row);
    });

    return { data, total, page, limit };
  }

  public async delete(id: string): Promise<void> {
    const query = `DELETE FROM fused_data WHERE id = ?`;
    await this.db.execute(query, [id]);
  }

  private mapRowToFusedCharacter(row: any): FusedCharacter {
    const fullResponse = typeof row.full_response === 'string' 
      ? JSON.parse(row.full_response) 
      : row.full_response;

    const starWarsCharacter = StarWarsCharacter.create({
      id: row.swapi_character_id,
      name: fullResponse.data.starWarsCharacter.name,
      height: fullResponse.data.starWarsCharacter.height.toString(),
      mass: fullResponse.data.starWarsCharacter.mass,
      birth_year: "",
      species: "",
      gender: "",
      homeworld: fullResponse.data.starWarsCharacter.homeworld,
    });

    const pokemon = Pokemon.create({
      id: row.pokemon_id,
      name: fullResponse.data.pokemonCompanion.name,
      types: fullResponse.data.pokemonCompanion.types,
      stats: fullResponse.data.pokemonCompanion.stats,
      sprites: fullResponse.data.pokemonCompanion.sprites,
      height: 0,
      weight: 0,
    });

    const fusionStrategy = FusionStrategy.create(row.fusion_strategy);

    // Extract character traits from the stored response
    const characterTraits = CharacterTraits.create({
      characterId: row.swapi_character_id,
      environmentTraits: fullResponse.data.starWarsCharacter.traits.environmentTraits || [],
      physicalTraits: fullResponse.data.starWarsCharacter.traits.physicalTraits || [],
      personalityTraits: fullResponse.data.starWarsCharacter.traits.personalityTraits || [],
      archetypeTraits: fullResponse.data.starWarsCharacter.traits.archetypeTraits || []
    });

    return new FusedCharacter(
      row.id,
      row.created_at.toISOString(),
      starWarsCharacter,
      pokemon,
      fusionStrategy,
      {
        fusionScore: row.fusion_score,
        fusionReason: row.fusion_reason,
        matchingTraits: typeof row.matching_traits === 'string' 
          ? JSON.parse(row.matching_traits) 
          : row.matching_traits,
        compatibilityLevel: row.compatibility_level,
      },
      {
        cacheHit: row.cache_hit === 1,
        apiCallsMade: row.api_calls_made,
        processingTimeMs: row.processing_time_ms,
      },
      characterTraits
    );
  }
}
