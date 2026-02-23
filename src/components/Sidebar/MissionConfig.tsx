import type { MissionConfig as MConfig, MissionStats } from '@/types/mission';

const DRONES = ['DJI Mini 4 Pro', 'DJI Mini 5 Pro', 'DJI Mavic 4 Pro', 'DJI Air 3', 'DJI Air 3S', 'DJI Mavic 3', 'DJI Mavic 3 Pro'];

interface Props { config: MConfig; onChange: (p: Partial<MConfig>) => void; stats: MissionStats; }

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      {children}
    </div>
  );
}

function SliderRow({ label, value, min, max, unit, onChange }: { label: string; value: number; min: number; max: number; unit: string; onChange: (v: number) => void }) {
  return (
    <Row label={label}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input type="range" min={min} max={max} value={value}
          onChange={e => onChange(+e.target.value)}
          style={{ flex: 1, accentColor: '#4f8ef7', height: 4 }} />
        <input type="number" min={min} max={max} value={value}
          onChange={e => onChange(Math.min(max, Math.max(min, +e.target.value)))}
          style={{
            width: 64, background: '#1e2130', border: '1px solid #2a2f45',
            borderRadius: 6, color: '#e8eaf0', padding: '4px 8px', fontSize: 13, textAlign: 'right'
          }} />
        <span style={{ fontSize: 11, color: '#6b7280', width: 24 }}>{unit}</span>
      </div>
    </Row>
  );
}

export function MissionConfig({ config, onChange, stats }: Props) {
  return (
    <div>
      <div style={{ background: '#1e2130', borderRadius: 8, padding: 12, marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <div style={{ fontSize: 10, color: '#6b7280' }}>WAYPOINTS</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#4f8ef7' }}>{stats.waypointCount}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#6b7280' }}>AREA</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#e8eaf0' }}>
            {stats.areaSqm >= 10000 ? `${(stats.areaSqm/10000).toFixed(1)} ha` : `${Math.round(stats.areaSqm)} m²`}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#6b7280' }}>EST. TIME</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e8eaf0' }}>
            {stats.estimatedTimeSec < 60 ? `${Math.round(stats.estimatedTimeSec)}s` : `${Math.floor(stats.estimatedTimeSec/60)}m ${Math.round(stats.estimatedTimeSec%60)}s`}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#6b7280' }}>SPEED</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e8eaf0' }}>{config.speed} m/s</div>
        </div>
      </div>

      <SliderRow label="Altitude" value={config.altitude} min={10} max={500} unit="m" onChange={v => onChange({ altitude: v })} />
      <SliderRow label="Speed" value={config.speed} min={1} max={15} unit="m/s" onChange={v => onChange({ speed: v })} />
      <SliderRow label="Photo Overlap" value={config.overlap} min={50} max={90} unit="%" onChange={v => onChange({ overlap: v })} />

      <Row label="Direction">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="range" min={0} max={359} value={config.direction}
            onChange={e => onChange({ direction: +e.target.value })}
            style={{ flex: 1, accentColor: '#7c3aed' }} />
          <span style={{ fontSize: 13, color: '#e8eaf0', width: 40 }}>{config.direction}°</span>
        </div>
      </Row>

      <Row label="Travel Axis">
        <div style={{ display: 'flex', gap: 8 }}>
          {(['EW', 'NS'] as const).map(axis => (
            <button key={axis} onClick={() => onChange({ travelAxis: axis })}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 7, fontSize: 13, cursor: 'pointer',
                background: config.travelAxis === axis ? '#4f8ef720' : '#1e2130',
                border: `1px solid ${config.travelAxis === axis ? '#4f8ef7' : '#2a2f45'}`,
                color: config.travelAxis === axis ? '#4f8ef7' : '#e8eaf0',
                fontWeight: config.travelAxis === axis ? 600 : 400,
              }}>
              {axis === 'EW' ? '↔ East–West' : '↕ North–South'}
            </button>
          ))}
        </div>
      </Row>

      <Row label="Photo Capture">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div onClick={() => onChange({ photoCapture: !config.photoCapture })}
            style={{
              width: 44, height: 24, borderRadius: 12, cursor: 'pointer', transition: 'background 0.2s',
              background: config.photoCapture ? '#22c55e' : '#2a2f45', position: 'relative',
            }}>
            <div style={{
              position: 'absolute', top: 3, left: config.photoCapture ? 23 : 3,
              width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
            }} />
          </div>
          <span style={{ fontSize: 13, color: config.photoCapture ? '#22c55e' : '#6b7280' }}>
            {config.photoCapture ? 'Capture at each waypoint' : 'No capture'}
          </span>
        </div>
      </Row>

      <Row label="Drone Model">
        <select value={config.droneModel} onChange={e => onChange({ droneModel: e.target.value })}
          style={{
            width: '100%', background: '#1e2130', border: '1px solid #2a2f45',
            borderRadius: 7, color: '#e8eaf0', padding: '8px 10px', fontSize: 13,
          }}>
          {DRONES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </Row>
    </div>
  );
}
