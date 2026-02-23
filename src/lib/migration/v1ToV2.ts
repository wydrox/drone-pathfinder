import type { Mission, MissionConfig, Waypoint, Zone, MissionStats } from '@/types/mission';
import type { MissionV2, MissionConfigV2, WaypointV2, SchemaVersion } from '@/types/mission';

export function migrateWaypointV1ToV2(waypoint: Waypoint): WaypointV2 {
  return {
    ...waypoint,
    actions: waypoint.action === 'photo' 
      ? [{ id: `action-${waypoint.id}`, type: 'photo' as const }]
      : [],
  };
}

export function migrateConfigV1ToV2(config: MissionConfig): MissionConfigV2 {
  return {
    ...config,
    schemaVersion: '2.0' as SchemaVersion,
    mapStyleId: 'carto-dark',
    terrainConfig: {
      mode: 'absolute',
      elevationSource: 'cached',
      offsetMeters: 0,
    },
    layerVisibility: {
      zones: true,
      waypoints: true,
      paths: true,
      pois: true,
      heatmaps: true,
      flightPath: true,
    },
  };
}

export function migrateV1ToV2(mission: Mission): MissionV2 {
  return {
    id: mission.id,
    name: mission.name,
    schemaVersion: '2.0',
    segments: [{
      id: `segment-${mission.id}`,
      type: 'grid',
      waypoints: mission.waypoints,
      config: {},
      order: 0,
    }],
    stages: [],
    waypoints: mission.waypoints.map(migrateWaypointV1ToV2),
    config: migrateConfigV1ToV2(mission.config),
    stats: mission.stats,
    pois: [],
    poiOverlays: [],
    obstacles: [],
    offlinePacks: [],
    createdAt: mission.createdAt,
    updatedAt: mission.updatedAt,
  };
}
