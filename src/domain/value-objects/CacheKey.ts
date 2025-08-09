export class CacheKey {
  private constructor(private readonly value: string) {}

  public static createFusionKey(characterId: number, strategy: string, theme?: string): CacheKey {
    const baseKey = `fusion:character:${characterId}:${strategy}`;
    const key = theme ? `${baseKey}:${theme}` : baseKey;
    return new CacheKey(key);
  }

  public static createCharacterTraitsKey(characterId: number): CacheKey {
    return new CacheKey(`character:traits:${characterId}`);
  }

  public static createPokemonDataKey(pokemonId: number): CacheKey {
    return new CacheKey(`pokemon:data:${pokemonId}`);
  }

  public static createTraitMappingsKey(): CacheKey {
    return new CacheKey('mappings:all');
  }

  public getValue(): string {
    return this.value;
  }

  public toString(): string {
    return this.value;
  }
}