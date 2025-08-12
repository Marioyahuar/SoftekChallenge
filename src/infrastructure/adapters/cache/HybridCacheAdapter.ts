import { ICacheService } from '../../../application/ports/services/ICacheService';
import { DynamoDBCacheAdapter } from './DynamoDBCacheAdapter';
import { MemoryCacheAdapter } from './MemoryCacheAdapter';

export class HybridCacheAdapter implements ICacheService {
  private dynamoCache: DynamoDBCacheAdapter;
  private memoryCache: MemoryCacheAdapter;
  private dynamoEnabled: boolean;

  constructor() {
    this.dynamoCache = new DynamoDBCacheAdapter();
    this.memoryCache = new MemoryCacheAdapter();
    // DynamoDB cache enabled for production
    this.dynamoEnabled = true;
    console.log('HybridCacheAdapter initialized with DynamoDB cache enabled');
  }

  public async get<T>(key: string): Promise<T | null> {
    // First check memory cache (fastest)
    let value = await this.memoryCache.get<T>(key);
    
    if (value) {
      return value;
    }

    // Then check DynamoDB cache
    if (this.dynamoEnabled) {
      value = await this.dynamoCache.get<T>(key);
      
      if (value) {
        // Store in memory for faster access
        await this.memoryCache.set(key, value, 300);
        return value;
      }
    }

    return null;
  }

  public async set<T>(key: string, value: T, ttlSeconds = 1800): Promise<void> {
    // Always set in memory cache (fast access)
    const memoryPromise = this.memoryCache.set(key, value, Math.min(ttlSeconds, 300));
    
    // Also set in DynamoDB cache (persistent)
    if (this.dynamoEnabled) {
      const ttlMinutes = Math.ceil(ttlSeconds / 60);
      await Promise.all([
        memoryPromise,
        this.dynamoCache.set(key, JSON.stringify(value), ttlMinutes)
      ]);
    } else {
      await memoryPromise;
    }
  }

  public async delete(key: string): Promise<void> {
    // Always delete from memory cache
    const memoryPromise = this.memoryCache.delete(key);
    
    // Delete from both memory and DynamoDB cache
    if (this.dynamoEnabled) {
      await Promise.all([
        memoryPromise,
        this.dynamoCache.delete(key)
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

    // Check DynamoDB cache if enabled
    if (this.dynamoEnabled) {
      return await this.dynamoCache.exists(key);
    }
    
    return false;
  }

  public async clear(): Promise<void> {
    // Always clear memory cache
    const memoryPromise = this.memoryCache.clear();
    
    // Clear both memory and DynamoDB cache
    if (this.dynamoEnabled) {
      await Promise.all([
        memoryPromise,
        this.dynamoCache.clear()
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