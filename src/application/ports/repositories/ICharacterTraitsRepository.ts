import { CharacterTraits } from '../../../domain/entities/CharacterTraits';

export interface ICharacterTraitsRepository {
  save(traits: CharacterTraits): Promise<void>;
  findByCharacterId(characterId: number): Promise<CharacterTraits | null>;
  update(traits: CharacterTraits): Promise<void>;
  delete(characterId: number): Promise<void>;
  findAll(): Promise<CharacterTraits[]>;
}