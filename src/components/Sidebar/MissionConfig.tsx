import { useState } from 'react';
import type { MissionConfig as MConfig, MissionStats } from '@/types/mission';

const DRONES = ['DJI Mini 4 Pro', 'DJI Mini 5 Pro', 'DJI Mavic 4 Pro', 'DJI Air 3', 'DJI Air 3S', 'DJI Mavic 3', 'DJI Mavic 3 Pro'];

interface Props { config: MConfig; onChange: (p: Partial<MConfig>) => void; stats: MissionStats; }

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span 
      style={{ 
        color: 'var(--text-dim)', 
        cursor: 'help',
        fontSize: 10,
        marginLeft: 4,
      }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      [?]
      {show && (
        <span style={{
          position: 'absolute',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          padding: '8px 12px',
          fontSize: 11,
          color: 'var(--text-muted)',
          maxWidth: 200,
          zIndex: 1000,
          marginTop: 4,
          marginLeft: -100,
        }}>
          {text}
        </span>
      )}
    </span>
  );
}

function Row({ label, children, info }: { label: string; children: React.ReactNode; info?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ 
        fontSize: 10, 
        color: 'var(--text-dim)', 
        marginBottom: 8, 
        textTransform: 'uppercase', 
        letterSpacing: '0.1em',
        fontFamily: 'var(--font-mono)',
        display: 'flex',
        alignItems: 'center',
      }}>
        {label}
        {info && <InfoTooltip text={info} />}
      </div>
      {children}
    </div>
  );
}

function SliderRow({ label, value, min, max, unit, onChange, info }: { label: string; value: number; min: number; max: number; unit: string; onChange: (v: number) => void; info?: string }) {
  return (
    <Row label={label} info={info}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <input type="range" min={min} max={max} value={value}
          onChange={e => onChange(+e.target.value)}
          style={{ flex: 1 }} />
        <input type="number" min={min} max={max} value={value}
          onChange={e => onChange(Math.min(max, Math.max(min, +e.target.value)))}
          style={{
            width: 60, 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border)',
            color: 'var(--text-primary)', 
            padding: '6px 8px', 
            fontSize: 12, 
            textAlign: 'right',
            fontFamily: 'var(--font-mono)',
          }} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 28, fontFamily: 'var(--font-mono)' }}>{unit}</span>
      </div>
    </Row>
  );
}

function ToggleRow({ label, value, onChange, info }: { label: string; value: boolean; onChange: (v: boolean) => void; info?: string }) {
  return (
    <Row label={label} info={info}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => onChange(!value)}
          style={{
            width: 44,
            height: 22,
            background: value ? 'var(--accent)' : 'var(--border)',
            border: 'none',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <div style={{
            position: 'absolute',
            top: 2,
            left: value ? 24 : 2,
            width: 18,
            height: 18,
            background: 'var(--text-primary)',
            transition: 'left 0.15s',
          }} />
        </button>
        <span style={{ 
          fontSize: 12, 
          color: value ? 'var(--text-primary)' : 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}>
          {value ? 'ENABLED' : 'DISABLED'}
        </span>
      </div>
    </Row>
  );
}

export function MissionConfig({ config, onChange, stats }: Props) {
  return (
    <div>
      <div style={{ 
        background: 'var(--bg-card)', 
        border: '1px solid var(--border)',
        padding: 16, 
        marginBottom: 24,
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: 12,
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: 8,
        }}>
          Mission Statistics
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>Waypoints</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{stats.waypointCount}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>Area</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {stats.areaSqm >= 10000 ? `${(stats.areaSqm/10000).toFixed(1)} ha` : `${Math.round(stats.areaSqm)} m²`}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>Est. Time</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {stats.estimatedTimeSec < 60 ? `${Math.round(stats.estimatedTimeSec)}s` : `${Math.floor(stats.estimatedTimeSec/60)}m ${Math.round(stats.estimatedTimeSec%60)}s`}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-mono)' }}>Distance</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {stats.totalDistanceM ? `${(stats.totalDistanceM/1000).toFixed(2)} km` : '0.00 km'}
            </div>
          </div>
        </div>
      </div>

      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        color: 'var(--text-dim)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        marginBottom: 16,
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: 8,
      }}>
        Flight Parameters
      </div>

      <SliderRow 
        label="Altitude" 
        value={config.altitude} 
        min={10} 
        max={500} 
        unit="m" 
        onChange={v => onChange({ altitude: v })} 
        info="Flight altitude above ground level. Higher altitudes cover more area per photo but reduce ground detail."
      />
      
      <SliderRow 
        label="Speed" 
        value={config.speed} 
        min={1} 
        max={15} 
        unit="m/s" 
        onChange={v => onChange({ speed: v })} 
        info="Drone flight speed during mission. Slower speeds improve photo quality but increase flight time."
      />
      
      <SliderRow 
        label="Photo Overlap" 
        value={config.overlap} 
        min={50} 
        max={90} 
        unit="%" 
        onChange={v => onChange({ overlap: v })} 
        info="Percentage overlap between consecutive photos. 70-80% recommended for photogrammetry."
      />

      <Row label="Direction" info="Rotation angle of the flight grid. 0° = North-South lines.">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input type="range" min={0} max={359} value={config.direction}
            onChange={e => onChange({ direction: +e.target.value })}
            style={{ flex: 1 }} />
          <span style={{ 
            fontSize: 13, 
            color: 'var(--text-primary)', 
            width: 40, 
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
          }}>{config.direction}°</span>
        </div>
      </Row>

      <Row label="Travel Axis" info="Primary direction of flight lines. East-West or North-South.">
        <div style={{ display: 'flex', gap: 0 }}>
          {(['EW', 'NS'] as const).map(axis => (
            <button key={axis} onClick={() => onChange({ travelAxis: axis })}
              style={{
                flex: 1, 
                padding: '10px 0', 
                fontSize: 12, 
                cursor: 'pointer',
                background: config.travelAxis === axis ? 'var(--bg-card)' : 'transparent',
                border: `1px solid ${config.travelAxis === axis ? 'var(--text-primary)' : 'var(--border)'}`,
                color: config.travelAxis === axis ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: config.travelAxis === axis ? 600 : 400,
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
              {axis === 'EW' ? 'East-West' : 'North-South'}
            </button>
          ))}
        </div>
      </Row>

      <ToggleRow 
        label="Photo Capture" 
        value={config.photoCapture} 
        onChange={v => onChange({ photoCapture: v })}
        info="Enable to capture photos at each waypoint. Disable for reconnaissance flights."
      />

      <Row label="Drone Model" info="Select your DJI drone model for compatibility.">
        <select 
          value={config.droneModel} 
          onChange={e => onChange({ droneModel: e.target.value })}
          style={{
            width: '100%', 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border)',
            color: 'var(--text-primary)', 
            padding: '10px 12px', 
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            cursor: 'pointer',
          }}>
          {DRONES.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </Row>
    </div>
  );
}
