import type { LayerVisibilityConfig } from '@/types/mission';

interface Props {
  visibility: LayerVisibilityConfig;
  onToggle: (layer: keyof LayerVisibilityConfig) => void;
}

const LAYER_LABELS: Record<keyof LayerVisibilityConfig, string> = {
  zones: 'Flight Zones',
  waypoints: 'Waypoints',
  paths: 'Manual Paths',
  pois: 'POI Markers',
  heatmaps: 'Coverage Heatmaps',
  flightPath: 'Flight Path',
};

export function LayerPanel({ visibility, onToggle }: Props) {
  return (
    <div style={{ padding: '12px 0' }}>
      <div style={{ 
        fontSize: 13, 
        fontWeight: 600, 
        color: '#e8eaf0',
        marginBottom: 12 
      }}>
        Layer Visibility
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(Object.keys(LAYER_LABELS) as Array<keyof LayerVisibilityConfig>).map(key => (
          <label
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              padding: '6px 8px',
              borderRadius: 6,
              transition: 'background 0.15s',
            }}
          >
            <input
              type="checkbox"
              checked={visibility[key]}
              onChange={() => onToggle(key)}
              style={{
                width: 16,
                height: 16,
                accentColor: '#4f8ef7',
              }}
            />
            <span style={{ fontSize: 13, color: '#e8eaf0' }}>
              {LAYER_LABELS[key]}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
