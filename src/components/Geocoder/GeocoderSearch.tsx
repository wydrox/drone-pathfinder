import { useState, useRef } from 'react';
import L from 'leaflet';

interface Result { display_name: string; lat: string; lon: string; }

interface Props { map: L.Map | null; }

export function GeocoderSearch({ map }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const search = async (q: string) => {
    if (q.length < 3) { setResults([]); return; }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`);
      setResults(await res.json());
    } catch { setResults([]); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(e.target.value), 400);
  };

  const select = (r: Result) => {
    map?.flyTo([+r.lat, +r.lon], 14, { animate: true, duration: 1.2 });
    setQuery(r.display_name.split(',')[0]);
    setResults([]);
  };

  return (
    <div style={{ position: 'absolute', top: 16, right: 332, zIndex: 1000, width: 260 }}>
      <input value={query} onChange={handleChange} placeholder="Search location..."
        style={{
          width: '100%', background: '#161922cc', border: '1px solid #2a2f45',
          borderRadius: 9, color: '#e8eaf0', padding: '9px 14px', fontSize: 13,
          backdropFilter: 'blur(12px)', outline: 'none',
        }} />
      {results.length > 0 && (
        <div style={{
          marginTop: 4, background: '#161922', border: '1px solid #2a2f45',
          borderRadius: 9, overflow: 'hidden', boxShadow: '0 8px 24px #00000060',
        }}>
          {results.map((r, i) => (
            <div key={i} onClick={() => select(r)}
              style={{
                padding: '9px 14px', fontSize: 12, cursor: 'pointer', color: '#e8eaf0',
                borderBottom: i < results.length - 1 ? '1px solid #2a2f4540' : 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1e2130')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              {r.display_name.length > 60 ? r.display_name.slice(0, 60) + '...' : r.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
