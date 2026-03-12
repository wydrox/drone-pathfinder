import { describe, expect, it } from 'vitest';
import type { MissionConfig, POI, Waypoint } from '@/types/mission';
import { resolveWaypointOrientation } from '../waypointOrientation';

const baseConfig: MissionConfig = {
  altitude: 80,
  speed: 8,
  overlap: 70,
  direction: 15,
  cameraAngle: -45,
  waypointOrientationMode: 'manual',
  travelAxis: 'EW',
  photoCapture: true,
  terrainAware: false,
  droneModel: 'DJI Mini 4 Pro',
};

const baseWaypoint: Waypoint = {
  id: 'wp-1',
  lat: 0,
  lng: 0,
  altitude: 100,
  index: 0,
  action: 'photo',
  heading: 120,
};

const poi: POI = {
  id: 'poi-1',
  name: 'Target',
  lat: 0,
  lng: 0.001,
  altitude: 0,
  category: 'target',
  radiusMeters: 10,
};

describe('resolveWaypointOrientation', () => {
  it('uses waypoint heading and manual camera angle in manual mode', () => {
    const result = resolveWaypointOrientation(baseWaypoint, baseConfig, [poi]);

    expect(result.activeMode).toBe('manual');
    expect(result.heading).toBe(120);
    expect(result.gimbalPitch).toBe(-45);
    expect(result.poi).toBeNull();
  });

  it('derives heading and gimbal pitch from the selected POI', () => {
    const result = resolveWaypointOrientation(
      baseWaypoint,
      { ...baseConfig, waypointOrientationMode: 'poi', waypointOrientationPoiId: poi.id },
      [poi],
    );

    const expectedPitch = -(Math.atan2(100, 111.19492664455875) * 180) / Math.PI;

    expect(result.activeMode).toBe('poi');
    expect(result.poi?.id).toBe(poi.id);
    expect(result.heading).toBeCloseTo(90, 2);
    expect(result.gimbalPitch).toBeCloseTo(expectedPitch, 2);
  });

  it('falls back to manual mode when the selected POI is missing', () => {
    const result = resolveWaypointOrientation(
      baseWaypoint,
      { ...baseConfig, waypointOrientationMode: 'poi', waypointOrientationPoiId: 'missing' },
      [poi],
    );

    expect(result.activeMode).toBe('manual');
    expect(result.heading).toBe(120);
    expect(result.gimbalPitch).toBe(-45);
  });

  it('handles zero-distance geometry without invalid pitch values', () => {
    const result = resolveWaypointOrientation(
      { ...baseWaypoint, lat: poi.lat, lng: poi.lng },
      { ...baseConfig, waypointOrientationMode: 'poi', waypointOrientationPoiId: poi.id },
      [poi],
    );

    expect(result.heading).toBe(120);
    expect(result.gimbalPitch).toBe(-90);
  });
});
