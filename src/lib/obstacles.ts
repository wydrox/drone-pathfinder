import type { LatLng, Obstacle } from '@/types/mission';

export interface ClearanceCheck {
  waypoint: LatLng;
  obstacle: Obstacle;
  distanceMeters: number;
  clearanceMeters: number;
  violated: boolean;
}

export function checkClearance(
  waypoint: LatLng & { altitude: number },
  obstacle: Obstacle
): ClearanceCheck {
  const distanceMeters = calculateDistance(waypoint, obstacle.geometry[0]);
  const clearanceMeters = distanceMeters - obstacle.minClearanceMeters;
  
  return {
    waypoint,
    obstacle,
    distanceMeters,
    clearanceMeters,
    violated: clearanceMeters < 0 || waypoint.altitude < obstacle.maxHeightMeters,
  };
}

export function checkAllClearances(
  waypoints: (LatLng & { altitude: number })[],
  obstacles: Obstacle[]
): ClearanceCheck[] {
  const violations: ClearanceCheck[] = [];
  
  for (const waypoint of waypoints) {
    for (const obstacle of obstacles) {
      const check = checkClearance(waypoint, obstacle);
      if (check.violated) {
        violations.push(check);
      }
    }
  }
  
  return violations;
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

export function findAlternativeRoute(
  start: LatLng,
  end: LatLng,
  obstacle: Obstacle
): LatLng[] {
  const midPoint: LatLng = {
    lat: (start.lat + end.lat) / 2 + 0.0001,
    lng: (start.lng + end.lng) / 2 + 0.0001,
  };
  
  return [start, midPoint, end];
}
