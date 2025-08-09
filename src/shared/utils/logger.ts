import winston from 'winston';
import { environment } from '../../infrastructure/config/environment';

interface LogContext {
  requestId?: string;
  userId?: string;
  functionName?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  processingTime?: number;
  cacheHit?: boolean;
  apiCalls?: number;
  errorCode?: string;
  [key: string]: unknown;
}

class Logger {
  private winston: winston.Logger;

  constructor() {
    this.winston = winston.createLogger({
      level: environment.app.logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            message,
            ...meta,
          });
        })
      ),
      defaultMeta: {
        service: 'star-wars-pokemon-api',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    });

    // In AWS Lambda, logs go to CloudWatch automatically via console
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
      this.winston.add(
        new winston.transports.Console({
          format: winston.format.json(),
        })
      );
    }
  }

  public info(message: string, context?: LogContext): void {
    this.winston.info(message, context);
  }

  public error(message: string, error?: Error, context?: LogContext): void {
    this.winston.error(message, {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  public warn(message: string, context?: LogContext): void {
    this.winston.warn(message, context);
  }

  public debug(message: string, context?: LogContext): void {
    this.winston.debug(message, context);
  }

  public logApiRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    processingTime: number,
    context?: LogContext
  ): void {
    this.info('API Request', {
      ...context,
      method,
      endpoint,
      statusCode,
      processingTime,
      type: 'api_request',
    });
  }

  public logCacheOperation(
    operation: 'hit' | 'miss' | 'set',
    key: string,
    context?: LogContext
  ): void {
    this.debug('Cache Operation', {
      ...context,
      operation,
      key,
      type: 'cache_operation',
    });
  }

  public logExternalApiCall(
    apiName: string,
    endpoint: string,
    duration: number,
    success: boolean,
    context?: LogContext
  ): void {
    this.info('External API Call', {
      ...context,
      apiName,
      endpoint,
      duration,
      success,
      type: 'external_api_call',
    });
  }

  public logFusionOperation(
    characterId: number,
    pokemonId: number,
    strategy: string,
    fusionScore: number,
    processingTime: number,
    context?: LogContext
  ): void {
    this.info('Fusion Operation', {
      ...context,
      characterId,
      pokemonId,
      strategy,
      fusionScore,
      processingTime,
      type: 'fusion_operation',
    });
  }

  public logPerformanceMetric(
    metric: string,
    value: number,
    unit: string,
    context?: LogContext
  ): void {
    this.info('Performance Metric', {
      ...context,
      metric,
      value,
      unit,
      type: 'performance_metric',
    });
  }

  public logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: LogContext
  ): void {
    const logMethod = severity === 'critical' || severity === 'high' ? 'error' : 'warn';
    this[logMethod]('Security Event', {
      ...context,
      event,
      severity,
      type: 'security_event',
    });
  }

  public logBusinessEvent(
    event: string,
    data: Record<string, unknown>,
    context?: LogContext
  ): void {
    this.info('Business Event', {
      ...context,
      event,
      data,
      type: 'business_event',
    });
  }
}

export const logger = new Logger();
export { LogContext };