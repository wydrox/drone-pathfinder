import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { MissionConfig, POI, Waypoint } from '@/types/mission';
import { resolveWaypointOrientation } from '@/lib/waypointOrientation';

interface Props {
  map: L.Map | null;
  waypoints: Waypoint[];
  selectedWaypointId?: string | null;
  defaultSpeed: number;
  defaultHeading: number;
  config: MissionConfig;
  pois: POI[];
  onWaypointChange?: (id: string, changes: Partial<Waypoint>) => void;
  onSelectWaypoint?: (id: string) => void;
}

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function getBearing(from: Waypoint, to: Waypoint): number | null {
  if (from.lat === to.lat && from.lng === to.lng) {
    return null;
  }

  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;

  if (!Number.isFinite(brng)) {
    return null;
  }

  return normalizeAngle(brng);
}

function getMovementHeading(waypoints: Waypoint[], index: number, fallback: number): number {
  if (waypoints.length < 2) return normalizeAngle(fallback);

  if (index < waypoints.length - 1) {
    const forward = getBearing(waypoints[index], waypoints[index + 1]);
    if (forward !== null) {
      return forward;
    }
  }

  if (index > 0) {
    const backward = getBearing(waypoints[index - 1], waypoints[index]);
    if (backward !== null) {
      return backward;
    }
  }

  return normalizeAngle(fallback);
}

function getArrowLength(speed: number): number {
  const minSpeed = 1;
  const maxSpeed = 15;
  const clamped = Math.max(minSpeed, Math.min(maxSpeed, speed));
  const normalized = (clamped - minSpeed) / (maxSpeed - minSpeed);
  return 10 + normalized * 16;
}

function createWaypointIcon(
  waypoint: Waypoint,
  movementHeading: number,
  cameraHeading: number,
  speed: number,
  selected: boolean,
): L.DivIcon {
  const arrowLength = getArrowLength(speed);
  const center = 28;
  const movementTipY = center - arrowLength;
  const dotRadius = selected ? 6 : 5;
  const dotFill = waypoint.action === 'photo' ? '#22c55e' : '#4f8ef7';
  const ringStroke = selected ? '#f59e0b' : '#111827';
  const ringWidth = selected ? 2.5 : 1.5;

  const html = `
    <div style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;">
      <svg width="56" height="56" viewBox="0 0 56 56" style="overflow:visible;pointer-events:none;">
        <g transform="rotate(${movementHeading} ${center} ${center})">
          <line x1="${center}" y1="${center}" x2="${center}" y2="${movementTipY}" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" />
          <polygon points="${center},${movementTipY - 5} ${center - 4},${movementTipY + 1} ${center + 4},${movementTipY + 1}" fill="#38bdf8" />
        </g>
        <g transform="rotate(${cameraHeading} ${center} ${center})">
          <polygon points="${center},${center - 18} ${center - 5},${center - 9} ${center + 5},${center - 9}" fill="#f97316" />
        </g>
        <circle cx="${center}" cy="${center}" r="${dotRadius + 2}" fill="#0b1220" stroke="${ringStroke}" stroke-width="${ringWidth}" />
        <circle cx="${center}" cy="${center}" r="${dotRadius}" fill="${dotFill}" />
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'waypoint-icon',
    html,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
}

export function WaypointLayer({
  map,
  waypoints,
  selectedWaypointId,
  defaultSpeed,
  defaultHeading,
  config,
  pois,
  onWaypointChange,
  onSelectWaypoint,
}: Props) {
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!map) return;

    layerRef.current?.clearLayers();
    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(map);
    }

    waypoints.forEach((wp, index) => {
      const movementHeading = getMovementHeading(waypoints, index, defaultHeading);
      const orientation = resolveWaypointOrientation(wp, config, pois);
      const cameraHeading = normalizeAngle(orientation.heading);
      const speed = wp.speed ?? defaultSpeed;

      const marker = L.marker([wp.lat, wp.lng], {
        icon: createWaypointIcon(wp, movementHeading, cameraHeading, speed, selectedWaypointId === wp.id),
        draggable: true,
        keyboard: false,
        bubblingMouseEvents: false,
      });

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onWaypointChange?.(wp.id, {
          lat: pos.lat,
          lng: pos.lng,
        });
      });

      marker.on('click', () => {
        onSelectWaypoint?.(wp.id);
      });

      marker.bindTooltip(`#${index + 1} — ${wp.altitude}m — cam ${orientation.gimbalPitch.toFixed(1)}deg`, { direction: 'top', opacity: 0.9 });
      layerRef.current?.addLayer(marker);
    });

    return () => {
      layerRef.current?.clearLayers();
    };
  }, [map, waypoints, selectedWaypointId, defaultSpeed, defaultHeading, config, pois, onWaypointChange, onSelectWaypoint]);

  return null;
}
