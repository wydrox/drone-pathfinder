import type { LatLng } from '@/types/mission';

export interface ElevationPoint {
  lat: number;
  lng: number;
  elevationMeters: number;
}

export async function fetchElevation(lat: number, lng: number): Promise<number> {
  try {
    const response = await fetch(
      `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`
    );
    const data = await response.json();
    return data.results?.[0]?.elevation || 0;
  } catch {
    return 0;
  }
}

export function calculateAGL(
  altitudeMeters: number,
  groundElevationMeters: number
): number {
  return altitudeMeters - groundElevationMeters;
}

export function calculateMSL(
  aglMeters: number,
  groundElevationMeters: number
): number {
  return aglMeters + groundElevationMeters;
}

export async function fetchElevationForArea(
  bbox: { north: number; south: number; east: number; west: number },
  resolution: number = 10
): Promise<ElevationPoint[]> {
  const points: ElevationPoint[] = [];
  const latStep = (bbox.north - bbox.south) / resolution;
  const lngStep = (bbox.east - bbox.west) / resolution;
  
  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      const lat = bbox.south + i * latStep;
      const lng = bbox.west + j * lngStep;
      const elevation = await fetchElevation(lat, lng);
      points.push({ lat, lng, elevationMeters: elevation });
    }
  }
  
  return points;
}
