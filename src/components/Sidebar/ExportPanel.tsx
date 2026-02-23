interface Props {
  onExportKmz: () => void;
  onExportGpx: () => void;
  onExportJson: () => void;
  onImport: (f: File) => void;
  waypointCount: number;
}

export function ExportPanel({ onExportKmz, onExportGpx, onExportJson, onImport, waypointCount }: Props) {
  const disabled = waypointCount === 0;
  const btnStyle = (color: string, dis: boolean) => ({
    width: '100%', padding: '12px 16px', borderRadius: 9, border: `1px solid ${dis ? '#2a2f45' : color + '40'}`,
    background: dis ? '#1a1d24' : color + '15', color: dis ? '#374151' : color,
    cursor: dis ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600,
    textAlign: 'left' as const, marginBottom: 10, transition: 'all 0.15s',
    display: 'flex', alignItems: 'center', gap: 10,
  });

  return (
    <div>
      {disabled && (
        <div style={{ background: '#1e2130', borderRadius: 8, padding: '10px 12px', marginBottom: 16, color: '#6b7280', fontSize: 12 }}>
          Draw a zone and generate waypoints first.
        </div>
      )}
      <button style={btnStyle('#4f8ef7', disabled)} onClick={onExportKmz} disabled={disabled}>
        <span>📦</span> Download KMZ <span style={{ fontSize: 11, marginLeft: 'auto', opacity: 0.7 }}>DJI Fly</span>
      </button>
      <button style={btnStyle('#22c55e', disabled)} onClick={onExportGpx} disabled={disabled}>
        <span>🗺</span> Download GPX <span style={{ fontSize: 11, marginLeft: 'auto', opacity: 0.7 }}>GPS route</span>
      </button>
      <button style={btnStyle('#7c3aed', disabled)} onClick={onExportJson} disabled={disabled}>
        <span>{'{}'}</span> Download JSON <span style={{ fontSize: 11, marginLeft: 'auto', opacity: 0.7 }}>raw data</span>
      </button>

      <div style={{ marginTop: 24, borderTop: '1px solid #2a2f45', paddingTop: 20 }}>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>Import KMZ</div>
        <label style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: 80, border: '2px dashed #2a2f45', borderRadius: 10, cursor: 'pointer',
          color: '#6b7280', fontSize: 13, gap: 6, transition: 'border-color 0.15s',
        }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) onImport(f); }}>
          <span style={{ fontSize: 24 }}>📂</span>
          Drag & drop KMZ or click to browse
          <input type="file" accept=".kmz" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) onImport(f); }} />
        </label>
      </div>
    </div>
  );
}
