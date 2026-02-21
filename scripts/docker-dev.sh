#!/bin/bash

# Development Docker startup script
# This script starts the services and runs migrations

set -e

echo "🚀 Starting Truckly Backend in Development Mode..."

# Start PostgreSQL and Redis
echo "📦 Starting PostgreSQL and Redis..."
docker-compose up -d postgres redis

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check PostgreSQL health
until docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done
echo "✅ PostgreSQL is ready"

# Check Redis health
until docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; do
  echo "Waiting for Redis..."
  sleep 2
done
echo "✅ Redis is ready"

# Run migrations
echo "🔄 Running database migrations..."
pnpm run migration:run

# Seed database (optional - comment out if not needed)
echo "🌱 Seeding database..."
pnpm run seed || echo "⚠️  Seeding skipped or failed"

# Start the application in development mode
echo "🚀 Starting application in development mode..."
docker-compose --profile dev up -d app-dev

echo "✅ Development environment started successfully!"
echo "📝 Application running on http://localhost:${PORT:-3000}"
echo "📊 View logs: docker-compose logs -f app-dev"
echo "🛑 Stop: docker-compose down"
