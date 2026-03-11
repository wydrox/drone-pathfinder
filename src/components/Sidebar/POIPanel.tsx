import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { POI, LatLng, WaypointSeed } from '@/types/mission';
import {
  calculateCoverageScore,
  generateOrbitRings,
  generateStackedOrbitWaypoints,
} from '@/lib/poiPhotogrammetry';

interface Props {
  pois: POI[];
  onAddPOI: (poi: Omit<POI, 'id'>) => POI;
  onRemovePOI: (id: string) => void;
  onGenerateWaypoints?: (waypoints: WaypointSeed[]) => void;
  onRequestMapPoiLocation?: () => void;
  mapPoiLocation?: LatLng | null;
  isPickingMapPoiLocation?: boolean;
}

export function POIPanel({
  pois,
  onAddPOI,
  onRemovePOI,
  onGenerateWaypoints,
  onRequestMapPoiLocation,
  mapPoiLocation,
  isPickingMapPoiLocation = false,
}: Props) {
  const [name, setName] = useState('POI');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [ringCount, setRingCount] = useState(3);
  const [baseRadius, setBaseRadius] = useState(12);
  const [overlap, setOverlap] = useState(75);
  const [altitude, setAltitude] = useState(40);
  const [photoInterval, setPhotoInterval] = useState(4);
  const [speed, setSpeed] = useState(5);
  const [levelCount, setLevelCount] = useState(3);
  const [levelStep, setLevelStep] = useState(10);

  useEffect(() => {
    if (!mapPoiLocation) return;
    setLat(mapPoiLocation.lat.toFixed(6));
    setLng(mapPoiLocation.lng.toFixed(6));
  }, [mapPoiLocation]);

  const addPoi = () => {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return;
    onAddPOI({
      name,
      lat: latNum,
      lng: lngNum,
      altitude,
      category: 'target',
      radiusMeters: baseRadius,
    });
    setName('POI');
  };

  const buildBands = () => {
    const bands: { altitudeMeters: number; overlapPercent: number }[] = [];
    const clampedLevels = Math.max(1, Math.min(9, levelCount));
    const centerIdx = Math.floor(clampedLevels / 2);

    for (let i = 0; i < clampedLevels; i++) {
      const delta = (i - centerIdx) * levelStep;
      bands.push({
        altitudeMeters: Math.max(10, altitude + delta),
        overlapPercent: overlap,
      });
    }

    return bands;
  };

  const generatePhotogrammetry = (poi: POI) => {
    const waypoints = generateStackedOrbitWaypoints(
      poi,
      {
        ringCount,
        baseRadiusMeters: baseRadius,
        overlapPercent: overlap,
        altitudeMeters: altitude,
        photoIntervalMeters: photoInterval,
      },
      {
        bands: buildBands(),
      },
      speed,
    );

    onGenerateWaypoints?.(waypoints);
  };

  const coverage = (poi: POI) => {
    const rings = generateOrbitRings(poi, {
      ringCount,
      baseRadiusMeters: baseRadius,
      overlapPercent: overlap,
      altitudeMeters: altitude,
      photoIntervalMeters: photoInterval,
    });
    return calculateCoverageScore(poi, rings.flat(), 84);
  };

  return (
    <div style={{ padding: '12px 0' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#e8eaf0', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
        Points of Interest
        <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 400 }}>{pois.length} POIs</span>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 10, marginBottom: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="POI name" style={inputStyle} />
          <button onClick={() => onRequestMapPoiLocation?.()} style={buttonStyle}>
            {isPickingMapPoiLocation ? 'Click on map...' : 'Add POI'}
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <input value={lat} onChange={e => setLat(e.target.value)} placeholder="lat" style={inputStyle} />
          <input value={lng} onChange={e => setLng(e.target.value)} placeholder="lng" style={inputStyle} />
        </div>
        <button
          onClick={addPoi}
          style={{ ...buttonStyle, width: '100%', opacity: Number.isFinite(Number(lat)) && Number.isFinite(Number(lng)) ? 1 : 0.5 }}
          disabled={!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))}
        >
          Save POI
        </button>
      </div>

      {pois.length === 0 ? (
        <div style={{ color: '#6b7280', fontSize: 12, textAlign: 'center', padding: '20px 0' }}>No POIs added yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pois.map(poi => {
            const c = coverage(poi);
            const isOpen = !!expanded[poi.id];
            return (
              <div key={poi.id} style={{ background: '#1e2130', borderRadius: 8, padding: '10px 12px', border: '1px solid #2a2f45' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#e8eaf0' }}>{poi.name}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{poi.lat.toFixed(5)}, {poi.lng.toFixed(5)}</div>
                    <div style={{ fontSize: 11, color: c.score >= 80 ? '#22c55e' : '#f59e0b' }}>Coverage {Math.round(c.score)}%</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setExpanded(prev => ({ ...prev, [poi.id]: !prev[poi.id] }))} style={miniButtonStyle}>{isOpen ? 'Hide' : '360'}</button>
                    <button onClick={() => onRemovePOI(poi.id)} style={miniButtonStyle}>✕</button>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>360 Model (Multi-level, camera locked on POI)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <label style={labelStyle}>Rings <input type="number" min={1} max={8} value={ringCount} onChange={e => setRingCount(Number(e.target.value))} style={inputStyle} /></label>
                      <label style={labelStyle}>Radius <input type="number" min={4} max={80} value={baseRadius} onChange={e => setBaseRadius(Number(e.target.value))} style={inputStyle} /></label>
                      <label style={labelStyle}>Overlap <input type="number" min={50} max={90} value={overlap} onChange={e => setOverlap(Number(e.target.value))} style={inputStyle} /></label>
                      <label style={labelStyle}>Base Alt <input type="number" min={10} max={300} value={altitude} onChange={e => setAltitude(Number(e.target.value))} style={inputStyle} /></label>
                      <label style={labelStyle}>Alt Levels <input type="number" min={1} max={9} value={levelCount} onChange={e => setLevelCount(Number(e.target.value))} style={inputStyle} /></label>
                      <label style={labelStyle}>Alt Step <input type="number" min={2} max={50} value={levelStep} onChange={e => setLevelStep(Number(e.target.value))} style={inputStyle} /></label>
                      <label style={labelStyle}>Interval <input type="number" min={2} max={20} value={photoInterval} onChange={e => setPhotoInterval(Number(e.target.value))} style={inputStyle} /></label>
                      <label style={labelStyle}>Speed <input type="number" min={1} max={15} value={speed} onChange={e => setSpeed(Number(e.target.value))} style={inputStyle} /></label>
                    </div>
                    <button onClick={() => generatePhotogrammetry(poi)} style={{ ...buttonStyle, marginTop: 10, width: '100%' }}>Generate Multi-level Orbit</button>
                    {c.blindSpots.length > 0 && <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 6 }}>Blind spots detected: {c.blindSpots.length}</div>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const inputStyle: CSSProperties = {
  background: 'var(--bg-base)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  padding: '6px 8px',
  fontSize: 12,
  fontFamily: 'var(--font-mono)',
};

const buttonStyle: CSSProperties = {
  background: 'var(--accent)',
  border: 'none',
  color: '#fff',
  padding: '6px 10px',
  fontSize: 11,
  cursor: 'pointer',
  fontFamily: 'var(--font-mono)',
};

const miniButtonStyle: CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border)',
  color: 'var(--text-muted)',
  padding: '4px 8px',
  fontSize: 11,
  cursor: 'pointer',
  fontFamily: 'var(--font-mono)',
};

const labelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  fontSize: 10,
  color: 'var(--text-dim)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontFamily: 'var(--font-mono)',
};
