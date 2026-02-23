import { useState, useCallback } from 'react';
import type { MissionConfig, Waypoint, Zone, MissionStats } from '@/types/mission';
import { generateGrid, calcStats } from '@/lib/gridAlgorithm';

const DEFAULT_CONFIG: MissionConfig = {
  altitude: 80, speed: 8, overlap: 70,
  direction: 0, travelAxis: 'EW',
  photoCapture: true, droneModel: 'DJI Mini 4 Pro',
};

export function useMission() {
  const [config, setConfig] = useState<MissionConfig>(DEFAULT_CONFIG);
  const [zones, setZones] = useState<Zone[]>([]);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [stats, setStats] = useState<MissionStats>({ waypointCount: 0, areaSqm: 0, estimatedTimeSec: 0 });

  const regenerate = useCallback((zoneList: Zone[], cfg: MissionConfig) => {
    const allWaypoints: Waypoint[] = [];
    let globalIdx = 0;
    for (const zone of zoneList) {
      const wps = generateGrid(zone.points, cfg).map(wp => ({ ...wp, index: globalIdx++ }));
      allWaypoints.push(...wps);
    }
    setWaypoints(allWaypoints);
    const allPoints = zoneList.flatMap(z => z.points);
    setStats(calcStats(allWaypoints, allPoints.length ? allPoints : [], cfg));
  }, []);

  const addZone = useCallback((zone: Zone) => {
    setZones(prev => {
      const next = [...prev, zone];
      regenerate(next, config);
      return next;
    });
  }, [config, regenerate]);

  const removeZone = useCallback((id: string) => {
    setZones(prev => {
      const next = prev.filter(z => z.id !== id);
      regenerate(next, config);
      return next;
    });
  }, [config, regenerate]);

  const updateConfig = useCallback((partial: Partial<MissionConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...partial };
      regenerate(zones, next);
      return next;
    });
  }, [zones, regenerate]);

  const clearAll = useCallback(() => {
    setZones([]);
    setWaypoints([]);
    setStats({ waypointCount: 0, areaSqm: 0, estimatedTimeSec: 0 });
  }, []);

  const updateWaypoint = useCallback((id: string, changes: Partial<Waypoint>) => {
    setWaypoints(prev => prev.map(wp => wp.id === id ? { ...wp, ...changes } : wp));
  }, []);

  const removeWaypoint = useCallback((id: string) => {
    setWaypoints(prev => prev.filter(wp => wp.id !== id));
  }, []);

  const setImportedWaypoints = useCallback((wps: Waypoint[]) => {
    setWaypoints(wps);
    setStats({ waypointCount: wps.length, areaSqm: 0, estimatedTimeSec: 0 });
  }, []);

  return {
    config, zones, waypoints, stats,
    addZone, removeZone, updateConfig, clearAll, updateWaypoint, removeWaypoint, setImportedWaypoints,
  };
}
