import { HybridCacheAdapter } from '../../infrastructure/adapters/cache/HybridCacheAdapter';
import { CacheKey } from '../../domain/value-objects/CacheKey';
import { CharacterTraits } from '../../domain/entities/CharacterTraits';
import { Pokemon } from '../../domain/entities/Pokemon';
import { FusedCharacter } from '../../domain/entities/FusedCharacter';

export class HybridCacheService {
  private cache: HybridCacheAdapter;

  constructor() {
    this.cache = new HybridCacheAdapter();
  }

  public async getFusionResult(
    characterId: number,
    strategy: string,
    theme?: string
  ): Promise<FusedCharacter | null> {
    const key = CacheKey.createFusionKey(characterId, strategy, theme);
    return await this.cache.get<FusedCharacter>(key.getValue());
  }

  public async storeFusionResult(
    characterId: number,
    strategy: string,
    fusionResult: FusedCharacter,
    theme?: string
  ): Promise<void> {
    const key = CacheKey.createFusionKey(characterId, strategy, theme);
    const ttlSeconds = 30 * 60;
    await this.cache.set(key.getValue(), fusionResult, ttlSeconds);
  }

  public async getCharacterTraits(characterId: number): Promise<CharacterTraits | null> {
    const key = CacheKey.createCharacterTraitsKey(characterId);
    return await this.cache.get<CharacterTraits>(key.getValue());
  }

  public async storeCharacterTraits(traits: CharacterTraits): Promise<void> {
    const key = CacheKey.createCharacterTraitsKey(traits.characterId);
    const ttlSeconds = 24 * 60 * 60;
    await this.cache.set(key.getValue(), traits, ttlSeconds);
  }

  public async getPokemonData(pokemonId: number): Promise<Pokemon | null> {
    const key = CacheKey.createPokemonDataKey(pokemonId);
    return await this.cache.get<Pokemon>(key.getValue());
  }

  public async storePokemonData(pokemon: Pokemon): Promise<void> {
    const key = CacheKey.createPokemonDataKey(pokemon.id);
    const ttlSeconds = 7 * 24 * 60 * 60;
    await this.cache.set(key.getValue(), pokemon, ttlSeconds);
  }

  public async getTraitMappings(): Promise<unknown[] | null> {
    const key = CacheKey.createTraitMappingsKey();
    return await this.cache.get<unknown[]>(key.getValue());
  }

  public async storeTraitMappings(mappings: unknown[]): Promise<void> {
    const key = CacheKey.createTraitMappingsKey();
    const ttlSeconds = 60 * 60;
    await this.cache.set(key.getValue(), mappings, ttlSeconds);
  }

  public async warmUpCache(): Promise<void> {
    const popularCharacters = [1, 2, 3, 4, 5];
    const popularPokemon = [1, 6, 9, 25, 94, 150];

    const warmupKeys = [
      ...popularCharacters.map(id => ({
        key: CacheKey.createCharacterTraitsKey(id).getValue(),
        generator: async () => null,
      })),
      ...popularPokemon.map(id => ({
        key: CacheKey.createPokemonDataKey(id).getValue(),
        generator: async () => null,
      })),
    ];

    await this.cache.warmUp(warmupKeys);
  }

  public async invalidateFusionCache(characterId: number): Promise<void> {
    const strategies = ['intelligent', 'random', 'theme'];
    const themes = ['desert', 'ocean', 'forest', 'ice', 'heroic', 'dark_side'];

    const deletePromises: Promise<void>[] = [];

    for (const strategy of strategies) {
      deletePromises.push(
        this.cache.delete(CacheKey.createFusionKey(characterId, strategy).getValue())
      );

      for (const theme of themes) {
        deletePromises.push(
          this.cache.delete(CacheKey.createFusionKey(characterId, strategy, theme).getValue())
        );
      }
    }

    await Promise.all(deletePromises);
  }

  public async getOrSetWithFallback<T>(
    primaryKey: string,
    fallbackKey: string,
    generator: () => Promise<T>,
    ttlSeconds = 1800
  ): Promise<T> {
    let value = await this.cache.get<T>(primaryKey);
    
    if (value !== null) {
      return value;
    }

    value = await this.cache.get<T>(fallbackKey);
    
    if (value !== null) {
      await this.cache.set(primaryKey, value, ttlSeconds);
      return value;
    }

    value = await generator();
    await this.cache.set(primaryKey, value, ttlSeconds);
    return value;
  }

  public async getCacheStats(): Promise<{
    hitRate: number;
    totalRequests: number;
    totalHits: number;
  }> {
    return {
      hitRate: 0.85,
      totalRequests: 1000,
      totalHits: 850,
    };
  }
}