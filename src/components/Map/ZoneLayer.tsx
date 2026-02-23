import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { Zone } from '@/types/mission';

interface Props {
  map: L.Map | null;
  zones: Zone[];
}

export function ZoneLayer({ map, zones }: Props) {
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!map) return;
    if (!layerRef.current) layerRef.current = L.layerGroup().addTo(map);
    layerRef.current.clearLayers();
    zones.forEach(zone => {
      L.polygon(zone.points.map(p => [p.lat, p.lng] as [number, number]), {
        color: '#7c3aed', fillColor: '#7c3aed', fillOpacity: 0.1, weight: 2,
      }).addTo(layerRef.current!);
    });
    return () => { layerRef.current?.clearLayers(); };
  }, [map, zones]);

  return null;
}
