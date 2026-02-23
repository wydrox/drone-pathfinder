import type { POI } from '@/types/mission';

interface Props {
  pois: POI[];
  onAddPOI: (poi: Omit<POI, 'id'>) => void;
  onRemovePOI: (id: string) => void;
}

export function POIPanel({ pois, onAddPOI, onRemovePOI }: Props) {
  return (
    <div style={{ padding: '12px 0' }}>
      <div style={{ 
        fontSize: 13, 
        fontWeight: 600, 
        color: '#e8eaf0',
        marginBottom: 12,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        Points of Interest
        <span style={{ 
          fontSize: 11, 
          color: '#6b7280',
          fontWeight: 400 
        }}>
          {pois.length} POIs
        </span>
      </div>
      
      {pois.length === 0 ? (
        <div style={{ 
          color: '#6b7280', 
          fontSize: 12, 
          textAlign: 'center',
          padding: '20px 0'
        }}>
          No POIs added yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pois.map(poi => (
            <div 
              key={poi.id}
              style={{
                background: '#1e2130',
                borderRadius: 8,
                padding: '10px 12px',
                border: '1px solid #2a2f45',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: '#e8eaf0' }}>{poi.name}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>
                  {poi.lat.toFixed(5)}, {poi.lng.toFixed(5)}
                </div>
              </div>
              <button
                onClick={() => onRemovePOI(poi.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
