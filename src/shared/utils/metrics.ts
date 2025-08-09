import { logger } from './logger';

export interface MetricData {
  name: string;
  value: number;
  unit: string;
  dimensions?: Record<string, string>;
  timestamp?: Date;
}

export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: MetricData[] = [];

  private constructor() {}

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  public recordMetric(
    name: string,
    value: number,
    unit: string,
    dimensions?: Record<string, string>
  ): void {
    const metric: MetricData = {
      name,
      value,
      unit,
      dimensions: dimensions || {},
      timestamp: new Date(),
    };

    this.metrics.push(metric);

    // Log the metric for CloudWatch ingestion
    logger.logPerformanceMetric(name, value, unit, {
      dimensions: dimensions || {},
      timestamp: metric.timestamp.toISOString(),
    });

    // In a real AWS environment, you would also send to CloudWatch directly
    this.sendToCloudWatch(metric);
  }

  public recordResponseTime(
    endpoint: string,
    method: string,
    duration: number,
    statusCode: number
  ): void {
    this.recordMetric('ResponseTime', duration, 'Milliseconds', {
      Endpoint: endpoint,
      Method: method,
      StatusCode: statusCode.toString(),
    });
  }

  public recordCacheHitRatio(
    cacheType: string,
    hits: number,
    total: number
  ): void {
    const ratio = total > 0 ? (hits / total) * 100 : 0;
    this.recordMetric('CacheHitRatio', ratio, 'Percent', {
      CacheType: cacheType,
    });
  }

  public recordExternalApiCall(
    apiName: string,
    success: boolean,
    duration: number
  ): void {
    this.recordMetric('ExternalApiCallDuration', duration, 'Milliseconds', {
      ApiName: apiName,
      Success: success.toString(),
    });

    this.recordMetric('ExternalApiCallCount', 1, 'Count', {
      ApiName: apiName,
      Success: success.toString(),
    });
  }

  public recordFusionScore(
    strategy: string,
    score: number,
    compatibilityLevel: string
  ): void {
    this.recordMetric('FusionScore', score, 'None', {
      Strategy: strategy,
      CompatibilityLevel: compatibilityLevel,
    });
  }

  public recordErrorRate(
    endpoint: string,
    errorCode: string,
    count: number
  ): void {
    this.recordMetric('ErrorCount', count, 'Count', {
      Endpoint: endpoint,
      ErrorCode: errorCode,
    });
  }

  public recordDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    success: boolean
  ): void {
    this.recordMetric('DatabaseOperationDuration', duration, 'Milliseconds', {
      Operation: operation,
      Table: table,
      Success: success.toString(),
    });
  }

  public recordRateLimitHit(
    endpoint: string,
    clientId: string
  ): void {
    this.recordMetric('RateLimitHits', 1, 'Count', {
      Endpoint: endpoint,
      ClientId: clientId,
    });
  }

  public recordMemoryUsage(): void {
    const memoryUsage = process.memoryUsage();
    
    this.recordMetric('MemoryUsage_RSS', memoryUsage.rss / 1024 / 1024, 'Megabytes');
    this.recordMetric('MemoryUsage_HeapUsed', memoryUsage.heapUsed / 1024 / 1024, 'Megabytes');
    this.recordMetric('MemoryUsage_HeapTotal', memoryUsage.heapTotal / 1024 / 1024, 'Megabytes');
    this.recordMetric('MemoryUsage_External', memoryUsage.external / 1024 / 1024, 'Megabytes');
  }

  public getMetrics(): MetricData[] {
    return [...this.metrics];
  }

  public clearMetrics(): void {
    this.metrics = [];
  }

  private sendToCloudWatch(metric: MetricData): void {
    // In a real AWS environment, you would use AWS SDK to send metrics
    // For now, we'll just log them in a format that CloudWatch can parse
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
      console.log(JSON.stringify({
        MetricName: metric.name,
        Value: metric.value,
        Unit: metric.unit,
        Dimensions: metric.dimensions,
        Timestamp: metric.timestamp?.toISOString(),
        Namespace: 'StarWarsPokemonAPI',
      }));
    }
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();

  public static startTimer(key: string): void {
    this.timers.set(key, Date.now());
  }

  public static endTimer(key: string): number {
    const startTime = this.timers.get(key);
    if (!startTime) {
      throw new Error(`Timer ${key} was not started`);
    }

    const duration = Date.now() - startTime;
    this.timers.delete(key);
    return duration;
  }

  public static async measureAsync<T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    this.startTimer(key);
    try {
      const result = await operation();
      const duration = this.endTimer(key);
      return { result, duration };
    } catch (error) {
      this.timers.delete(key);
      throw error;
    }
  }

  public static measure<T>(
    key: string,
    operation: () => T
  ): { result: T; duration: number } {
    this.startTimer(key);
    try {
      const result = operation();
      const duration = this.endTimer(key);
      return { result, duration };
    } catch (error) {
      this.timers.delete(key);
      throw error;
    }
  }
}

export const metrics = MetricsCollector.getInstance();