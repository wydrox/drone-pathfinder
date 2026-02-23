import { useState, useCallback } from 'react';
import type { MissionConfig, Waypoint, Zone, MissionStats, SchemaVersion, WaypointV2 } from '@/types/mission';
import { generateGrid, calcStats } from '@/lib/gridAlgorithm';

// Feature flags for incremental rollout
const FEATURE_FLAGS = {
  enableV2Schema: true,
  enableSegments: false,
  enableStages: false,
  enableMultiAction: false,
  enablePOI: false,
  enableTerrain: false,
  enableOffline: false,
};

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
  const [schemaVersion, setSchemaVersion] = useState<SchemaVersion>('1.0');
  const [features] = useState(FEATURE_FLAGS);
  const isFeatureEnabled = useCallback((flag: keyof typeof FEATURE_FLAGS) => !!features[flag], []);

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

  const setImportedWaypoints = useCallback((wps: Waypoint[] | WaypointV2[]) => {
    // Detect v2 structure based on presence of actions array
    const isV2 = (wps as any)[0]?.actions !== undefined;
    setSchemaVersion(isV2 ? '2.0' : '1.0');
    setWaypoints(wps as Waypoint[]);
    setStats({ waypointCount: wps.length, areaSqm: 0, estimatedTimeSec: 0 });
  }, []);

  return {
    config, zones, waypoints, stats,
    schemaVersion,
    features,
    isFeatureEnabled,
    addZone, removeZone, updateConfig, clearAll, updateWaypoint, removeWaypoint, setImportedWaypoints,
  };
}
