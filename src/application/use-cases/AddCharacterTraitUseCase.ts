import { ICharacterTraitsRepository } from '../ports/repositories/ICharacterTraitsRepository';
import { CharacterTraits } from '../../domain/entities/CharacterTraits';

export interface AddCharacterTraitRequest {
  characterId: number;
  traitName: string;
  category: 'environment' | 'physical' | 'personality' | 'archetype';
  reasoning?: string;
  userId: string;
}

export class AddCharacterTraitUseCase {
  constructor(private characterTraitsRepository: ICharacterTraitsRepository) {}

  public async execute(request: AddCharacterTraitRequest): Promise<CharacterTraits> {
    this.validateRequest(request);

    // Check if character traits exist
    const existingTraits = await this.characterTraitsRepository.findByCharacterId(request.characterId);
    
    if (!existingTraits) {
      throw new Error(`Character ${request.characterId} not found. The character must exist in the system before adding custom traits.`);
    }

    // Add the new trait to the appropriate category
    const updatedTraits = this.addTraitToCharacter(existingTraits, request);
    
    // Save updated traits
    await this.characterTraitsRepository.update(updatedTraits);
    
    return updatedTraits;
  }

  private validateRequest(request: AddCharacterTraitRequest): void {
    if (!request.characterId || request.characterId <= 0) {
      throw new Error('Character ID is required and must be a positive integer');
    }

    if (!request.traitName || request.traitName.trim().length === 0) {
      throw new Error('Trait name is required and cannot be empty');
    }

    if (request.traitName.length > 100) {
      throw new Error('Trait name cannot exceed 100 characters');
    }

    if (!request.userId || request.userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    const validCategories = ['environment', 'physical', 'personality', 'archetype'];
    if (!validCategories.includes(request.category)) {
      throw new Error(`Category must be one of: ${validCategories.join(', ')}`);
    }

    if (request.reasoning && request.reasoning.length > 500) {
      throw new Error('Reasoning cannot exceed 500 characters');
    }
  }

  private addTraitToCharacter(traits: CharacterTraits, request: AddCharacterTraitRequest): CharacterTraits {
    const traitToAdd = request.traitName.trim().toLowerCase();
    
    // Get the current traits for the category
    let categoryTraits: string[];
    
    switch (request.category) {
      case 'environment':
        categoryTraits = [...traits.environmentTraits];
        break;
      case 'physical':
        categoryTraits = [...traits.physicalTraits];
        break;
      case 'personality':
        categoryTraits = [...traits.personalityTraits];
        break;
      case 'archetype':
        categoryTraits = [...traits.archetypeTraits];
        break;
      default:
        throw new Error(`Invalid category: ${request.category}`);
    }

    // Check if trait already exists
    if (categoryTraits.includes(traitToAdd)) {
      throw new Error(`Trait '${traitToAdd}' already exists in category '${request.category}' for character ${request.characterId}`);
    }

    // Add the new trait
    categoryTraits.push(traitToAdd);

    // Create updated traits object
    const updatedTraitsData = {
      characterId: traits.characterId,
      environmentTraits: request.category === 'environment' ? categoryTraits : traits.environmentTraits,
      physicalTraits: request.category === 'physical' ? categoryTraits : traits.physicalTraits,
      personalityTraits: request.category === 'personality' ? categoryTraits : traits.personalityTraits,
      archetypeTraits: request.category === 'archetype' ? categoryTraits : traits.archetypeTraits,
    };

    return CharacterTraits.create(updatedTraitsData);
  }
}