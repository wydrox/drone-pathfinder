import { saveAs } from 'file-saver';
import type { MissionConfig, POI, Waypoint } from '@/types/mission';
import { resolveWaypointOrientation } from './waypointOrientation';

export function exportGpx(waypoints: Waypoint[], config?: MissionConfig, pois: POI[] = []) {
  const rtepts = waypoints.map((wp, i) =>
    {
      const orientation = config
        ? resolveWaypointOrientation(wp, config, pois)
        : { heading: wp.heading ?? 0, gimbalPitch: 0 };

      return `  <rtept lat="${wp.lat}" lon="${wp.lng}"><ele>${wp.altitude}</ele><name>WP${i+1}</name><extensions><heading>${orientation.heading}</heading><speed>${wp.speed ?? config?.speed ?? 0}</speed><cameraAngle>${orientation.gimbalPitch}</cameraAngle></extensions></rtept>`;
    }
  ).join('\n');
  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="drone-pathfinder" xmlns="http://www.topografix.com/GPX/1/1">
  <rte>
    <name>drone-pathfinder-mission</name>
${rtepts}
  </rte>
</gpx>`;
  const blob = new Blob([gpx], { type: 'application/gpx+xml' });
  saveAs(blob, `drone-pathfinder-${Date.now()}.gpx`);
}
