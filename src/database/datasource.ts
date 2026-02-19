import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

// Load environment variables for CLI usage
config();

// Create ConfigService instance for accessing environment variables
const configService = new ConfigService();

// Single source of truth for database configuration
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.get<string>('DB_HOST'),
  port: configService.get<number>('DB_PORT'),
  username: configService.get<string>('DB_USER'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_NAME'),
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/database/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
  synchronize: false, // Always use migrations for schema changes
  logging: configService.get<string>('NODE_ENV') === 'development',
};

// DataSource instance for TypeORM CLI
const AppDataSource = new DataSource(dataSourceOptions);

// Initialize connection (useful for CLI operations)
AppDataSource.initialize()
  .then(() => {
    console.log('✅ Database connection established successfully');
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
  });

export default AppDataSource;
