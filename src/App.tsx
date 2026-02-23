import { useRef, useState, useCallback, useEffect } from 'react';
import L from 'leaflet';
import { MapContainer } from '@/components/Map/MapContainer';
import { WaypointLayer } from '@/components/Map/WaypointLayer';
import { FlightPathLayer } from '@/components/Map/FlightPathLayer';
import { ZoneLayer } from '@/components/Map/ZoneLayer';
import { Toolbar } from '@/components/Toolbar/Toolbar';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { useMission } from '@/hooks/useMission';
import { useMapDrawing } from '@/hooks/useMapDrawing';
import type { Zone, Waypoint, LatLng } from '@/types/mission';
import { exportKmz } from '@/lib/kmzGenerator';
import { exportGpx } from '@/lib/gpxGenerator';
import { exportJson } from '@/lib/jsonExporter';
import { MAP_STYLES } from '@/lib/mapStyles';
import { usePOIManager } from '@/hooks/usePOIManager';
import { POILayer } from '@/components/Map/POILayer';
import { ManualPathLayer } from '@/components/Map/ManualPathLayer';
import { HeatmapLayer } from '@/components/Map/HeatmapLayer';
import type { LayerVisibilityConfig, MissionV2, WaypointV2 } from '@/types/mission';

function formatTime(sec: number) {
  if (sec < 60) return `${Math.round(sec)}s`;
  return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
}

function formatArea(sqm: number) {
  if (sqm >= 10000) return `${(sqm / 10000).toFixed(2)} ha`;
  return `${Math.round(sqm)} m²`;
}

export default function App() {
  const mapRef = useRef<L.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapStyleId, setMapStyleId] = useState('carto-dark');
  const mission = useMission();
  const poiManager = usePOIManager();
  
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibilityConfig>({
    zones: true,
    waypoints: true,
    paths: true,
    pois: true,
    heatmaps: true,
    flightPath: true,
  });

  const [mapCenter, setMapCenter] = useState<LatLng | undefined>(undefined);
  const [videoCenter, setVideoCenter] = useState<LatLng | null>(null);
  const [isPickingVideoCenter, setIsPickingVideoCenter] = useState(false);

  const handleZoneComplete = useCallback((zone: Zone) => {
    mission.addZone(zone);
  }, [mission.addZone]);

  const { drawMode, setMode } = useMapDrawing(
    mapReady ? mapRef.current : null,
    handleZoneComplete
  );

  const handleExportKmz = useCallback(() => {
    exportKmz(mission.waypoints, mission.config);
  }, [mission.waypoints, mission.config]);

  const handleExportGpx = useCallback(() => {
    exportGpx(mission.waypoints);
  }, [mission.waypoints]);

  const handleExportJson = useCallback(() => {
    exportJson(mission.waypoints, mission.config, mission.stats, mission.zones);
  }, [mission.waypoints, mission.config, mission.stats, mission.zones]);

  const handleImportKmz = useCallback(async (file: File) => {
    const JSZip = (await import('jszip')).default;
    const zip = await JSZip.loadAsync(file);
    const kmlFile = zip.file(/\.kml$|\.wpml$/i)[0];
    if (!kmlFile) return;
    const kmlText = await kmlFile.async('string');
    const parser = new DOMParser();
    const doc = parser.parseFromString(kmlText, 'text/xml');
    const placemarks = doc.querySelectorAll('Placemark');
    const importedWps: Waypoint[] = [];
    placemarks.forEach((pm, i) => {
      const coords = pm.querySelector('coordinates')?.textContent?.trim().split(',');
      if (coords && coords.length >= 2) {
        importedWps.push({
          id: `wp-imported-${i}`,
          lat: parseFloat(coords[1]),
          lng: parseFloat(coords[0]),
          altitude: coords[2] ? parseFloat(coords[2]) : mission.config.altitude,
          index: i,
          action: 'photo',
        });
      }
    });
    if (importedWps.length) {
      mission.setImportedWaypoints(importedWps);
    }
  }, [mission.config.altitude, mission.setImportedWaypoints]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (mission.zones.length > 0) {
          mission.removeZone(mission.zones[mission.zones.length - 1].id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mission.zones, mission.removeZone]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const syncCenter = () => {
      const c = map.getCenter();
      setMapCenter({ lat: c.lat, lng: c.lng });
    };
    syncCenter();
    map.on('moveend', syncCenter);
    return () => {
      map.off('moveend', syncCenter);
    };
  }, [mapReady]);

  useEffect(() => {
    if (!mapRef.current || !isPickingVideoCenter) return;
    const map = mapRef.current;
    const pick = (e: L.LeafletMouseEvent) => {
      setVideoCenter({ lat: e.latlng.lat, lng: e.latlng.lng });
      setIsPickingVideoCenter(false);
    };
    map.once('click', pick);
    return () => {
      map.off('click', pick);
    };
  }, [isPickingVideoCenter, mapReady]);

  const toWaypoints = useCallback((points: LatLng[]): Waypoint[] => {
    return points.map((p, i) => ({
      id: `wp-extra-${Date.now()}-${i}`,
      lat: p.lat,
      lng: p.lng,
      altitude: mission.config.altitude,
      index: i,
      action: 'photo',
    }));
  }, [mission.config.altitude]);

  const missionV2: MissionV2 = {
    id: 'mission-live',
    name: 'Live Mission',
    schemaVersion: '2.0',
    segments: [],
    stages: [],
    waypoints: mission.waypoints.map((wp): WaypointV2 => ({
      id: wp.id,
      lat: wp.lat,
      lng: wp.lng,
      altitude: wp.altitude,
      index: wp.index,
      actions: [{ id: `action-${wp.id}`, type: wp.action === 'photo' ? 'photo' : 'custom' }],
    })),
    config: {
      ...mission.config,
      schemaVersion: '2.0',
      mapStyleId,
      terrainConfig: { mode: 'absolute', elevationSource: 'openElevation', offsetMeters: 0 },
      layerVisibility,
    },
    stats: mission.stats,
    pois: poiManager.pois,
    poiOverlays: [],
    obstacles: [],
    offlinePacks: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      width: '100vw', 
      background: 'var(--bg-base)',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer 
          mapRef={mapRef} 
          onMapReady={() => setMapReady(true)}
          mapStyleId={mapStyleId}
        />
        {mapReady && (
          <>
            {layerVisibility.zones && <ZoneLayer map={mapRef.current} zones={mission.zones} />}
            {layerVisibility.waypoints && <WaypointLayer map={mapRef.current} waypoints={mission.waypoints} />}
            {layerVisibility.flightPath && <FlightPathLayer map={mapRef.current} waypoints={mission.waypoints} />}
            {layerVisibility.pois && <POILayer map={mapRef.current} pois={poiManager.pois} />}
            {layerVisibility.paths && <ManualPathLayer map={mapRef.current} paths={mission.waypoints.length > 1 ? [mission.waypoints.map(w => ({ lat: w.lat, lng: w.lng }))] : []} />}
            {layerVisibility.heatmaps && <HeatmapLayer map={mapRef.current} pois={poiManager.pois} />}
          </>
        )}
        <Toolbar
          drawMode={drawMode}
          setMode={setMode}
          onClear={mission.clearAll}
          waypointCount={mission.waypoints.length}
          map={mapRef.current}
        />
        
        <div style={{
          position: 'absolute', 
          bottom: 0, 
          left: 0,
          right: 0,
          zIndex: 1000, 
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border)',
          padding: '8px 16px',
          display: 'flex',
          gap: 24,
          alignItems: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>WP</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{mission.stats.waypointCount}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AREA</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatArea(mission.stats.areaSqm)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TIME</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatTime(mission.stats.estimatedTimeSec)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ALT</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{mission.config.altitude}m</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SPD</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{mission.config.speed}m/s</span>
          </div>
          {mission.zones.length === 0 && (
            <div style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
              Draw polygon or rectangle to generate flight path
            </div>
          )}
        </div>
      </div>

      <Sidebar
        config={mission.config}
        onConfigChange={mission.updateConfig}
        waypoints={mission.waypoints}
        stats={mission.stats}
        onUpdateWaypoint={mission.updateWaypoint}
        onRemoveWaypoint={mission.removeWaypoint}
        onImportKmz={handleImportKmz}
        onExportKmz={handleExportKmz}
        onExportGpx={handleExportGpx}
        onExportJson={handleExportJson}
        mapStyles={MAP_STYLES}
        currentMapStyleId={mapStyleId}
        onMapStyleChange={setMapStyleId}
        poiManager={poiManager}
        layerVisibility={layerVisibility}
        onLayerVisibilityChange={(layer) => setLayerVisibility(prev => ({...prev, [layer]: !prev[layer]}))}
        onGenerateVideoWaypoints={(points) => mission.appendWaypoints(toWaypoints(points))}
        onSetVideoCenter={() => setIsPickingVideoCenter(true)}
        onUseMapCenterForVideo={() => {
          if (mapCenter) setVideoCenter(mapCenter);
        }}
        videoCenter={videoCenter}
        missionV2={missionV2}
        mapCenter={mapCenter}
      />
    </div>
  );
}
