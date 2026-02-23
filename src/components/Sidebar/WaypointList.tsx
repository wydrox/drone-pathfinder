import type { Waypoint } from '@/types/mission';

interface Props {
  waypoints: Waypoint[];
  onUpdate: (id: string, changes: Partial<Waypoint>) => void;
  onRemove: (id: string) => void;
}

export function WaypointList({ waypoints, onUpdate, onRemove }: Props) {
  if (waypoints.length === 0) {
    return (
      <div style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>
        No waypoints yet.<br />Draw a shape on the map.
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {waypoints.map((wp, i) => (
        <div key={wp.id} style={{
          background: '#1e2130', borderRadius: 8, padding: '8px 10px',
          border: '1px solid #2a2f45', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: wp.action === 'photo' ? '#22c55e20' : '#4f8ef720',
            border: `1.5px solid ${wp.action === 'photo' ? '#22c55e' : '#4f8ef7'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, color: wp.action === 'photo' ? '#22c55e' : '#4f8ef7', fontWeight: 700, flexShrink: 0,
          }}>{i + 1}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}>
              {wp.lat.toFixed(5)}, {wp.lng.toFixed(5)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="number" value={wp.altitude} min={10} max={500}
                onChange={e => onUpdate(wp.id, { altitude: +e.target.value })}
                style={{
                  width: 60, background: '#0d0f14', border: '1px solid #2a2f45',
                  borderRadius: 5, color: '#e8eaf0', padding: '2px 6px', fontSize: 12,
                }} />
              <span style={{ fontSize: 11, color: '#6b7280' }}>m</span>
              <span style={{
                fontSize: 10, padding: '2px 6px', borderRadius: 4,
                background: wp.action === 'photo' ? '#22c55e20' : '#2a2f45',
                color: wp.action === 'photo' ? '#22c55e' : '#6b7280',
              }}>{wp.action === 'photo' ? '📷' : '—'}</span>
            </div>
          </div>
          <button onClick={() => onRemove(wp.id)}
            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14, padding: 4 }}>
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
