import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { ICacheService } from '../../../application/ports/services/ICacheService';

export class DynamoDBCacheAdapter implements ICacheService {
  private client: DynamoDBClient;
  private tableName: string;

  constructor() {
    this.client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-2' });
    this.tableName = process.env.CACHE_TABLE_NAME || 'star-wars-pokemon-api-dev-cache';
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const command = new GetItemCommand({
        TableName: this.tableName,
        Key: marshall({ cacheKey: key }),
      });

      const result = await this.client.send(command);
      
      if (!result.Item) {
        return null;
      }

      const item = unmarshall(result.Item);
      
      // Check if item is expired (DynamoDB TTL might have delay)
      if (item.ttl && item.ttl < Math.floor(Date.now() / 1000)) {
        return null;
      }

      // Check if value is already an object or string
      if (typeof item.value === 'string') {
        try {
          return JSON.parse(item.value) as T;
        } catch (parseError) {
          console.error('Error parsing cached JSON string:', parseError);
          return null;
        }
      } else {
        // Value is already an object
        return item.value as T;
      }
    } catch (error) {
      console.error('DynamoDB Cache Get Error:', error);
      return null; // Fail gracefully, don't break the app
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const ttl = ttlSeconds 
        ? Math.floor(Date.now() / 1000) + ttlSeconds
        : Math.floor(Date.now() / 1000) + (30 * 60); // Default 30 minutes

      const command = new PutItemCommand({
        TableName: this.tableName,
        Item: marshall({
          cacheKey: key,
          value: JSON.stringify(value),
          ttl: ttl,
          createdAt: new Date().toISOString()
        }),
      });

      await this.client.send(command);
    } catch (error) {
      console.error('DynamoDB Cache Set Error:', error);
      // Don't throw, cache failures shouldn't break the app
    }
  }

  async delete(key: string): Promise<void> {
    try {
      // DynamoDB will handle TTL deletion automatically
      // We could implement explicit deletion if needed
    } catch (error) {
      console.error('DynamoDB Cache Delete Error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.get(key);
      return result !== null;
    } catch (error) {
      console.error('DynamoDB Cache Exists Error:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      // DynamoDB doesn't have a clear all operation
      // In practice, we'd scan and delete, but for cache it's not usually needed
      console.log('DynamoDB Cache Clear: Not implemented (TTL handles expiration)');
    } catch (error) {
      console.error('DynamoDB Cache Clear Error:', error);
    }
  }

  async ping(): Promise<boolean> {
    try {
      // Simple test to verify connection
      await this.get('ping-test');
      return true;
    } catch (error) {
      console.error('DynamoDB Cache Ping Error:', error);
      return false;
    }
  }
}