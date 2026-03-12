import { useEffect, useRef } from 'react';
import type { MissionConfig, POI, Waypoint } from '@/types/mission';
import { getOrientationPoi, resolveWaypointOrientation } from '@/lib/waypointOrientation';

interface Props {
  waypoints: Waypoint[];
  onUpdate: (id: string, changes: Partial<Waypoint>) => void;
  onRemove: (id: string) => void;
  selectedWaypointId: string | null;
  onSelect: (id: string | null) => void;
  config: MissionConfig;
  pois: POI[];
}

function toNumber(value: string): number | null {
  if (value.trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function WaypointList({ waypoints, onUpdate, onRemove, selectedWaypointId, onSelect, config, pois }: Props) {
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const orientationPoi = getOrientationPoi(config, pois);

  useEffect(() => {
    if (!selectedWaypointId) return;
    rowRefs.current[selectedWaypointId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedWaypointId]);

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

      {waypoints.map((wp, i) => {
        const isSelected = selectedWaypointId === wp.id;
        const orientation = resolveWaypointOrientation(wp, config, pois);
        const isPoiDriven = orientationPoi !== null;
        return (
          <div
            key={wp.id}
            ref={(node) => {
              rowRefs.current[wp.id] = node;
            }}
            onClick={() => onSelect(wp.id)}
            style={{
              borderBottom: '1px solid var(--border-subtle)',
              background: isSelected ? 'var(--bg-card)' : (i % 2 === 0 ? 'transparent' : 'var(--bg-card)'),
              borderLeft: `3px solid ${isSelected ? 'var(--accent)' : 'transparent'}`,
              padding: '10px 12px',
              cursor: 'pointer',
              transition: 'background 0.1s ease',
            }}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 70px 30px',
              gap: 8,
              alignItems: 'center',
            }}>
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
                onClick={(e) => e.stopPropagation()}
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
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedWaypointId === wp.id) {
                    onSelect(null);
                  }
                  onRemove(wp.id);
                }}
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

            {isSelected && (
              <div style={{
                marginTop: 10,
                paddingTop: 10,
                borderTop: '1px dashed var(--border)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                alignItems: 'center',
              }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>Speed (m/s)</span>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    step={0.1}
                    value={wp.speed ?? ''}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const parsed = toNumber(e.target.value);
                      onUpdate(wp.id, { speed: parsed === null ? undefined : Math.max(1, Math.min(15, parsed)) });
                    }}
                    style={{
                      width: '100%',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      padding: '5px 6px',
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {isPoiDriven ? 'Camera dir (POI)' : 'Camera dir (deg)'}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={359}
                    step={1}
                    value={isPoiDriven ? orientation.heading.toFixed(1) : (wp.heading ?? '')}
                    disabled={isPoiDriven}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      if (isPoiDriven) return;
                      const parsed = toNumber(e.target.value);
                      const normalized = parsed === null ? undefined : ((parsed % 360) + 360) % 360;
                      onUpdate(wp.id, { heading: normalized });
                    }}
                    style={{
                      width: '100%',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      padding: '5px 6px',
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      opacity: isPoiDriven ? 0.7 : 1,
                    }}
                  />
                  {isPoiDriven && orientation.poi && (
                    <span style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                      Derived from {orientation.poi.name}
                    </span>
                  )}
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {isPoiDriven ? 'Gimbal pitch (POI)' : 'Gimbal pitch'}
                  </span>
                  <input
                    type="number"
                    value={orientation.gimbalPitch.toFixed(1)}
                    readOnly
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '100%',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      padding: '5px 6px',
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      opacity: isPoiDriven ? 1 : 0.7,
                    }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>Lat</span>
                  <input
                    type="number"
                    step={0.000001}
                    value={wp.lat}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const parsed = toNumber(e.target.value);
                      if (parsed !== null) onUpdate(wp.id, { lat: parsed });
                    }}
                    style={{
                      width: '100%',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      padding: '5px 6px',
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </label>

                <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>Lng</span>
                  <input
                    type="number"
                    step={0.000001}
                    value={wp.lng}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const parsed = toNumber(e.target.value);
                      if (parsed !== null) onUpdate(wp.id, { lng: parsed });
                    }}
                    style={{
                      width: '100%',
                      background: 'var(--bg-base)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      padding: '5px 6px',
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                    }}
                  />
                </label>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
