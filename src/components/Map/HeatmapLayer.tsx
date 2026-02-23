import { useEffect } from 'react';
import L from 'leaflet';
import type { POI } from '@/types/mission';

interface Props {
  map: L.Map | null;
  pois: POI[];
}

export function HeatmapLayer({ map, pois }: Props) {
  useEffect(() => {
    if (!map) return;
    const circles: L.Circle[] = [];
    pois.forEach(poi => {
      const c = L.circle([poi.lat, poi.lng], {
        radius: Math.max(8, poi.radiusMeters),
        color: '#f59e0b',
        fillColor: '#f59e0b',
        fillOpacity: 0.15,
        weight: 1,
      }).addTo(map);
      circles.push(c);
    });
    return () => circles.forEach(c => c.remove());
  }, [map, pois]);

  return null;
}
