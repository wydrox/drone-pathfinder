import type { Mission, MissionConfig, Waypoint } from '@/types/mission';
import type { MissionV2, MissionConfigV2, WaypointV2 } from '@/types/mission';

export function isMissionV2(obj: unknown): obj is MissionV2 {
  if (typeof obj !== 'object' || obj === null) return false;
  const mission = obj as Record<string, unknown>;
  return (
    'schemaVersion' in mission &&
    mission.schemaVersion === '2.0' &&
    'segments' in mission &&
    Array.isArray(mission.segments)
  );
}

export function downgradeWaypointV2ToV1(waypoint: WaypointV2): Waypoint {
  const photoAction = waypoint.actions.find(a => a.type === 'photo');
  return {
    id: waypoint.id,
    lat: waypoint.lat,
    lng: waypoint.lng,
    altitude: waypoint.altitude,
    index: waypoint.index,
    action: photoAction ? 'photo' : 'none',
  };
}

export function downgradeConfigV2ToV1(config: MissionConfigV2): MissionConfig {
  const { schemaVersion, mapStyleId, terrainConfig, layerVisibility, ...v1Config } = config;
  return v1Config as MissionConfig;
}

export function downgradeV2ToV1(mission: MissionV2): Mission {
  // Flatten segments to single waypoint list
  const allWaypoints = mission.segments.flatMap(s => s.waypoints);
  
  return {
    id: mission.id,
    name: mission.name,
    zones: [], // v2 doesn't store zones separately
    waypoints: allWaypoints.map(downgradeWaypointV2ToV1),
    config: downgradeConfigV2ToV1(mission.config),
    stats: mission.stats,
    createdAt: mission.createdAt,
    updatedAt: mission.updatedAt,
  };
}
