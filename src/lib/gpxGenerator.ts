import { saveAs } from 'file-saver';
import type { Waypoint } from '@/types/mission';

export function exportGpx(waypoints: Waypoint[]) {
  const rtepts = waypoints.map((wp, i) =>
    `  <rtept lat="${wp.lat}" lon="${wp.lng}"><ele>${wp.altitude}</ele><name>WP${i+1}</name></rtept>`
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
