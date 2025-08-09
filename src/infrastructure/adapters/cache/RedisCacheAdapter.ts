import { RedisClientType } from 'redis';
import { ICacheService } from '../../../application/ports/services/ICacheService';
import { RedisConfig } from '../../config/redis';

export class RedisCacheAdapter implements ICacheService {
  private client: RedisClientType | null = null;

  private async getClient(): Promise<RedisClientType> {
    if (!this.client) {
      this.client = await RedisConfig.getClient();
    }
    return this.client;
  }

  public async get<T>(key: string): Promise<T | null> {
    try {
      const client = await this.getClient();
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  public async set<T>(key: string, value: T, ttlSeconds = 1800): Promise<void> {
    try {
      const client = await this.getClient();
      const serializedValue = JSON.stringify(value);
      await client.setEx(key, ttlSeconds, serializedValue);
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  public async delete(key: string): Promise<void> {
    try {
      const client = await this.getClient();
      await client.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  public async clear(): Promise<void> {
    try {
      const client = await this.getClient();
      await client.flushDb();
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  public async isConnected(): Promise<boolean> {
    try {
      const client = await this.getClient();
      await client.ping();
      return true;
    } catch {
      return false;
    }
  }
}