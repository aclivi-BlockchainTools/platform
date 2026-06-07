import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { get } from '../api';
import StackBadge from '../components/StackBadge';
import TaskList from '../components/TaskList';

export default function ProjectView() {
  const { name } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    get(`/api/projects/${name}`)
      .then(setProject)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [name]);

  if (loading) return <div className="loading">Carregant projecte...</div>;
  if (error) return <div className="error-box">{error}</div>;
  if (!project) return <div className="error-box">Projecte no trobat</div>;

  const { description, stack, activeSkills, tasks, decisions, status, modelStrategy, rawClaudeMd } = project;

  const allStack = [
    ...(stack.alta || []).map(t => ({ tech: t, level: 'alta' })),
    ...(stack.mitjana || []).map(t => ({ tech: t, level: 'mitjana' })),
    ...(stack.baixa || []).map(t => ({ tech: t, level: 'baixa' }))
  ];

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'tasks', label: `Tasques (${tasks.length})` },
    { key: 'skills', label: 'Skills' },
    { key: 'decisions', label: `Decisions (${decisions.length})` },
    { key: 'claude', label: 'CLAUDE.md' }
  ];

  return (
    <div>
      <div className="page-header">
        <h2>{name}</h2>
        {description && <p>{description}</p>}
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div>
          <div className="card">
            <h3 className="mb-3">Stack</h3>
            {allStack.length > 0 ? (
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {allStack.map(s => (
                  <StackBadge key={s.tech} tech={s.tech} level={s.level} />
                ))}
              </div>
            ) : (
              <p className="text-dim">Cap stack detectat</p>
            )}
          </div>

          <div className="card">
            <h3 className="mb-3">Model Strategy</h3>
            <div className="flex gap-4 text-sm">
              <div><span className="text-dim">Principal:</span> <span className="badge badge-purple">{modelStrategy?.principal}</span></div>
              <div><span className="text-dim">Ràpid:</span> <span className="badge badge-green">{modelStrategy?.rapid}</span></div>
              <div><span className="text-dim">Auditor:</span> <span className="badge badge-yellow">{modelStrategy?.auditor}</span></div>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-3">Skills actives</h3>
            {activeSkills.length > 0 ? (
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {activeSkills.map(s => <span key={s} className="badge badge-green">{s}</span>)}
              </div>
            ) : (
              <p className="text-dim">Cap skill de domini activa</p>
            )}
          </div>

          {status && (
            <div className="card">
              <h3 className="mb-3">Estat actual</h3>
              <pre style={{ whiteSpace: 'pre-wrap', background: 'transparent', border: 'none', padding: 0 }}>{status}</pre>
            </div>
          )}
        </div>
      )}

      {activeTab === 'tasks' && (
        <div>
          <div className="flex-between mb-4">
            <h3>Tasques</h3>
            <Link to={`/project/${name}/tasks/new`} className="btn btn-primary">Nova tasca</Link>
          </div>
          <TaskList projectName={name} tasks={tasks} />
        </div>
      )}

      {activeTab === 'skills' && (
        <div className="card">
          <div className="flex-between mb-3">
            <h3>Skills del projecte</h3>
            <Link to={`/project/${name}/skills`} className="btn">Gestionar skills</Link>
          </div>
          <h4 className="text-dim mb-2">Skills de domini actives</h4>
          {activeSkills.length > 0 ? (
            <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
              {activeSkills.map(s => <span key={s} className="badge badge-green">{s}</span>)}
            </div>
          ) : (
            <p className="text-dim mb-4">Cap skill de domini activa</p>
          )}
          <p className="text-sm text-dim">
            Les skills universals (arquitectura, debugging, testing, etc.) estan sempre actives.
          </p>
        </div>
      )}

      {activeTab === 'decisions' && (
        <div className="card">
          <h3 className="mb-3">Decisions d'arquitectura</h3>
          {decisions.length > 0 ? (
            decisions.map(d => (
              <div key={d.filename} className="mb-3" style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                <strong>{d.title}</strong>
                <div className="text-sm text-dim">{d.filename} {d.date ? `(${d.date})` : ''}</div>
              </div>
            ))
          ) : (
            <p className="text-dim">Cap decisió documentada</p>
          )}
        </div>
      )}

      {activeTab === 'claude' && (
        <div className="card">
          <h3 className="mb-3">CLAUDE.md</h3>
          <pre>{rawClaudeMd}</pre>
        </div>
      )}
    </div>
  );
}
