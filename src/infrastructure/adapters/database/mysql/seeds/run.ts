import { MySQLConnection } from '../connection';
import { seedTraitMappings } from './001_trait_pokemon_mappings';

async function runSeeds(): Promise<void> {
  const db = MySQLConnection.getInstance();
  
  try {
    console.log('Starting database seeding...');

    // Run seeders in order
    await seedTraitMappings();

    console.log('All seeds completed successfully!');
    
  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  } finally {
    await db.close();
  }
}

if (require.main === module) {
  runSeeds()
    .then(() => {
      console.log('Database seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database seeding failed:', error);
      process.exit(1);
    });
}

export { runSeeds };