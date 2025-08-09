import { TraitExtractionService } from '../../../../application/services/TraitExtractionService';
import { StarWarsCharacter } from '../../../../domain/entities/StarWarsCharacter';

describe('TraitExtractionService', () => {
  let service: TraitExtractionService;

  beforeEach(() => {
    service = new TraitExtractionService();
  });

  describe('extractTraits', () => {
    it('should extract traits for Luke Skywalker', () => {
      const character = StarWarsCharacter.create({
        id: 1,
        name: 'Luke Skywalker',
        height: '172',
        mass: '77',
        birth_year: '19BBY',
        species: 'Human',
        gender: 'male',
        homeworld: {
          name: 'Tatooine',
          climate: 'arid',
          terrain: 'desert'
        }
      });

      const traits = service.extractTraits(character);

      expect(traits.characterId).toBe(1);
      expect(traits.environmentTraits).toContain('desert');
      expect(traits.physicalTraits).toContain('human');
      expect(traits.physicalTraits).toContain('organic');
      expect(traits.physicalTraits).toContain('average_height');
      expect(traits.personalityTraits).toContain('heroic');
      expect(traits.personalityTraits).toContain('brave');
      expect(traits.archetypeTraits).toContain('chosen_one');
      expect(traits.archetypeTraits).toContain('hero');
    });

    it('should extract traits for C-3PO (droid)', () => {
      const character = StarWarsCharacter.create({
        id: 2,
        name: 'C-3PO',
        height: '167',
        mass: '75',
        birth_year: '112BBY',
        species: 'Droid',
        gender: 'n/a',
        homeworld: {
          name: 'Tatooine',
          climate: 'arid',
          terrain: 'desert'
        }
      });

      const traits = service.extractTraits(character);

      expect(traits.environmentTraits).toContain('desert');
      expect(traits.physicalTraits).toContain('mechanical');
      expect(traits.physicalTraits).toContain('artificial');
      expect(traits.physicalTraits).toContain('average_weight');
      expect(traits.personalityTraits).toContain('logical');
      expect(traits.personalityTraits).toContain('loyal');
      expect(traits.archetypeTraits).toContain('droid');
      expect(traits.archetypeTraits).toContain('companion');
    });

    it('should extract traits for Darth Vader', () => {
      const character = StarWarsCharacter.create({
        id: 4,
        name: 'Darth Vader',
        height: '202',
        mass: '136',
        birth_year: '41.9BBY',
        species: 'Human',
        gender: 'male',
        homeworld: {
          name: 'Tatooine',
          climate: 'arid',
          terrain: 'desert'
        }
      });

      const traits = service.extractTraits(character);

      expect(traits.physicalTraits).toContain('tall');
      expect(traits.physicalTraits).toContain('heavy');
      expect(traits.personalityTraits).toContain('dark_side');
      expect(traits.personalityTraits).toContain('intimidating');
      expect(traits.archetypeTraits).toContain('dark_lord');
      expect(traits.archetypeTraits).toContain('villain');
    });

    it('should handle ocean environment', () => {
      const character = StarWarsCharacter.create({
        id: 10,
        name: 'Test Character',
        height: '180',
        mass: '80',
        birth_year: 'unknown',
        species: 'Human',
        gender: 'male',
        homeworld: {
          name: 'Ocean Planet',
          climate: 'temperate ocean',
          terrain: 'ocean'
        }
      });

      const traits = service.extractTraits(character);

      expect(traits.environmentTraits).toContain('ocean');
    });

    it('should handle ice environment', () => {
      const character = StarWarsCharacter.create({
        id: 11,
        name: 'Ice Character',
        height: '170',
        mass: '70',
        birth_year: 'unknown',
        species: 'Human',
        gender: 'male',
        homeworld: {
          name: 'Ice Planet',
          climate: 'frozen',
          terrain: 'ice plains'
        }
      });

      const traits = service.extractTraits(character);

      expect(traits.environmentTraits).toContain('ice');
    });

    it('should handle forest environment', () => {
      const character = StarWarsCharacter.create({
        id: 12,
        name: 'Forest Character',
        height: '160',
        mass: '60',
        birth_year: 'unknown',
        species: 'Human',
        gender: 'male',
        homeworld: {
          name: 'Forest Planet',
          climate: 'temperate',
          terrain: 'forest'
        }
      });

      const traits = service.extractTraits(character);

      expect(traits.environmentTraits).toContain('forest');
    });

    it('should handle unknown mass', () => {
      const character = StarWarsCharacter.create({
        id: 13,
        name: 'Unknown Mass Character',
        height: '180',
        mass: 'unknown',
        birth_year: 'unknown',
        species: 'Human',
        gender: 'male',
        homeworld: {
          name: 'Test Planet',
          climate: 'temperate',
          terrain: 'grasslands'
        }
      });

      const traits = service.extractTraits(character);

      expect(traits.physicalTraits).toContain('unknown_mass');
    });

    it('should assign neutral personality when no patterns match', () => {
      const character = StarWarsCharacter.create({
        id: 14,
        name: 'Random Name',
        height: '180',
        mass: '80',
        birth_year: 'unknown',
        species: 'Human',
        gender: 'male',
        homeworld: {
          name: 'Test Planet',
          climate: 'temperate',
          terrain: 'grasslands'
        }
      });

      const traits = service.extractTraits(character);

      expect(traits.personalityTraits).toContain('neutral');
    });

    it('should assign citizen archetype when no patterns match', () => {
      const character = StarWarsCharacter.create({
        id: 15,
        name: 'Citizen Name',
        height: '180',
        mass: '80',
        birth_year: 'unknown',
        species: 'Human',
        gender: 'male',
        homeworld: {
          name: 'Test Planet',
          climate: 'temperate',
          terrain: 'grasslands'
        }
      });

      const traits = service.extractTraits(character);

      expect(traits.archetypeTraits).toContain('citizen');
    });
  });

  describe('error handling', () => {
    it('should throw TraitExtractionError when extraction fails', () => {
      const character = StarWarsCharacter.create({
        id: 1,
        name: 'Luke Skywalker',
        height: '172',
        mass: '77',
        birth_year: '19BBY',
        species: 'Human',
        gender: 'male',
        homeworld: {
          name: 'Tatooine',
          climate: 'arid',
          terrain: 'desert'
        }
      });

      // Mock a method to throw an error
      jest.spyOn(service as any, 'extractEnvironmentTraits').mockImplementation(() => {
        throw new Error('Test error');
      });

      expect(() => service.extractTraits(character)).toThrow('Failed to extract traits');
    });
  });
});