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
    <div style={{
      position: 'absolute',
      top: 60,
      right: 336,
      zIndex: 1000,
      width: 280,
    }}>
      <input
        value={query}
        onChange={handleChange}
        placeholder="SEARCH LOCATION..."
        style={{
          width: '100%',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
          padding: '10px 14px',
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          outline: 'none',
        }}
      />

      {results.length > 0 && (
        <div style={{
          marginTop: 0,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderTop: 'none',
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {results.map((r, i) => (
            <div
              key={i}
              onClick={() => select(r)}
              style={{
                padding: '10px 14px',
                fontSize: 11,
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                borderBottom: i < results.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                fontFamily: 'var(--font-mono)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {r.display_name.length > 50 ? r.display_name.slice(0, 50) + '...' : r.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
