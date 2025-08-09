import mysql from 'mysql2/promise';
import { environment } from './environment';

export class DatabaseConfig {
  private static connection: mysql.Connection;

  public static async getConnection(): Promise<mysql.Connection> {
    if (!this.connection) {
      this.connection = await mysql.createConnection({
        host: environment.database.host,
        user: environment.database.user,
        password: environment.database.password,
        database: environment.database.name,
        port: environment.database.port,
        ssl: false,
        connectTimeout: 60000,
        acquireTimeout: 60000,
        timeout: 60000,
      });
    }
    return this.connection;
  }

  public static async closeConnection(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
    }
  }

  public static async testConnection(): Promise<boolean> {
    try {
      const connection = await this.getConnection();
      await connection.ping();
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }
}