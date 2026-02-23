import type { DrawMode } from '@/hooks/useMapDrawing';

interface Props {
  drawMode: DrawMode;
  setMode: (m: DrawMode) => void;
  onClear: () => void;
  waypointCount: number;
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

export function Toolbar({ drawMode, setMode, onClear, waypointCount }: Props) {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 320,
      zIndex: 1000,
      display: 'flex',
      gap: 0,
      alignItems: 'center',
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      padding: '10px 16px',
    }}>
      <span style={{
        color: 'var(--text-primary)',
        fontWeight: 700,
        fontSize: 13,
        marginRight: 24,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.02em',
      }}>
        DRONE PATHFINDER
      </span>

      <div style={{ display: 'flex', gap: 0 }}>
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
          }} />
          
          <button
            style={{
              ...btn(false),
              color: 'var(--warning)',
              borderColor: 'var(--warning)',
            }}
            onClick={onClear}
          >
            Clear All
          </button>
        </>
      )}

      {drawMode !== 'none' && (
        <span style={{
          color: 'var(--text-muted)',
          fontSize: 11,
          marginLeft: 'auto',
          fontFamily: 'var(--font-mono)',
        }}>
          {drawMode === 'polygon'
            ? 'Click to add points, double-click to finish'
            : 'Click to set start corner, click again to set end corner'}
        </span>
      )}
    </div>
  );
}
