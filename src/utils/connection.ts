import pkg from 'pg';
import type { Pool as PoolType, PoolClient as PoolClientType, PoolConfig } from 'pg';
const { Pool } = pkg;

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private pool: PoolType | null = null;
  private client: PoolClientType | null = null;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(connectionString: string): Promise<void> {
    try {
      if (this.pool) {
        await this.disconnect();
      }

      const config: PoolConfig = {
        connectionString,
        max: 1, // simple single connection
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 5000,
        allowExitOnIdle: true
      };

      this.pool = new Pool(config);

      // Test connection
      this.client = await this.pool.connect();
      await this.client.query('SELECT 1');

    } catch (error) {
      if (this.client) {
        this.client.release();
        this.client = null;
      }
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
      }
      throw new Error(`Failed to connect to database: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      this.client.release();
      this.client = null;
    }
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  public async query(text: string, values: any[] = []): Promise<{ rows: any[]; rowCount: number; command: string }> {
    if (!this.client || !this.pool) {
      throw new Error('Not connected to database');
    }

    try {
      const result = await this.client.query(text, values);
      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
        command: result.command
      };
    } catch (error) {
      throw new Error(`Query failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}