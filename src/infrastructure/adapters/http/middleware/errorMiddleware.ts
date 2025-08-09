import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DomainError } from '../../../../domain/errors/DomainError';
import { ExternalApiError } from '../../../../domain/errors/ExternalApiError';
import { FusionError } from '../../../../domain/errors/FusionError';

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: string;
    timestamp: string;
    requestId?: string;
  };
}

export const handleError = (
  error: Error,
  event: APIGatewayProxyEvent
): APIGatewayProxyResult => {
  const timestamp = new Date().toISOString();
  const requestId = event.requestContext.requestId;

  console.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    event: {
      path: event.path,
      httpMethod: event.httpMethod,
      queryStringParameters: event.queryStringParameters,
      headers: event.headers,
    },
    requestId,
    timestamp,
  });

  if (error instanceof DomainError) {
    return createErrorResponse(
      getDomainErrorStatusCode(error),
      error.code,
      error.message,
      requestId,
      timestamp
    );
  }

  if (error.message.includes('Validation error')) {
    return createErrorResponse(
      400,
      'VALIDATION_ERROR',
      error.message,
      requestId,
      timestamp
    );
  }

  if (error.message.includes('Unauthorized') || error.message.includes('Invalid token')) {
    return createErrorResponse(
      401,
      'UNAUTHORIZED',
      'Authentication required or invalid token',
      requestId,
      timestamp
    );
  }

  if (error.message.includes('Forbidden')) {
    return createErrorResponse(
      403,
      'FORBIDDEN',
      'Access denied',
      requestId,
      timestamp
    );
  }

  if (error.message.includes('Not found')) {
    return createErrorResponse(
      404,
      'NOT_FOUND',
      'Resource not found',
      requestId,
      timestamp
    );
  }

  return createErrorResponse(
    500,
    'INTERNAL_SERVER_ERROR',
    'An unexpected error occurred',
    requestId,
    timestamp,
    process.env.NODE_ENV === 'development' ? error.message : undefined
  );
};

const getDomainErrorStatusCode = (error: DomainError): number => {
  if (error instanceof ExternalApiError) {
    return 502;
  }

  if (error instanceof FusionError) {
    return 400;
  }

  return 500;
};

const createErrorResponse = (
  statusCode: number,
  code: string,
  message: string,
  requestId?: string,
  timestamp?: string,
  details?: string
): APIGatewayProxyResult => {
  const errorResponse: ErrorResponse = {
    error: {
      code,
      message,
      timestamp: timestamp || new Date().toISOString(),
      ...(requestId && { requestId }),
      ...(details && { details }),
    },
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    },
    body: JSON.stringify(errorResponse),
  };
};

export const withErrorHandling = (
  handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>
) => {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      return await handler(event);
    } catch (error) {
      return handleError(error as Error, event);
    }
  };
};