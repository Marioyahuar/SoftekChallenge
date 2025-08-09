import { Connection } from 'mysql2/promise';
import { DatabaseConfig } from '../../../config/database';

export class MySQLConnection {
  private static instance: MySQLConnection;
  private connection: Connection | null = null;

  private constructor() {}

  public static getInstance(): MySQLConnection {
    if (!MySQLConnection.instance) {
      MySQLConnection.instance = new MySQLConnection();
    }
    return MySQLConnection.instance;
  }

  public async getConnection(): Promise<Connection> {
    if (!this.connection) {
      this.connection = await DatabaseConfig.getConnection();
    }
    return this.connection;
  }

  public async beginTransaction(): Promise<void> {
    const connection = await this.getConnection();
    await connection.beginTransaction();
  }

  public async commit(): Promise<void> {
    const connection = await this.getConnection();
    await connection.commit();
  }

  public async rollback(): Promise<void> {
    const connection = await this.getConnection();
    await connection.rollback();
  }

  public async close(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }

  public async execute(query: string, params: unknown[] = []): Promise<unknown> {
    const connection = await this.getConnection();
    const [results] = await connection.execute(query, params);
    return results;
  }

  public async query(sql: string, params: unknown[] = []): Promise<unknown[]> {
    const connection = await this.getConnection();
    const [rows] = await connection.execute(sql, params);
    return rows as unknown[];
  }
}