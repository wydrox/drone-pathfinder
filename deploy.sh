#!/bin/bash
# Deploy script for drone-pathfinder

set -e

echo "🚀 Deploying drone-pathfinder..."

# Build Docker image
echo "📦 Building Docker image..."
docker build -t drone-pathfinder:latest .

# Stop existing container if running
if docker ps -a | grep -q drone-pathfinder; then
    echo "🛑 Stopping existing container..."
    docker stop drone-pathfinder || true
    docker rm drone-pathfinder || true
fi

# Run new container
echo "▶️  Starting container..."
docker run -d \
    --name drone-pathfinder \
    --restart unless-stopped \
    -p 3000:80 \
    drone-pathfinder:latest

echo "✅ Deployment complete!"
echo "🌐 Application available at: http://localhost:3000"

# Show logs
echo "📋 Recent logs:"
docker logs --tail 20 drone-pathfinder
