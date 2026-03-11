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
import { useIsMobile } from '@/hooks/useMediaQuery';
import type { Zone, Waypoint, LatLng, WaypointSeed } from '@/types/mission';
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
  const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>(null);
  const mission = useMission();
  const poiManager = usePOIManager();
  const isMobile = useIsMobile();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
  const [poiLocation, setPoiLocation] = useState<LatLng | null>(null);
  const [isPickingPoiLocation, setIsPickingPoiLocation] = useState(false);
  const [importStatus, setImportStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  // Auto-clear import status after 4 seconds
  useEffect(() => {
    if (!importStatus) return;
    const t = setTimeout(() => setImportStatus(null), 4000);
    return () => clearTimeout(t);
  }, [importStatus]);

  // Close mobile sidebar when a waypoint is selected (auto-switch to WPTS tab happens in Sidebar)
  useEffect(() => {
    if (selectedWaypointId && isMobile) {
      setMobileSidebarOpen(true);
    }
  }, [selectedWaypointId, isMobile]);

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
    exportGpx(mission.waypoints, mission.config);
  }, [mission.waypoints, mission.config]);

  const handleExportJson = useCallback(() => {
    exportJson(mission.waypoints, mission.config, mission.stats, mission.zones);
  }, [mission.waypoints, mission.config, mission.stats, mission.zones]);

  const handleImportKmz = useCallback(async (file: File) => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = await JSZip.loadAsync(file);
      // Prefer the waylines.wpml file (DJI WPML format), fall back to any KML
      const wpmlFile = zip.file('wpmz/waylines.wpml') ?? zip.file(/\.kml$|\.wpml$/i)[0];
      if (!wpmlFile) {
        setImportStatus({ ok: false, msg: 'No KML/WPML file found in archive' });
        return;
      }
      const kmlText = await wpmlFile.async('string');
      const parser = new DOMParser();
      const doc = parser.parseFromString(kmlText, 'text/xml');

      // Check for XML parse errors
      if (doc.querySelector('parsererror')) {
        setImportStatus({ ok: false, msg: 'Failed to parse KML/WPML XML' });
        return;
      }

      const placemarks = doc.querySelectorAll('Placemark');
      const importedWps: Waypoint[] = [];

      placemarks.forEach((pm, i) => {
        const coords = pm.querySelector('coordinates')?.textContent?.trim().split(',');
        if (!coords || coords.length < 2) return;

        // Prefer WPML-specific altitude tags over coordinate altitude
        const executeHeightEl = pm.querySelector('executeHeight');
        const heightEl = pm.querySelector('height');
        const coordAlt = coords[2] ? parseFloat(coords[2]) : undefined;
        const wpmlAlt = executeHeightEl?.textContent
          ? parseFloat(executeHeightEl.textContent)
          : heightEl?.textContent
            ? parseFloat(heightEl.textContent)
            : undefined;
        const altitude = (wpmlAlt !== undefined && isFinite(wpmlAlt) && wpmlAlt > 0)
          ? wpmlAlt
          : (coordAlt !== undefined && isFinite(coordAlt) && coordAlt > 0)
            ? coordAlt
            : mission.config.altitude;

        // Extract per-waypoint speed if present
        const speedEl = pm.querySelector('waypointSpeed');
        const speed = speedEl?.textContent ? parseFloat(speedEl.textContent) : mission.config.speed;

        // Extract heading if present
        const headingEl = pm.querySelector('waypointHeadingAngle');
        const heading = headingEl?.textContent ? parseFloat(headingEl.textContent) : mission.config.direction;

        // Determine action from actionGroup
        const actionFuncEl = pm.querySelector('actionActuatorFunc');
        const action: 'photo' | 'none' = actionFuncEl?.textContent === 'takePhoto' ? 'photo' : 'none';

        importedWps.push({
          id: `wp-imported-${i}`,
          lat: parseFloat(coords[1]),
          lng: parseFloat(coords[0]),
          altitude,
          index: i,
          action,
          speed: isFinite(speed) ? speed : mission.config.speed,
          heading: isFinite(heading) ? heading : mission.config.direction,
        });
      });

      if (importedWps.length === 0) {
        setImportStatus({ ok: false, msg: 'No valid waypoints found in file' });
        return;
      }

      mission.setImportedWaypoints(importedWps);
      setImportStatus({ ok: true, msg: `Imported ${importedWps.length} waypoints` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setImportStatus({ ok: false, msg: `Import failed: ${msg}` });
    }
  }, [mission.config.altitude, mission.config.direction, mission.config.speed, mission.setImportedWaypoints]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        mission.undo();
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        mission.redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mission.undo, mission.redo]);

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

  useEffect(() => {
    if (!mapRef.current || !isPickingPoiLocation) return;
    const map = mapRef.current;
    const pick = (e: L.LeafletMouseEvent) => {
      setPoiLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
      setIsPickingPoiLocation(false);
    };
    map.once('click', pick);
    return () => {
      map.off('click', pick);
    };
  }, [isPickingPoiLocation, mapReady]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const clearSelection = () => setSelectedWaypointId(null);
    map.on('click', clearSelection);
    return () => {
      map.off('click', clearSelection);
    };
  }, [mapReady]);

  useEffect(() => {
    if (!selectedWaypointId || !mapRef.current) return;
    const wp = mission.waypoints.find(item => item.id === selectedWaypointId);
    if (!wp) return;
    mapRef.current.panTo([wp.lat, wp.lng], { animate: true, duration: 0.25 });
  }, [selectedWaypointId, mission.waypoints]);

  useEffect(() => {
    if (!selectedWaypointId) return;
    if (!mission.waypoints.some(wp => wp.id === selectedWaypointId)) {
      setSelectedWaypointId(null);
    }
  }, [selectedWaypointId, mission.waypoints]);

  const toWaypoints = useCallback((points: WaypointSeed[]): Waypoint[] => {
    return points.map((p, i) => ({
      id: `wp-extra-${Date.now()}-${i}`,
      lat: p.lat,
      lng: p.lng,
      altitude: p.altitude ?? mission.config.altitude,
      index: i,
      action: p.action ?? 'photo',
      speed: p.speed ?? mission.config.speed,
      heading: p.heading ?? mission.config.direction,
    }));
  }, [mission.config.altitude, mission.config.direction, mission.config.speed]);

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
      speed: wp.speed,
      heading: wp.heading,
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

  const sidebarProps = {
    config: mission.config,
    onConfigChange: mission.updateConfig,
    waypoints: mission.waypoints,
    stats: mission.stats,
    onUpdateWaypoint: mission.updateWaypoint,
    onRemoveWaypoint: mission.removeWaypoint,
    onImportKmz: handleImportKmz,
    onExportKmz: handleExportKmz,
    onExportGpx: handleExportGpx,
    onExportJson: handleExportJson,
    mapStyles: MAP_STYLES,
    currentMapStyleId: mapStyleId,
    onMapStyleChange: setMapStyleId,
    selectedWaypointId,
    onSelectWaypoint: setSelectedWaypointId,
    poiManager,
    layerVisibility,
    onLayerVisibilityChange: (layer: keyof LayerVisibilityConfig) =>
      setLayerVisibility(prev => ({ ...prev, [layer]: !prev[layer] })),
    onGenerateVideoWaypoints: (points: WaypointSeed[]) => mission.appendWaypoints(toWaypoints(points)),
    onSetVideoCenter: () => {
      setIsPickingPoiLocation(false);
      setIsPickingVideoCenter(true);
    },
    onRequestMapPoiLocation: () => {
      setIsPickingVideoCenter(false);
      setIsPickingPoiLocation(true);
    },
    mapPoiLocation: poiLocation,
    isPickingMapPoiLocation: isPickingPoiLocation,
    onUseMapCenterForVideo: () => {
      if (mapCenter) setVideoCenter(mapCenter);
    },
    videoCenter,
    missionV2,
    mapCenter,
  };

  // ── Status bar content ──────────────────────────────────────────────────────
  const statusBar = (
    <div style={{
      display: 'flex',
      gap: isMobile ? 12 : 24,
      alignItems: 'center',
      fontFamily: 'var(--font-mono)',
      fontSize: isMobile ? '11px' : '12px',
      flex: 1,
      minWidth: 0,
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span style={{ color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>WP</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{mission.stats.waypointCount}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span style={{ color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AREA</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatArea(mission.stats.areaSqm)}</span>
      </div>
      {!isMobile && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TIME</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{formatTime(mission.stats.estimatedTimeSec)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ALT</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{mission.config.altitude}m</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SPD</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{mission.config.speed}m/s</span>
          </div>
        </>
      )}
      {mission.zones.length === 0 && !isMobile && (
        <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 11 }}>
          Draw polygon or rectangle to generate flight path
        </div>
      )}
    </div>
  );

  // ── Map area (shared between mobile and desktop) ────────────────────────────
  const mapArea = (
    <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
      <MapContainer
        mapRef={mapRef}
        onMapReady={() => setMapReady(true)}
        mapStyleId={mapStyleId}
      />
      {mapReady && (
        <>
          {layerVisibility.zones && <ZoneLayer map={mapRef.current} zones={mission.zones} />}
          {layerVisibility.waypoints && (
            <WaypointLayer
              map={mapRef.current}
              waypoints={mission.waypoints}
              selectedWaypointId={selectedWaypointId}
              defaultSpeed={mission.config.speed}
              defaultHeading={mission.config.direction}
              onWaypointChange={mission.updateWaypoint}
              onSelectWaypoint={setSelectedWaypointId}
            />
          )}
          {layerVisibility.flightPath && <FlightPathLayer map={mapRef.current} waypoints={mission.waypoints} />}
          {layerVisibility.pois && <POILayer map={mapRef.current} pois={poiManager.pois} />}
          {layerVisibility.paths && (
            <ManualPathLayer
              map={mapRef.current}
              paths={mission.waypoints.length > 1 ? [mission.waypoints.map(w => ({ lat: w.lat, lng: w.lng }))] : []}
            />
          )}
          {layerVisibility.heatmaps && <HeatmapLayer map={mapRef.current} pois={poiManager.pois} />}
        </>
      )}

      <Toolbar
        drawMode={drawMode}
        setMode={setMode}
        onClear={mission.clearAll}
        waypointCount={mission.waypoints.length}
        map={mapRef.current}
        onUndo={mission.undo}
        onRedo={mission.redo}
        canUndo={mission.canUndo}
        canRedo={mission.canRedo}
        isMobile={isMobile}
      />

      {/* Import status toast */}
      {importStatus && (
        <div style={{
          position: 'absolute',
          top: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2000,
          background: importStatus.ok ? 'var(--success-dim)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${importStatus.ok ? 'var(--success)' : '#ef4444'}`,
          color: importStatus.ok ? 'var(--success)' : '#ef4444',
          padding: '10px 20px',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          letterSpacing: '0.04em',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}>
          {importStatus.ok ? '✓' : '✗'} {importStatus.msg}
        </div>
      )}
    </div>
  );

  // ── MOBILE layout ───────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        width: '100vw',
        background: 'var(--bg-base)',
        fontFamily: 'var(--font-sans)',
        overflow: 'hidden',
      }}>
        {/* Map fills remaining space */}
        {mapArea}

        {/* Bottom status + panel toggle */}
        <div style={{
          position: 'relative',
          zIndex: 1000,
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border)',
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}>
          {statusBar}
          <button
            onClick={() => setMobileSidebarOpen(o => !o)}
            style={{
              flexShrink: 0,
              padding: '8px 14px',
              background: mobileSidebarOpen ? 'var(--accent)' : 'var(--bg-card)',
              border: `1px solid ${mobileSidebarOpen ? 'var(--accent)' : 'var(--border)'}`,
              color: mobileSidebarOpen ? '#fff' : 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              transition: 'all 0.15s',
            }}
          >
            {mobileSidebarOpen ? '✕ CLOSE' : '☰ MENU'}
          </button>
        </div>

        {/* Mobile sidebar: slide-up overlay */}
        {mobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setMobileSidebarOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1500,
                background: 'rgba(0,0,0,0.5)',
              }}
            />
            {/* Drawer */}
            <div style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1600,
              height: '75dvh',
              background: 'var(--bg-surface)',
              borderTop: '2px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}>
              {/* Drag handle */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                padding: '8px 0 4px',
                flexShrink: 0,
              }}>
                <div style={{
                  width: 40,
                  height: 4,
                  background: 'var(--border-strong)',
                  borderRadius: 2,
                }} />
              </div>
              <Sidebar {...sidebarProps} isMobile />
            </div>
          </>
        )}
      </div>
    );
  }

  // ── DESKTOP layout ──────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      background: 'var(--bg-base)',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {mapArea}

        {/* Bottom status bar */}
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
          alignItems: 'center',
        }}>
          {statusBar}
        </div>
      </div>

      <Sidebar {...sidebarProps} isMobile={false} />
    </div>
  );
}
