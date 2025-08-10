import { DomainError } from './DomainError';

export class FusionError extends DomainError {
  public readonly code: string = 'FUSION_ERROR';

  constructor(message: string) {
    super(message);
  }
}

export class InvalidFusionStrategyError extends FusionError {
  public readonly code = 'INVALID_FUSION_STRATEGY';

  constructor(strategy: string) {
    super(`Invalid fusion strategy: ${strategy}`);
  }
}

export class NoMatchingPokemonError extends FusionError {
  public readonly code = 'NO_MATCHING_POKEMON';

  constructor(characterId: number) {
    super(`No matching Pokemon found for character ID: ${characterId}`);
  }
}

export class TraitExtractionError extends FusionError {
  public readonly code = 'TRAIT_EXTRACTION_ERROR';

  constructor(characterId: number, reason: string) {
    super(`Failed to extract traits for character ${characterId}: ${reason}`);
  }
}