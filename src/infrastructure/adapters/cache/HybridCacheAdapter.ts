import { ICacheService } from '../../../application/ports/services/ICacheService';
import { RedisCacheAdapter } from './RedisCacheAdapter';
import { MemoryCacheAdapter } from './MemoryCacheAdapter';

export class HybridCacheAdapter implements ICacheService {
  private redisCache: RedisCacheAdapter;
  private memoryCache: MemoryCacheAdapter;

  constructor() {
    this.redisCache = new RedisCacheAdapter();
    this.memoryCache = new MemoryCacheAdapter();
  }

  public async get<T>(key: string): Promise<T | null> {
    let value = await this.memoryCache.get<T>(key);
    
    if (value) {
      return value;
    }

    value = await this.redisCache.get<T>(key);
    
    if (value) {
      await this.memoryCache.set(key, value, 300);
      return value;
    }

    return null;
  }

  public async set<T>(key: string, value: T, ttlSeconds = 1800): Promise<void> {
    await Promise.all([
      this.memoryCache.set(key, value, Math.min(ttlSeconds, 300)),
      this.redisCache.set(key, value, ttlSeconds)
    ]);
  }

  public async delete(key: string): Promise<void> {
    await Promise.all([
      this.memoryCache.delete(key),
      this.redisCache.delete(key)
    ]);
  }

  public async exists(key: string): Promise<boolean> {
    const memoryExists = await this.memoryCache.exists(key);
    if (memoryExists) {
      return true;
    }

    return await this.redisCache.exists(key);
  }

  public async clear(): Promise<void> {
    await Promise.all([
      this.memoryCache.clear(),
      this.redisCache.clear()
    ]);
  }

  public async warmUp(keys: Array<{ key: string; generator: () => Promise<unknown> }>): Promise<void> {
    const warmupPromises = keys.map(async ({ key, generator }) => {
      const exists = await this.exists(key);
      if (!exists) {
        try {
          const value = await generator();
          await this.set(key, value);
        } catch (error) {
          console.error(`Failed to warm up cache for key ${key}:`, error);
        }
      }
    });

    await Promise.all(warmupPromises);
  }

  public async getOrSet<T>(
    key: string,
    generator: () => Promise<T>,
    ttlSeconds = 1800
  ): Promise<T> {
    let value = await this.get<T>(key);
    
    if (value !== null) {
      return value;
    }

    value = await generator();
    await this.set(key, value, ttlSeconds);
    return value;
  }
}