import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { GetFusedDataUseCase } from '../../../../application/use-cases/GetFusedDataUseCase';
import { SwapiService } from '../../external-apis/swapi/SwapiService';
import { PokeApiService } from '../../external-apis/pokeapi/PokeApiService';
import { TraitExtractionService } from '../../../../application/services/TraitExtractionService';
import { PokemonMatchingService } from '../../../../application/services/PokemonMatchingService';
import { HybridCacheService } from '../../../../application/services/HybridCacheService';
import { FusedDataRepository } from '../../../database/mysql/repositories/FusedDataRepository';
import { CharacterTraitsRepository } from '../../../database/mysql/repositories/CharacterTraitsRepository';
import { withErrorHandling } from '../middleware/errorMiddleware';
import { withRateLimit } from '../middleware/rateLimitMiddleware';
import { validateQueryParams, fusedDataQuerySchema } from '../schemas/validation-schemas';

export const handler = withErrorHandling(
  withRateLimit(
    async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
      const startTime = Date.now();

      if (event.httpMethod === 'OPTIONS') {
        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,OPTIONS',
          },
          body: '',
        };
      }

      if (event.httpMethod !== 'GET') {
        return {
          statusCode: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            error: {
              code: 'METHOD_NOT_ALLOWED',
              message: 'Only GET method is allowed',
            },
          }),
        };
      }

      const queryParams = validateQueryParams(fusedDataQuerySchema)(
        event.queryStringParameters || {}
      );

      const swapiService = new SwapiService();
      const pokeApiService = new PokeApiService();
      const traitExtractionService = new TraitExtractionService();
      const pokemonMatchingService = new PokemonMatchingService(pokeApiService);
      const cacheService = new HybridCacheService();
      const fusedDataRepository = new FusedDataRepository();
      const characterTraitsRepository = new CharacterTraitsRepository();

      const getFusedDataUseCase = new GetFusedDataUseCase(
        swapiService,
        pokeApiService,
        traitExtractionService,
        pokemonMatchingService,
        cacheService,
        fusedDataRepository,
        characterTraitsRepository
      );

      const fusedCharacters = await getFusedDataUseCase.execute(queryParams);

      const processingTime = Date.now() - startTime;

      const response = fusedCharacters.length === 1 ? fusedCharacters[0] : fusedCharacters;

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Processing-Time': processingTime.toString(),
        },
        body: JSON.stringify(response),
      };
    },
    { maxRequests: 60, windowMinutes: 1 }
  )
);