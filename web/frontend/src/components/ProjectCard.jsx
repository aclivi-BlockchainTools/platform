import { Link } from 'react-router-dom';
import StackBadge from './StackBadge';

function DoDDot({ label, value }) {
  const cls = value === 'sí' || value === 'si' ? 'dot-green' : 'dot-gray';
  return <span title={`${label}: ${value}`}><span className={`dot ${cls}`} /></span>;
}

export default function ProjectCard({ project }) {
  const { name, description, stack, activeSkills, lastTask, status: projStatus } = project;

  const allStack = [
    ...(stack.alta || []).map(t => ({ tech: t, level: 'alta' })),
    ...(stack.mitjana || []).map(t => ({ tech: t, level: 'mitjana' })),
    ...(stack.baixa || []).map(t => ({ tech: t, level: 'baixa' }))
  ].slice(0, 5);

  return (
    <Link to={`/project/${name}`} style={{ textDecoration: 'none' }}>
      <div className="card">
        <div className="flex-between mb-3">
          <h3 style={{ color: 'var(--accent)', fontSize: 16 }}>{name}</h3>
          <div className="flex gap-2">
            <DoDDot label="Implementat" value={lastTask?.implementat} />
            <DoDDot label="Verificat" value={lastTask?.verificat} />
            <DoDDot label="Completat" value={lastTask?.completat} />
          </div>
        </div>

        {description && <p className="text-sm text-dim mb-3">{description}</p>}

        {allStack.length > 0 && (
          <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
            {allStack.map(s => (
              <StackBadge key={s.tech} tech={s.tech} level={s.level} />
            ))}
          </div>
        )}

        <div className="flex-between text-sm text-dim">
          <span>
            {activeSkills?.length > 0
              ? `${activeSkills.length} skill${activeSkills.length > 1 ? 's' : ''} actives`
              : 'Cap skill de domini'}
          </span>
          {lastTask && (
            <span className="truncate" style={{ maxWidth: '60%' }}>
              {lastTask.title}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
