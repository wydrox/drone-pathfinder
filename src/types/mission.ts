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
