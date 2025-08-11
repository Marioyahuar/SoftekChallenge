// REDIS TEMPORARILY DISABLED - All Redis operations commented out to allow running without Redis server
// import { RedisClientType } from 'redis';
import { ICacheService } from '../../../application/ports/services/ICacheService';
import { RedisConfig } from '../../config/redis';

export class RedisCacheAdapter implements ICacheService {
  // private client: RedisClientType | null = null;

  private async getClient(): Promise<any> {
    // Redis client disabled - returning null
    // if (!this.client) {
    //   this.client = await RedisConfig.getClient();
    // }
    // return this.client;
    
    console.warn('Redis cache disabled - getClient returning null');
    return null;
  }

  public async get<T>(key: string): Promise<T | null> {
    // Redis get operation temporarily disabled
    // try {
    //   const client = await this.getClient();
    //   const value = await client.get(key);
    //   return value ? JSON.parse(value) : null;
    // } catch (error) {
    //   console.error('Redis get error:', error);
    //   return null;
    // }
    
    console.debug(`Redis get disabled - returning null for key: ${key}`);
    return null;
  }

  public async set<T>(key: string, value: T, ttlSeconds = 1800): Promise<void> {
    // Redis set operation temporarily disabled
    // try {
    //   const client = await this.getClient();
    //   const serializedValue = JSON.stringify(value);
    //   await client.setEx(key, ttlSeconds, serializedValue);
    // } catch (error) {
    //   console.error('Redis set error:', error);
    // }
    
    console.debug(`Redis set disabled - skipping cache for key: ${key}`);
  }

  public async delete(key: string): Promise<void> {
    // Redis delete operation temporarily disabled
    // try {
    //   const client = await this.getClient();
    //   await client.del(key);
    // } catch (error) {
    //   console.error('Redis delete error:', error);
    // }
    
    console.debug(`Redis delete disabled - skipping delete for key: ${key}`);
  }

  public async exists(key: string): Promise<boolean> {
    // Redis exists operation temporarily disabled
    // try {
    //   const client = await this.getClient();
    //   const result = await client.exists(key);
    //   return result === 1;
    // } catch (error) {
    //   console.error('Redis exists error:', error);
    //   return false;
    // }
    
    console.debug(`Redis exists disabled - returning false for key: ${key}`);
    return false;
  }

  public async clear(): Promise<void> {
    // Redis clear operation temporarily disabled
    // try {
    //   const client = await this.getClient();
    //   await client.flushDb();
    // } catch (error) {
    //   console.error('Redis clear error:', error);
    // }
    
    console.debug('Redis clear disabled - no operation performed');
  }

  public async isConnected(): Promise<boolean> {
    // Redis connection check temporarily disabled
    // try {
    //   const client = await this.getClient();
    //   await client.ping();
    //   return true;
    // } catch {
    //   return false;
    // }
    
    console.debug('Redis connection check disabled - returning false');
    return false;
  }
}