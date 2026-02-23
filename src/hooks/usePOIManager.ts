import { useState, useCallback } from 'react';
import type { POI, POIOverlay } from '@/types/mission';

export function usePOIManager() {
  const [pois, setPois] = useState<POI[]>([]);
  const [overlays, setOverlays] = useState<POIOverlay[]>([]);

  const addPOI = useCallback((poi: Omit<POI, 'id'>) => {
    const newPOI: POI = {
      ...poi,
      id: `poi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setPois(prev => [...prev, newPOI]);
    return newPOI;
  }, []);

  const removePOI = useCallback((id: string) => {
    setPois(prev => prev.filter(p => p.id !== id));
  }, []);

  const updatePOI = useCallback((id: string, changes: Partial<POI>) => {
    setPois(prev => prev.map(p => p.id === id ? { ...p, ...changes } : p));
  }, []);

  const toggleOverlayVisibility = useCallback((id: string) => {
    setOverlays(prev => prev.map(o => 
      o.id === id ? { ...o, visible: !o.visible } : o
    ));
  }, []);

  return {
    pois,
    overlays,
    addPOI,
    removePOI,
    updatePOI,
    toggleOverlayVisibility,
  };
}
