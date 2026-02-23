import { useState, useRef } from 'react';
import L from 'leaflet';
import type { DrawMode } from '@/hooks/useMapDrawing';

interface Props {
  drawMode: DrawMode;
  setMode: (m: DrawMode) => void;
  onClear: () => void;
  waypointCount: number;
  map: L.Map | null;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

const btn = (active: boolean) => ({
  padding: '8px 16px',
  background: active ? 'var(--bg-card)' : 'transparent',
  border: `1px solid ${active ? 'var(--text-primary)' : 'var(--border)'}`,
  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
  cursor: 'pointer',
  fontSize: 11,
  fontWeight: active ? 600 : 400,
  fontFamily: 'var(--font-mono)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  transition: 'all 0.1s',
});

export function Toolbar({ drawMode, setMode, onClear, waypointCount, map, onUndo, onRedo, canUndo, canRedo }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
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

  const select = (r: SearchResult) => {
    map?.flyTo([+r.lat, +r.lon], 14, { animate: true, duration: 1.2 });
    setQuery(r.display_name.split(',')[0]);
    setResults([]);
    setShowSearch(false);
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      display: 'flex',
      gap: 0,
      alignItems: 'center',
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      padding: '10px 16px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginRight: 24,
        flexShrink: 0,
      }}>
        <img 
          src="/logo.svg" 
          alt="Drone Pathfinder" 
          style={{ 
            height: 28, 
            width: 'auto',
            color: 'var(--text-primary)',
          }} 
        />
        <span style={{
          color: 'var(--text-primary)',
          fontWeight: 700,
          fontSize: 13,
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.02em',
        }}>
          DRONE PATHFINDER
        </span>
      </div>

      <div style={{ display: 'flex', gap: 0, flexShrink: 0 }}>
        <button
          style={btn(drawMode === 'polygon')}
          onClick={() => setMode(drawMode === 'polygon' ? 'none' : 'polygon')}
        >
          Polygon [P]
        </button>
        
        <button
          style={btn(drawMode === 'rectangle')}
          onClick={() => setMode(drawMode === 'rectangle' ? 'none' : 'rectangle')}
        >
          Rectangle [R]
        </button>
      </div>

      {waypointCount > 0 && (
        <>
          <div style={{
            width: 1,
            height: 20,
            background: 'var(--border)',
            margin: '0 16px',
            flexShrink: 0,
          }} />
          
          <button
            style={{
              ...btn(false),
              color: 'var(--warning)',
              borderColor: 'var(--warning)',
              flexShrink: 0,
            }}
            onClick={onClear}
          >
            Clear All
          </button>
          
          {onUndo && onRedo && (
            <>
              <div style={{
                width: 1,
                height: 20,
                background: 'var(--border)',
                margin: '0 16px',
                flexShrink: 0,
              }} />
              
              <button
                style={{
                  ...btn(false),
                  opacity: canUndo ? 1 : 0.4,
                  cursor: canUndo ? 'pointer' : 'not-allowed',
                  flexShrink: 0,
                }}
                onClick={onUndo}
                disabled={!canUndo}
              >
                Undo [Ctrl+Z]
              </button>
              
              <button
                style={{
                  ...btn(false),
                  opacity: canRedo ? 1 : 0.4,
                  cursor: canRedo ? 'pointer' : 'not-allowed',
                  flexShrink: 0,
                }}
                onClick={onRedo}
                disabled={!canRedo}
              >
                Redo [Ctrl+Y]
              </button>
            </>
          )}
        </>
      )}

      <div style={{ flex: 1 }} />

      <div style={{ position: 'relative', width: 280 }}>
        {!showSearch ? (
          <button
            onClick={() => setShowSearch(true)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              width: '100%',
              textAlign: 'left',
            }}
          >
            Search location...
          </button>
        ) : (
          <>
            <input
              value={query}
              onChange={handleChange}
              placeholder="SEARCH LOCATION..."
              autoFocus
              style={{
                width: '100%',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                padding: '8px 16px',
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                outline: 'none',
              }}
            />
            <button
              onClick={() => {
                setShowSearch(false);
                setQuery('');
                setResults([]);
              }}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 14,
                padding: '4px 8px',
              }}
            >
              ×
            </button>
          </>
        )}

        {results.length > 0 && showSearch && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 1001,
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

      {drawMode !== 'none' && (
        <span style={{
          color: 'var(--text-muted)',
          fontSize: 11,
          marginLeft: 24,
          fontFamily: 'var(--font-mono)',
          flexShrink: 0,
        }}>
          {drawMode === 'polygon'
            ? 'Click to add points, double-click to finish'
            : 'Click to set start corner, click again to set end corner'}
        </span>
      )}
    </div>
  );
}
