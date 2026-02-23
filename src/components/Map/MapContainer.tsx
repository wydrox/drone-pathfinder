import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getMapStyleById } from '@/lib/mapStyles';

interface Props {
  mapRef: React.MutableRefObject<L.Map | null>;
  onMapReady?: (map: L.Map) => void;
  mapStyleId?: string;
}

export function MapContainer({ mapRef, onMapReady, mapStyleId = 'carto-dark' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [52.2297, 21.0122],
      zoom: 13,
      zoomControl: false,
    });

    const style = getMapStyleById(mapStyleId);
    tileLayerRef.current = L.tileLayer(style.url, {
      attribution: style.attribution,
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapRef.current = map;
    onMapReady?.(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    
    const style = getMapStyleById(mapStyleId);
    tileLayerRef.current.setUrl(style.url);
  }, [mapStyleId]);

  return <div ref={containerRef} className="w-full h-full" />;
}
