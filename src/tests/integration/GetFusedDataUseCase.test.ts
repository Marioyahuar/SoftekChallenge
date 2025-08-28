import { GetFusedDataUseCase } from "../../application/use-cases/GetFusedDataUseCase";
import { SwapiService } from "../../infrastructure/adapters/external-apis/swapi/SwapiService";
import { PokeApiService } from "../../infrastructure/adapters/external-apis/pokeapi/PokeApiService";
import { TraitExtractionService } from "../../application/services/TraitExtractionService";
import { PokemonMatchingService } from "../../application/services/PokemonMatchingService";
import { HybridCacheService } from "../../application/services/HybridCacheService";
import { StarWarsCharacter } from "../../domain/entities/StarWarsCharacter";
import { Pokemon } from "../../domain/entities/Pokemon";
import { CharacterTraits } from "../../domain/entities/CharacterTraits";
import { Mock } from "node:test";

// Mock implementations
class MockTraitMappingRepository {
  async save(mapping: any): Promise<void> {
    // Mock implementation
  }

  async findActiveByTraitName(traitName: string): Promise<any[]> {
    // Return mock mappings for common traits
    const mockMappings: Record<string, any[]> = {
      heroic: [
        {
          pokemonId: 25,
          weight: 0.95,
          traitName: "heroic",
          category: "personality",
          reasoning: "Mock heroic mapping",
        },
      ],
      desert: [
        {
          pokemonId: 27,
          weight: 0.9,
          traitName: "desert",
          category: "environment",
          reasoning: "Mock desert mapping",
        },
      ],
      human: [
        {
          pokemonId: 25,
          weight: 0.8,
          traitName: "human",
          category: "physical",
          reasoning: "Mock human mapping",
        },
      ],
    };
    return mockMappings[traitName] || [];
  }

  async findByPokemonId(pokemonId: number): Promise<any[]> {
    return [];
  }

  async findAll(): Promise<any[]> {
    return [];
  }

  async findByTraitName(traitName: string): Promise<any[]> {
    return await this.findActiveByTraitName(traitName);
  }

  async update(mapping: any): Promise<void> {
    // Mock implementation
  }

  async delete(id: number): Promise<void> {
    // Mock implementation
  }

  async deactivate(id: number): Promise<void> {
    // Mock implementation
  }
}

class MockFusedDataRepository {
  async save(fusedCharacter: any): Promise<void> {
    // Mock implementation
  }

  async findById(id: string): Promise<any> {
    return null;
  }

  async findByUserId(
    userId: string,
    page: number,
    limit: number
  ): Promise<any> {
    return { data: [], total: 0, page, limit };
  }

  async findAll(
    page: number,
    limit: number,
    sortBy?: string,
    order?: "asc" | "desc"
  ): Promise<any> {
    return { data: [], total: 0, page, limit };
  }

  async delete(id: string): Promise<void> {
    // Mock implementation
  }
}

class MockCharacterTraitsRepository {
  private traits: CharacterTraits | null = null;

  async findByCharacterId(
    characterId: number
  ): Promise<CharacterTraits | null> {
    return this.traits;
  }

  async save(traits: CharacterTraits): Promise<void> {
    this.traits = traits;
  }

  async update(traits: CharacterTraits): Promise<void> {
    this.traits = traits;
  }

  async delete(characterId: number): Promise<void> {
    this.traits = null;
  }

  async findAll(): Promise<CharacterTraits[]> {
    return this.traits ? [this.traits] : [];
  }
}

class MockSwapiCharacterRepository {
  async save(character: any): Promise<void> {
    // Mock implementation - just return success
  }

  async findById(id: number): Promise<any> {
    return null;
  }

  async findAll(): Promise<any[]> {
    return [];
  }

  async update(character: any): Promise<void> {
    // Mock implementation
  }

  async delete(id: number): Promise<void> {
    // Mock implementation
  }
}

// Mock services
const mockSwapiService = {
  getCharacter: jest.fn(),
  getRandomCharacterId: jest.fn(),
} as any;

const mockPokeApiService = {
  getPokemon: jest.fn(),
  getRandomPokemonId: jest.fn(),
} as any;

const mockCacheService = {
  getFusionResult: jest.fn(),
  storeFusionResult: jest.fn(),
  storeCharacterTraits: jest.fn(),
  storePokemonData: jest.fn(),
} as any;

describe("GetFusedDataUseCase Integration", () => {
  let useCase: GetFusedDataUseCase;
  let traitExtractionService: TraitExtractionService;
  let pokemonMatchingService: PokemonMatchingService;
  let fusedDataRepository: MockFusedDataRepository;
  let characterTraitsRepository: MockCharacterTraitsRepository;
  let swapiCharacterRepository: MockSwapiCharacterRepository;

  beforeEach(() => {
    jest.clearAllMocks();

    traitExtractionService = new TraitExtractionService();
    const mockTraitMappingRepository = new MockTraitMappingRepository();
    pokemonMatchingService = new PokemonMatchingService(
      mockPokeApiService,
      mockTraitMappingRepository
    );
    fusedDataRepository = new MockFusedDataRepository();
    characterTraitsRepository = new MockCharacterTraitsRepository();
    swapiCharacterRepository = new MockSwapiCharacterRepository();

    useCase = new GetFusedDataUseCase(
      mockSwapiService,
      mockPokeApiService,
      traitExtractionService,
      pokemonMatchingService,
      mockCacheService,
      fusedDataRepository,
      characterTraitsRepository,
      swapiCharacterRepository
    );
  });

  describe("execute", () => {
    it("should successfully execute fusion with cache miss", async () => {
      // Mock data
      const mockCharacter = StarWarsCharacter.create({
        id: 1,
        name: "Luke Skywalker",
        height: "172",
        mass: "77",
        birth_year: "19BBY",
        species: "Human",
        gender: "male",
        homeworld: {
          name: "Tatooine",
          climate: "arid",
          terrain: "desert",
        },
      });

      const mockPokemon = Pokemon.create({
        id: 25,
        name: "pikachu",
        types: [{ name: "electric" }],
        stats: [{ base_stat: 35, stat: { name: "hp" } }],
        sprites: { front_default: "https://example.com/pikachu.png" },
        height: 4,
        weight: 60,
      });

      // Setup mocks
      mockCacheService.getFusionResult.mockResolvedValue(null); // Cache miss
      mockSwapiService.getCharacter.mockResolvedValue({
        character: mockCharacter,
        apiCallsCount: 3,
      });
      mockPokeApiService.getPokemon.mockResolvedValue(mockPokemon);
      mockCacheService.storeCharacterTraits.mockResolvedValue(undefined);
      mockCacheService.storePokemonData.mockResolvedValue(undefined);
      mockCacheService.storeFusionResult.mockResolvedValue(undefined);

      // Execute
      const result = await useCase.execute({
        character: 1,
        strategy: "intelligent",
        limit: 1,
      });

      // Assertions
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        fusionStrategy: expect.objectContaining({
          getValue: expect.any(Function),
        }),
        starWarsCharacter: mockCharacter,
        pokemonCompanion: mockPokemon,
        metadata: expect.objectContaining({
          cacheHit: false,
          apiCallsMade: expect.any(Number),
          processingTimeMs: expect.any(Number),
        }),
      });

      // Verify service calls
      expect(mockSwapiService.getCharacter).toHaveBeenCalledWith(1);
      expect(mockCacheService.getFusionResult).toHaveBeenCalled();
      expect(mockCacheService.storeFusionResult).toHaveBeenCalled();
    });

    it("should use cached result when available", async () => {
      // Mock cached result
      const mockCachedResult = {
        id: "cached-fusion-123",
        timestamp: new Date().toISOString(),
        fusionStrategy: { getValue: () => "intelligent" },
        starWarsCharacter: { name: "Cached Character" },
        pokemonCompanion: { name: "Cached Pokemon" },
        fusionAnalysis: {
          fusionScore: 0.8,
          fusionReason: "Cached reason",
          matchingTraits: ["heroic"],
          compatibilityLevel: "high",
        },
        metadata: { cacheHit: true, apiCallsMade: 0, processingTimeMs: 50 },
      };

      mockCacheService.getFusionResult.mockResolvedValue(mockCachedResult);

      // Execute
      const result = await useCase.execute({
        character: 1,
        strategy: "intelligent",
        limit: 1,
      });

      // Assertions
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(mockCachedResult);
      expect(mockSwapiService.getCharacter).not.toHaveBeenCalled();
      expect(mockCacheService.getFusionResult).toHaveBeenCalled();
    });

    it("should handle random character selection", async () => {
      mockSwapiService.getRandomCharacterId.mockResolvedValue(42);
      mockCacheService.getFusionResult.mockResolvedValue(null);

      const mockCharacter = StarWarsCharacter.create({
        id: 42,
        name: "Random Character",
        height: "180",
        mass: "80",
        birth_year: "unknown",
        species: "Human",
        gender: "male",
        homeworld: {
          name: "Random Planet",
          climate: "temperate",
          terrain: "grasslands",
        },
      });

      const mockPokemon = Pokemon.create({
        id: 1,
        name: "bulbasaur",
        types: [{ name: "grass" }],
        stats: [{ base_stat: 45, stat: { name: "hp" } }],
        sprites: { front_default: "https://example.com/bulbasaur.png" },
        height: 7,
        weight: 69,
      });

      mockSwapiService.getCharacter.mockResolvedValue({
        character: mockCharacter,
        apiCallsCount: 3,
      });
      mockPokeApiService.getPokemon.mockResolvedValue(mockPokemon);
      mockCacheService.storeCharacterTraits.mockResolvedValue(undefined);
      mockCacheService.storePokemonData.mockResolvedValue(undefined);
      mockCacheService.storeFusionResult.mockResolvedValue(undefined);

      // Execute with random=true
      const result = await useCase.execute({
        random: true,
        strategy: "intelligent",
        limit: 1,
      });

      // Assertions
      expect(result).toHaveLength(1);
      expect(mockSwapiService.getRandomCharacterId).toHaveBeenCalled();
      expect(mockSwapiService.getCharacter).toHaveBeenCalledWith(42);
    });

    it("should handle multiple fusion limit", async () => {
      mockCacheService.getFusionResult.mockResolvedValue(null);
      mockSwapiService.getRandomCharacterId
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2);

      const mockCharacter1 = StarWarsCharacter.create({
        id: 1,
        name: "Luke Skywalker",
        height: "172",
        mass: "77",
        birth_year: "19BBY",
        species: "Human",
        gender: "male",
        homeworld: {
          name: "Tatooine",
          climate: "arid",
          terrain: "desert",
        },
      });

      const mockCharacter2 = StarWarsCharacter.create({
        id: 2,
        name: "C-3PO",
        height: "167",
        mass: "75",
        birth_year: "112BBY",
        species: "Droid",
        gender: "n/a",
        homeworld: {
          name: "Tatooine",
          climate: "arid",
          terrain: "desert",
        },
      });

      const mockPokemon = Pokemon.create({
        id: 25,
        name: "pikachu",
        types: [{ name: "electric" }],
        stats: [{ base_stat: 35, stat: { name: "hp" } }],
        sprites: { front_default: "https://example.com/pikachu.png" },
        height: 4,
        weight: 60,
      });

      mockSwapiService.getCharacter
        .mockResolvedValueOnce({ character: mockCharacter1, apiCallsCount: 3 })
        .mockResolvedValueOnce({ character: mockCharacter2, apiCallsCount: 3 });

      mockPokeApiService.getPokemon.mockResolvedValue(mockPokemon);
      mockCacheService.storeCharacterTraits.mockResolvedValue(undefined);
      mockCacheService.storePokemonData.mockResolvedValue(undefined);
      mockCacheService.storeFusionResult.mockResolvedValue(undefined);

      // Execute with limit=2
      const result = await useCase.execute({
        character: 1,
        strategy: "intelligent",
        limit: 2,
      });

      // Assertions
      expect(result).toHaveLength(2);
      expect(mockSwapiService.getCharacter).toHaveBeenCalledTimes(2);
    });

    it("should validate limit parameter", async () => {
      await expect(
        useCase.execute({
          character: 1,
          strategy: "intelligent",
          limit: 0,
        })
      ).rejects.toThrow("Limit must be between 1 and 10");

      await expect(
        useCase.execute({
          character: 1,
          strategy: "intelligent",
          limit: 11,
        })
      ).rejects.toThrow("Limit must be between 1 and 10");
    });

    it("should use existing character traits when available", async () => {
      const existingTraits = CharacterTraits.create({
        characterId: 1,
        environmentTraits: ["desert"],
        physicalTraits: ["human"],
        personalityTraits: ["heroic"],
        archetypeTraits: ["hero"],
      });

      // Mock repository to return existing traits
      characterTraitsRepository = {
        findByCharacterId: jest.fn().mockResolvedValue(existingTraits),
        save: jest.fn(),
      } as any;

      useCase = new GetFusedDataUseCase(
        mockSwapiService,
        mockPokeApiService,
        traitExtractionService,
        pokemonMatchingService,
        mockCacheService,
        fusedDataRepository,
        characterTraitsRepository,
        swapiCharacterRepository
      );

      mockCacheService.getFusionResult.mockResolvedValue(null);

      const mockCharacter = StarWarsCharacter.create({
        id: 1,
        name: "Luke Skywalker",
        height: "172",
        mass: "77",
        birth_year: "19BBY",
        species: "Human",
        gender: "male",
        homeworld: {
          name: "Tatooine",
          climate: "arid",
          terrain: "desert",
        },
      });

      const mockPokemon = Pokemon.create({
        id: 25,
        name: "pikachu",
        types: [{ name: "electric" }],
        stats: [{ base_stat: 35, stat: { name: "hp" } }],
        sprites: { front_default: "https://example.com/pikachu.png" },
        height: 4,
        weight: 60,
      });

      mockSwapiService.getCharacter.mockResolvedValue({
        character: mockCharacter,
        apiCallsCount: 3,
      });
      mockPokeApiService.getPokemon.mockResolvedValue(mockPokemon);
      mockCacheService.storeCharacterTraits.mockResolvedValue(undefined);
      mockCacheService.storePokemonData.mockResolvedValue(undefined);
      mockCacheService.storeFusionResult.mockResolvedValue(undefined);

      // Execute
      const result = await useCase.execute({
        character: 1,
        strategy: "intelligent",
        limit: 1,
      });

      // Verify existing traits were used (no new save called)
      expect(characterTraitsRepository.findByCharacterId).toHaveBeenCalledWith(
        1
      );
      expect(characterTraitsRepository.save).not.toHaveBeenCalled();
    });
  });
});
