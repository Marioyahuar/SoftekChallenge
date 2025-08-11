// REDIS TEMPORARILY DISABLED - Redis functionality commented out to allow running without Redis server
// import { createClient, RedisClientType } from 'redis';
// import { environment } from './environment';

export class RedisConfig {
  // private static client: RedisClientType;

  public static async getClient(): Promise<any> {
    // Redis client creation temporarily disabled
    // if (!this.client) {
    //   this.client = createClient({
    //     socket: {
    //       host: environment.redis.host,
    //       port: environment.redis.port,
    //     },
    //   });

    //   this.client.on('error', (err) => console.error('Redis Client Error:', err));
    //   await this.client.connect();
    // }
    // return this.client;
    
    console.warn('Redis is temporarily disabled - returning null client');
    return null;
  }

  public static async closeConnection(): Promise<void> {
    // Redis connection closing temporarily disabled
    // if (this.client && this.client.isOpen) {
    //   await this.client.quit();
    // }
    console.log('Redis close connection skipped - Redis temporarily disabled');
  }

  public static async testConnection(): Promise<boolean> {
    // Redis connection test temporarily disabled
    // try {
    //   const client = await this.getClient();
    //   await client.ping();
    //   return true;
    // } catch (error) {
    //   console.error('Redis connection failed:', error);
    //   return false;
    // }
    
    console.warn('Redis connection test skipped - Redis temporarily disabled');
    return false;
  }
}