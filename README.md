# drone-pathfinder

A professional dark-mode drone mission planning web application. Draw zones on a map, generate automatic flight paths with configurable grid patterns, and export to KMZ (DJI Fly), GPX, or JSON formats.

**Live Demo**: https://drone-pathfinder.ottervibe.cc

![drone-pathfinder](https://img.shields.io/badge/drone-pathfinder-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6)
![Vite](https://img.shields.io/badge/Vite-6-646CFF)

## Features

### Flight Planning
- **Interactive Map**: Dark-themed OpenStreetMap (CartoDB Dark Matter)
- **Zone Drawing**: Polygon and rectangle tools (keyboard shortcuts: `P` / `R`)
- **Live Grid Generation**: Boustrophedon flight path algorithm
- **Configurable Parameters**:
  - Altitude: 10-500m
  - Speed: 1-15 m/s
  - Photo overlap: 50-90%
  - Flight direction: 0-359°
  - Travel axis: East-West or North-South
  - Photo capture toggle

### Export Formats
- **KMZ**: DJI Fly compatible (waylines.wpml format)
- **GPX**: GPS route format for navigation apps
- **JSON**: Raw mission data with full metadata

### Additional Features
- **KMZ Import**: Drag & drop to reload saved missions
- **Location Search**: Nominatim geocoding (no API key required)
- **Keyboard Shortcuts**:
  - `P` - Polygon tool
  - `R` - Rectangle tool
  - `Esc` - Cancel drawing
  - `Cmd/Ctrl + Z` - Undo last zone
- **No Login Required**: All data stored locally in browser

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 (dark theme)
- **Mapping**: Leaflet + react-leaflet + OpenStreetMap
- **Geometry**: Turf.js for geospatial calculations
- **Export**: JSZip for KMZ generation
- **Deployment**: Docker + Nginx + Cloudflare Tunnel

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Docker (Local)

```bash
docker compose build
docker compose up -d
```

App will be available at http://localhost:3000

### VPS Deployment

The repository includes deployment scripts for Ubuntu VPS:

```bash
# On your local machine
scp deploy/setup.sh user@vps:/tmp/
scp deploy/install-cloudflare-tunnel.sh user@vps:/tmp/
ssh user@vps "chmod +x /tmp/*.sh && /tmp/setup.sh"
```

### Cloudflare Tunnel Setup

To expose the app via `drone-pathfinder.ottervibe.cc`:

1. Go to [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
2. Navigate to: **Networks** → **Tunnels**
3. Click **Create a tunnel** → **Cloudflared**
4. Name: `drone-pathfinder`
5. Copy the token
6. On the VPS, run:

```bash
sudo /tmp/install-cloudflare-tunnel.sh YOUR_TUNNEL_TOKEN
```

## Project Structure

```
drone-pathfinder/
├── src/
│   ├── components/
│   │   ├── Map/           # Map container, waypoint layers
│   │   ├── Sidebar/       # Mission config, waypoint list, exports
│   │   ├── Toolbar/       # Drawing tools
│   │   └── Geocoder/      # Location search
│   ├── hooks/
│   │   ├── useMission.ts  # Mission state management
│   │   └── useMapDrawing.ts # Drawing interaction
│   ├── lib/
│   │   ├── gridAlgorithm.ts    # Boustrophedon grid generation
│   │   ├── kmzGenerator.ts     # DJI KMZ export
│   │   ├── gpxGenerator.ts     # GPX export
│   │   └── jsonExporter.ts     # JSON export
│   └── types/
│       └── mission.ts     # TypeScript interfaces
├── deploy/                # VPS deployment scripts
├── Dockerfile
├── docker-compose.yml
└── nginx.conf
```

## Supported Drones

The exported KMZ files are compatible with DJI drones supporting waypoint missions:
- DJI Mini 4 Pro / Mini 5 Pro
- DJI Mavic 4 Pro / Mavic 3 / Mavic 3 Pro
- DJI Air 3 / Air 3S

## License

MIT License - Free for personal and commercial use. No attribution required.

## Acknowledgments

- Map tiles: [CartoDB Dark Matter](https://carto.com/basemaps/)
- Geocoding: [Nominatim](https://nominatim.org/)
- Inspired by: [WaypointMap](https://www.waypointmap.com/)

---

**Built with ❤️ for drone pilots everywhere.**
