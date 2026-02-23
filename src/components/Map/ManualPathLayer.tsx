import { useEffect } from 'react';
import L from 'leaflet';
import type { LatLng } from '@/types/mission';

interface Props {
  map: L.Map | null;
  paths: LatLng[][];
  visible?: boolean;
}

export function ManualPathLayer({ map, paths, visible = true }: Props) {
  useEffect(() => {
    if (!map || !visible) return;

    const polylines: L.Polyline[] = [];

    paths.forEach(pathPoints => {
      if (pathPoints.length < 2) return;
      
      const polyline = L.polyline(
        pathPoints.map(p => [p.lat, p.lng]),
        {
          color: '#f59e0b',
          weight: 3,
          opacity: 0.8,
          dashArray: '10, 10',
        }
      ).addTo(map);
      
      polylines.push(polyline);
    });

    return () => {
      polylines.forEach(line => line.remove());
    };
  }, [map, paths, visible]);

  return null;
}
