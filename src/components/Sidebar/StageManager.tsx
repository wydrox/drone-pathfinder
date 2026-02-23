import { useState } from 'react';
import type { MissionV2, MissionStage, BatteryConfig } from '@/types/mission';
import { 
  calculateBatteryRequirement, 
  splitMissionIntoStages, 
  generateResumeToken,
  DEFAULT_BATTERY_CONFIG 
} from '@/lib/missionStages';
import type { MissionConfig } from '@/types/mission';

interface Props {
  mission?: MissionV2;
  config?: MissionConfig;
  waypoints?: Array<{ id: string; lat: number; lng: number; altitude: number; index: number }>;
}

export function StageManager({ mission, config, waypoints = [] }: Props) {
  const [batteryConfig, setBatteryConfig] = useState<BatteryConfig>(DEFAULT_BATTERY_CONFIG);
  const [showConfig, setShowConfig] = useState(false);

  const stages = mission && config 
    ? splitMissionIntoStages(mission, batteryConfig)
    : [];

  const totalBatteryRequired = waypoints.length > 0 && config
    ? calculateBatteryRequirement(
        waypoints.map((wp) => ({ 
          ...wp, 
          actions: [{ id: `action-\${wp.id}`, type: 'photo' as const }]
        })),
        config,
        batteryConfig
      )
    : 0;

  const handleGenerateTokens = (stageIndex: number) => {
    if (!mission) return;
    const token = generateResumeToken(
      mission, 
      stages[stageIndex]?.startWaypointIndex || 0,
      stageIndex
    );
    console.log('Resume token:', token);
  };

  return (
    <div style={{ padding: '12px 0' }}>
      <div style={{ 
        fontSize: 13, 
        fontWeight: 600, 
        color: '#e8eaf0',
        marginBottom: 16,
      }}>
        Battery & Mission Staging
      </div>

      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        padding: '12px',
        marginBottom: 16,
        borderRadius: 6,
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: 8,
        }}>
          Battery Requirement
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
        }}>
          <span style={{
            fontSize: 24,
            fontWeight: 700,
            color: totalBatteryRequired > 100 ? '#ef4444' : totalBatteryRequired > 80 ? '#f59e0b' : '#22c55e',
            fontFamily: 'var(--font-mono)',
          }}>
            {Math.round(totalBatteryRequired)}
          </span>
          <span style={{
            fontSize: 14,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}>
            %
          </span>
        </div>
        {totalBatteryRequired > 100 && (
          <div style={{
            fontSize: 11,
            color: '#ef4444',
            marginTop: 8,
            fontFamily: 'var(--font-mono)',
          }}>
            ⚠️ Exceeds battery capacity - mission will be split into stages
          </div>
        )}
      </div>

      <button
        onClick={() => setShowConfig(!showConfig)}
        style={{
          width: '100%',
          padding: '10px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>Battery Configuration</span>
        <span>{showConfig ? '▼' : '▶'}</span>
      </button>

      {showConfig && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          padding: '12px',
          marginBottom: 16,
          borderRadius: 6,
        }}>
          {[
            { key: 'capacityMah', label: 'Capacity', min: 1000, max: 10000, unit: 'mAh', step: 100 },
            { key: 'voltage', label: 'Voltage', min: 7.4, max: 25.2, unit: 'V', step: 0.1 },
            { key: 'reservePercent', label: 'Reserve', min: 10, max: 50, unit: '%', step: 5 },
            { key: 'hoverCurrentAmps', label: 'Hover Current', min: 5, max: 30, unit: 'A', step: 1 },
            { key: 'cruiseCurrentAmps', label: 'Cruise Current', min: 5, max: 25, unit: 'A', step: 1 },
          ].map((param) => (
            <div key={param.key} style={{ marginBottom: 12 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 4,
              }}>
                <label style={{
                  fontSize: 10,
                  color: 'var(--text-dim)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {param.label}
                </label>
                <span style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {batteryConfig[param.key as keyof BatteryConfig]}{param.unit}
                </span>
              </div>
              <input
                type="range"
                min={param.min}
                max={param.max}
                step={param.step}
                value={batteryConfig[param.key as keyof BatteryConfig]}
                onChange={(e) => setBatteryConfig((prev: BatteryConfig) => ({
                  ...prev,
                  [param.key]: parseFloat(e.target.value)
                }))}
                style={{ width: '100%' }}
              />
            </div>
          ))}
        </div>
      )}

      {stages.length > 0 && (
        <div>
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
            Mission Stages ({stages.length})
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stages.map((stage, index) => (
              <div
                key={stage.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '10px 12px',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 4,
                }}>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {stage.name}
                  </span>
                  <span style={{
                    fontSize: 11,
                    color: stage.batteryRequiredPercent > 80 ? '#ef4444' : '#22c55e',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {Math.round(stage.batteryRequiredPercent)}%
                  </span>
                </div>

                <div style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  marginBottom: 8,
                }}>
                  WP {stage.startWaypointIndex + 1}-{stage.endWaypointIndex + 1} • {Math.round(stage.estimatedTimeSec / 60)}min
                </div>

                <button
                  onClick={() => handleGenerateTokens(index)}
                  style={{
                    width: '100%',
                    padding: '6px',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                  }}
                >
                  Generate Resume Token
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {stages.length === 0 && waypoints.length === 0 && (
        <div style={{
          color: 'var(--text-muted)',
          fontSize: 12,
          textAlign: 'center',
          padding: '20px 0',
          fontFamily: 'var(--font-mono)',
        }}>
          No waypoints to stage.
          <br />
          Create a mission first.
        </div>
      )}
    </div>
  );
}
