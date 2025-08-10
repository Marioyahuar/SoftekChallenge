import { config } from 'dotenv';
config();

import { readFileSync } from 'fs';
import { join } from 'path';
import { MySQLConnection } from '../connection';

async function runMigrations(): Promise<void> {
  const db = MySQLConnection.getInstance();
  
  try {
    console.log('Starting database migrations...');

    const migrationFiles = [
      '001_create_swapi_tables.sql',
      '002_create_pokemon_tables.sql',
      '003_create_fusion_tables.sql',
    ];

    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      
      const migrationPath = join(__dirname, file);
      const migrationSQL = readFileSync(migrationPath, 'utf-8');
      
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      for (const statement of statements) {
        await db.execute(statement);
      }
      
      console.log(`Migration completed: ${file}`);
    }

    console.log('All migrations completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await db.close();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Database migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database migration failed:', error);
      process.exit(1);
    });
}

export { runMigrations };