export interface TraitPokemonMapping {
  id?: number;
  traitName: string;
  pokemonId: number;
  weight: number;
  reasoning: string;
  category: 'environment' | 'physical' | 'personality' | 'archetype';
  active: boolean;
  createdAt?: Date;
}

export interface ITraitMappingRepository {
  save(mapping: TraitPokemonMapping): Promise<void>;
  findByTraitName(traitName: string): Promise<TraitPokemonMapping[]>;
  findByPokemonId(pokemonId: number): Promise<TraitPokemonMapping[]>;
  findAll(): Promise<TraitPokemonMapping[]>;
  findActiveByTraitName(traitName: string): Promise<TraitPokemonMapping[]>;
  update(mapping: TraitPokemonMapping): Promise<void>;
  delete(id: number): Promise<void>;
  deactivate(id: number): Promise<void>;
}