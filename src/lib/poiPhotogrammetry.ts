import type { POI } from '@/types/mission';
import type { LatLng } from '@/types/mission';
import type { WaypointSeed } from '@/types/mission';

export interface OrbitConfig {
  ringCount: number;
  baseRadiusMeters: number;
  overlapPercent: number;
  altitudeMeters: number;
  photoIntervalMeters: number;
}

export function generateOrbitRings(
  poi: POI,
  config: OrbitConfig
): LatLng[][] {
  const rings: LatLng[][] = [];
  
  for (let i = 0; i < config.ringCount; i++) {
    const radius = config.baseRadiusMeters * (i + 1);
    const points = generateCirclePoints(poi, radius, config.photoIntervalMeters);
    rings.push(points);
  }
  
  return rings;
}

function generateCirclePoints(
  center: POI,
  radiusMeters: number,
  intervalMeters: number
): LatLng[] {
  const points: LatLng[] = [];
  const circumference = 2 * Math.PI * radiusMeters;
  const numPoints = Math.max(8, Math.ceil(circumference / intervalMeters));
  
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const lat = center.lat + (radiusMeters / 111320) * Math.cos(angle);
    const lng = center.lng + (radiusMeters / (111320 * Math.cos(center.lat * Math.PI / 180))) * Math.sin(angle);
    points.push({ lat, lng });
  }
  
  return points;
}

export interface StackedLevelConfig {
  bands: { altitudeMeters: number; overlapPercent: number }[];
}

export function generateStackedLevels(
  _poi: POI,
  baseRings: LatLng[][],
  config: StackedLevelConfig
): { altitude: number; points: LatLng[] }[] {
  return config.bands.map(band => ({
    altitude: band.altitudeMeters,
    points: baseRings.flat(),
  }));
}

export function calculateCoverageScore(
  poi: POI,
  waypoints: LatLng[],
  cameraFOVDegrees: number = 84
): { score: number; blindSpots: LatLng[] } {
  const expectedCoverage = Math.PI * Math.pow(poi.radiusMeters * 2, 2);
  const actualCoverage = waypoints.length * Math.pow(poi.radiusMeters * Math.tan((cameraFOVDegrees * Math.PI / 180) / 2) * 2, 2);
  const score = Math.min(100, (actualCoverage / expectedCoverage) * 100);
  
  const blindSpots: LatLng[] = [];
  if (score < 80) {
    blindSpots.push({ lat: poi.lat + 0.0001, lng: poi.lng });
  }
  
  return { score, blindSpots };
}

function normalizeHeading(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function bearingToTarget(from: LatLng, to: LatLng): number {
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;

  if (!Number.isFinite(brng)) {
    return 0;
  }

  return normalizeHeading(brng);
}

export function generateStackedOrbitWaypoints(
  poi: POI,
  orbitConfig: OrbitConfig,
  stackedConfig: StackedLevelConfig,
  speedMps: number,
): WaypointSeed[] {
  const baseRings = generateOrbitRings(poi, orbitConfig);
  const levels = generateStackedLevels(poi, baseRings, stackedConfig);

  return levels.flatMap(level =>
    level.points.map((point): WaypointSeed => ({
      lat: point.lat,
      lng: point.lng,
      altitude: level.altitude,
      speed: speedMps,
      heading: bearingToTarget(point, poi),
      action: 'photo',
    }))
  );
}
