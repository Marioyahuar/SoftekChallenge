import { ICacheService } from '../../../application/ports/services/ICacheService';
import { RedisCacheAdapter } from './RedisCacheAdapter';
import { MemoryCacheAdapter } from './MemoryCacheAdapter';

export class HybridCacheAdapter implements ICacheService {
  private redisCache: RedisCacheAdapter;
  private memoryCache: MemoryCacheAdapter;
  private redisEnabled: boolean;

  constructor() {
    this.redisCache = new RedisCacheAdapter();
    this.memoryCache = new MemoryCacheAdapter();
    // Redis is temporarily disabled - using only memory cache
    this.redisEnabled = false;
    console.log('HybridCacheAdapter initialized with Redis temporarily disabled - falling back to memory-only caching');
  }

  public async get<T>(key: string): Promise<T | null> {
    let value = await this.memoryCache.get<T>(key);
    
    if (value) {
      return value;
    }

    // Redis temporarily disabled - skip Redis lookup
    if (this.redisEnabled) {
      value = await this.redisCache.get<T>(key);
      
      if (value) {
        await this.memoryCache.set(key, value, 300);
        return value;
      }
    }

    return null;
  }

  public async set<T>(key: string, value: T, ttlSeconds = 1800): Promise<void> {
    // Always set in memory cache
    const memoryPromise = this.memoryCache.set(key, value, Math.min(ttlSeconds, 300));
    
    // Redis temporarily disabled - only use memory cache
    if (this.redisEnabled) {
      await Promise.all([
        memoryPromise,
        this.redisCache.set(key, value, ttlSeconds)
      ]);
    } else {
      await memoryPromise;
    }
  }

  public async delete(key: string): Promise<void> {
    // Always delete from memory cache
    const memoryPromise = this.memoryCache.delete(key);
    
    // Redis temporarily disabled - only delete from memory cache
    if (this.redisEnabled) {
      await Promise.all([
        memoryPromise,
        this.redisCache.delete(key)
      ]);
    } else {
      await memoryPromise;
    }
  }

  public async exists(key: string): Promise<boolean> {
    const memoryExists = await this.memoryCache.exists(key);
    if (memoryExists) {
      return true;
    }

    // Redis temporarily disabled - only check memory cache
    if (this.redisEnabled) {
      return await this.redisCache.exists(key);
    }
    
    return false;
  }

  public async clear(): Promise<void> {
    // Always clear memory cache
    const memoryPromise = this.memoryCache.clear();
    
    // Redis temporarily disabled - only clear memory cache
    if (this.redisEnabled) {
      await Promise.all([
        memoryPromise,
        this.redisCache.clear()
      ]);
    } else {
      await memoryPromise;
    }
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