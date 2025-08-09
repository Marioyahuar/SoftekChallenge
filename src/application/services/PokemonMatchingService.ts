import { CharacterTraits } from '../../domain/entities/CharacterTraits';
import { Pokemon } from '../../domain/entities/Pokemon';
import { FusionStrategy } from '../../domain/value-objects/FusionStrategy';
import { FusionScore } from '../../domain/value-objects/FusionScore';
import { NoMatchingPokemonError } from '../../domain/errors/FusionError';
import { PokeApiService } from '../../infrastructure/adapters/external-apis/pokeapi/PokeApiService';

export interface TraitPokemonMapping {
  traitName: string;
  pokemonId: number;
  weight: number;
  reasoning: string;
  category: 'environment' | 'physical' | 'personality' | 'archetype';
}

export interface PokemonMatch {
  pokemon: Pokemon;
  fusionScore: FusionScore;
  matchingTraits: string[];
  fusionReason: string;
}

export class PokemonMatchingService {
  private pokeApiService: PokeApiService;
  private traitMappings: TraitPokemonMapping[];

  constructor(pokeApiService: PokeApiService) {
    this.pokeApiService = pokeApiService;
    this.initializeTraitMappings();
  }

  private initializeTraitMappings(): void {
    this.traitMappings = [
      { traitName: 'desert', pokemonId: 27, weight: 0.9, reasoning: 'Desert-dwelling ground type', category: 'environment' },
      { traitName: 'desert', pokemonId: 28, weight: 0.85, reasoning: 'Enhanced desert adaptation', category: 'environment' },
      { traitName: 'desert', pokemonId: 104, weight: 0.8, reasoning: 'Bone collector in arid lands', category: 'environment' },
      { traitName: 'ocean', pokemonId: 7, weight: 0.9, reasoning: 'Water starter, ocean dweller', category: 'environment' },
      { traitName: 'ocean', pokemonId: 8, weight: 0.85, reasoning: 'Advanced water abilities', category: 'environment' },
      { traitName: 'ocean', pokemonId: 9, weight: 0.95, reasoning: 'Ultimate water type evolution', category: 'environment' },
      { traitName: 'ice', pokemonId: 87, weight: 0.9, reasoning: 'Ice/Water dual type', category: 'environment' },
      { traitName: 'ice', pokemonId: 91, weight: 0.85, reasoning: 'Spiky ice shell', category: 'environment' },
      { traitName: 'ice', pokemonId: 144, weight: 0.95, reasoning: 'Legendary ice bird', category: 'environment' },
      { traitName: 'forest', pokemonId: 1, weight: 0.9, reasoning: 'Grass starter, forest dweller', category: 'environment' },
      { traitName: 'forest', pokemonId: 43, weight: 0.8, reasoning: 'Grass type, forest habitat', category: 'environment' },
      { traitName: 'forest', pokemonId: 45, weight: 0.85, reasoning: 'Flower Pokemon, forest guardian', category: 'environment' },
      { traitName: 'mechanical', pokemonId: 81, weight: 0.95, reasoning: 'Electric/Steel, pure machine', category: 'physical' },
      { traitName: 'mechanical', pokemonId: 82, weight: 0.9, reasoning: 'Evolved magnetic Pokemon', category: 'physical' },
      { traitName: 'mechanical', pokemonId: 137, weight: 0.85, reasoning: 'Digital Pokemon, artificial', category: 'physical' },
      { traitName: 'artificial', pokemonId: 137, weight: 0.9, reasoning: 'Man-made digital creature', category: 'physical' },
      { traitName: 'heroic', pokemonId: 25, weight: 0.95, reasoning: 'Iconic hero Pokemon', category: 'personality' },
      { traitName: 'heroic', pokemonId: 6, weight: 0.9, reasoning: 'Dragon-like protector', category: 'personality' },
      { traitName: 'heroic', pokemonId: 150, weight: 0.85, reasoning: 'Legendary psychic protector', category: 'personality' },
      { traitName: 'dark_side', pokemonId: 94, weight: 0.95, reasoning: 'Ghost type, dark presence', category: 'personality' },
      { traitName: 'dark_side', pokemonId: 169, weight: 0.9, reasoning: 'Evolved poison/flying menace', category: 'personality' },
      { traitName: 'intimidating', pokemonId: 6, weight: 0.8, reasoning: 'Fire/Flying dragon-like', category: 'personality' },
      { traitName: 'wise', pokemonId: 65, weight: 0.9, reasoning: 'Psychic sage', category: 'personality' },
      { traitName: 'wise', pokemonId: 150, weight: 0.95, reasoning: 'Legendary psychic master', category: 'personality' },
      { traitName: 'small', pokemonId: 25, weight: 0.8, reasoning: 'Small electric mouse', category: 'physical' },
      { traitName: 'small', pokemonId: 104, weight: 0.85, reasoning: 'Small ground type', category: 'physical' },
      { traitName: 'tall', pokemonId: 6, weight: 0.8, reasoning: 'Large fire dragon', category: 'physical' },
      { traitName: 'tall', pokemonId: 150, weight: 0.85, reasoning: 'Tall psychic legendary', category: 'physical' },
      { traitName: 'droid', pokemonId: 81, weight: 0.95, reasoning: 'Robotic appearance', category: 'archetype' },
      { traitName: 'companion', pokemonId: 25, weight: 0.9, reasoning: 'Loyal partner Pokemon', category: 'archetype' },
      { traitName: 'royalty', pokemonId: 150, weight: 0.9, reasoning: 'Legendary status', category: 'archetype' },
      { traitName: 'chosen_one', pokemonId: 150, weight: 0.95, reasoning: 'Ultimate legendary Pokemon', category: 'archetype' },
    ];
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
      const { fusionScore, matchingTraits, fusionReason } = this.calculateFusionScore(traits, pokemon, strategy);

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
      const mappings = this.traitMappings.filter(m => m.traitName === trait);
      
      for (const mapping of mappings) {
        const currentScore = scores.get(mapping.pokemonId) || 0;
        scores.set(mapping.pokemonId, currentScore + mapping.weight);
      }
    }

    if (scores.size === 0) {
      return await this.getFallbackPokemon(traits);
    }

    const sortedScores = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);
    return sortedScores[0][0];
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

    const pokemonIds = themeMappings[theme] || themeMappings.heroic;
    const randomIndex = Math.floor(Math.random() * pokemonIds.length);
    return pokemonIds[randomIndex];
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

  private calculateFusionScore(
    traits: CharacterTraits,
    pokemon: Pokemon,
    strategy: FusionStrategy
  ): { fusionScore: FusionScore; matchingTraits: string[]; fusionReason: string } {
    const allTraits = traits.getAllTraits();
    const matchingTraits: string[] = [];
    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const trait of allTraits) {
      const mapping = this.traitMappings.find(
        m => m.traitName === trait && m.pokemonId === pokemon.id
      );
      
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