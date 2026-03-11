import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { Waypoint, MissionConfig } from '@/types/mission';

// DJI drone model → WPML enum values
// Source: DJI WPML 1.0.6 specification
const DRONE_ENUM_MAP: Record<string, { droneEnumValue: number; droneSubEnumValue: number }> = {
  'DJI Mini 4 Pro':   { droneEnumValue: 77,  droneSubEnumValue: 0 },
  'DJI Mini 5 Pro':   { droneEnumValue: 77,  droneSubEnumValue: 0 },
  'DJI Mavic 4 Pro':  { droneEnumValue: 67,  droneSubEnumValue: 0 },
  'DJI Mavic 3':      { droneEnumValue: 60,  droneSubEnumValue: 0 },
  'DJI Mavic 3 Pro':  { droneEnumValue: 60,  droneSubEnumValue: 0 },
  'DJI Air 3':        { droneEnumValue: 89,  droneSubEnumValue: 0 },
  'DJI Air 3S':       { droneEnumValue: 96,  droneSubEnumValue: 0 },
};

function getDroneEnum(droneModel: string): { droneEnumValue: number; droneSubEnumValue: number } {
  return DRONE_ENUM_MAP[droneModel] ?? { droneEnumValue: 77, droneSubEnumValue: 0 };
}

function buildWaylineWpml(waypoints: Waypoint[], config: MissionConfig): string {
  const { droneEnumValue, droneSubEnumValue } = getDroneEnum(config.droneModel);
  const now = Date.now();
  const speed = config.speed;
  const altitude = config.altitude;
  const gimbalPitch = config.cameraAngle ?? -90;

  const placemarks = waypoints.map((wp, i) => {
    const wpSpeed = wp.speed ?? speed;
    const wpAlt = wp.altitude ?? altitude;
    const wpHeading = wp.heading ?? config.direction;
    const wpGimbal = gimbalPitch;
    const hasPhoto = wp.action === 'photo';

    const actionGroup = hasPhoto ? `
      <wpml:actionGroup>
        <wpml:actionGroupId>${i}</wpml:actionGroupId>
        <wpml:actionGroupStartIndex>${i}</wpml:actionGroupStartIndex>
        <wpml:actionGroupEndIndex>${i}</wpml:actionGroupEndIndex>
        <wpml:actionGroupMode>sequence</wpml:actionGroupMode>
        <wpml:actionTrigger>
          <wpml:actionTriggerType>reachPoint</wpml:actionTriggerType>
        </wpml:actionTrigger>
        <wpml:action>
          <wpml:actionId>0</wpml:actionId>
          <wpml:actionActuatorFunc>takePhoto</wpml:actionActuatorFunc>
          <wpml:actionActuatorFuncParam>
            <wpml:fileSuffix></wpml:fileSuffix>
            <wpml:payloadPositionIndex>0</wpml:payloadPositionIndex>
          </wpml:actionActuatorFuncParam>
        </wpml:action>
      </wpml:actionGroup>` : '';

    return `
    <Placemark>
      <Point>
        <coordinates>${wp.lng},${wp.lat},${wpAlt}</coordinates>
      </Point>
      <wpml:index>${i}</wpml:index>
      <wpml:ellipsoidHeight>NaN</wpml:ellipsoidHeight>
      <wpml:height>${wpAlt}</wpml:height>
      <wpml:executeHeight>${wpAlt}</wpml:executeHeight>
      <wpml:waypointSpeed>${wpSpeed}</wpml:waypointSpeed>
      <wpml:waypointHeadingParam>
        <wpml:waypointHeadingMode>followWayline</wpml:waypointHeadingMode>
        <wpml:waypointHeadingAngle>${wpHeading}</wpml:waypointHeadingAngle>
        <wpml:waypointPoiPoint>0.000000,0.000000,0.000000</wpml:waypointPoiPoint>
        <wpml:waypointHeadingAngleEnable>0</wpml:waypointHeadingAngleEnable>
      </wpml:waypointHeadingParam>
      <wpml:waypointTurnParam>
        <wpml:waypointTurnMode>toPointAndStopWithDiscontinuityCurvature</wpml:waypointTurnMode>
        <wpml:waypointTurnDampingDist>0</wpml:waypointTurnDampingDist>
      </wpml:waypointTurnParam>
      <wpml:useStraightLine>0</wpml:useStraightLine>
      <wpml:gimbalPitchAngle>${wpGimbal}</wpml:gimbalPitchAngle>${actionGroup}
    </Placemark>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:wpml="http://www.dji.com/wpmz/1.0.6">
<Document>
  <wpml:author>drone-pathfinder</wpml:author>
  <wpml:createTime>${now}</wpml:createTime>
  <wpml:updateTime>${now}</wpml:updateTime>
  <wpml:missionConfig>
    <wpml:flyToWaylineMode>safely</wpml:flyToWaylineMode>
    <wpml:finishAction>goHome</wpml:finishAction>
    <wpml:exitOnRCLost>goContinue</wpml:exitOnRCLost>
    <wpml:takeOffSecurityHeight>20</wpml:takeOffSecurityHeight>
    <wpml:globalTransitionalSpeed>${speed}</wpml:globalTransitionalSpeed>
    <wpml:droneInfo>
      <wpml:droneEnumValue>${droneEnumValue}</wpml:droneEnumValue>
      <wpml:droneSubEnumValue>${droneSubEnumValue}</wpml:droneSubEnumValue>
    </wpml:droneInfo>
  </wpml:missionConfig>
  <Folder>
    <wpml:templateType>waypoint</wpml:templateType>
    <wpml:templateId>0</wpml:templateId>
    <wpml:waylineCoordinateReference>WGS84EG</wpml:waylineCoordinateReference>
    <wpml:autoFlightSpeed>${speed}</wpml:autoFlightSpeed>
    <wpml:transitionalSpeed>${speed}</wpml:transitionalSpeed>
    <wpml:globalHeight>${altitude}</wpml:globalHeight>
    <wpml:caliFlightEnable>0</wpml:caliFlightEnable>
    <wpml:gimbalPitchMode>manual</wpml:gimbalPitchMode>
    <wpml:ellipsoidHeight>NaN</wpml:ellipsoidHeight>
    <wpml:height>${altitude}</wpml:height>
    <wpml:globalWaypointHeadingParam>
      <wpml:waypointHeadingMode>followWayline</wpml:waypointHeadingMode>
    </wpml:globalWaypointHeadingParam>
    <wpml:globalWaypointTurnMode>toPointAndStopWithDiscontinuityCurvature</wpml:globalWaypointTurnMode>
    <wpml:waylineId>0</wpml:waylineId>
    <wpml:distance>0</wpml:distance>
    <wpml:duration>0</wpml:duration>
    <wpml:autoFlightSpeed>${speed}</wpml:autoFlightSpeed>${placemarks}
  </Folder>
</Document>
</kml>`;
}

function buildTemplateKml(config: MissionConfig): string {
  const { droneEnumValue, droneSubEnumValue } = getDroneEnum(config.droneModel);
  const now = Date.now();
  const speed = config.speed;
  const altitude = config.altitude;
  const gimbalPitch = config.cameraAngle ?? -90;

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:wpml="http://www.dji.com/wpmz/1.0.6">
<Document>
  <wpml:author>drone-pathfinder</wpml:author>
  <wpml:createTime>${now}</wpml:createTime>
  <wpml:updateTime>${now}</wpml:updateTime>
  <wpml:missionConfig>
    <wpml:flyToWaylineMode>safely</wpml:flyToWaylineMode>
    <wpml:finishAction>goHome</wpml:finishAction>
    <wpml:exitOnRCLost>goContinue</wpml:exitOnRCLost>
    <wpml:takeOffSecurityHeight>20</wpml:takeOffSecurityHeight>
    <wpml:globalTransitionalSpeed>${speed}</wpml:globalTransitionalSpeed>
    <wpml:droneInfo>
      <wpml:droneEnumValue>${droneEnumValue}</wpml:droneEnumValue>
      <wpml:droneSubEnumValue>${droneSubEnumValue}</wpml:droneSubEnumValue>
    </wpml:droneInfo>
  </wpml:missionConfig>
  <Folder>
    <wpml:templateType>waypoint</wpml:templateType>
    <wpml:templateId>0</wpml:templateId>
    <wpml:waylineCoordinateReference>WGS84EG</wpml:waylineCoordinateReference>
    <wpml:autoFlightSpeed>${speed}</wpml:autoFlightSpeed>
    <wpml:transitionalSpeed>${speed}</wpml:transitionalSpeed>
    <wpml:globalHeight>${altitude}</wpml:globalHeight>
    <wpml:caliFlightEnable>0</wpml:caliFlightEnable>
    <wpml:gimbalPitchMode>manual</wpml:gimbalPitchMode>
    <wpml:ellipsoidHeight>NaN</wpml:ellipsoidHeight>
    <wpml:height>${altitude}</wpml:height>
    <wpml:globalWaypointHeadingParam>
      <wpml:waypointHeadingMode>followWayline</wpml:waypointHeadingMode>
    </wpml:globalWaypointHeadingParam>
    <wpml:globalWaypointTurnMode>toPointAndStopWithDiscontinuityCurvature</wpml:globalWaypointTurnMode>
    <wpml:globalGimbalPitchAngle>${gimbalPitch}</wpml:globalGimbalPitchAngle>
  </Folder>
</Document>
</kml>`;
}

export async function exportKmz(waypoints: Waypoint[], config: MissionConfig) {
  if (waypoints.length === 0) return;

  const wpml = buildWaylineWpml(waypoints, config);
  const templateKml = buildTemplateKml(config);

  const zip = new JSZip();
  const folder = zip.folder('wpmz')!;
  folder.file('waylines.wpml', wpml);
  folder.file('template.kml', templateKml);

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  saveAs(blob, `drone-pathfinder-${Date.now()}.kmz`);
}
