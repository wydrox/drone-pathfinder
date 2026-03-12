import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { MissionConfig, POI, Waypoint } from '@/types/mission';
import { formatWaypointPoiPoint, getOrientationPoi, resolveWaypointOrientation } from '@/lib/waypointOrientation';

const BUILD_TIMESTAMP = 0;

const DRONE_ENUM_MAP: Record<string, { droneEnumValue: number; droneSubEnumValue: number }> = {
  'DJI Mini 4 Pro': { droneEnumValue: 77, droneSubEnumValue: 0 },
  'DJI Mini 5 Pro': { droneEnumValue: 77, droneSubEnumValue: 0 },
  'DJI Mavic 4 Pro': { droneEnumValue: 67, droneSubEnumValue: 0 },
  'DJI Mavic 3': { droneEnumValue: 60, droneSubEnumValue: 0 },
  'DJI Mavic 3 Pro': { droneEnumValue: 60, droneSubEnumValue: 0 },
  'DJI Air 3': { droneEnumValue: 89, droneSubEnumValue: 0 },
  'DJI Air 3S': { droneEnumValue: 96, droneSubEnumValue: 0 },
};

function getDroneEnum(droneModel: string): { droneEnumValue: number; droneSubEnumValue: number } {
  return DRONE_ENUM_MAP[droneModel] ?? { droneEnumValue: 77, droneSubEnumValue: 0 };
}

function formatAngle(angle: number): string {
  return angle.toFixed(1);
}

function buildCoordinateSystemXml(): string {
  return `
    <wpml:waylineCoordinateSysParam>
      <wpml:coordinateMode>WGS84</wpml:coordinateMode>
      <wpml:heightMode>EGM96</wpml:heightMode>
    </wpml:waylineCoordinateSysParam>`;
}

function buildGlobalHeadingParamXml(config: MissionConfig, pois: POI[]): string {
  const poi = getOrientationPoi(config, pois);

  if (poi) {
    return `
    <wpml:globalWaypointHeadingParam>
      <wpml:waypointHeadingMode>towardPOI</wpml:waypointHeadingMode>
      <wpml:waypointPoiPoint>${formatWaypointPoiPoint(poi)}</wpml:waypointPoiPoint>
      <wpml:waypointHeadingPathMode>followBadArc</wpml:waypointHeadingPathMode>
    </wpml:globalWaypointHeadingParam>`;
  }

  return `
    <wpml:globalWaypointHeadingParam>
      <wpml:waypointHeadingMode>smoothTransition</wpml:waypointHeadingMode>
      <wpml:waypointHeadingAngle>${formatAngle(config.direction)}</wpml:waypointHeadingAngle>
      <wpml:waypointHeadingPathMode>followBadArc</wpml:waypointHeadingPathMode>
    </wpml:globalWaypointHeadingParam>`;
}

function buildWaypointHeadingParamXml(wp: Waypoint, config: MissionConfig, pois: POI[]): string {
  const poi = getOrientationPoi(config, pois);

  if (poi) {
    return `
      <wpml:waypointHeadingParam>
        <wpml:waypointHeadingMode>towardPOI</wpml:waypointHeadingMode>
        <wpml:waypointPoiPoint>${formatWaypointPoiPoint(poi)}</wpml:waypointPoiPoint>
        <wpml:waypointHeadingPathMode>followBadArc</wpml:waypointHeadingPathMode>
      </wpml:waypointHeadingParam>`;
  }

  const orientation = resolveWaypointOrientation(wp, config, pois);

  return `
      <wpml:waypointHeadingParam>
        <wpml:waypointHeadingMode>smoothTransition</wpml:waypointHeadingMode>
        <wpml:waypointHeadingAngle>${formatAngle(orientation.heading)}</wpml:waypointHeadingAngle>
        <wpml:waypointHeadingPathMode>followBadArc</wpml:waypointHeadingPathMode>
        <wpml:waypointHeadingAngleEnable>1</wpml:waypointHeadingAngleEnable>
      </wpml:waypointHeadingParam>`;
}

function buildWaypointActionGroupXml(index: number, wp: Waypoint, config: MissionConfig, pois: POI[]): string {
  const orientation = resolveWaypointOrientation(wp, config, pois);
  const photoAction = wp.action === 'photo'
    ? `
        <wpml:action>
          <wpml:actionId>1</wpml:actionId>
          <wpml:actionActuatorFunc>takePhoto</wpml:actionActuatorFunc>
          <wpml:actionActuatorFuncParam>
            <wpml:fileSuffix></wpml:fileSuffix>
            <wpml:payloadPositionIndex>0</wpml:payloadPositionIndex>
          </wpml:actionActuatorFuncParam>
        </wpml:action>`
    : '';

  return `
      <wpml:actionGroup>
        <wpml:actionGroupId>${index}</wpml:actionGroupId>
        <wpml:actionGroupStartIndex>${index}</wpml:actionGroupStartIndex>
        <wpml:actionGroupEndIndex>${index}</wpml:actionGroupEndIndex>
        <wpml:actionGroupMode>sequence</wpml:actionGroupMode>
        <wpml:actionTrigger>
          <wpml:actionTriggerType>reachPoint</wpml:actionTriggerType>
        </wpml:actionTrigger>
        <wpml:action>
          <wpml:actionId>0</wpml:actionId>
          <wpml:actionActuatorFunc>gimbalRotate</wpml:actionActuatorFunc>
          <wpml:actionActuatorFuncParam>
            <wpml:gimbalRotateMode>absoluteAngle</wpml:gimbalRotateMode>
            <wpml:gimbalPitchRotateEnable>1</wpml:gimbalPitchRotateEnable>
            <wpml:gimbalPitchRotateAngle>${formatAngle(orientation.gimbalPitch)}</wpml:gimbalPitchRotateAngle>
            <wpml:gimbalRollRotateEnable>0</wpml:gimbalRollRotateEnable>
            <wpml:gimbalRollRotateAngle>0</wpml:gimbalRollRotateAngle>
            <wpml:gimbalYawRotateEnable>0</wpml:gimbalYawRotateEnable>
            <wpml:gimbalYawRotateAngle>0</wpml:gimbalYawRotateAngle>
            <wpml:gimbalRotateTimeEnable>0</wpml:gimbalRotateTimeEnable>
            <wpml:gimbalRotateTime>0</wpml:gimbalRotateTime>
            <wpml:payloadPositionIndex>0</wpml:payloadPositionIndex>
          </wpml:actionActuatorFuncParam>
        </wpml:action>${photoAction}
      </wpml:actionGroup>`;
}

function buildTemplatePlacemarkXml(wp: Waypoint, index: number, config: MissionConfig, pois: POI[]): string {
  const wpSpeed = wp.speed ?? config.speed;
  const wpAlt = wp.altitude ?? config.altitude;
  const poi = getOrientationPoi(config, pois);
  const orientation = resolveWaypointOrientation(wp, config, pois);

  return `
    <Placemark>
      <Point>
        <coordinates>${wp.lng},${wp.lat},${wpAlt}</coordinates>
      </Point>
      <wpml:index>${index}</wpml:index>
      <wpml:ellipsoidHeight>${wpAlt}</wpml:ellipsoidHeight>
      <wpml:height>${wpAlt}</wpml:height>
      <wpml:useGlobalSpeed>0</wpml:useGlobalSpeed>
      <wpml:waypointSpeed>${wpSpeed}</wpml:waypointSpeed>
      <wpml:useGlobalHeadingParam>${poi ? 1 : 0}</wpml:useGlobalHeadingParam>${poi ? '' : buildWaypointHeadingParamXml(wp, config, pois)}
      <wpml:gimbalPitchAngle>${formatAngle(orientation.gimbalPitch)}</wpml:gimbalPitchAngle>
    </Placemark>`;
}

function buildWaylinePlacemarkXml(wp: Waypoint, index: number, config: MissionConfig, pois: POI[]): string {
  const wpSpeed = wp.speed ?? config.speed;
  const wpAlt = wp.altitude ?? config.altitude;

  return `
    <Placemark>
      <Point>
        <coordinates>${wp.lng},${wp.lat},${wpAlt}</coordinates>
      </Point>
      <wpml:index>${index}</wpml:index>
      <wpml:ellipsoidHeight>${wpAlt}</wpml:ellipsoidHeight>
      <wpml:height>${wpAlt}</wpml:height>
      <wpml:executeHeight>${wpAlt}</wpml:executeHeight>
      <wpml:waypointSpeed>${wpSpeed}</wpml:waypointSpeed>${buildWaypointHeadingParamXml(wp, config, pois)}
      <wpml:waypointTurnParam>
        <wpml:waypointTurnMode>toPointAndStopWithDiscontinuityCurvature</wpml:waypointTurnMode>
        <wpml:waypointTurnDampingDist>0</wpml:waypointTurnDampingDist>
      </wpml:waypointTurnParam>
      <wpml:useStraightLine>0</wpml:useStraightLine>${buildWaypointActionGroupXml(index, wp, config, pois)}
    </Placemark>`;
}

function buildWaylineWpml(waypoints: Waypoint[], config: MissionConfig, pois: POI[]): string {
  const { droneEnumValue, droneSubEnumValue } = getDroneEnum(config.droneModel);
  const speed = config.speed;
  const altitude = config.altitude;
  const placemarks = waypoints.map((wp, index) => buildWaylinePlacemarkXml(wp, index, config, pois)).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:wpml="http://www.dji.com/wpmz/1.0.6">
<Document>
  <wpml:author>drone-pathfinder</wpml:author>
  <wpml:createTime>${BUILD_TIMESTAMP}</wpml:createTime>
  <wpml:updateTime>${BUILD_TIMESTAMP}</wpml:updateTime>
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
    <wpml:templateId>0</wpml:templateId>${buildCoordinateSystemXml()}
    <wpml:autoFlightSpeed>${speed}</wpml:autoFlightSpeed>
    <wpml:transitionalSpeed>${speed}</wpml:transitionalSpeed>
    <wpml:globalHeight>${altitude}</wpml:globalHeight>
    <wpml:caliFlightEnable>0</wpml:caliFlightEnable>
    <wpml:globalWaypointTurnMode>toPointAndStopWithDiscontinuityCurvature</wpml:globalWaypointTurnMode>
    <wpml:waylineId>0</wpml:waylineId>
    <wpml:distance>0</wpml:distance>
    <wpml:duration>0</wpml:duration>
    <wpml:autoFlightSpeed>${speed}</wpml:autoFlightSpeed>${placemarks}
  </Folder>
</Document>
</kml>`;
}

function buildTemplateKml(waypoints: Waypoint[], config: MissionConfig, pois: POI[]): string {
  const { droneEnumValue, droneSubEnumValue } = getDroneEnum(config.droneModel);
  const speed = config.speed;
  const altitude = config.altitude;
  const placemarks = waypoints.map((wp, index) => buildTemplatePlacemarkXml(wp, index, config, pois)).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:wpml="http://www.dji.com/wpmz/1.0.6">
<Document>
  <wpml:author>drone-pathfinder</wpml:author>
  <wpml:createTime>${BUILD_TIMESTAMP}</wpml:createTime>
  <wpml:updateTime>${BUILD_TIMESTAMP}</wpml:updateTime>
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
    <wpml:templateId>0</wpml:templateId>${buildCoordinateSystemXml()}
    <wpml:autoFlightSpeed>${speed}</wpml:autoFlightSpeed>
    <wpml:transitionalSpeed>${speed}</wpml:transitionalSpeed>
    <wpml:globalHeight>${altitude}</wpml:globalHeight>
    <wpml:caliFlightEnable>0</wpml:caliFlightEnable>
    <wpml:gimbalPitchMode>usePointSetting</wpml:gimbalPitchMode>${buildGlobalHeadingParamXml(config, pois)}
    <wpml:globalWaypointTurnMode>toPointAndStopWithDiscontinuityCurvature</wpml:globalWaypointTurnMode>${placemarks}
  </Folder>
</Document>
</kml>`;
}

export async function exportKmz(waypoints: Waypoint[], config: MissionConfig, pois: POI[] = []) {
  if (waypoints.length === 0) return;

  const wpml = buildWaylineWpml(waypoints, config, pois);
  const templateKml = buildTemplateKml(waypoints, config, pois);

  const zip = new JSZip();
  const folder = zip.folder('wpmz');
  if (!folder) {
    throw new Error('Failed to create KMZ folder');
  }

  folder.file('waylines.wpml', wpml);
  folder.file('template.kml', templateKml);

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  saveAs(blob, `drone-pathfinder-${Date.now()}.kmz`);
}
