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
import type { Zone, Waypoint } from '@/types/mission';
import { exportKmz } from '@/lib/kmzGenerator';
import { exportGpx } from '@/lib/gpxGenerator';
import { exportJson } from '@/lib/jsonExporter';

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
  const mission = useMission();

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

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      width: '100vw', 
      background: 'var(--bg-base)',
      fontFamily: 'var(--font-sans)',
    }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer mapRef={mapRef} onMapReady={() => setMapReady(true)} />
        {mapReady && (
          <>
            <ZoneLayer map={mapRef.current} zones={mission.zones} />
            <WaypointLayer map={mapRef.current} waypoints={mission.waypoints} />
            <FlightPathLayer map={mapRef.current} waypoints={mission.waypoints} />
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
      />
    </div>
  );
}
