import { StarWarsCharacter } from './StarWarsCharacter';
import { Pokemon } from './Pokemon';
import { FusionScore } from '../value-objects/FusionScore';
import { CompatibilityLevel } from '../value-objects/CompatibilityLevel';
import { FusionStrategy } from '../value-objects/FusionStrategy';

export interface FusionAnalysis {
  fusionScore: number;
  fusionReason: string;
  matchingTraits: string[];
  compatibilityLevel: string;
}

export interface FusionMetadata {
  cacheHit: boolean;
  apiCallsMade: number;
  processingTimeMs: number;
}

export class FusedCharacter {
  constructor(
    public readonly id: string,
    public readonly timestamp: string,
    public readonly starWarsCharacter: StarWarsCharacter,
    public readonly pokemonCompanion: Pokemon,
    public readonly fusionStrategy: FusionStrategy,
    public readonly fusionAnalysis: FusionAnalysis,
    public readonly metadata: FusionMetadata
  ) {}

  public static create(data: {
    id: string;
    starWarsCharacter: StarWarsCharacter;
    pokemonCompanion: Pokemon;
    fusionStrategy: FusionStrategy;
    fusionScore: FusionScore;
    fusionReason: string;
    matchingTraits: string[];
    metadata: FusionMetadata;
  }): FusedCharacter {
    const compatibilityLevel = CompatibilityLevel.create(data.fusionScore.getValue());
    
    return new FusedCharacter(
      data.id,
      new Date().toISOString(),
      data.starWarsCharacter,
      data.pokemonCompanion,
      data.fusionStrategy,
      {
        fusionScore: data.fusionScore.getValue(),
        fusionReason: data.fusionReason,
        matchingTraits: data.matchingTraits,
        compatibilityLevel: compatibilityLevel.getValue(),
      },
      data.metadata
    );
  }

  public isHighCompatibility(): boolean {
    return this.fusionAnalysis.compatibilityLevel === 'high' || 
           this.fusionAnalysis.compatibilityLevel === 'perfect';
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      timestamp: this.timestamp,
      fusionStrategy: this.fusionStrategy.toString(),
      data: {
        starWarsCharacter: {
          id: this.starWarsCharacter.id,
          name: this.starWarsCharacter.name,
          height: this.starWarsCharacter.height,
          mass: this.starWarsCharacter.mass,
          homeworld: this.starWarsCharacter.homeworld,
          traits: {
            environmentTraits: [],
            physicalTraits: [],
            personalityTraits: [],
            archetypeTraits: []
          }
        },
        pokemonCompanion: {
          id: this.pokemonCompanion.id,
          name: this.pokemonCompanion.name,
          types: this.pokemonCompanion.types,
          stats: this.pokemonCompanion.stats,
          sprites: this.pokemonCompanion.sprites,
        },
        fusionAnalysis: this.fusionAnalysis,
      },
      metadata: this.metadata,
    };
  }
}