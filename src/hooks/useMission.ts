import { useState, useCallback, useRef } from 'react';
import type { MissionConfig, Waypoint, Zone, MissionStats, SchemaVersion, WaypointV2 } from '@/types/mission';
import { generateGrid, calcStats } from '@/lib/gridAlgorithm';

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

interface MissionState {
  config: MissionConfig;
  zones: Zone[];
  waypoints: Waypoint[];
  stats: MissionStats;
  schemaVersion: SchemaVersion;
}

const INITIAL_STATE: MissionState = {
  config: DEFAULT_CONFIG,
  zones: [],
  waypoints: [],
  stats: { waypointCount: 0, areaSqm: 0, estimatedTimeSec: 0 },
  schemaVersion: '1.0',
};

export function useMission() {
  const [history, setHistory] = useState<{ past: MissionState[]; present: MissionState; future: MissionState[] }>({
    past: [],
    present: INITIAL_STATE,
    future: [],
  });
  const [features] = useState(FEATURE_FLAGS);
  const isUndoing = useRef(false);

  const isFeatureEnabled = useCallback((flag: keyof typeof FEATURE_FLAGS) => !!features[flag], []);

  const regenerateWaypoints = useCallback((zoneList: Zone[], cfg: MissionConfig): { waypoints: Waypoint[]; stats: MissionStats } => {
    const allWaypoints: Waypoint[] = [];
    let globalIdx = 0;
    for (const zone of zoneList) {
      const wps = generateGrid(zone.points, cfg).map(wp => ({ ...wp, index: globalIdx++ }));
      allWaypoints.push(...wps);
    }
    const allPoints = zoneList.flatMap(z => z.points);
    const newStats = calcStats(allWaypoints, allPoints.length ? allPoints : [], cfg);
    return { waypoints: allWaypoints, stats: newStats };
  }, []);

  const saveState = useCallback((updater: MissionState | ((prev: MissionState) => MissionState)) => {
    if (isUndoing.current) return;
    setHistory(prev => {
      const newState = typeof updater === 'function' 
        ? (updater as (prev: MissionState) => MissionState)(prev.present)
        : updater;
      return {
        past: [prev.present, ...prev.past].slice(0, 50),
        present: newState,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory(prev => {
      if (prev.past.length === 0) return prev;
      const [newPresent, ...newPast] = prev.past;
      isUndoing.current = true;
      setTimeout(() => { isUndoing.current = false; }, 0);
      return {
        past: newPast,
        present: newPresent,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory(prev => {
      if (prev.future.length === 0) return prev;
      const [newPresent, ...newFuture] = prev.future;
      isUndoing.current = true;
      setTimeout(() => { isUndoing.current = false; }, 0);
      return {
        past: [prev.present, ...prev.past],
        present: newPresent,
        future: newFuture,
      };
    });
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const { config, zones, waypoints, stats, schemaVersion } = history.present;

  const addZone = useCallback((zone: Zone) => {
    saveState(prev => {
      const newZones = [...prev.zones, zone];
      const { waypoints: newWaypoints, stats: newStats } = regenerateWaypoints(newZones, prev.config);
      return {
        ...prev,
        zones: newZones,
        waypoints: newWaypoints,
        stats: newStats,
      };
    });
  }, [saveState, regenerateWaypoints]);

  const removeZone = useCallback((id: string) => {
    saveState(prev => {
      const newZones = prev.zones.filter(z => z.id !== id);
      const { waypoints: newWaypoints, stats: newStats } = regenerateWaypoints(newZones, prev.config);
      return {
        ...prev,
        zones: newZones,
        waypoints: newWaypoints,
        stats: newStats,
      };
    });
  }, [saveState, regenerateWaypoints]);

  const updateConfig = useCallback((partial: Partial<MissionConfig>) => {
    saveState(prev => {
      const newConfig = { ...prev.config, ...partial };
      const { waypoints: newWaypoints, stats: newStats } = regenerateWaypoints(prev.zones, newConfig);
      return {
        ...prev,
        config: newConfig,
        waypoints: newWaypoints,
        stats: newStats,
      };
    });
  }, [saveState, regenerateWaypoints]);

  const clearAll = useCallback(() => {
    saveState({
      ...INITIAL_STATE,
      config: history.present.config,
    });
  }, [saveState, history.present.config]);

  const updateWaypoint = useCallback((id: string, changes: Partial<Waypoint>) => {
    saveState(prev => ({
      ...prev,
      waypoints: prev.waypoints.map(wp => wp.id === id ? { ...wp, ...changes } : wp),
    }));
  }, [saveState]);

  const removeWaypoint = useCallback((id: string) => {
    saveState(prev => ({
      ...prev,
      waypoints: prev.waypoints.filter(wp => wp.id !== id),
    }));
  }, [saveState]);

  const appendWaypoints = useCallback((wps: Waypoint[]) => {
    saveState(prev => {
      const start = prev.waypoints.length;
      const normalized = wps.map((wp, i) => ({ ...wp, id: wp.id || `wp-${start + i}`, index: start + i }));
      const newWaypoints = [...prev.waypoints, ...normalized];
      return {
        ...prev,
        waypoints: newWaypoints,
        stats: { ...prev.stats, waypointCount: newWaypoints.length },
      };
    });
  }, [saveState]);

  const replaceWaypoints = useCallback((wps: Waypoint[]) => {
    saveState(prev => ({
      ...prev,
      waypoints: wps.map((wp, i) => ({ ...wp, index: i })),
      stats: { ...prev.stats, waypointCount: wps.length },
    }));
  }, [saveState]);

  const setImportedWaypoints = useCallback((wps: Waypoint[] | WaypointV2[]) => {
    const first = wps[0];
    const isV2 = !!first && 'actions' in first;
    saveState(prev => ({
      ...prev,
      schemaVersion: isV2 ? '2.0' : '1.0',
      waypoints: isV2 
        ? (wps as WaypointV2[]).map(wp => ({
            id: wp.id,
            lat: wp.lat,
            lng: wp.lng,
            altitude: wp.altitude,
            index: wp.index,
            action: wp.actions.some(a => a.type === 'photo') ? 'photo' : 'none',
          }))
        : wps as Waypoint[],
      stats: { waypointCount: wps.length, areaSqm: 0, estimatedTimeSec: 0 },
    }));
  }, [saveState]);

  return {
    config, zones, waypoints, stats,
    schemaVersion,
    features,
    isFeatureEnabled,
    addZone, removeZone, updateConfig, clearAll, updateWaypoint, removeWaypoint, setImportedWaypoints,
    appendWaypoints, replaceWaypoints,
    undo, redo, canUndo, canRedo,
  };
}
