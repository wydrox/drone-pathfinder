import { saveAs } from 'file-saver';
import type { Waypoint, MissionConfig, MissionStats, Zone, POI } from '@/types/mission';
import { resolveWaypointOrientation } from './waypointOrientation';

export function exportJson(waypoints: Waypoint[], config: MissionConfig, stats: MissionStats, zones: Zone[], pois: POI[] = []) {
  const data = {
    generator: 'drone-pathfinder',
    exportedAt: new Date().toISOString(),
    config, stats, zones, pois,
    waypoints: waypoints.map(wp => {
      const orientation = resolveWaypointOrientation(wp, config, pois);

      return {
        index: wp.index,
        lat: wp.lat,
        lng: wp.lng,
        altitude: wp.altitude,
        action: wp.action,
        speed: wp.speed,
        heading: wp.heading,
        resolvedHeading: orientation.heading,
        resolvedGimbalPitch: orientation.gimbalPitch,
      };
    }),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  saveAs(blob, `drone-pathfinder-${Date.now()}.json`);
}
