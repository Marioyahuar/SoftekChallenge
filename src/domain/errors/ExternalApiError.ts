import { DomainError } from './DomainError';

export class ExternalApiError extends DomainError {
  public readonly code = 'EXTERNAL_API_ERROR';

  constructor(message: string, public readonly apiName: string) {
    super(message);
  }
}

export class SwapiError extends ExternalApiError {
  public readonly code = 'SWAPI_ERROR';

  constructor(message: string) {
    super(message, 'SWAPI');
  }
}

export class PokeApiError extends ExternalApiError {
  public readonly code = 'POKEAPI_ERROR';

  constructor(message: string) {
    super(message, 'PokeAPI');
  }
}

export class ApiTimeoutError extends ExternalApiError {
  public readonly code = 'API_TIMEOUT_ERROR';

  constructor(apiName: string) {
    super(`API call to ${apiName} timed out`, apiName);
  }
}

export class ApiRateLimitError extends ExternalApiError {
  public readonly code = 'API_RATE_LIMIT_ERROR';

  constructor(apiName: string) {
    super(`Rate limit exceeded for ${apiName}`, apiName);
  }
}