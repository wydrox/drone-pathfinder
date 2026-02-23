import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { POI, LatLng } from '@/types/mission';
import { calculateCoverageScore, generateOrbitRings, generateStackedLevels } from '@/lib/poiPhotogrammetry';

interface Props {
  pois: POI[];
  onAddPOI: (poi: Omit<POI, 'id'>) => POI;
  onRemovePOI: (id: string) => void;
  onGenerateWaypoints?: (waypoints: LatLng[]) => void;
}

export function POIPanel({ pois, onAddPOI, onRemovePOI, onGenerateWaypoints }: Props) {
  const [name, setName] = useState('POI');
  const [lat, setLat] = useState('52.2297');
  const [lng, setLng] = useState('21.0122');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [ringCount, setRingCount] = useState(3);
  const [baseRadius, setBaseRadius] = useState(12);
  const [overlap, setOverlap] = useState(75);
  const [altitude, setAltitude] = useState(40);
  const [photoInterval, setPhotoInterval] = useState(4);

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
  };

  const generatePhotogrammetry = (poi: POI) => {
    const rings = generateOrbitRings(poi, {
      ringCount,
      baseRadiusMeters: baseRadius,
      overlapPercent: overlap,
      altitudeMeters: altitude,
      photoIntervalMeters: photoInterval,
    });
    const stacked = generateStackedLevels(poi, rings, {
      bands: [
        { altitudeMeters: altitude - 10, overlapPercent: overlap },
        { altitudeMeters: altitude, overlapPercent: overlap },
        { altitudeMeters: altitude + 10, overlapPercent: overlap },
      ],
    });
    const flat = stacked.flatMap(level => level.points);
    onGenerateWaypoints?.(flat);
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
          <button onClick={addPoi} style={buttonStyle}>Add POI</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input value={lat} onChange={e => setLat(e.target.value)} placeholder="lat" style={inputStyle} />
          <input value={lng} onChange={e => setLng(e.target.value)} placeholder="lng" style={inputStyle} />
        </div>
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
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>360 Model (Multi-level)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <label style={labelStyle}>Rings <input type="number" min={1} max={6} value={ringCount} onChange={e => setRingCount(Number(e.target.value))} style={inputStyle} /></label>
                      <label style={labelStyle}>Radius <input type="number" min={4} max={60} value={baseRadius} onChange={e => setBaseRadius(Number(e.target.value))} style={inputStyle} /></label>
                      <label style={labelStyle}>Overlap <input type="number" min={50} max={90} value={overlap} onChange={e => setOverlap(Number(e.target.value))} style={inputStyle} /></label>
                      <label style={labelStyle}>Altitude <input type="number" min={10} max={200} value={altitude} onChange={e => setAltitude(Number(e.target.value))} style={inputStyle} /></label>
                      <label style={labelStyle}>Interval <input type="number" min={2} max={20} value={photoInterval} onChange={e => setPhotoInterval(Number(e.target.value))} style={inputStyle} /></label>
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
