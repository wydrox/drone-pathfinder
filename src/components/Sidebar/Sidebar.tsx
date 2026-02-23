import { useState } from 'react';
import type { MissionConfig as MConfig, MissionStats, Waypoint } from '@/types/mission';
import { MissionConfig } from './MissionConfig';
import { WaypointList } from './WaypointList';
import { ExportPanel } from './ExportPanel';
import { POIPanel } from './POIPanel';
import { LayerPanel } from './LayerPanel';
import type { MapStyle, LayerVisibilityConfig } from '@/types/mission';
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
  mapStyles: MapStyle[];
  currentMapStyleId: string;
  onMapStyleChange: (id: string) => void;
  poiManager: {
    pois: { id: string; name: string; lat: number; lng: number }[];
    addPOI: (poi: { name: string; lat: number; lng: number; altitude: number; category: string; radiusMeters: number }) => void;
    removePOI: (id: string) => void;
  };
  layerVisibility: LayerVisibilityConfig;
  onLayerVisibilityChange: (layer: keyof LayerVisibilityConfig) => void;
}

type Tab = 'config' | 'waypoints' | 'pois' | 'layers' | 'export';

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
          {(['config', 'waypoints', 'pois', 'layers', 'export'] as Tab[]).map(t => (
            <button
              key={t}
              style={tabStyle(t)}
              onClick={() => setTab(t)}
            >
              {t === 'config' ? 'CONFIG' : t === 'waypoints' ? `WAYPOINTS (${props.stats.waypointCount})` : t === 'pois' ? `POIs (${props.poiManager.pois.length})` : t === 'layers' ? 'LAYERS' : 'EXPORT'}
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
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 8 }}>Map Style</label>
              <select
                value={props.currentMapStyleId}
                onChange={(e) => props.onMapStyleChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  color: 'var(--text-primary)',
                  fontSize: 13,
                }}
              >
                {props.mapStyles.map(style => (
                  <option key={style.id} value={style.id}>{style.name}</option>
                ))}
              </select>
            </div>
            <MissionConfig
              config={props.config}
              onChange={props.onConfigChange}
              stats={props.stats}
            />
          </>
        )}
        {tab === 'waypoints' && (
          <WaypointList
            waypoints={props.waypoints}
            onUpdate={props.onUpdateWaypoint}
            onRemove={props.onRemoveWaypoint}
          />
        )}
        {tab === 'pois' && (
          <POIPanel
            pois={props.poiManager.pois}
            onAddPOI={props.poiManager.addPOI}
            onRemovePOI={props.poiManager.removePOI}
          />
        )}
        {tab === 'layers' && (
          <LayerPanel
            visibility={props.layerVisibility}
            onToggle={props.onLayerVisibilityChange}
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
