import { useRef, useState, useCallback, useEffect } from 'react';
import L from 'leaflet';
import { MapContainer } from '@/components/Map/MapContainer';
import { WaypointLayer } from '@/components/Map/WaypointLayer';
import { FlightPathLayer } from '@/components/Map/FlightPathLayer';
import { ZoneLayer } from '@/components/Map/ZoneLayer';
import { Toolbar } from '@/components/Toolbar/Toolbar';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { GeocoderSearch } from '@/components/Geocoder/GeocoderSearch';
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
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#0d0f14' }}>
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
        />

        <GeocoderSearch map={mapRef.current} />
        
        <div style={{
          position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, background: '#161922cc', border: '1px solid #2a2f45',
          borderRadius: 20, padding: '6px 20px', color: '#e8eaf0', fontSize: 12,
          backdropFilter: 'blur(8px)', display: 'flex', gap: 16, alignItems: 'center',
        }}>
          <span>⬡ {mission.stats.waypointCount} waypoints</span>
          <span style={{ color: '#2a2f45' }}>|</span>
          <span>◻ {formatArea(mission.stats.areaSqm)}</span>
          <span style={{ color: '#2a2f45' }}>|</span>
          <span>⏱ {formatTime(mission.stats.estimatedTimeSec)}</span>
          {mission.zones.length === 0 && (
            <>
              <span style={{ color: '#2a2f45' }}>|</span>
              <span style={{ color: '#6b7280' }}>Draw a shape to generate waypoints</span>
            </>
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
