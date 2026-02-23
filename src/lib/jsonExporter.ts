import { saveAs } from 'file-saver';
import type { Waypoint, MissionConfig, MissionStats, Zone } from '@/types/mission';

export function exportJson(waypoints: Waypoint[], config: MissionConfig, stats: MissionStats, zones: Zone[]) {
  const data = {
    generator: 'drone-pathfinder',
    exportedAt: new Date().toISOString(),
    config, stats, zones,
    waypoints: waypoints.map(wp => ({
      index: wp.index,
      lat: wp.lat,
      lng: wp.lng,
      altitude: wp.altitude,
      action: wp.action,
    })),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  saveAs(blob, `drone-pathfinder-${Date.now()}.json`);
}
