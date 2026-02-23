import type { MissionStage } from '@/types/mission';

interface Props {
  stages: MissionStage[];
  currentStageIndex?: number;
  onResume?: (stageIndex: number) => void;
}

export function StageManager({ stages, currentStageIndex = 0, onResume }: Props) {
  return (
    <div style={{ padding: '12px 0' }}>
      <div style={{ 
        fontSize: 13, 
        fontWeight: 600, 
        color: '#e8eaf0',
        marginBottom: 12 
      }}>
        Mission Stages
      </div>
      
      {stages.length === 0 ? (
        <div style={{ 
          color: '#6b7280', 
          fontSize: 12, 
          textAlign: 'center',
          padding: '20px 0'
        }}>
          No stages defined.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {stages.map((stage, index) => (
            <div 
              key={stage.id}
              style={{
                background: index === currentStageIndex ? '#1e3a5f' : '#1e2130',
                borderRadius: 8,
                padding: '12px',
                border: `1px solid ${index === currentStageIndex ? '#4f8ef7' : '#2a2f45'}`,
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: 8 
              }}>
                <span style={{ fontSize: 13, color: '#e8eaf0', fontWeight: 500 }}>
                  {stage.name}
                </span>
                <span style={{ fontSize: 11, color: '#6b7280' }}>
                  {Math.round(stage.batteryRequiredPercent)}% batt
                </span>
              </div>
              
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>
                Waypoints: {stage.startWaypointIndex + 1} - {stage.endWaypointIndex + 1}
                <br />
                Est. time: {Math.round(stage.estimatedTimeSec / 60)} min
              </div>
              
              {index >= currentStageIndex && onResume && (
                <button
                  onClick={() => onResume(index)}
                  style={{
                    width: '100%',
                    padding: '6px 12px',
                    background: index === currentStageIndex ? '#4f8ef7' : '#2a2f45',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  {index === currentStageIndex ? 'Resume' : 'Start Stage'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
