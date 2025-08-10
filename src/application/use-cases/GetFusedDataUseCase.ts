import { v4 as uuidv4 } from 'uuid';
import { FusedCharacter } from '../../domain/entities/FusedCharacter';
import { FusionStrategy } from '../../domain/value-objects/FusionStrategy';
import { FusionScore } from '../../domain/value-objects/FusionScore';
import { SwapiService } from '../../infrastructure/adapters/external-apis/swapi/SwapiService';
import { PokeApiService } from '../../infrastructure/adapters/external-apis/pokeapi/PokeApiService';
import { TraitExtractionService } from '../services/TraitExtractionService';
import { PokemonMatchingService } from '../services/PokemonMatchingService';
import { HybridCacheService } from '../services/HybridCacheService';
import { IFusedDataRepository } from '../ports/repositories/IFusedDataRepository';
import { ICharacterTraitsRepository } from '../ports/repositories/ICharacterTraitsRepository';
import { ISwapiCharacterRepository } from '../../infrastructure/adapters/database/mysql/repositories/SwapiCharacterRepository';

export interface GetFusedDataRequest {
  character?: number;
  strategy?: string;
  theme?: string;
  limit?: number;
  random?: boolean;
}

export class GetFusedDataUseCase {
  constructor(
    private swapiService: SwapiService,
    private pokeApiService: PokeApiService,
    private traitExtractionService: TraitExtractionService,
    private pokemonMatchingService: PokemonMatchingService,
    private cacheService: HybridCacheService,
    private fusedDataRepository: IFusedDataRepository,
    private characterTraitsRepository: ICharacterTraitsRepository,
    private swapiCharacterRepository: ISwapiCharacterRepository
  ) {}

  public async execute(request: GetFusedDataRequest): Promise<FusedCharacter[]> {
    const startTime = Date.now();
    let apiCallsMade = 0;
    let cacheHit = false;

    const {
      character = await this.getRandomCharacterId(request.random),
      strategy = 'intelligent',
      theme,
      limit = 1,
    } = request;

    if (limit < 1 || limit > 10) {
      throw new Error('Limit must be between 1 and 10');
    }

    const results: FusedCharacter[] = [];

    for (let i = 0; i < limit; i++) {
      const characterId = i === 0 ? character : await this.getRandomCharacterId(true);
      const fusionStrategy = FusionStrategy.create(strategy);

      console.log('DEBUG Cache Check:', {
        characterId,
        strategy,
        theme,
        cacheKey: `fusion:character:${characterId}:${strategy}${theme ? ':' + theme : ''}`
      });

      const cachedResult = await this.cacheService.getFusionResult(
        characterId,
        strategy,
        theme
      );

      if (cachedResult) {
        console.log('DEBUG Cache HIT:', {
          characterId,
          cachedCharacterId: cachedResult.starWarsCharacter?.id,
          cachedCharacterName: cachedResult.starWarsCharacter?.name
        });
        cacheHit = true;
        results.push(cachedResult);
        continue;
      }

      console.log('DEBUG Cache MISS:', { characterId, strategy, theme });

      const { character: swCharacter, apiCallsCount } = await this.swapiService.getCharacter(characterId);
      apiCallsMade += apiCallsCount;

      // Save the character to the database first (required for FK constraint)
      await this.swapiCharacterRepository.save(swCharacter);

      let traits = await this.characterTraitsRepository.findByCharacterId(characterId);
      
      if (!traits) {
        traits = this.traitExtractionService.extractTraits(swCharacter);
        await this.characterTraitsRepository.save(traits);
      }

      await this.cacheService.storeCharacterTraits(traits);

      const pokemonMatch = await this.pokemonMatchingService.findBestMatch(
        traits,
        fusionStrategy,
        theme
      );
      apiCallsMade++;

      await this.cacheService.storePokemonData(pokemonMatch.pokemon);

      const processingTime = Date.now() - startTime;
      
      const fusedCharacter = FusedCharacter.create({
        id: uuidv4(),
        starWarsCharacter: swCharacter,
        pokemonCompanion: pokemonMatch.pokemon,
        fusionStrategy,
        fusionScore: pokemonMatch.fusionScore,
        fusionReason: pokemonMatch.fusionReason,
        matchingTraits: pokemonMatch.matchingTraits,
        metadata: {
          cacheHit: i === 0 ? cacheHit : false,
          apiCallsMade,
          processingTimeMs: processingTime,
        },
      });

      await this.fusedDataRepository.save(fusedCharacter);

      console.log('DEBUG Cache STORE:', {
        characterId,
        strategy,
        theme,
        storedCharacterId: fusedCharacter.starWarsCharacter?.id,
        storedCharacterName: fusedCharacter.starWarsCharacter?.name
      });

      await this.cacheService.storeFusionResult(
        characterId,
        strategy,
        fusedCharacter,
        theme
      );

      results.push(fusedCharacter);
    }

    return results;
  }

  private async getRandomCharacterId(random = false): Promise<number> {
    if (random) {
      return await this.swapiService.getRandomCharacterId();
    }
    
    return 1;
  }
}