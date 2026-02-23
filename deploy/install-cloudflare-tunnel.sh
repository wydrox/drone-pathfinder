#!/bin/bash
# Run this after setup.sh to configure Cloudflare tunnel
# Usage: sudo ./install-cloudflare-tunnel.sh <TUNNEL_TOKEN>

if [ -z "$1" ]; then
    echo "Usage: $0 <CLOUDFLARE_TUNNEL_TOKEN>"
    echo "Get your token from Cloudflare Zero Trust dashboard:"
    echo "https://one.dash.cloudflare.com/ → Networks → Tunnels"
    exit 1
fi

TOKEN=$1

# Install cloudflared as a service
cloudflared service install "$TOKEN"

# Enable and start service
systemctl enable cloudflared
systemctl start cloudflared

echo "Cloudflare tunnel installed and started"
echo "Domain should be accessible shortly at: https://drone-pathfinder.ottervibe.cc"
