import type { MissionConfig, POI, Waypoint } from '@/types/mission';

interface OrientationWaypoint {
  lat: number;
  lng: number;
  altitude: number;
  heading?: number;
}

export interface WaypointOrientationResolution {
  heading: number;
  gimbalPitch: number;
  activeMode: 'manual' | 'poi';
  poi: POI | null;
}

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function calculateBearing(from: Pick<OrientationWaypoint, 'lat' | 'lng'>, to: Pick<POI, 'lat' | 'lng'>): number | null {
  if (from.lat === to.lat && from.lng === to.lng) {
    return null;
  }

  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;

  if (!Number.isFinite(bearing)) {
    return null;
  }

  return normalizeAngle(bearing);
}

function distanceMeters(from: Pick<OrientationWaypoint, 'lat' | 'lng'>, to: Pick<POI, 'lat' | 'lng'>): number {
  const earthRadius = 6371000;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

export function getOrientationPoi(config: MissionConfig, pois: POI[]): POI | null {
  if (config.waypointOrientationMode !== 'poi' || !config.waypointOrientationPoiId) {
    return null;
  }

  return pois.find(poi => poi.id === config.waypointOrientationPoiId) ?? null;
}

export function resolveWaypointOrientation(
  waypoint: OrientationWaypoint,
  config: MissionConfig,
  pois: POI[],
): WaypointOrientationResolution {
  const manualHeading = normalizeAngle(waypoint.heading ?? config.direction);
  const manualPitch = clamp(config.cameraAngle, -90, 30);
  const poi = getOrientationPoi(config, pois);

  if (!poi) {
    return {
      heading: manualHeading,
      gimbalPitch: manualPitch,
      activeMode: 'manual',
      poi: null,
    };
  }

  const heading = calculateBearing(waypoint, poi) ?? manualHeading;
  const horizontalDistance = distanceMeters(waypoint, poi);
  const altitudeDelta = waypoint.altitude - poi.altitude;

  let gimbalPitch = manualPitch;
  if (horizontalDistance < 0.01) {
    if (altitudeDelta > 0) {
      gimbalPitch = -90;
    } else if (altitudeDelta < 0) {
      gimbalPitch = 30;
    }
  } else {
    const pitch = -(Math.atan2(altitudeDelta, horizontalDistance) * 180) / Math.PI;
    gimbalPitch = clamp(pitch, -90, 30);
  }

  return {
    heading,
    gimbalPitch,
    activeMode: 'poi',
    poi,
  };
}

export function resolveWaypointHeading(waypoint: OrientationWaypoint, config: MissionConfig, pois: POI[]): number {
  return resolveWaypointOrientation(waypoint, config, pois).heading;
}

export function resolveWaypointGimbalPitch(waypoint: OrientationWaypoint, config: MissionConfig, pois: POI[]): number {
  return resolveWaypointOrientation(waypoint, config, pois).gimbalPitch;
}

export function isWaypointOrientationPoiDriven(config: MissionConfig, pois: POI[]): boolean {
  return getOrientationPoi(config, pois) !== null;
}

export function formatWaypointPoiPoint(poi: POI): string {
  return `${poi.lat.toFixed(6)},${poi.lng.toFixed(6)},0.000000`;
}

export function getWaypointTemplateHeadingMode(config: MissionConfig, pois: POI[]): 'followWayline' | 'towardPOI' {
  return getOrientationPoi(config, pois) ? 'towardPOI' : 'followWayline';
}

export type { OrientationWaypoint };
export type { Waypoint };
