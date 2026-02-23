import * as turf from '@turf/turf';
import type { LatLng, Waypoint, MissionConfig } from '@/types/mission';

function rotatePoint(pt: [number, number], center: [number, number], angleDeg: number): [number, number] {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = pt[0] - center[0];
  const dy = pt[1] - center[1];
  return [
    center[0] + dx * cos - dy * sin,
    center[1] + dx * sin + dy * cos,
  ];
}

export function generateGrid(points: LatLng[], config: MissionConfig): Waypoint[] {
  if (points.length < 3) return [];

  const coords = points.map(p => [p.lng, p.lat] as [number, number]);
  if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
    coords.push(coords[0]);
  }

  const poly = turf.polygon([coords]);
  const bbox = turf.bbox(poly);
  const center: [number, number] = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];

  const spacingFactor = config.altitude * (1 - config.overlap / 100) * 2;
  const spacingDeg = spacingFactor / 111111;

  const useNS = config.travelAxis === 'NS';
  const margin = spacingDeg * 2;
  const minX = bbox[0] - margin;
  const maxX = bbox[2] + margin;
  const minY = bbox[1] - margin;
  const maxY = bbox[3] + margin;

  const waypoints: Waypoint[] = [];
  let idx = 0;
  let lineIdx = 0;

  if (useNS) {
    let x = minX;
    while (x <= maxX) {
      const forward = lineIdx % 2 === 0;
      const startY = forward ? minY : maxY;
      const endY = forward ? maxY : minY;
      const steps = Math.ceil(Math.abs(endY - startY) / spacingDeg);
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const y = startY + (endY - startY) * t;
        const pt: [number, number] = [x, y];
        const rotated = rotatePoint(pt, center, config.direction);
        const candidate = turf.point(rotated);
        if (turf.booleanPointInPolygon(candidate, poly)) {
          waypoints.push({
            id: `wp-${idx}`,
            lat: rotated[1],
            lng: rotated[0],
            altitude: config.altitude,
            index: idx,
            action: config.photoCapture ? 'photo' : 'none',
          });
          idx++;
        }
      }
      x += spacingDeg;
      lineIdx++;
    }
  } else {
    let y = minY;
    while (y <= maxY) {
      const forward = lineIdx % 2 === 0;
      const startX = forward ? minX : maxX;
      const endX = forward ? maxX : minX;
      const steps = Math.ceil(Math.abs(endX - startX) / spacingDeg);
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const x = startX + (endX - startX) * t;
        const pt: [number, number] = [x, y];
        const rotated = rotatePoint(pt, center, config.direction);
        const candidate = turf.point(rotated);
        if (turf.booleanPointInPolygon(candidate, poly)) {
          waypoints.push({
            id: `wp-${idx}`,
            lat: rotated[1],
            lng: rotated[0],
            altitude: config.altitude,
            index: idx,
            action: config.photoCapture ? 'photo' : 'none',
          });
          idx++;
        }
      }
      y += spacingDeg;
      lineIdx++;
    }
  }

  return waypoints;
}

export function calcStats(waypoints: Waypoint[], points: LatLng[], config: MissionConfig) {
  if (points.length < 3) return { waypointCount: 0, areaSqm: 0, estimatedTimeSec: 0 };
  const coords = points.map(p => [p.lng, p.lat] as [number, number]);
  if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
    coords.push(coords[0]);
  }
  const poly = turf.polygon([coords]);
  const areaSqm = turf.area(poly);

  let totalDist = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const from = turf.point([waypoints[i-1].lng, waypoints[i-1].lat]);
    const to = turf.point([waypoints[i].lng, waypoints[i].lat]);
    totalDist += turf.distance(from, to, { units: 'meters' });
  }
  const estimatedTimeSec = totalDist / config.speed;

  return { waypointCount: waypoints.length, areaSqm, estimatedTimeSec };
}
