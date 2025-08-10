import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { GetHistoryUseCase } from "../../../../application/use-cases/GetHistoryUseCase";
import { FusedDataRepository } from "../../database/mysql/repositories/FusedDataRepository";
import { withErrorHandling } from "../middleware/errorMiddleware";
import {
  withAuthentication,
  AuthenticatedUser,
} from "../middleware/authMiddleware";
import { withRateLimit } from "../middleware/rateLimitMiddleware";
import {
  validateQueryParams,
  historyQuerySchema,
} from "../schemas/validation-schemas";
import { environment } from "../../../config/environment";

export const handler = withErrorHandling(
  withRateLimit(
    withAuthentication(
      async (
        event: APIGatewayProxyEvent,
        user: AuthenticatedUser
      ): Promise<APIGatewayProxyResult> => {
        const startTime = Date.now();
        const httpMethod = event.httpMethod || event.requestContext?.httpMethod || 'GET';
        console.log("EVENT HTTP METHOD ts:", httpMethod);
        if (httpMethod === "OPTIONS") {
          return {
            statusCode: 200,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Headers":
                "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
              "Access-Control-Allow-Methods": "GET,OPTIONS",
            },
            body: "",
          };
        }

        if (httpMethod !== "GET") {
          return {
            statusCode: 405,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
              error: {
                code: "METHOD_NOT_ALLOWED",
                message: "Only GET method is allowed",
              },
            }),
          };
        }

        const queryParams = validateQueryParams(historyQuerySchema)(
          event.queryStringParameters || {}
        );

        const fusedDataRepository = new FusedDataRepository();
        const getHistoryUseCase = new GetHistoryUseCase(fusedDataRepository);

        // Verificar si el usuario es admin
        const isAdmin = environment.app.adminUserIds.includes(user.userId);

        const historyResponse = await getHistoryUseCase.execute({
          ...queryParams,
          userId: user.userId,
          isAdmin,
        });

        const processingTime = Date.now() - startTime;

        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "X-Processing-Time": processingTime.toString(),
          },
          body: JSON.stringify(historyResponse),
        };
      }
    ),
    { maxRequests: 100, windowMinutes: 1 }
  )
);
