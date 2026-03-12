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
  direction: 0, cameraAngle: -90, waypointOrientationMode: 'manual', travelAxis: 'EW',
  photoCapture: true, terrainAware: false, droneModel: 'DJI Mini 4 Pro',
};

const NON_DESTRUCTIVE_CONFIG_KEYS = new Set<keyof MissionConfig>([
  'cameraAngle',
  'droneModel',
  'terrainAware',
  'waypointOrientationMode',
  'waypointOrientationPoiId',
]);

function calcPathStats(waypoints: Waypoint[], speed: number): Pick<MissionStats, 'waypointCount' | 'estimatedTimeSec' | 'totalDistanceM'> {
  let totalDistanceM = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    const dx = (curr.lng - prev.lng) * 111320 * Math.cos(((curr.lat + prev.lat) * Math.PI) / 360);
    const dy = (curr.lat - prev.lat) * 111320;
    totalDistanceM += Math.sqrt(dx * dx + dy * dy);
  }

  return {
    waypointCount: waypoints.length,
    totalDistanceM,
    estimatedTimeSec: speed > 0 ? totalDistanceM / speed : 0,
  };
}

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
      const wps = generateGrid(zone.points, cfg).map(wp => {
        const nextIndex = globalIdx++;
        return {
          ...wp,
          id: `${zone.id}-wp-${nextIndex}`,
          index: nextIndex,
        };
      });
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
      const partialKeys = Object.keys(partial) as (keyof MissionConfig)[];

      if (partialKeys.length > 0 && partialKeys.every(key => NON_DESTRUCTIVE_CONFIG_KEYS.has(key))) {
        return {
          ...prev,
          config: newConfig,
        };
      }

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
    saveState(prev => {
      const newWaypoints = prev.waypoints.map(wp => (wp.id === id ? { ...wp, ...changes } : wp));
      const allPoints = prev.zones.flatMap(z => z.points);
      const newStats = calcStats(newWaypoints, allPoints.length ? allPoints : [], prev.config);
      return {
        ...prev,
        waypoints: newWaypoints,
        stats: newStats,
      };
    });
  }, [saveState]);

  const removeWaypoint = useCallback((id: string) => {
    saveState(prev => {
      const newWaypoints = prev.waypoints
        .filter(wp => wp.id !== id)
        .map((wp, index) => ({ ...wp, index }));
      const allPoints = prev.zones.flatMap(z => z.points);
      const newStats = calcStats(newWaypoints, allPoints.length ? allPoints : [], prev.config);
      return {
        ...prev,
        waypoints: newWaypoints,
        stats: newStats,
      };
    });
  }, [saveState]);

  const appendWaypoints = useCallback((wps: Waypoint[]) => {
    saveState(prev => {
      const start = prev.waypoints.length;
      const normalized = wps.map((wp, i) => ({ ...wp, id: wp.id || `wp-${start + i}`, index: start + i }));
      const newWaypoints = [...prev.waypoints, ...normalized];
      const pathStats = calcPathStats(newWaypoints, prev.config.speed);
      return {
        ...prev,
        waypoints: newWaypoints,
        stats: { ...prev.stats, ...pathStats },
      };
    });
  }, [saveState]);

  const replaceWaypoints = useCallback((wps: Waypoint[]) => {
    saveState(prev => {
      const reindexed = wps.map((wp, i) => ({ ...wp, index: i }));
      const pathStats = calcPathStats(reindexed, prev.config.speed);
      return {
        ...prev,
        waypoints: reindexed,
        stats: { ...prev.stats, ...pathStats },
      };
    });
  }, [saveState]);

  const setImportedWaypoints = useCallback((wps: Waypoint[] | WaypointV2[]) => {
    const first = wps[0];
    const isV2 = !!first && 'actions' in first;
    saveState(prev => {
      const normalizedWps: Waypoint[] = isV2
        ? (wps as WaypointV2[]).map(wp => ({
            id: wp.id,
            lat: wp.lat,
            lng: wp.lng,
            altitude: wp.altitude,
            index: wp.index,
            action: (wp.actions.some(a => a.type === 'photo') ? 'photo' : 'none') as 'photo' | 'none',
            speed: wp.speed,
            heading: wp.heading,
          }))
        : (wps as Waypoint[]).map(wp => ({
            ...wp,
            speed: wp.speed ?? prev.config.speed,
            heading: wp.heading ?? prev.config.direction,
          }));
      const pathStats = calcPathStats(normalizedWps, prev.config.speed);
      return {
        ...prev,
        schemaVersion: isV2 ? '2.0' : '1.0',
        waypoints: normalizedWps,
        stats: { areaSqm: 0, ...pathStats },
      };
    });
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
