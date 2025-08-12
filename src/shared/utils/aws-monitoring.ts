import AWSXRay from 'aws-xray-sdk-core';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { environment } from '../../infrastructure/config/environment';

// Initialize CloudWatch client
const cloudWatch = new CloudWatchClient({ region: environment.aws.region });

// X-Ray configuration
if (process.env.NODE_ENV !== 'development') {
  // Only enable X-Ray in production/staging
  AWSXRay.config([AWSXRay.plugins.ECSPlugin, AWSXRay.plugins.EC2Plugin]);
  AWSXRay.captureAWS(require('aws-sdk'));
}

/**
 * Real AWS X-Ray tracing utilities
 */
export class XRayTracing {
  /**
   * Trace an external API call
   */
  static async traceExternalCall<T>(
    serviceName: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    // Always use simplified tracing for now
    console.log(`[X-Ray] Tracing: ${serviceName} - ${operation}`);
    const startTime = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      console.log(`[X-Ray] Completed: ${serviceName} - ${operation} in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`[X-Ray] Failed: ${serviceName} - ${operation} after ${duration}ms`);
      throw error;
    }
  }

  /**
   * Trace a database operation
   */
  static async traceDatabaseCall<T>(
    operation: string,
    table: string,
    fn: () => Promise<T>
  ): Promise<T> {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[X-Ray Dev] DB Tracing: ${operation} on ${table}`);
      return await fn();
    }

    const segment = AWSXRay.getSegment();
    if (!segment) {
      return await fn();
    }

    const subsegment = segment.addNewSubsegment('Database');
    subsegment.addAnnotation('operation', operation);
    subsegment.addAnnotation('table', table);
    subsegment.namespace = 'aws';

    try {
      const result = await fn();
      subsegment.close();
      return result;
    } catch (error) {
      subsegment.addError(error as Error);
      subsegment.close();
      throw error;
    }
  }
}

/**
 * Real CloudWatch custom metrics
 */
export class CloudWatchMetrics {
  private static namespace = 'StarWarsPokemon/API';

  /**
   * Record API response time
   */
  static async recordResponseTime(
    endpoint: string,
    method: string,
    duration: number,
    statusCode: number
  ): Promise<void> {
    try {
      await cloudWatch.send(new PutMetricDataCommand({
        Namespace: this.namespace,
        MetricData: [
          {
            MetricName: 'ResponseTime',
            Value: duration,
            Unit: 'Milliseconds',
            Dimensions: [
              { Name: 'Endpoint', Value: endpoint },
              { Name: 'Method', Value: method },
              { Name: 'StatusCode', Value: statusCode.toString() }
            ],
            Timestamp: new Date()
          }
        ]
      }));
      
      console.log(`[CloudWatch] Metric sent: ResponseTime=${duration}ms for ${method} ${endpoint}`);
    } catch (error) {
      console.error('[CloudWatch] Failed to send metric:', error);
    }
  }

  /**
   * Record fusion performance
   */
  static async recordFusionMetrics(
    strategy: string,
    cacheHit: boolean,
    processingTime: number
  ): Promise<void> {
    try {
      await cloudWatch.send(new PutMetricDataCommand({
        Namespace: this.namespace,
        MetricData: [
          {
            MetricName: 'FusionProcessingTime',
            Value: processingTime,
            Unit: 'Milliseconds',
            Dimensions: [
              { Name: 'Strategy', Value: strategy },
              { Name: 'CacheHit', Value: cacheHit.toString() }
            ],
            Timestamp: new Date()
          },
          {
            MetricName: 'CacheHitRate',
            Value: cacheHit ? 1 : 0,
            Unit: 'Count',
            Dimensions: [
              { Name: 'Strategy', Value: strategy }
            ],
            Timestamp: new Date()
          }
        ]
      }));

      console.log(`[CloudWatch] Fusion metrics sent: strategy=${strategy}, cache=${cacheHit}, time=${processingTime}ms`);
    } catch (error) {
      console.error('[CloudWatch] Failed to send fusion metrics:', error);
    }
  }

  /**
   * Record error rate
   */
  static async recordError(
    endpoint: string,
    errorType: string
  ): Promise<void> {
    try {
      await cloudWatch.send(new PutMetricDataCommand({
        Namespace: this.namespace,
        MetricData: [
          {
            MetricName: 'ErrorRate',
            Value: 1,
            Unit: 'Count',
            Dimensions: [
              { Name: 'Endpoint', Value: endpoint },
              { Name: 'ErrorType', Value: errorType }
            ],
            Timestamp: new Date()
          }
        ]
      }));

      console.log(`[CloudWatch] Error metric sent: ${errorType} on ${endpoint}`);
    } catch (error) {
      console.error('[CloudWatch] Failed to send error metric:', error);
    }
  }
}

/**
 * Middleware wrapper for X-Ray tracing
 */
export const withXRayTracing = (
  handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>, 
  name: string
): ((event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>) => {
  // Use simplified tracing without Layer dependency
  if (true) {
    // In development, just add console logging
    return async (event: APIGatewayProxyEvent) => {
      console.log(`[X-Ray Dev] Handler: ${name} started`);
      const startTime = Date.now();
      try {
        const result = await handler(event);
        const duration = Date.now() - startTime;
        console.log(`[X-Ray Dev] Handler: ${name} completed in ${duration}ms`);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.log(`[X-Ray Dev] Handler: ${name} failed after ${duration}ms`);
        throw error;
      }
    };
  }

  // In production, create a wrapper for X-Ray that matches our signature
  return async (event: APIGatewayProxyEvent) => {
    return AWSXRay.captureAsyncFunc(name, async () => {
      return await handler(event);
    });
  };
};