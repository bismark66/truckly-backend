#!/bin/bash

# Production Docker startup script
# This script builds and starts the production services

set -e

echo "🚀 Starting Truckly Backend in Production Mode..."

# Build production image
echo "🔨 Building production image..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build app-prod

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

# Run migrations (using host pnpm or docker exec)
echo "🔄 Running database migrations..."
pnpm run migration:run || echo "⚠️  Run migrations manually: pnpm run migration:run"

# Start the application in production mode
echo "🚀 Starting application in production mode..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d app-prod

echo "✅ Production environment started successfully!"
echo "📝 Application running on http://localhost:${PORT:-3000}"
echo "📊 View logs: docker-compose logs -f app-prod"
echo "🛑 Stop: docker-compose --profile production down"
