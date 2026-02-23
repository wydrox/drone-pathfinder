import { useState, useEffect } from 'react';
import type { LatLng } from '@/types/mission';
import { generateSpiralPath, generateHelixPath, generateGoldenRatioPath } from '@/lib/pathGenerators';

interface Props {
  onGenerateWaypoints: (waypoints: LatLng[]) => void;
}

type VideoMode = 'spiral' | 'helix' | 'golden';

export function VideoMissionPanel({ onGenerateWaypoints }: Props) {
  const [mode, setMode] = useState<VideoMode>('spiral');
  const [center, setCenter] = useState<LatLng | null>(null);
  const [radius, setRadius] = useState(50);
  const [altitude, setAltitude] = useState(50);
  const [speed, setSpeed] = useState(5);
  const [duration, setDuration] = useState(30);
  const [isSettingCenter, setIsSettingCenter] = useState(false);

  useEffect(() => {
    if (isSettingCenter) {
      const handleMapClick = (_e: MouseEvent) => {
        // This would be connected to map click events via props
        setIsSettingCenter(false);
      };
      window.addEventListener('click', handleMapClick);
      return () => window.removeEventListener('click', handleMapClick);
    }
  }, [isSettingCenter]);

  const handleGenerate = () => {
    if (!center) return;
    
    const config = {
      center,
      radiusMeters: radius,
      altitudeMeters: altitude,
      speedMps: speed,
      durationSeconds: duration,
    };

    let points: LatLng[] = [];
    switch (mode) {
      case 'spiral':
        points = generateSpiralPath(config);
        break;
      case 'helix':
        points = generateHelixPath(config);
        break;
      case 'golden':
        points = generateGoldenRatioPath(config);
        break;
    }
    
    onGenerateWaypoints(points);
  };

  const modeInfo = {
    spiral: 'Spiral inward from outer radius to center',
    helix: 'Circular orbit at constant radius',
    golden: 'Golden ratio spiral for cinematic composition',
  };

  return (
    <div style={{ padding: '12px 0' }}>
      <div style={{ 
        fontSize: 13, 
        fontWeight: 600, 
        color: '#e8eaf0',
        marginBottom: 16,
      }}>
        Video Mission Generator
      </div>

      {/* Mode Selection */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ 
          fontSize: 10, 
          color: 'var(--text-dim)', 
          display: 'block', 
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontFamily: 'var(--font-mono)',
        }}>
          Flight Mode
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['spiral', 'helix', 'golden'] as VideoMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: '8px 0',
                fontSize: 11,
                cursor: 'pointer',
                background: mode === m ? 'var(--accent)' : 'var(--bg-card)',
                border: `1px solid ${mode === m ? 'var(--accent)' : 'var(--border)'}`,
                color: mode === m ? '#fff' : 'var(--text-muted)',
                fontWeight: mode === m ? 600 : 400,
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
              }}
            >
              {m}
            </button>
          ))}
        </div>
        <div style={{ 
          fontSize: 11, 
          color: 'var(--text-muted)', 
          marginTop: 8,
          fontStyle: 'italic',
        }}>
          {modeInfo[mode]}
        </div>
      </div>

      {/* Center Point */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ 
          fontSize: 10, 
          color: 'var(--text-dim)', 
          display: 'block', 
          marginBottom: 8,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontFamily: 'var(--font-mono)',
        }}>
          Center Point
        </label>
        {center ? (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            padding: '8px 12px',
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>{center.lat.toFixed(5)}, {center.lng.toFixed(5)}</span>
            <button
              onClick={() => setCenter(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsSettingCenter(true)}
            style={{
              width: '100%',
              padding: '12px',
              background: isSettingCenter ? 'var(--accent)' : 'var(--bg-card)',
              border: `1px dashed ${isSettingCenter ? 'var(--accent)' : 'var(--border)'}`,
              color: isSettingCenter ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
            }}
          >
            {isSettingCenter ? 'Click on map to set center...' : '[ SET CENTER ON MAP ]'}
          </button>
        )}
      </div>

      {/* Radius Slider */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: 8,
        }}>
          <label style={{ 
            fontSize: 10, 
            color: 'var(--text-dim)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: 'var(--font-mono)',
          }}>
            Radius
          </label>
          <span style={{
            fontSize: 11,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}>
            {radius}m
          </span>
        </div>
        <input
          type="range"
          min={10}
          max={200}
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Altitude Slider */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: 8,
        }}>
          <label style={{ 
            fontSize: 10, 
            color: 'var(--text-dim)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: 'var(--font-mono)',
          }}>
            Altitude
          </label>
          <span style={{
            fontSize: 11,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}>
            {altitude}m
          </span>
        </div>
        <input
          type="range"
          min={10}
          max={500}
          value={altitude}
          onChange={(e) => setAltitude(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Speed Slider */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: 8,
        }}>
          <label style={{ 
            fontSize: 10, 
            color: 'var(--text-dim)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: 'var(--font-mono)',
          }}>
            Speed
          </label>
          <span style={{
            fontSize: 11,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}>
            {speed}m/s
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={15}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Duration Slider */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: 8,
        }}>
          <label style={{ 
            fontSize: 10, 
            color: 'var(--text-dim)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontFamily: 'var(--font-mono)',
          }}>
            Duration
          </label>
          <span style={{
            fontSize: 11,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
          }}>
            {duration}s
          </span>
        </div>
        <input
          type="range"
          min={10}
          max={120}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!center}
        style={{
          width: '100%',
          padding: '14px',
          background: center ? 'var(--accent)' : 'var(--bg-card)',
          border: 'none',
          color: center ? '#fff' : 'var(--text-muted)',
          cursor: center ? 'pointer' : 'not-allowed',
          fontSize: 12,
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          opacity: center ? 1 : 0.5,
        }}
      >
        Generate Video Path
      </button>
    </div>
  );
}
