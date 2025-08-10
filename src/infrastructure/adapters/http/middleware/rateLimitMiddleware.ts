import { APIGatewayProxyEvent } from "aws-lambda";
import { RedisCacheAdapter } from "../../cache/RedisCacheAdapter";
import { environment } from "../../../config/environment";

interface RateLimitConfig {
  windowMinutes: number;
  maxRequests: number;
}

interface RateLimitInfo {
  requests: number;
  resetTime: number;
}

export class RateLimitMiddleware {
  private cache: RedisCacheAdapter;
  private defaultConfig: RateLimitConfig;

  constructor() {
    this.cache = new RedisCacheAdapter();
    this.defaultConfig = {
      windowMinutes: 1,
      maxRequests: environment.app.apiRateLimitRpm,
    };
  }

  public async checkRateLimit(
    event: APIGatewayProxyEvent,
    config: Partial<RateLimitConfig> = {}
  ): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
  }> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const clientId = this.getClientIdentifier(event);
    const windowKey = this.getRateLimitKey(clientId, event.path || "/unknown");

    const windowStart = Date.now();
    const windowEnd = windowStart + finalConfig.windowMinutes * 60 * 1000;

    try {
      const existingInfo = await this.cache.get<RateLimitInfo>(windowKey);

      if (!existingInfo || existingInfo.resetTime <= windowStart) {
        const newInfo: RateLimitInfo = {
          requests: 1,
          resetTime: windowEnd,
        };

        await this.cache.set(
          windowKey,
          newInfo,
          finalConfig.windowMinutes * 60
        );

        return {
          allowed: true,
          limit: finalConfig.maxRequests,
          remaining: finalConfig.maxRequests - 1,
          resetTime: windowEnd,
        };
      }

      if (existingInfo.requests >= finalConfig.maxRequests) {
        return {
          allowed: false,
          limit: finalConfig.maxRequests,
          remaining: 0,
          resetTime: existingInfo.resetTime,
        };
      }

      const updatedInfo: RateLimitInfo = {
        requests: existingInfo.requests + 1,
        resetTime: existingInfo.resetTime,
      };

      await this.cache.set(
        windowKey,
        updatedInfo,
        Math.ceil((existingInfo.resetTime - windowStart) / 1000)
      );

      return {
        allowed: true,
        limit: finalConfig.maxRequests,
        remaining: finalConfig.maxRequests - updatedInfo.requests,
        resetTime: existingInfo.resetTime,
      };
    } catch (error) {
      console.error("Rate limiting check failed:", error);

      return {
        allowed: true,
        limit: finalConfig.maxRequests,
        remaining: finalConfig.maxRequests - 1,
        resetTime: windowEnd,
      };
    }
  }

  private getClientIdentifier(event: APIGatewayProxyEvent): string {
    const xForwardedFor = (event.headers["X-Forwarded-For"] ??
      event.headers["x-forwarded-for"] ??
      "") as string;

    // Handle serverless-offline development mode
    const sourceIp = event.requestContext?.identity?.sourceIp || "127.0.0.1";

    const userAgent =
      event.headers["User-Agent"] ??
      event.headers["user-agent"] ??
      "unknown_agent";

    const clientIp = xForwardedFor
      ? xForwardedFor.split(",")[0]?.trim() || sourceIp
      : sourceIp;

    const authHeader =
      event.headers.Authorization ?? event.headers.authorization;

    if (authHeader) {
      const hashedAuth = this.simpleHash(authHeader);
      return `auth_${hashedAuth}`;
    }

    const fingerprint = this.simpleHash(`${clientIp}_${userAgent}`);
    return `ip_${fingerprint}`;
  }

  private getRateLimitKey(clientId: string, path: string): string {
    const endpoint = path?.split("/")[1] || "unknown";
    return `ratelimit:${endpoint}:${clientId}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

export const withRateLimit = (
  handler: (event: APIGatewayProxyEvent) => Promise<any>,
  config: Partial<RateLimitConfig> = {}
) => {
  const rateLimitMiddleware = new RateLimitMiddleware();

  return async (event: APIGatewayProxyEvent) => {
    const rateLimitResult = await rateLimitMiddleware.checkRateLimit(
      event,
      config
    );

    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil(
        (rateLimitResult.resetTime - Date.now()) / 1000
      );

      return {
        statusCode: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
          "Retry-After": retryAfter.toString(),
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests. Please try again later.",
            retryAfter,
            limit: rateLimitResult.limit,
          },
        }),
      };
    }

    const response = await handler(event);

    if (response.headers) {
      response.headers["X-RateLimit-Limit"] = rateLimitResult.limit.toString();
      response.headers["X-RateLimit-Remaining"] =
        rateLimitResult.remaining.toString();
      response.headers["X-RateLimit-Reset"] =
        rateLimitResult.resetTime.toString();
    }

    return response;
  };
};
