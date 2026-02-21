#!/bin/bash

# Docker cleanup script
# This script stops all containers and optionally removes volumes

set -e

echo "🧹 Cleaning up Docker containers..."

# Stop all services
echo "🛑 Stopping all services..."
docker-compose --profile dev --profile production --profile tools down

# Prompt for volume cleanup
read -p "⚠️  Do you want to remove volumes (THIS WILL DELETE ALL DATA)? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "🗑️  Removing volumes..."
    docker-compose --profile dev --profile production --profile tools down -v
    echo "✅ Volumes removed"
else
    echo "ℹ️  Volumes preserved"
fi

# Prune unused images
read -p "🧹 Do you want to prune unused Docker images? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "🗑️  Pruning unused images..."
    docker image prune -f
    echo "✅ Images pruned"
else
    echo "ℹ️  Images preserved"
fi

echo "✅ Cleanup complete!"
