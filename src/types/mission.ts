export interface LatLng {
  lat: number;
  lng: number;
}

export interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  altitude: number;
  index: number;
  action: 'photo' | 'none';
}

export interface Zone {
  id: string;
  points: LatLng[];
  type: 'polygon' | 'rectangle';
}

export interface MissionConfig {
  altitude: number;
  speed: number;
  overlap: number;
  direction: number;
  travelAxis: 'NS' | 'EW';
  photoCapture: boolean;
  droneModel: string;
}

export interface MissionStats {
  waypointCount: number;
  areaSqm: number;
  estimatedTimeSec: number;
  totalDistanceM?: number;
}

export interface Mission {
  id: string;
  name: string;
  zones: Zone[];
  waypoints: Waypoint[];
  config: MissionConfig;
  stats: MissionStats;
  createdAt: string;
  updatedAt: string;
}

// ============ SCHEMA V2 TYPES ============

export type SchemaVersion = '1.0' | '2.0';

export interface MissionSegment {
  id: string;
  type: 'grid' | 'orbit' | 'facade' | 'path' | 'poi';
  waypoints: Waypoint[];
  config: Partial<MissionConfig>;
  order: number;
}

export interface MissionStage {
  id: string;
  name: string;
  startWaypointIndex: number;
  endWaypointIndex: number;
  estimatedTimeSec: number;
  batteryRequiredPercent: number;
}

export interface BatteryConfig {
  capacityMah: number;
  voltage: number;
  reservePercent: number;
  hoverCurrentAmps: number;
  cruiseCurrentAmps: number;
}

export type WaypointActionType = 'photo' | 'videoStart' | 'videoStop' | 'hover' | 'yaw' | 'gimbalPitch' | 'custom';

export interface WaypointAction {
  id: string;
  type: WaypointActionType;
  params?: {
    durationMs?: number;
    angleDegrees?: number;
    customTag?: string;
  };
}

export interface WaypointV2 extends Omit<Waypoint, 'action'> {
  actions: WaypointAction[];
}

export interface POI {
  id: string;
  lat: number;
  lng: number;
  altitude: number;
  name: string;
  category: 'structure' | 'object' | 'target' | 'other';
  radiusMeters: number;
}

export interface POIOverlay {
  id: string;
  name: string;
  pois: POI[];
  visible: boolean;
  category: string;
}

export interface TerrainConfig {
  mode: 'absolute' | 'agl' | 'surfaceRelative';
  elevationSource: 'mapbox' | 'openElevation' | 'cached';
  offsetMeters: number;
}

export interface Obstacle {
  id: string;
  type: 'building' | 'tree' | 'manual';
  geometry: LatLng[];
  minClearanceMeters: number;
  maxHeightMeters: number;
}

export interface MapStyle {
  id: string;
  name: string;
  url: string;
  attribution: string;
  type: 'vector' | 'raster';
  requiresToken: boolean;
}

export interface LayerVisibilityConfig {
  zones: boolean;
  waypoints: boolean;
  paths: boolean;
  pois: boolean;
  heatmaps: boolean;
  flightPath: boolean;
}

export interface OfflinePack {
  id: string;
  name: string;
  bbox: [number, number, number, number];
  zoomRange: [number, number];
  downloadedAt: string;
  sizeBytes: number;
  tileCount: number;
  type: 'basemap' | 'elevation' | 'poi';
  status: 'pending' | 'downloading' | 'complete' | 'error';
}

export interface MissionConfigV2 extends MissionConfig {
  schemaVersion: SchemaVersion;
  mapStyleId: string;
  terrainConfig: TerrainConfig;
  layerVisibility: LayerVisibilityConfig;
}

export interface MissionV2 {
  id: string;
  name: string;
  schemaVersion: SchemaVersion;
  segments: MissionSegment[];
  stages: MissionStage[];
  waypoints: WaypointV2[];
  config: MissionConfigV2;
  stats: MissionStats;
  pois: POI[];
  poiOverlays: POIOverlay[];
  obstacles: Obstacle[];
  offlinePacks: OfflinePack[];
  createdAt: string;
  updatedAt: string;
}
