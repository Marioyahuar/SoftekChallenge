import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { StoreCustomDataUseCase } from "../../../../application/use-cases/StoreCustomDataUseCase";
import { AddTraitMappingUseCase } from "../../../../application/use-cases/AddTraitMappingUseCase";
import { AddCharacterTraitUseCase } from "../../../../application/use-cases/AddCharacterTraitUseCase";
import { CustomDataRepository } from "../../database/mysql/repositories/CustomDataRepository";
import { TraitMappingRepository } from "../../database/mysql/repositories/TraitMappingRepository";
import { CharacterTraitsRepository } from "../../database/mysql/repositories/CharacterTraitsRepository";
import { withErrorHandling } from "../middleware/errorMiddleware";
import {
  withAuthentication,
  AuthenticatedUser,
} from "../middleware/authMiddleware";
import { withRateLimit } from "../middleware/rateLimitMiddleware";
import { validateBody, storeDataSchema } from "../schemas/validation-schemas";

export const handler = withErrorHandling(
  withRateLimit(
    withAuthentication(
      async (
        event: APIGatewayProxyEvent,
        user: AuthenticatedUser
      ): Promise<APIGatewayProxyResult> => {
        const startTime = Date.now();
        const httpMethod = event.httpMethod || event.requestContext?.httpMethod || 'POST';

        if (httpMethod === "OPTIONS") {
          return {
            statusCode: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Headers":
                "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
              "Access-Control-Allow-Methods": "POST,OPTIONS",
            },
            body: "",
          };
        }

        if (httpMethod !== "POST") {
          return {
            statusCode: 405,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              error: {
                code: "METHOD_NOT_ALLOWED",
                message: "Only POST method is allowed",
              },
            }),
          };
        }

        if (!event.body) {
          return {
            statusCode: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              error: {
                code: "MISSING_BODY",
                message: "Request body is required",
              },
            }),
          };
        }

        let requestBody;
        try {
          requestBody = JSON.parse(event.body);
        } catch (error) {
          return {
            statusCode: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              error: {
                code: "INVALID_JSON",
                message: "Request body must be valid JSON",
              },
            }),
          };
        }

        const validatedData = validateBody(storeDataSchema)(requestBody);

        let result: any;
        let message: string;

        // Handle different types of data based on the type field
        if (validatedData.type) {
          switch (validatedData.type) {
            case 'trait_mapping':
              const traitMappingRepository = new TraitMappingRepository();
              const addTraitMappingUseCase = new AddTraitMappingUseCase(traitMappingRepository);
              
              result = await addTraitMappingUseCase.execute({
                traitName: validatedData.traitName,
                pokemonId: validatedData.pokemonId,
                weight: validatedData.weight,
                reasoning: validatedData.reasoning,
                category: validatedData.category,
                userId: user.userId,
              });
              message = "Trait mapping added successfully";
              break;

            case 'character_trait':
              const characterTraitsRepository = new CharacterTraitsRepository();
              const addCharacterTraitUseCase = new AddCharacterTraitUseCase(characterTraitsRepository);
              
              result = await addCharacterTraitUseCase.execute({
                characterId: validatedData.characterId,
                traitName: validatedData.traitName,
                category: validatedData.category,
                reasoning: validatedData.reasoning,
                userId: user.userId,
              });
              message = "Character trait added successfully";
              break;

            case 'pokemon_trait':
              // For now, Pokemon traits are stored as trait mappings with weight 1.0
              const pokemonTraitMappingRepository = new TraitMappingRepository();
              const addPokemonTraitUseCase = new AddTraitMappingUseCase(pokemonTraitMappingRepository);
              
              result = await addPokemonTraitUseCase.execute({
                traitName: validatedData.traitName,
                pokemonId: validatedData.pokemonId,
                weight: 1.0, // Default weight for pokemon traits
                reasoning: validatedData.reasoning || `Custom trait added to Pokemon ${validatedData.pokemonId}`,
                category: validatedData.category,
                userId: user.userId,
              });
              message = "Pokemon trait added successfully";
              break;

            default:
              throw new Error(`Unsupported data type: ${validatedData.type}`);
          }
        } else {
          // Backward compatibility: handle original custom data format
          const customDataRepository = new CustomDataRepository();
          const storeCustomDataUseCase = new StoreCustomDataUseCase(customDataRepository);

          result = await storeCustomDataUseCase.execute({
            ...validatedData,
            userId: user.userId,
          });
          message = "Custom data stored successfully";
        }

        const processingTime = Date.now() - startTime;

        return {
          statusCode: 201,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "X-Processing-Time": processingTime.toString(),
          },
          body: JSON.stringify({
            success: true,
            data: result,
            message: message,
          }),
        };
      }
    ),
    { maxRequests: 30, windowMinutes: 1 }
  )
);
