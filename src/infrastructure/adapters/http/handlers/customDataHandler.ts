import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { StoreCustomDataUseCase } from '../../../../application/use-cases/StoreCustomDataUseCase';
import { CustomDataRepository } from '../../../database/mysql/repositories/CustomDataRepository';
import { withErrorHandling } from '../middleware/errorMiddleware';
import { withAuthentication, AuthenticatedUser } from '../middleware/authMiddleware';
import { withRateLimit } from '../middleware/rateLimitMiddleware';
import { validateBody, customDataSchema } from '../schemas/validation-schemas';

export const handler = withErrorHandling(
  withRateLimit(
    withAuthentication(
      async (event: APIGatewayProxyEvent, user: AuthenticatedUser): Promise<APIGatewayProxyResult> => {
        const startTime = Date.now();

        if (event.httpMethod === 'OPTIONS') {
          return {
            statusCode: 200,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
              'Access-Control-Allow-Methods': 'POST,OPTIONS',
            },
            body: '',
          };
        }

        if (event.httpMethod !== 'POST') {
          return {
            statusCode: 405,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              error: {
                code: 'METHOD_NOT_ALLOWED',
                message: 'Only POST method is allowed',
              },
            }),
          };
        }

        if (!event.body) {
          return {
            statusCode: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              error: {
                code: 'MISSING_BODY',
                message: 'Request body is required',
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
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
              error: {
                code: 'INVALID_JSON',
                message: 'Request body must be valid JSON',
              },
            }),
          };
        }

        const validatedData = validateBody(customDataSchema)(requestBody);

        const customDataRepository = new CustomDataRepository();
        const storeCustomDataUseCase = new StoreCustomDataUseCase(customDataRepository);

        const customData = await storeCustomDataUseCase.execute({
          ...validatedData,
          userId: user.userId,
        });

        const processingTime = Date.now() - startTime;

        return {
          statusCode: 201,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'X-Processing-Time': processingTime.toString(),
          },
          body: JSON.stringify({
            success: true,
            data: customData.toJSON(),
            message: 'Custom data stored successfully',
          }),
        };
      }
    ),
    { maxRequests: 30, windowMinutes: 1 }
  )
);