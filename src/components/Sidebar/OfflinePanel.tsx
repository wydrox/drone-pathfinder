import { useState, useEffect } from 'react';
import { cacheArea, getCachedAreas, clearCache } from '@/lib/offline';
import type { LatLng } from '@/types/mission';

interface Props {
  currentCenter?: LatLng;
}

export function OfflinePanel({ currentCenter }: Props) {
  const [cacheSize, setCacheSize] = useState(0);
  const [isCaching, setIsCaching] = useState(false);
  const [radius, setRadius] = useState(1000);
  const [status, setStatus] = useState('');

  useEffect(() => {
    checkCacheSize();
  }, []);

  const checkCacheSize = async () => {
    const areas = getCachedAreas();
    const estimatedSize = areas.length * 2;
    setCacheSize(estimatedSize);
  };

  const handleCacheArea = async () => {
    if (!currentCenter) {
      setStatus('Set a map location first');
      return;
    }

    setIsCaching(true);
    setStatus('Caching map tiles...');

    try {
      await cacheArea(currentCenter, radius);
      await checkCacheSize();
      setStatus(`Cached ${radius}m radius around current center`);
    } catch (error) {
      setStatus('Failed to cache area');
    } finally {
      setIsCaching(false);
    }
  };

  const handleClearCache = () => {
    clearCache();
    setCacheSize(0);
    setStatus('Cache cleared');
  };

  return (
    <div style={{ padding: '12px 0' }}>
      <div style={{ 
        fontSize: 13, 
        fontWeight: 600, 
        color: '#e8eaf0',
        marginBottom: 16,
      }}>
        Offline Maps
      </div>

      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        padding: '12px',
        marginBottom: 16,
        borderRadius: 6,
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: 8,
        }}>
          Cache Status
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
        }}>
          <span style={{
            fontSize: 24,
            fontWeight: 700,
            color: cacheSize > 0 ? 'var(--success)' : 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}>
            {cacheSize}
          </span>
          <span style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}>
            MB cached
          </span>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}>
          <label style={{
            fontSize: 10,
            color: 'var(--text-dim)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: 'var(--font-mono)',
          }}>
            Cache Radius
          </label>
          <span style={{
            fontSize: 11,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}>
            {radius}m
          </span>
        </div>        
        <input
          type="range"
          min={500}
          max={5000}
          step={500}
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          style={{ width: '100%', marginBottom: 12 }}
        />

        <button
          onClick={handleCacheArea}
          disabled={isCaching}
          style={{
            width: '100%',
            padding: '12px',
            background: isCaching ? 'var(--bg-card)' : 'var(--accent)',
            border: 'none',
            color: '#fff',
            cursor: isCaching ? 'not-allowed' : 'pointer',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            opacity: isCaching ? 0.5 : 1,
          }}
        >
          {isCaching ? 'Caching...' : 'Cache Current Area'}
        </button>
      </div>

      {status && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          padding: '10px',
          marginBottom: 16,
          borderRadius: 6,
          fontSize: 11,
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-mono)',
          textAlign: 'center',
        }}
        >
          {status}
        </div>
      )}

      <button
        onClick={handleClearCache}
        style={{
          width: '100%',
          padding: '10px',
          background: 'transparent',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
        }}
      >
        Clear Cache
      </button>
    </div>
  );
}
