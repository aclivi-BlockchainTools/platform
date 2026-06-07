import { Link } from 'react-router-dom';

function StatusBadge({ value }) {
  const yes = value === 'sí' || value === 'si';
  return (
    <span className={`badge ${yes ? 'badge-green' : 'badge-gray'}`}>
      {yes ? '✓' : '—'} {value}
    </span>
  );
}

export default function TaskList({ projectName, tasks }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="empty-state">
        <p>Cap tasca creada</p>
        <Link to={`/project/${projectName}/tasks/new`} className="btn btn-primary mt-3">
          Crear primera tasca
        </Link>
      </div>
    );
  }

  return (
    <div>
      {tasks.map(t => (
        <Link
          key={t.filename}
          to={`/project/${projectName}/tasks/${t.filename}`}
          style={{ textDecoration: 'none' }}
        >
          <div className="card">
            <div className="flex-between mb-2">
              <strong style={{ color: 'var(--accent)' }} className="truncate" title={t.title}>
                {t.title}
              </strong>
              <span className="badge badge-purple text-sm">{t.model}</span>
            </div>
            <div className="flex gap-3 text-sm">
              <span className="text-dim">{t.date}</span>
              <StatusBadge value={t.implementat} />
              <StatusBadge value={t.verificat} />
              <StatusBadge value={t.completat} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
