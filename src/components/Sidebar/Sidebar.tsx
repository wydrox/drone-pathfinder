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

  const tabStyle = (t: Tab) => ({
    flex: 1, padding: '10px 0', textAlign: 'center' as const,
    fontSize: 13, fontWeight: tab === t ? 600 : 400,
    color: tab === t ? '#4f8ef7' : '#6b7280',
    borderBottom: `2px solid ${tab === t ? '#4f8ef7' : 'transparent'}`,
    cursor: 'pointer', background: 'transparent', border: 'none',
    transition: 'all 0.15s',
  });

  return (
    <div style={{
      width: 300, minWidth: 300, background: '#161922',
      borderLeft: '1px solid #2a2f45', display: 'flex', flexDirection: 'column',
      height: '100vh', overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 20px 0', borderBottom: '1px solid #2a2f45' }}>
        <div style={{ fontWeight: 700, fontSize: 17, color: '#4f8ef7', marginBottom: 12 }}>
          ✦ drone-pathfinder
        </div>
        <div style={{ display: 'flex' }}>
          {(['config', 'waypoints', 'export'] as Tab[]).map(t => (
            <button key={t} style={tabStyle(t)} onClick={() => setTab(t)}>
              {t === 'config' ? '⚙ Config' : t === 'waypoints' ? `⬡ WPs (${props.stats.waypointCount})` : '↓ Export'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {tab === 'config' && <MissionConfig config={props.config} onChange={props.onConfigChange} stats={props.stats} />}
        {tab === 'waypoints' && <WaypointList waypoints={props.waypoints} onUpdate={props.onUpdateWaypoint} onRemove={props.onRemoveWaypoint} />}
        {tab === 'export' && <ExportPanel onExportKmz={props.onExportKmz} onExportGpx={props.onExportGpx} onExportJson={props.onExportJson} onImport={props.onImportKmz} waypointCount={props.stats.waypointCount} />}
      </div>
    </div>
  );
}
