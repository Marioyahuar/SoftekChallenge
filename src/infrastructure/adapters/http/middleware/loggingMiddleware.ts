import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { logger } from '../../../../shared/utils/logger';
import { metrics, PerformanceMonitor } from '../../../../shared/utils/metrics';
import { v4 as uuidv4 } from 'uuid';

export interface LoggingContext {
  requestId: string;
  userId?: string;
  functionName: string;
  startTime: number;
}

export const withLogging = (
  handler: (event: APIGatewayProxyEvent, context?: LoggingContext) => Promise<APIGatewayProxyResult>
) => {
  return async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const requestId = event.requestContext.requestId || uuidv4();
    const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME || 'local-function';
    const startTime = Date.now();

    const loggingContext: LoggingContext = {
      requestId,
      functionName,
      startTime,
    };

    // Extract user ID if available
    if (event.requestContext.authorizer?.claims?.sub) {
      loggingContext.userId = event.requestContext.authorizer.claims.sub;
    }

    // Log request start
    logger.info('Request started', {
      requestId,
      method: event.httpMethod,
      path: event.path,
      userAgent: event.headers['User-Agent'],
      sourceIp: event.requestContext.identity.sourceIp,
      userId: loggingContext.userId,
      queryParams: event.queryStringParameters,
    });

    // Start performance timer
    const timerKey = `request-${requestId}`;
    PerformanceMonitor.startTimer(timerKey);

    try {
      // Execute the handler
      const result = await handler(event, loggingContext);

      const processingTime = PerformanceMonitor.endTimer(timerKey);

      // Log successful request
      logger.logApiRequest(
        event.httpMethod,
        event.path,
        result.statusCode,
        processingTime,
        {
          requestId,
          userId: loggingContext.userId,
          functionName,
        }
      );

      // Record metrics
      metrics.recordResponseTime(
        event.path,
        event.httpMethod,
        processingTime,
        result.statusCode
      );

      // Record memory usage periodically
      if (Math.random() < 0.1) { // 10% of requests
        metrics.recordMemoryUsage();
      }

      // Add logging headers to response
      const loggingHeaders = {
        'X-Request-ID': requestId,
        'X-Processing-Time': processingTime.toString(),
        'X-Function-Name': functionName,
      };

      return {
        ...result,
        headers: {
          ...result.headers,
          ...loggingHeaders,
        },
      };

    } catch (error) {
      const processingTime = PerformanceMonitor.endTimer(timerKey);
      const err = error as Error;

      // Log error
      logger.error('Request failed', err, {
        requestId,
        method: event.httpMethod,
        path: event.path,
        processingTime,
        userId: loggingContext.userId,
        functionName,
      });

      // Record error metrics
      metrics.recordErrorRate(
        event.path,
        err.name || 'UnknownError',
        1
      );

      metrics.recordResponseTime(
        event.path,
        event.httpMethod,
        processingTime,
        500
      );

      // Re-throw error to be handled by error middleware
      throw error;
    }
  };
};

export const logBusinessEvent = (
  event: string,
  data: Record<string, unknown>,
  context?: LoggingContext
): void => {
  logger.logBusinessEvent(event, data, {
    requestId: context?.requestId,
    userId: context?.userId,
    functionName: context?.functionName,
  });
};

export const logSecurityEvent = (
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  context?: LoggingContext,
  additionalData?: Record<string, unknown>
): void => {
  logger.logSecurityEvent(event, severity, {
    requestId: context?.requestId,
    userId: context?.userId,
    functionName: context?.functionName,
    ...additionalData,
  });
};

export const logCacheOperation = (
  operation: 'hit' | 'miss' | 'set',
  key: string,
  context?: LoggingContext
): void => {
  logger.logCacheOperation(operation, key, {
    requestId: context?.requestId,
    userId: context?.userId,
    functionName: context?.functionName,
  });
};