import { createClient, RedisClientType } from 'redis';
import { environment } from './environment';

export class RedisConfig {
  private static client: RedisClientType;

  public static async getClient(): Promise<RedisClientType> {
    if (!this.client) {
      this.client = createClient({
        socket: {
          host: environment.redis.host,
          port: environment.redis.port,
        },
      });

      this.client.on('error', (err) => console.error('Redis Client Error:', err));
      await this.client.connect();
    }
    return this.client;
  }

  public static async closeConnection(): Promise<void> {
    if (this.client && this.client.isOpen) {
      await this.client.quit();
    }
  }

  public static async testConnection(): Promise<boolean> {
    try {
      const client = await this.getClient();
      await client.ping();
      return true;
    } catch (error) {
      console.error('Redis connection failed:', error);
      return false;
    }
  }
}