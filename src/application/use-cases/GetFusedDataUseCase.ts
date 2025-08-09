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
    private characterTraitsRepository: ICharacterTraitsRepository
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

      const cachedResult = await this.cacheService.getFusionResult(
        characterId,
        strategy,
        theme
      );

      if (cachedResult) {
        cacheHit = true;
        results.push(cachedResult);
        continue;
      }

      const swCharacter = await this.swapiService.getCharacter(characterId);
      apiCallsMade++;

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