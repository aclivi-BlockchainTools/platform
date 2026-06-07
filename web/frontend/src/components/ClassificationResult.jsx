const modelColors = {
  'deepseek-v4-pro': 'badge-purple',
  'deepseek-v4-flash': 'badge-green',
  'claude-sonnet': 'badge-yellow',
  'claude-haiku': 'badge-gray'
};

export default function ClassificationResult({ classification }) {
  if (!classification) return null;

  const { category, model, reason, alternative } = classification;
  const badge = modelColors[model] || 'badge-purple';

  return (
    <div className="card" style={{ borderLeft: '3px solid var(--accent)' }}>
      <div className="flex gap-4" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <div className="text-sm text-dim mb-1">Model recomanat</div>
          <span className={`badge ${badge}`} style={{ fontSize: 14, padding: '4px 12px' }}>
            {model}
          </span>
        </div>
        <div>
          <div className="text-sm text-dim mb-1">Categoria</div>
          <span className="badge badge-gray">{category || '—'}</span>
        </div>
      </div>
      {reason && <p className="mt-3 text-sm text-dim">{reason}</p>}
      {alternative && <p className="text-sm text-dim">Alternativa: {alternative}</p>}
    </div>
  );
}
