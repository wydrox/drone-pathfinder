import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Waypoint } from '@/types/mission';

interface Props {
  map: L.Map | null;
  waypoints: Waypoint[];
}

export function WaypointLayer({ map, waypoints }: Props) {
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!map) return;
    layerRef.current?.clearLayers();
    if (!layerRef.current) {
      layerRef.current = L.layerGroup().addTo(map);
    }

    waypoints.forEach((wp, i) => {
      const marker = L.circleMarker([wp.lat, wp.lng], {
        radius: 6,
        color: wp.action === 'photo' ? '#22c55e' : '#4f8ef7',
        fillColor: wp.action === 'photo' ? '#22c55e' : '#4f8ef7',
        fillOpacity: 0.85,
        weight: 1.5,
      });
      marker.bindTooltip(`#${i + 1} — ${wp.altitude}m`, { direction: 'top', opacity: 0.9 });
      layerRef.current!.addLayer(marker);
    });

    return () => { layerRef.current?.clearLayers(); };
  }, [map, waypoints]);

  return null;
}
