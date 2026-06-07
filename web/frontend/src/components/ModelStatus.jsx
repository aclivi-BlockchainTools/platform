const statusColors = {
  ok: { badge: 'badge-green', dot: 'dot-green', label: 'ACTIU' },
  error: { badge: 'badge-red', dot: 'dot-red', label: 'ERROR' },
  skipped: { badge: 'badge-gray', dot: 'dot-gray', label: 'NO DISPONIBLE' },
  testing: { badge: 'badge-yellow', dot: 'dot-yellow', label: 'TESTANT' }
};

export default function ModelStatus({ model }) {
  const colors = statusColors[model.status] || statusColors.skipped;

  return (
    <div className="flex-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div className="flex gap-3" style={{ alignItems: 'center' }}>
        <span className={`dot ${colors.dot}`} />
        <div>
          <strong>{model.label}</strong>
          <div className="text-sm text-dim">{model.name}</div>
        </div>
        <span className={`badge ${colors.badge}`}>{colors.label}</span>
        {model.viaClaudeCode && (
          <span className="badge badge-purple">Claude Code</span>
        )}
      </div>
      <div className="flex gap-2" style={{ alignItems: 'center' }}>
        {model.message && (
          <span className={`text-sm ${model.status === 'ok' ? '' : 'text-dim'}`}>
            {model.message}
          </span>
        )}
      </div>
    </div>
  );
}
