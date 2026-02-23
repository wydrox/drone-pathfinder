import type { LatLng, ElevationPoint } from '@/types/mission';

export interface LOSCheck {
  waypoint: LatLng;
  visible: boolean;
  obstruction?: ElevationPoint;
  riskScore: number;
}

export function calculateLOS(
  homePoint: LatLng & { altitude: number },
  waypoint: LatLng & { altitude: number },
  terrain: ElevationPoint[]
): LOSCheck {
  const distance = calculateDistance(homePoint, waypoint);
  const steps = Math.max(10, Math.ceil(distance / 10));
  
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const checkLat = homePoint.lat + (waypoint.lat - homePoint.lat) * t;
    const checkLng = homePoint.lng + (waypoint.lng - homePoint.lng) * t;
    const checkAlt = homePoint.altitude + (waypoint.altitude - homePoint.altitude) * t;
    
    const terrainElevation = interpolateElevation(checkLat, checkLng, terrain);
    if (terrainElevation > checkAlt) {
      return {
        waypoint,
        visible: false,
        obstruction: { lat: checkLat, lng: checkLng, elevationMeters: terrainElevation },
        riskScore: 100,
      };
    }
  }
  
  return { waypoint, visible: true, riskScore: 0 };
}

export function generateLOSRiskMap(
  homePoint: LatLng & { altitude: number },
  waypoints: (LatLng & { altitude: number })[],
  terrain: ElevationPoint[]
): LOSCheck[] {
  return waypoints.map(wp => calculateLOS(homePoint, wp, terrain));
}

function calculateDistance(p1: LatLng, p2: LatLng): number {
  const R = 6371000;
  const lat1 = p1.lat * Math.PI / 180;
  const lat2 = p2.lat * Math.PI / 180;
  const deltaLat = (p2.lat - p1.lat) * Math.PI / 180;
  const deltaLng = (p2.lng - p1.lng) * Math.PI / 180;
  
  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function interpolateElevation(lat: number, lng: number, terrain: ElevationPoint[]): number {
  let closest = terrain[0];
  let minDist = Infinity;
  
  for (const point of terrain) {
    const dist = calculateDistance({ lat, lng }, point);
    if (dist < minDist) {
      minDist = dist;
      closest = point;
    }
  }
  
  return closest.elevationMeters;
}
