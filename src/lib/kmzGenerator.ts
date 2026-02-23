import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { Waypoint, MissionConfig } from '@/types/mission';

function buildKml(waypoints: Waypoint[], config: MissionConfig): string {
  const placemarks = waypoints.map((wp, i) => `
  <Placemark>
    <name>WP${i + 1}</name>
    <Point><coordinates>${wp.lng},${wp.lat},${wp.altitude}</coordinates></Point>
    <ExtendedData>
      <Data name="speed"><value>${config.speed}</value></Data>
      <Data name="altitude"><value>${wp.altitude}</value></Data>
      <Data name="action"><value>${wp.action}</value></Data>
      <Data name="droneModel"><value>${config.droneModel}</value></Data>
    </ExtendedData>
  </Placemark>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:wpml="http://www.dji.com/wpmz/1.0.6">
<Document>
  <name>drone-pathfinder-mission</name>
  <wpml:missionConfig>
    <wpml:flyToWaylineMode>safely</wpml:flyToWaylineMode>
    <wpml:finishAction>goHome</wpml:finishAction>
    <wpml:exitOnRCLost>goContinue</wpml:exitOnRCLost>
    <wpml:takeOffSecurityHeight>20</wpml:takeOffSecurityHeight>
    <wpml:globalTransitionalSpeed>${config.speed}</wpml:globalTransitionalSpeed>
    <wpml:droneInfo><wpml:droneEnumValue>77</wpml:droneEnumValue></wpml:droneInfo>
  </wpml:missionConfig>
  <Folder>
    <name>Waypoints</name>
    ${placemarks}
  </Folder>
</Document>
</kml>`;
}

export async function exportKmz(waypoints: Waypoint[], config: MissionConfig) {
  const kml = buildKml(waypoints, config);
  const zip = new JSZip();
  const folder = zip.folder('wpmz')!;
  folder.file('waylines.wpml', kml);
  folder.file('template.kml', `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>drone-pathfinder</name></Document></kml>`);
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  saveAs(blob, `drone-pathfinder-${Date.now()}.kmz`);
}
