import type { OfflinePack } from '@/types/mission';
import type { LatLng } from '@/types/mission';

export interface DownloadProgress {
  packId: string;
  downloaded: number;
  total: number;
  status: 'pending' | 'downloading' | 'complete' | 'error';
}

export async function cacheArea(center: LatLng, radiusMeters: number): Promise<void> {
  console.log(`Caching area around ${center.lat}, ${center.lng} with radius ${radiusMeters}m`);
  await new Promise(resolve => setTimeout(resolve, 1000));
}

export function getCachedAreas(): Array<{ center: LatLng; radius: number; timestamp: string }> {
  return [];
}

export function clearCache(): void {
  console.log('Clearing cache');
}

export async function downloadBasemapPack(
  bbox: [number, number, number, number],
  zoomRange: [number, number],
  onProgress?: (progress: DownloadProgress) => void
): Promise<OfflinePack> {
  const pack: OfflinePack = {
    id: `basemap-${Date.now()}`,
    name: `Basemap ${new Date().toLocaleDateString()}`,
    bbox,
    zoomRange,
    downloadedAt: new Date().toISOString(),
    sizeBytes: 0,
    tileCount: 0,
    type: 'basemap',
    status: 'downloading',
  };
  
  let downloaded = 0;
  const totalTiles = estimateTileCount(bbox, zoomRange);
  
  for (let z = zoomRange[0]; z <= zoomRange[1]; z++) {
    const tiles = getTilesInBounds(bbox, z);
    
    for (const _tile of tiles) {
      await downloadTile();
      downloaded++;
      
      if (onProgress && downloaded % 10 === 0) {
        onProgress({
          packId: pack.id,
          downloaded,
          total: totalTiles,
          status: 'downloading',
        });
      }
    }
  }
  
  pack.status = 'complete';
  pack.tileCount = downloaded;
  pack.sizeBytes = downloaded * 15000;
  
  return pack;
}

function estimateTileCount(
  bbox: [number, number, number, number],
  zoomRange: [number, number]
): number {
  let count = 0;
  for (let z = zoomRange[0]; z <= zoomRange[1]; z++) {
    const tiles = getTilesInBounds(bbox, z);
    count += tiles.length;
  }
  return count;
}

function getTilesInBounds(
  bbox: [number, number, number, number],
  zoom: number
): { x: number; y: number; z: number }[] {
  const [west, south, east, north] = bbox;
  const tiles: { x: number; y: number; z: number }[] = [];
  
  const minTile = latLngToTile(south, west, zoom);
  const maxTile = latLngToTile(north, east, zoom);
  
  for (let x = minTile.x; x <= maxTile.x; x++) {
    for (let y = maxTile.y; y <= minTile.y; y++) {
      tiles.push({ x, y, z: zoom });
    }
  }
  
  return tiles;
}

function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lng + 180) / 360 * n);
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
  return { x, y };
}

async function downloadTile(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 50));
}

export async function cacheElevationData(
  bbox: [number, number, number, number],
  resolution: number = 100
): Promise<OfflinePack> {
  return {
    id: `elevation-${Date.now()}`,
    name: `Elevation Data`,
    bbox,
    zoomRange: [0, 0],
    downloadedAt: new Date().toISOString(),
    sizeBytes: resolution * resolution * 4,
    tileCount: resolution * resolution,
    type: 'elevation',
    status: 'complete',
  };
}
