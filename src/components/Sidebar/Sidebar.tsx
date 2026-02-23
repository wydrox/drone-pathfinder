import { useState } from 'react';
import type { MissionConfig as MConfig, MissionStats, Waypoint } from '@/types/mission';
import { MissionConfig } from './MissionConfig';
import { WaypointList } from './WaypointList';
import { ExportPanel } from './ExportPanel';

interface Props {
  config: MConfig;
  onConfigChange: (p: Partial<MConfig>) => void;
  waypoints: Waypoint[];
  stats: MissionStats;
  onUpdateWaypoint: (id: string, changes: Partial<Waypoint>) => void;
  onRemoveWaypoint: (id: string) => void;
  onImportKmz: (file: File) => void;
  onExportKmz: () => void;
  onExportGpx: () => void;
  onExportJson: () => void;
}

type Tab = 'config' | 'waypoints' | 'export';

export function Sidebar(props: Props) {
  const [tab, setTab] = useState<Tab>('config');
  const [showHelp, setShowHelp] = useState(true);

  const tabStyle = (t: Tab) => ({
    flex: 1,
    padding: '12px 0',
    textAlign: 'center' as const,
    fontSize: 11,
    fontWeight: tab === t ? 600 : 400,
    color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
    background: tab === t ? 'var(--bg-card)' : 'transparent',
    border: 'none',
    borderBottom: `2px solid ${tab === t ? 'var(--text-primary)' : 'transparent'}`,
    cursor: 'pointer',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    transition: 'all 0.1s',
  });

  return (
    <div style={{
      width: 320,
      minWidth: 320,
      background: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px 16px 0',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: 12,
          letterSpacing: '0.02em',
        }}>
          DRONE PATHFINDER
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {(['config', 'waypoints', 'export'] as Tab[]).map(t => (
            <button
              key={t}
              style={tabStyle(t)}
              onClick={() => setTab(t)}
            >
              {t === 'config' ? 'CONFIG' : t === 'waypoints' ? `WAYPOINTS (${props.stats.waypointCount})` : 'EXPORT'}
            </button>
          ))}
        </div>
      </div>

      {showHelp && tab === 'config' && (
        <div style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border)',
          padding: '12px 16px',
          fontSize: 11,
          lineHeight: '1.5',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text-dim)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
              Quick Guide
            </span>
            <button
              onClick={() => setShowHelp(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: 10,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              [DISMISS]
            </button>
          </div>
          <div style={{ color: 'var(--text-muted)' }}>
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>1.</span> Draw a zone on the map using Polygon or Rectangle tools
            </div>
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>2.</span> Configure altitude, speed, and overlap below
            </div>
            <div style={{ marginBottom: 4 }}>
              <span style={{ color: 'var(--text-secondary)' }}>3.</span> Export as KMZ for DJI Fly import
            </div>
            <div style={{ color: 'var(--text-dim)', marginTop: 8 }}>
              Keyboard: P=Polygon, R=Rectangle, Esc=Cancel, Cmd+Z=Undo
            </div>
          </div>
        </div>
      )}

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 16,
        background: 'var(--bg-surface)',
      }}>
        {tab === 'config' && (
          <MissionConfig
            config={props.config}
            onChange={props.onConfigChange}
            stats={props.stats}
          />
        )}
        {tab === 'waypoints' && (
          <WaypointList
            waypoints={props.waypoints}
            onUpdate={props.onUpdateWaypoint}
            onRemove={props.onRemoveWaypoint}
          />
        )}
        {tab === 'export' && (
          <ExportPanel
            onExportKmz={props.onExportKmz}
            onExportGpx={props.onExportGpx}
            onExportJson={props.onExportJson}
            onImport={props.onImportKmz}
            waypointCount={props.stats.waypointCount}
          />
        )}
      </div>

      <div style={{
        padding: '10px 16px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-surface)',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        color: 'var(--text-dim)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span>v1.0.0</span>
        <span>WARSAW • 52.23°N 21.01°E</span>
      </div>
    </div>
  );
}
