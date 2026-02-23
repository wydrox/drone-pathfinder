import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Waypoint } from '@/types/mission';

interface Props {
  map: L.Map | null;
  waypoints: Waypoint[];
}

export function FlightPathLayer({ map, waypoints }: Props) {
  const lineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;
    lineRef.current?.remove();
    if (waypoints.length < 2) return;
    lineRef.current = L.polyline(
      waypoints.map(wp => [wp.lat, wp.lng]),
      { color: '#4f8ef7', weight: 1.5, opacity: 0.5, dashArray: '4,6' }
    ).addTo(map);
    return () => { lineRef.current?.remove(); };
  }, [map, waypoints]);

  return null;
}
