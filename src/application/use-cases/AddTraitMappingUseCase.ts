import { ITraitMappingRepository, TraitPokemonMapping } from '../ports/repositories/ITraitMappingRepository';

export interface AddTraitMappingRequest {
  traitName: string;
  pokemonId: number;
  weight: number;
  reasoning: string;
  category: 'environment' | 'physical' | 'personality' | 'archetype';
  userId: string;
}

export class AddTraitMappingUseCase {
  constructor(private traitMappingRepository: ITraitMappingRepository) {}

  public async execute(request: AddTraitMappingRequest): Promise<TraitPokemonMapping> {
    this.validateRequest(request);

    // Check if this exact mapping already exists
    const existingMappings = await this.traitMappingRepository.findByTraitName(request.traitName);
    const duplicateMapping = existingMappings.find(m => m.pokemonId === request.pokemonId);
    
    if (duplicateMapping) {
      throw new Error(`Mapping between trait '${request.traitName}' and Pokemon ${request.pokemonId} already exists`);
    }

    const mapping: TraitPokemonMapping = {
      traitName: request.traitName.trim().toLowerCase(),
      pokemonId: request.pokemonId,
      weight: request.weight,
      reasoning: request.reasoning.trim(),
      category: request.category,
      active: true
    };

    await this.traitMappingRepository.save(mapping);
    
    return mapping;
  }

  private validateRequest(request: AddTraitMappingRequest): void {
    if (!request.traitName || request.traitName.trim().length === 0) {
      throw new Error('Trait name is required and cannot be empty');
    }

    if (request.traitName.length > 100) {
      throw new Error('Trait name cannot exceed 100 characters');
    }

    if (!request.pokemonId || request.pokemonId <= 0 || request.pokemonId > 1010) {
      throw new Error('Pokemon ID must be between 1 and 1010');
    }

    if (request.weight < 0 || request.weight > 1) {
      throw new Error('Weight must be between 0 and 1');
    }

    if (!request.reasoning || request.reasoning.trim().length === 0) {
      throw new Error('Reasoning is required and cannot be empty');
    }

    if (request.reasoning.length > 500) {
      throw new Error('Reasoning cannot exceed 500 characters');
    }

    if (!request.userId || request.userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    const validCategories = ['environment', 'physical', 'personality', 'archetype'];
    if (!validCategories.includes(request.category)) {
      throw new Error(`Category must be one of: ${validCategories.join(', ')}`);
    }
  }
}