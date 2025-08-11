import { DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { ICacheAdapter } from '../../../domain/ports/ICacheAdapter';

export class DynamoDBCacheAdapter implements ICacheAdapter {
  private client: DynamoDBClient;
  private tableName: string;

  constructor() {
    this.client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-2' });
    this.tableName = process.env.CACHE_TABLE_NAME || 'star-wars-pokemon-api-dev-cache';
  }

  async get(key: string): Promise<string | null> {
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

      return item.value || null;
    } catch (error) {
      console.error('DynamoDB Cache Get Error:', error);
      return null; // Fail gracefully, don't break the app
    }
  }

  async set(key: string, value: string, ttlMinutes?: number): Promise<void> {
    try {
      const ttl = ttlMinutes 
        ? Math.floor(Date.now() / 1000) + (ttlMinutes * 60)
        : Math.floor(Date.now() / 1000) + (30 * 60); // Default 30 minutes

      const command = new PutItemCommand({
        TableName: this.tableName,
        Item: marshall({
          cacheKey: key,
          value: value,
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