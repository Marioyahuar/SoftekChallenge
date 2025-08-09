import { StarWarsCharacter } from '../../../../domain/entities/StarWarsCharacter';

describe('StarWarsCharacter', () => {
  const mockCharacterData = {
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
  };

  describe('create', () => {
    it('should create a StarWarsCharacter instance', () => {
      const character = StarWarsCharacter.create(mockCharacterData);

      expect(character).toBeInstanceOf(StarWarsCharacter);
      expect(character.id).toBe(1);
      expect(character.name).toBe('Luke Skywalker');
      expect(character.height).toBe(172);
      expect(character.mass).toBe('77');
      expect(character.birthYear).toBe('19BBY');
      expect(character.species).toBe('Human');
      expect(character.gender).toBe('male');
      expect(character.homeworld.name).toBe('Tatooine');
    });

    it('should handle invalid height as 0', () => {
      const data = { ...mockCharacterData, height: 'unknown' };
      const character = StarWarsCharacter.create(data);

      expect(character.height).toBe(0);
    });
  });

  describe('size methods', () => {
    it('should identify small characters', () => {
      const data = { ...mockCharacterData, height: '140' };
      const character = StarWarsCharacter.create(data);

      expect(character.isSmall()).toBe(true);
      expect(character.isTall()).toBe(false);
    });

    it('should identify tall characters', () => {
      const data = { ...mockCharacterData, height: '220' };
      const character = StarWarsCharacter.create(data);

      expect(character.isSmall()).toBe(false);
      expect(character.isTall()).toBe(true);
    });

    it('should identify average height characters', () => {
      const character = StarWarsCharacter.create(mockCharacterData);

      expect(character.isSmall()).toBe(false);
      expect(character.isTall()).toBe(false);
    });
  });

  describe('species methods', () => {
    it('should identify droids', () => {
      const data = { ...mockCharacterData, species: 'Droid' };
      const character = StarWarsCharacter.create(data);

      expect(character.isDroid()).toBe(true);
      expect(character.isHuman()).toBe(false);
    });

    it('should identify humans', () => {
      const character = StarWarsCharacter.create(mockCharacterData);

      expect(character.isHuman()).toBe(true);
      expect(character.isDroid()).toBe(false);
    });
  });

  describe('environment methods', () => {
    it('should identify desert environment', () => {
      const character = StarWarsCharacter.create(mockCharacterData);

      expect(character.hasDesertEnvironment()).toBe(true);
    });

    it('should identify ocean environment', () => {
      const data = {
        ...mockCharacterData,
        homeworld: {
          name: 'Kamino',
          climate: 'temperate',
          terrain: 'ocean'
        }
      };
      const character = StarWarsCharacter.create(data);

      expect(character.hasOceanEnvironment()).toBe(true);
      expect(character.hasDesertEnvironment()).toBe(false);
    });

    it('should identify ice environment', () => {
      const data = {
        ...mockCharacterData,
        homeworld: {
          name: 'Hoth',
          climate: 'frozen',
          terrain: 'tundra, ice caves'
        }
      };
      const character = StarWarsCharacter.create(data);

      expect(character.hasIceEnvironment()).toBe(true);
    });

    it('should identify forest environment', () => {
      const data = {
        ...mockCharacterData,
        homeworld: {
          name: 'Endor',
          climate: 'temperate',
          terrain: 'forest, mountains'
        }
      };
      const character = StarWarsCharacter.create(data);

      expect(character.hasForestEnvironment()).toBe(true);
    });
  });
});