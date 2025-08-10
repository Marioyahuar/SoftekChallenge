import { DomainError } from "./DomainError";

export class ExternalApiError extends DomainError {
  public readonly code: string;

  constructor(message: string, public readonly apiName: string, code: string) {
    super(message);
    this.code = code;
  }
}

export class SwapiError extends ExternalApiError {
  constructor(message: string) {
    super(message, "SWAPI", "SWAPI_ERROR");
  }
}

export class PokeApiError extends ExternalApiError {
  constructor(message: string) {
    super(message, "PokeAPI", "POKEAPI_ERROR");
  }
}

export class ApiTimeoutError extends ExternalApiError {
  constructor(apiName: string) {
    super(`API call to ${apiName} timed out`, apiName, "API_TIMEOUT_ERROR");
  }
}

export class ApiRateLimitError extends ExternalApiError {
  constructor(apiName: string) {
    super(
      `Rate limit exceeded for ${apiName}`,
      apiName,
      "API_RATE_LIMIT_ERROR"
    );
  }
}
