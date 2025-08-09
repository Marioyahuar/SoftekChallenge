// AWS X-Ray integration utilities
// Note: In a real implementation, you would use aws-xray-sdk-core

interface TraceSegment {
  name: string;
  startTime: number;
  endTime?: number;
  metadata?: Record<string, unknown>;
  annotations?: Record<string, string | number | boolean>;
  error?: boolean;
  fault?: boolean;
  subsegments?: TraceSegment[];
}

class XRayTracer {
  private segments: Map<string, TraceSegment> = new Map();
  private currentSegment: string | null = null;

  public startSegment(name: string, metadata?: Record<string, unknown>): string {
    const segmentId = `${name}-${Date.now()}-${Math.random().toString(36)}`;
    
    const segment: TraceSegment = {
      name,
      startTime: Date.now(),
      metadata: metadata || {},
      annotations: {},
      subsegments: [],
    };

    this.segments.set(segmentId, segment);
    this.currentSegment = segmentId;

    console.log(JSON.stringify({
      type: 'segment_start',
      segmentId,
      name,
      startTime: segment.startTime,
      metadata,
    }));

    return segmentId;
  }

  public endSegment(segmentId: string, error?: Error): void {
    const segment = this.segments.get(segmentId);
    if (!segment) {
      console.warn(`Segment ${segmentId} not found`);
      return;
    }

    segment.endTime = Date.now();
    
    if (error) {
      segment.error = true;
      segment.fault = true;
      segment.metadata = {
        ...segment.metadata,
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack,
        },
      };
    }

    console.log(JSON.stringify({
      type: 'segment_end',
      segmentId,
      name: segment.name,
      duration: segment.endTime - segment.startTime,
      error: segment.error,
      fault: segment.fault,
      annotations: segment.annotations,
    }));

    if (this.currentSegment === segmentId) {
      this.currentSegment = null;
    }
  }

  public addAnnotation(key: string, value: string | number | boolean): void {
    if (!this.currentSegment) {
      console.warn('No active segment to add annotation to');
      return;
    }

    const segment = this.segments.get(this.currentSegment);
    if (segment) {
      segment.annotations![key] = value;
    }
  }

  public addMetadata(key: string, value: unknown): void {
    if (!this.currentSegment) {
      console.warn('No active segment to add metadata to');
      return;
    }

    const segment = this.segments.get(this.currentSegment);
    if (segment) {
      segment.metadata![key] = value;
    }
  }

  public startSubsegment(name: string, parentSegmentId?: string): string {
    const subsegmentId = this.startSegment(name);
    
    if (parentSegmentId) {
      const parentSegment = this.segments.get(parentSegmentId);
      const subsegment = this.segments.get(subsegmentId);
      
      if (parentSegment && subsegment) {
        parentSegment.subsegments!.push(subsegment);
      }
    }

    return subsegmentId;
  }

  public traceFunction<T>(
    name: string,
    fn: () => T,
    metadata?: Record<string, unknown>
  ): T {
    const segmentId = this.startSegment(name, metadata);
    
    try {
      const result = fn();
      this.endSegment(segmentId);
      return result;
    } catch (error) {
      this.endSegment(segmentId, error as Error);
      throw error;
    }
  }

  public async traceAsyncFunction<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const segmentId = this.startSegment(name, metadata);
    
    try {
      const result = await fn();
      this.endSegment(segmentId);
      return result;
    } catch (error) {
      this.endSegment(segmentId, error as Error);
      throw error;
    }
  }

  public traceExternalCall<T>(
    serviceName: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return this.traceAsyncFunction(
      `External-${serviceName}`,
      fn,
      {
        service: serviceName,
        operation,
        type: 'external',
      }
    );
  }

  public traceDatabaseCall<T>(
    operation: string,
    table: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return this.traceAsyncFunction(
      `Database-${operation}`,
      fn,
      {
        operation,
        table,
        type: 'database',
      }
    );
  }

  public traceCacheCall<T>(
    operation: string,
    key: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return this.traceAsyncFunction(
      `Cache-${operation}`,
      fn,
      {
        operation,
        key,
        type: 'cache',
      }
    );
  }
}

// Create singleton instance
export const tracer = new XRayTracer();

// Utility decorators for tracing
export const traced = (name?: string) => {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const traceName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function(...args: any[]) {
      return tracer.traceAsyncFunction(
        traceName,
        () => originalMethod.apply(this, args),
        {
          class: target.constructor.name,
          method: propertyKey,
          args: args.length,
        }
      );
    };

    return descriptor;
  };
};