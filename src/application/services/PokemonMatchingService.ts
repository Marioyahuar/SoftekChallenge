import { CharacterTraits } from '../../domain/entities/CharacterTraits';
import { Pokemon } from '../../domain/entities/Pokemon';
import { FusionStrategy } from '../../domain/value-objects/FusionStrategy';
import { FusionScore } from '../../domain/value-objects/FusionScore';
import { NoMatchingPokemonError } from '../../domain/errors/FusionError';
import { PokeApiService } from '../../infrastructure/adapters/external-apis/pokeapi/PokeApiService';
import { ITraitMappingRepository, TraitPokemonMapping } from '../ports/repositories/ITraitMappingRepository';

export interface PokemonMatch {
  pokemon: Pokemon;
  fusionScore: FusionScore;
  matchingTraits: string[];
  fusionReason: string;
}

export class PokemonMatchingService {
  private pokeApiService: PokeApiService;
  private traitMappingRepository: ITraitMappingRepository;

  constructor(pokeApiService: PokeApiService, traitMappingRepository: ITraitMappingRepository) {
    this.pokeApiService = pokeApiService;
    this.traitMappingRepository = traitMappingRepository;
  }

  public async findBestMatch(
    traits: CharacterTraits,
    strategy: FusionStrategy,
    theme?: string
  ): Promise<PokemonMatch> {
    try {
      let pokemonId: number;

      switch (strategy.getValue()) {
        case 'intelligent':
          pokemonId = await this.intelligentMatch(traits);
          break;
        case 'random':
          pokemonId = await this.randomMatch();
          break;
        case 'theme':
          pokemonId = await this.themeMatch(theme || 'heroic');
          break;
        default:
          throw new NoMatchingPokemonError(traits.characterId);
      }

      const pokemon = await this.pokeApiService.getPokemon(pokemonId);
      const { fusionScore, matchingTraits, fusionReason } = await this.calculateFusionScore(traits, pokemon, strategy);

      return {
        pokemon,
        fusionScore,
        matchingTraits,
        fusionReason,
      };
    } catch (error) {
      if (error instanceof NoMatchingPokemonError) {
        throw error;
      }
      throw new NoMatchingPokemonError(traits.characterId);
    }
  }

  private async intelligentMatch(traits: CharacterTraits): Promise<number> {
    const scores: Map<number, number> = new Map();
    const allTraits = traits.getAllTraits();

    for (const trait of allTraits) {
      const mappings = await this.traitMappingRepository.findActiveByTraitName(trait);
      
      for (const mapping of mappings) {
        const currentScore = scores.get(mapping.pokemonId) || 0;
        scores.set(mapping.pokemonId, currentScore + mapping.weight);
      }
    }

    if (scores.size === 0) {
      return await this.getFallbackPokemon(traits);
    }

    const sortedScores = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
    return sortedScores[0]?.[0] ?? await this.getFallbackPokemon(traits);
  }

  private async randomMatch(): Promise<number> {
    return await this.pokeApiService.getRandomPokemonId();
  }

  private async themeMatch(theme: string): Promise<number> {
    const themeMappings: Record<string, number[]> = {
      desert: this.pokeApiService.getDesertPokemon(),
      ocean: this.pokeApiService.getOceanPokemon(),
      ice: this.pokeApiService.getIcePokemon(),
      forest: this.pokeApiService.getForestPokemon(),
      mechanical: this.pokeApiService.getMechanicalPokemon(),
      heroic: this.pokeApiService.getHeroicPokemon(),
      dark_side: this.pokeApiService.getDarkPokemon(),
      urban: [25, 81, 100, 137],
    };

    const pokemonIds = themeMappings[theme] || themeMappings.heroic || [25];
    const randomIndex = Math.floor(Math.random() * pokemonIds.length);
    return pokemonIds[randomIndex] || 25;
  }

  private async getFallbackPokemon(traits: CharacterTraits): Promise<number> {
    if (traits.hasPhysicalTrait('human')) {
      return 25;
    }
    
    if (traits.hasPhysicalTrait('mechanical')) {
      return 81;
    }

    if (traits.hasPersonalityTrait('heroic')) {
      return 6;
    }

    if (traits.hasPersonalityTrait('dark_side')) {
      return 94;
    }

    return 1;
  }

  private async calculateFusionScore(
    traits: CharacterTraits,
    pokemon: Pokemon,
    strategy: FusionStrategy
  ): Promise<{ fusionScore: FusionScore; matchingTraits: string[]; fusionReason: string }> {
    const allTraits = traits.getAllTraits();
    const matchingTraits: string[] = [];
    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const trait of allTraits) {
      const mappings = await this.traitMappingRepository.findActiveByTraitName(trait);
      const mapping = mappings.find(m => m.pokemonId === pokemon.id);
      
      if (mapping) {
        matchingTraits.push(trait);
        totalScore += mapping.weight;
      }
      
      maxPossibleScore += 1;
    }

    const normalizedScore = maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;
    const bonusScore = matchingTraits.length > 3 ? 0.1 : 0;
    const finalScore = Math.min(1, normalizedScore + bonusScore);

    const fusionScore = FusionScore.create(finalScore);
    const fusionReason = this.generateFusionReason(traits, pokemon, matchingTraits, strategy);

    return {
      fusionScore,
      matchingTraits,
      fusionReason,
    };
  }

  private generateFusionReason(
    traits: CharacterTraits,
    pokemon: Pokemon,
    matchingTraits: string[],
    strategy: FusionStrategy
  ): string {
    if (strategy.isRandom()) {
      return `Random fusion selected ${pokemon.name} as companion through chance encounter.`;
    }

    if (matchingTraits.length === 0) {
      return `${pokemon.name} was chosen as a versatile companion despite limited trait matches.`;
    }

    const traitCategories = {
      environment: matchingTraits.filter(t => 
        ['desert', 'ocean', 'ice', 'forest', 'mountain', 'urban'].includes(t)
      ),
      physical: matchingTraits.filter(t =>
        ['small', 'tall', 'mechanical', 'human', 'alien'].includes(t)
      ),
      personality: matchingTraits.filter(t =>
        ['heroic', 'dark_side', 'wise', 'brave', 'intimidating'].includes(t)
      ),
    };

    const reasons: string[] = [];

    if (traitCategories.environment.length > 0) {
      reasons.push(`shares similar environmental preferences (${traitCategories.environment.join(', ')})`);
    }

    if (traitCategories.physical.length > 0) {
      reasons.push(`complements physical characteristics (${traitCategories.physical.join(', ')})`);
    }

    if (traitCategories.personality.length > 0) {
      reasons.push(`matches personality traits (${traitCategories.personality.join(', ')})`);
    }

    const reasonText = reasons.length > 0 ? reasons.join(' and ') : 'complementary abilities';
    return `${pokemon.name} was selected because it ${reasonText}, creating a powerful fusion bond.`;
  }
}