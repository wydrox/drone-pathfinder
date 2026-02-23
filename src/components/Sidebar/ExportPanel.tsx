interface Props {
  onExportKmz: () => void;
  onExportGpx: () => void;
  onExportJson: () => void;
  onImport: (f: File) => void;
  waypointCount: number;
}

export function ExportPanel({ onExportKmz, onExportGpx, onExportJson, onImport, waypointCount }: Props) {
  const disabled = waypointCount === 0;

  const btnBase = {
    width: '100%',
    padding: '12px 16px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 12,
    fontWeight: 600,
    textAlign: 'left' as const,
    marginBottom: 8,
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    opacity: disabled ? 0.4 : 1,
    transition: 'all 0.1s',
  };

  return (
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
        Export Mission
      </div>

      {disabled && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          padding: '12px',
          marginBottom: 16,
          color: 'var(--text-muted)',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
        }}>
          [ WARNING ] No waypoints to export. Draw a zone first.
        </div>
      )}

      <button
        style={btnBase}
        onClick={onExportKmz}
        disabled={disabled}
        onMouseEnter={e => !disabled && (e.currentTarget.style.borderColor = 'var(--accent)')}
        onMouseLeave={e => !disabled && (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>KMZ</span>
          <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 400 }}>DJI Fly</span>
        </div>
        <div style={{
          fontSize: 10,
          color: 'var(--text-muted)',
          fontWeight: 400,
          marginTop: 4,
          textTransform: 'none',
          letterSpacing: 'normal',
        }}>
          Waylines.wpml format for DJI drones
        </div>
      </button>

      <button
        style={btnBase}
        onClick={onExportGpx}
        disabled={disabled}
        onMouseEnter={e => !disabled && (e.currentTarget.style.borderColor = 'var(--success)')}
        onMouseLeave={e => !disabled && (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>GPX</span>
          <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 400 }}>GPS Route</span>
        </div>
        <div style={{
          fontSize: 10,
          color: 'var(--text-muted)',
          fontWeight: 400,
          marginTop: 4,
          textTransform: 'none',
          letterSpacing: 'normal',
        }}>
          Standard GPS exchange format
        </div>
      </button>

      <button
        style={btnBase}
        onClick={onExportJson}
        disabled={disabled}
        onMouseEnter={e => !disabled && (e.currentTarget.style.borderColor = 'var(--text-secondary)')}
        onMouseLeave={e => !disabled && (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>JSON</span>
          <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 400 }}>Raw Data</span>
        </div>
        <div style={{
          fontSize: 10,
          color: 'var(--text-muted)',
          fontWeight: 400,
          marginTop: 4,
          textTransform: 'none',
          letterSpacing: 'normal',
        }}>
          Full mission data with metadata
        </div>
      </button>

      <div style={{
        marginTop: 24,
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: 20,
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: 12,
        }}>
          Import Mission
        </div>

        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: 80,
            border: '2px dashed var(--border)',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            fontSize: 12,
            gap: 8,
            fontFamily: 'var(--font-mono)',
            transition: 'border-color 0.1s',
          }}
          onDragOver={e => {
            e.preventDefault();
            (e.currentTarget as HTMLLabelElement).style.borderColor = 'var(--text-muted)';
          }}
          onDragLeave={e => {
            (e.currentTarget as HTMLLabelElement).style.borderColor = 'var(--border)';
          }}
          onDrop={e => {
            e.preventDefault();
            (e.currentTarget as HTMLLabelElement).style.borderColor = 'var(--border)';
            const f = e.dataTransfer.files[0];
            if (f) onImport(f);
          }}
        >
          <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>[ DROP KMZ FILE ]</span>
          <span>or click to browse</span>
          <input
            type="file"
            accept=".kmz"
            style={{ display: 'none' }}
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
            }}
          />
        </label>
      </div>
    </div>
  );
}
