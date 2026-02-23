import { useState, useCallback } from 'react';
import type { MissionConfig, Waypoint, Zone, MissionStats, SchemaVersion, WaypointV2 } from '@/types/mission';
import { generateGrid, calcStats } from '@/lib/gridAlgorithm';

// Feature flags for incremental rollout
const FEATURE_FLAGS = {
  enableV2Schema: true,
  enableSegments: false,
  enableStages: true,
  enableMultiAction: false,
  enablePOI: true,
  enableTerrain: true,
  enableOffline: false,
};

const DEFAULT_CONFIG: MissionConfig = {
  altitude: 80, speed: 8, overlap: 70,
  direction: 0, cameraAngle: -90, travelAxis: 'EW',
  photoCapture: true, terrainAware: false, droneModel: 'DJI Mini 4 Pro',
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

  const appendWaypoints = useCallback((wps: Waypoint[]) => {
    setWaypoints(prev => {
      const start = prev.length;
      const normalized = wps.map((wp, i) => ({ ...wp, id: wp.id || `wp-${start + i}`, index: start + i }));
      const next = [...prev, ...normalized];
      setStats(s => ({ ...s, waypointCount: next.length }));
      return next;
    });
  }, []);

  const replaceWaypoints = useCallback((wps: Waypoint[]) => {
    setWaypoints(wps.map((wp, i) => ({ ...wp, index: i })));
    setStats(s => ({ ...s, waypointCount: wps.length }));
  }, []);

  const setImportedWaypoints = useCallback((wps: Waypoint[] | WaypointV2[]) => {
    const first = wps[0];
    const isV2 = !!first && 'actions' in first;
    setSchemaVersion(isV2 ? '2.0' : '1.0');
    if (isV2) {
      setWaypoints((wps as WaypointV2[]).map(wp => ({
        id: wp.id,
        lat: wp.lat,
        lng: wp.lng,
        altitude: wp.altitude,
        index: wp.index,
        action: wp.actions.some(a => a.type === 'photo') ? 'photo' : 'none',
      })));
    } else {
      setWaypoints(wps as Waypoint[]);
    }
    setStats({ waypointCount: wps.length, areaSqm: 0, estimatedTimeSec: 0 });
  }, []);

  return {
    config, zones, waypoints, stats,
    schemaVersion,
    features,
    isFeatureEnabled,
    addZone, removeZone, updateConfig, clearAll, updateWaypoint, removeWaypoint, setImportedWaypoints,
    appendWaypoints, replaceWaypoints,
  };
}
