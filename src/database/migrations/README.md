# Database Migrations

This directory contains TypeORM migrations for the Truckly backend.

## Usage

### Generate a new migration
```bash
npm run migration:generate -- src/database/migrations/MigrationName
```

### Create an empty migration
```bash
npm run migration:create -- src/database/migrations/MigrationName
```

### Run pending migrations
```bash
npm run migration:run
```

### Revert the last migration
```bash
npm run migration:revert
```

### Show migration status
```bash
npm run migration:show
```

## Important Notes

- Always review generated migrations before running them
- Test migrations in development before applying to production
- Migrations are executed in timestamp order
- The `migrations` table tracks which migrations have been applied
