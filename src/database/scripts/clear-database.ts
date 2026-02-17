import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { dataSourceOptions } from '../datasource';

dotenv.config();

async function clearDatabase() {
  const AppDataSource = new DataSource(dataSourceOptions);

  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connection established!');

    const entities = AppDataSource.entityMetadatas;
    const tableNames = entities
      .map((entity) => `"${entity.tableName}"`)
      .join(', ');

    console.log(`🗑️  Clearing ${entities.length} tables...`);

    // Use TRUNCATE CASCADE to handle foreign key constraints
    await AppDataSource.query(`TRUNCATE TABLE ${tableNames} CASCADE`);

    console.log(`   ✓ Cleared all tables successfully`);
    console.log('\n✅ Database cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}

clearDatabase();
