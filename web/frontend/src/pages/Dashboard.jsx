import { useState, useEffect } from 'react';
import { get } from '../api';
import ProjectCard from '../components/ProjectCard';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    get('/api/projects')
      .then(setProjects)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Carregant projectes...</div>;
  if (error) return <div className="error-box">{error}</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Projectes a ~/Projects</p>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <p>No s'han trobat projectes a ~/Projects.</p>
          <p className="text-sm">
            Crea un projecte nou amb <code>platform new &lt;nom&gt;</code>
          </p>
        </div>
      ) : (
        <div className="grid-2">
          {projects.map(p => (
            <ProjectCard key={p.name} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
