import { useEffect } from 'react';
import L from 'leaflet';
import type { POI } from '@/types/mission';

interface Props {
  map: L.Map | null;
  pois: POI[];
  visible?: boolean;
}

export function POILayer({ map, pois, visible = true }: Props) {
  useEffect(() => {
    if (!map || !visible) return;

    const markers: L.Marker[] = [];

    pois.forEach(poi => {
      const marker = L.marker([poi.lat, poi.lng], {
        title: poi.name,
      }).addTo(map);
      
      marker.bindPopup(`
        <b>${poi.name}</b><br>
        ${poi.category}<br>
        Alt: ${poi.altitude}m
      `);
      
      markers.push(marker);
    });

    return () => {
      markers.forEach(marker => marker.remove());
    };
  }, [map, pois, visible]);

  return null;
}
