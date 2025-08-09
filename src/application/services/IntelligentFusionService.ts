import { StarWarsCharacter } from '../../domain/entities/StarWarsCharacter';
import { Pokemon } from '../../domain/entities/Pokemon';
import { CharacterTraits } from '../../domain/entities/CharacterTraits';
import { FusedCharacter } from '../../domain/entities/FusedCharacter';
import { FusionStrategy } from '../../domain/value-objects/FusionStrategy';
import { FusionScore } from '../../domain/value-objects/FusionScore';
import { TraitExtractionService } from './TraitExtractionService';
import { PokemonMatchingService } from './PokemonMatchingService';

export class IntelligentFusionService {
  constructor(
    private traitExtractionService: TraitExtractionService,
    private pokemonMatchingService: PokemonMatchingService
  ) {}

  public async createFusion(
    character: StarWarsCharacter,
    strategy: FusionStrategy,
    theme?: string,
    existingTraits?: CharacterTraits
  ): Promise<{
    fusedCharacter: FusedCharacter;
    traits: CharacterTraits;
  }> {
    const traits = existingTraits || this.traitExtractionService.extractTraits(character);
    
    const pokemonMatch = await this.pokemonMatchingService.findBestMatch(
      traits,
      strategy,
      theme
    );

    const fusedCharacter = FusedCharacter.create({
      id: this.generateFusionId(),
      starWarsCharacter: character,
      pokemonCompanion: pokemonMatch.pokemon,
      fusionStrategy: strategy,
      fusionScore: pokemonMatch.fusionScore,
      fusionReason: pokemonMatch.fusionReason,
      matchingTraits: pokemonMatch.matchingTraits,
      metadata: {
        cacheHit: false,
        apiCallsMade: 0,
        processingTimeMs: 0,
      },
    });

    return {
      fusedCharacter,
      traits,
    };
  }

  public analyzeCompatibility(
    character: StarWarsCharacter,
    pokemon: Pokemon
  ): {
    score: FusionScore;
    analysis: string;
    strengths: string[];
    weaknesses: string[];
  } {
    const traits = this.traitExtractionService.extractTraits(character);
    const compatibilityFactors: string[] = [];
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    let totalScore = 0;
    let maxScore = 0;

    if (character.hasDesertEnvironment() && (pokemon.isGroundType() || pokemon.isRockType())) {
      compatibilityFactors.push('Desert environment compatibility');
      strengths.push('Shared harsh environment adaptation');
      totalScore += 0.8;
    }

    if (character.hasOceanEnvironment() && pokemon.isWaterType()) {
      compatibilityFactors.push('Ocean environment compatibility');
      strengths.push('Aquatic lifestyle synchronization');
      totalScore += 0.9;
    }

    if (character.isDroid() && (pokemon.isSteelType() || pokemon.isElectricType())) {
      compatibilityFactors.push('Technological nature compatibility');
      strengths.push('Shared mechanical/electronic essence');
      totalScore += 0.95;
    }

    if (character.isSmall() && pokemon.getStat('speed') > 80) {
      compatibilityFactors.push('Agility synergy');
      strengths.push('Enhanced mobility combination');
      totalScore += 0.6;
    }

    if (character.isTall() && pokemon.getStat('attack') > 100) {
      compatibilityFactors.push('Physical prowess match');
      strengths.push('Intimidating presence amplification');
      totalScore += 0.7;
    }

    maxScore = 5;

    if (totalScore === 0) {
      weaknesses.push('No obvious trait synchronization');
      weaknesses.push('Potential clash in natural habitats');
      totalScore = 0.2;
    }

    if (compatibilityFactors.length < 2) {
      weaknesses.push('Limited shared characteristics');
    }

    const normalizedScore = Math.min(1, totalScore / maxScore + (compatibilityFactors.length > 2 ? 0.1 : 0));
    const fusionScore = FusionScore.create(normalizedScore);

    const analysis = this.generateCompatibilityAnalysis(
      character,
      pokemon,
      compatibilityFactors,
      fusionScore
    );

    return {
      score: fusionScore,
      analysis,
      strengths,
      weaknesses,
    };
  }

  private generateCompatibilityAnalysis(
    character: StarWarsCharacter,
    pokemon: Pokemon,
    factors: string[],
    score: FusionScore
  ): string {
    if (score.isPerfect()) {
      return `${character.name} and ${pokemon.name} form an extraordinary fusion with perfect synergy across multiple dimensions: ${factors.join(', ')}.`;
    }

    if (score.isHigh()) {
      return `${character.name} and ${pokemon.name} demonstrate excellent compatibility through ${factors.join(' and ')}, creating a powerful partnership.`;
    }

    if (score.isMedium()) {
      return `${character.name} and ${pokemon.name} show moderate compatibility with some shared traits (${factors.join(', ')}), offering balanced fusion potential.`;
    }

    return `${character.name} and ${pokemon.name} present an unconventional fusion with unique challenges, requiring adaptation but offering surprising combination possibilities.`;
  }

  private generateFusionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `fusion_${timestamp}_${random}`;
  }

  public calculateFusionPower(
    character: StarWarsCharacter,
    pokemon: Pokemon,
    traits: CharacterTraits
  ): {
    totalPower: number;
    breakdown: {
      characterPower: number;
      pokemonPower: number;
      synergyBonus: number;
    };
  } {
    let characterPower = 50;
    
    if (character.isTall()) characterPower += 15;
    if (character.isDroid()) characterPower += 20;
    if (traits.hasPersonalityTrait('heroic')) characterPower += 25;
    if (traits.hasPersonalityTrait('dark_side')) characterPower += 30;

    const pokemonPower = pokemon.stats.reduce((sum, stat) => sum + stat.base_stat, 0) / 10;

    let synergyBonus = 0;
    const allTraits = traits.getAllTraits();
    
    if (character.hasDesertEnvironment() && pokemon.isGroundType()) synergyBonus += 20;
    if (character.isDroid() && pokemon.isElectricType()) synergyBonus += 30;
    if (allTraits.length > 5) synergyBonus += 15;

    const totalPower = characterPower + pokemonPower + synergyBonus;

    return {
      totalPower: Math.round(totalPower),
      breakdown: {
        characterPower: Math.round(characterPower),
        pokemonPower: Math.round(pokemonPower),
        synergyBonus: Math.round(synergyBonus),
      },
    };
  }
}