import type { LatLng, MissionConfig } from '@/types/mission';

export interface VideoPathConfig {
  center: LatLng;
  radiusMeters: number;
  altitudeMeters: number;
  speedMps: number;
  durationSeconds: number;
}

export function generateSpiralPath(config: VideoPathConfig): LatLng[] {
  const points: LatLng[] = [];
  const numPoints = Math.ceil(config.durationSeconds * config.speedMps / 5);
  
  for (let i = 0; i < numPoints; i++) {
    const t = i / numPoints;
    const radius = config.radiusMeters * (1 - t);
    const angle = t * 4 * Math.PI;
    
    const lat = config.center.lat + (radius / 111320) * Math.cos(angle);
    const lng = config.center.lng + (radius / (111320 * Math.cos(config.center.lat * Math.PI / 180))) * Math.sin(angle);
    
    points.push({ lat, lng });
  }
  
  return points;
}

export function generateHelixPath(config: VideoPathConfig): LatLng[] {
  const points: LatLng[] = [];
  const numPoints = Math.ceil(config.durationSeconds * config.speedMps / 5);
  const heightChange = 20;
  
  for (let i = 0; i < numPoints; i++) {
    const t = i / numPoints;
    const angle = t * 4 * Math.PI;
    
    const lat = config.center.lat + (config.radiusMeters / 111320) * Math.cos(angle);
    const lng = config.center.lng + (config.radiusMeters / (111320 * Math.cos(config.center.lat * Math.PI / 180))) * Math.sin(angle);
    
    points.push({ lat, lng });
  }
  
  return points;
}

export function generateGoldenRatioPath(config: VideoPathConfig): LatLng[] {
  const points: LatLng[] = [];
  const numPoints = Math.ceil(config.durationSeconds * config.speedMps / 5);
  const phi = 1.618033988749;
  
  for (let i = 0; i < numPoints; i++) {
    const t = i / numPoints;
    const radius = config.radiusMeters * Math.sqrt(t);
    const angle = 2 * Math.PI * phi * i;
    
    const lat = config.center.lat + (radius / 111320) * Math.cos(angle);
    const lng = config.center.lng + (radius / (111320 * Math.cos(config.center.lat * Math.PI / 180))) * Math.sin(angle);
    
    points.push({ lat, lng });
  }
  
  return points;
}
