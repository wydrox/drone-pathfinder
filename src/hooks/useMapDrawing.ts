import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { Zone, LatLng } from '@/types/mission';

export type DrawMode = 'none' | 'polygon' | 'rectangle';

export function useMapDrawing(
  map: L.Map | null,
  onZoneComplete: (zone: Zone) => void
) {
  const [drawMode, setDrawModeState] = useState<DrawMode>('none');
  const drawModeRef = useRef<DrawMode>('none');
  const tempPoints = useRef<LatLng[]>([]);
  const tempMarkers = useRef<L.CircleMarker[]>([]);
  const previewLine = useRef<L.Polyline | null>(null);
  const previewRect = useRef<L.Rectangle | null>(null);
  const rectStart = useRef<L.LatLng | null>(null);

  const cleanup = () => {
    tempPoints.current = [];
    tempMarkers.current.forEach(m => m.remove());
    tempMarkers.current = [];
    previewLine.current?.remove();
    previewLine.current = null;
    previewRect.current?.remove();
    previewRect.current = null;
    rectStart.current = null;
  };

  const setMode = (mode: DrawMode) => {
    cleanup();
    drawModeRef.current = mode;
    setDrawModeState(mode);
    if (map) {
      map.getContainer().style.cursor = mode !== 'none' ? 'crosshair' : '';
    }
  };

  useEffect(() => {
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      const mode = drawModeRef.current;
      if (mode === 'polygon') {
        tempPoints.current.push({ lat: e.latlng.lat, lng: e.latlng.lng });
        const marker = L.circleMarker(e.latlng, {
          radius: 5, color: '#4f8ef7', fillColor: '#4f8ef7', fillOpacity: 1, weight: 2,
        }).addTo(map);
        tempMarkers.current.push(marker);
        previewLine.current?.remove();
        if (tempPoints.current.length >= 2) {
          previewLine.current = L.polyline(
            tempPoints.current.map(p => [p.lat, p.lng]),
            { color: '#4f8ef7', weight: 2, dashArray: '6,4', opacity: 0.8 }
          ).addTo(map);
        }
      } else if (mode === 'rectangle') {
        if (!rectStart.current) {
          rectStart.current = e.latlng;
        } else {
          const bounds = L.latLngBounds(rectStart.current, e.latlng);
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          const points: LatLng[] = [
            { lat: ne.lat, lng: sw.lng },
            { lat: ne.lat, lng: ne.lng },
            { lat: sw.lat, lng: ne.lng },
            { lat: sw.lat, lng: sw.lng },
          ];
          const zone: Zone = { id: `zone-${Date.now()}`, points, type: 'rectangle' };
          cleanup();
          setMode('none');
          onZoneComplete(zone);
        }
      }
    };

    const handleDblClick = (e: L.LeafletMouseEvent) => {
      if (drawModeRef.current !== 'polygon') return;
      L.DomEvent.stop(e);
      if (tempPoints.current.length < 3) return;
      const zone: Zone = { id: `zone-${Date.now()}`, points: [...tempPoints.current], type: 'polygon' };
      cleanup();
      setMode('none');
      onZoneComplete(zone);
    };

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      const mode = drawModeRef.current;
      if (mode === 'rectangle' && rectStart.current) {
        previewRect.current?.remove();
        previewRect.current = L.rectangle(
          L.latLngBounds(rectStart.current, e.latlng),
          { color: '#4f8ef7', weight: 2, dashArray: '6,4', fillOpacity: 0.1 }
        ).addTo(map);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMode('none');
      if (e.key === 'p' || e.key === 'P') setMode('polygon');
      if (e.key === 'r' || e.key === 'R') setMode('rectangle');
    };

    map.on('click', handleClick);
    map.on('dblclick', handleDblClick);
    map.on('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      map.off('click', handleClick);
      map.off('dblclick', handleDblClick);
      map.off('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [map]);

  return { drawMode, setMode };
}
