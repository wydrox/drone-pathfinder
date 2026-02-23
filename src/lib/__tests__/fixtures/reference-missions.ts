import type { Mission, Zone, Waypoint, MissionConfig, MissionStats } from '@/types/mission';

export const DEFAULT_CONFIG: MissionConfig = {
  altitude: 80,
  speed: 8,
  overlap: 70,
  direction: 0,
  travelAxis: 'EW',
  photoCapture: true,
  droneModel: 'DJI Mini 4 Pro',
};

export const simpleGridMission: Mission = {
  id: 'mission-simple-001',
  name: 'Simple Grid Test',
  zones: [{
    id: 'zone-001',
    type: 'rectangle',
    points: [
      { lat: 51.505, lng: -0.09 },
      { lat: 51.515, lng: -0.09 },
      { lat: 51.515, lng: -0.08 },
      { lat: 51.505, lng: -0.08 },
    ],
  }],
  waypoints: [
    { id: 'wp-001', lat: 51.505, lng: -0.09, altitude: 80, index: 0, action: 'photo' },
    { id: 'wp-002', lat: 51.51, lng: -0.085, altitude: 80, index: 1, action: 'photo' },
    { id: 'wp-003', lat: 51.515, lng: -0.08, altitude: 80, index: 2, action: 'photo' },
  ],
  config: DEFAULT_CONFIG,
  stats: { waypointCount: 3, areaSqm: 10000, estimatedTimeSec: 120 },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const multiZoneMission: Mission = {
  id: 'mission-multi-001',
  name: 'Multi Zone Test',
  zones: [
    {
      id: 'zone-001',
      type: 'rectangle',
      points: [
        { lat: 51.5, lng: -0.1 },
        { lat: 51.52, lng: -0.1 },
        { lat: 51.52, lng: -0.08 },
        { lat: 51.5, lng: -0.08 },
      ],
    },
    {
      id: 'zone-002',
      type: 'rectangle',
      points: [
        { lat: 51.52, lng: -0.08 },
        { lat: 51.53, lng: -0.08 },
        { lat: 51.53, lng: -0.07 },
        { lat: 51.52, lng: -0.07 },
      ],
    },
  ],
  waypoints: Array.from({ length: 24 }, (_, i) => ({
    id: `wp-${i.toString().padStart(3, '0')}`,
    lat: 51.5 + (i * 0.001),
    lng: -0.1 + (i * 0.001),
    altitude: 80,
    index: i,
    action: (i % 3 === 0 ? 'photo' : 'none') as 'photo' | 'none',
  })),
  config: { ...DEFAULT_CONFIG, overlap: 80 },
  stats: { waypointCount: 24, areaSqm: 50000, estimatedTimeSec: 600 },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const photoCaptureMission: Mission = {
  ...simpleGridMission,
  id: 'mission-photo-001',
  name: 'Photo Capture Test',
  config: { ...DEFAULT_CONFIG, photoCapture: true },
  waypoints: simpleGridMission.waypoints.map(wp => ({
    ...wp,
    action: 'photo' as const,
  })),
  stats: { ...simpleGridMission.stats, waypointCount: 3 },
};

export const customConfigMission: Mission = {
  ...simpleGridMission,
  id: 'mission-custom-001',
  name: 'Custom Config Test',
  config: {
    altitude: 120,
    speed: 12,
    overlap: 85,
    direction: 45,
    travelAxis: 'NS',
    photoCapture: false,
    droneModel: 'DJI Mavic 3 Pro',
  },
};

export const singleWaypointMission: Mission = {
  ...simpleGridMission,
  id: 'mission-single-001',
  name: 'Single Waypoint Test',
  waypoints: [simpleGridMission.waypoints[0]],
  stats: { waypointCount: 1, areaSqm: 0, estimatedTimeSec: 0 },
};
