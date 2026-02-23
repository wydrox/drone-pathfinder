import type { Waypoint } from '@/types/mission';

interface Props {
  waypoints: Waypoint[];
  onUpdate: (id: string, changes: Partial<Waypoint>) => void;
  onRemove: (id: string) => void;
}

export function WaypointList({ waypoints, onUpdate, onRemove }: Props) {
  if (waypoints.length === 0) {
    return (
      <div style={{
        color: 'var(--text-muted)',
        fontSize: 12,
        textAlign: 'center',
        padding: '40px 20px',
        fontFamily: 'var(--font-mono)',
      }}>
        <div style={{ marginBottom: 8, color: 'var(--text-dim)' }}>[ NO WAYPOINTS ]</div>
        <div>Draw a polygon or rectangle on the map to generate flight waypoints.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '40px 1fr 70px 30px',
        gap: 8,
        padding: '8px 12px',
        borderBottom: '1px solid var(--border)',
        fontSize: 10,
        color: 'var(--text-dim)',
        fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        <span>#</span>
        <span>Coordinates</span>
        <span>Alt (m)</span>
        <span></span>
      </div>

      {waypoints.map((wp, i) => (
        <div
          key={wp.id}
          style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 70px 30px',
            gap: 8,
            padding: '10px 12px',
            borderBottom: '1px solid var(--border-subtle)',
            alignItems: 'center',
            background: i % 2 === 0 ? 'transparent' : 'var(--bg-card)',
          }}
        >
          <div style={{
            width: 24,
            height: 24,
            background: wp.action === 'photo' ? 'var(--success-dim)' : 'var(--bg-hover)',
            border: `1px solid ${wp.action === 'photo' ? 'var(--success)' : 'var(--border)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: wp.action === 'photo' ? 'var(--success)' : 'var(--text-muted)',
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
          }}>
            {i + 1}
          </div>

          <div style={{
            fontSize: 11,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}>
            {wp.lat.toFixed(5)}, {wp.lng.toFixed(5)}
          </div>

          <input
            type="number"
            value={wp.altitude}
            min={10}
            max={500}
            onChange={e => onUpdate(wp.id, { altitude: +e.target.value })}
            style={{
              width: '100%',
              background: 'var(--bg-base)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              padding: '4px 6px',
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
            }}
          />

          <button
            onClick={() => onRemove(wp.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              fontSize: 14,
              padding: 0,
              fontFamily: 'var(--font-mono)',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--warning)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-dim)')}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
