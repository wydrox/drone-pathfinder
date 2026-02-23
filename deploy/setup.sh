#!/bin/bash
set -e

echo "=== Setting up drone-pathfinder VPS ==="

# Update system
apt-get update

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker $USER
fi

# Install cloudflared if not present
if ! command -v cloudflared &> /dev/null; then
    echo "Installing cloudflared..."
    curl -L --output /tmp/cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    dpkg -i /tmp/cloudflared.deb || apt-get install -f -y
fi

# Create app directory
mkdir -p /opt/drone-pathfinder
cd /opt/drone-pathfinder

# Clone or pull repo
if [ -d .git ]; then
    echo "Pulling latest changes..."
    git pull origin main
else
    echo "Cloning repository..."
    git clone https://github.com/wydrox/drone-pathfinder.git /opt/drone-pathfinder
fi

# Build and start containers
echo "Building and starting containers..."
docker compose build --no-cache
docker compose up -d

echo "=== Setup complete ==="
echo "App is running on port 3000"
echo "Next step: Configure Cloudflare tunnel with your token"
