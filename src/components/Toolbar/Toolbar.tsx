import type { DrawMode } from '@/hooks/useMapDrawing';

interface Props {
  drawMode: DrawMode;
  setMode: (m: DrawMode) => void;
  onClear: () => void;
  waypointCount: number;
}

const btn = (active: boolean) => ({
  padding: '7px 14px',
  borderRadius: 7,
  border: `1px solid ${active ? '#4f8ef7' : '#2a2f45'}`,
  background: active ? '#4f8ef720' : '#1e2130',
  color: active ? '#4f8ef7' : '#e8eaf0',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: active ? 600 : 400,
  transition: 'all 0.15s',
});

export function Toolbar({ drawMode, setMode, onClear, waypointCount }: Props) {
  return (
    <div style={{
      position: 'absolute', top: 16, left: 16, zIndex: 1000,
      display: 'flex', gap: 8, alignItems: 'center',
      background: '#161922cc', backdropFilter: 'blur(12px)',
      border: '1px solid #2a2f45', borderRadius: 12,
      padding: '8px 12px',
    }}>
      <span style={{ color: '#4f8ef7', fontWeight: 700, fontSize: 15, marginRight: 4 }}>
        ✦ drone-pathfinder
      </span>
      <div style={{ width: 1, height: 20, background: '#2a2f45', margin: '0 4px' }} />
      <button style={btn(drawMode === 'polygon')} onClick={() => setMode(drawMode === 'polygon' ? 'none' : 'polygon')}>
        ⬡ Polygon <span style={{ fontSize: 10, color: '#6b7280' }}>(P)</span>
      </button>
      <button style={btn(drawMode === 'rectangle')} onClick={() => setMode(drawMode === 'rectangle' ? 'none' : 'rectangle')}>
        ▭ Rectangle <span style={{ fontSize: 10, color: '#6b7280' }}>(R)</span>
      </button>
      {waypointCount > 0 && (
        <button style={{ ...btn(false), color: '#f59e0b', borderColor: '#f59e0b40' }} onClick={onClear}>
          ✕ Clear
        </button>
      )}
      {drawMode !== 'none' && (
        <span style={{ color: '#6b7280', fontSize: 12 }}>
          {drawMode === 'polygon' ? 'Click to add points, dbl-click to finish' : 'Click start, click end'}
        </span>
      )}
    </div>
  );
}
