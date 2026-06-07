import { useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { get } from '../api';

export default function Layout({ children }) {
  const location = useLocation();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    get('/api/projects').then(setProjects).catch(() => {});
  }, []);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h1>Platform AI</h1>
          <span>Consola local</span>
        </div>

        <div className="sidebar-section">Principal</div>
        <Link to="/" className={`sidebar-link ${isActive('/') ? 'active' : ''}`}>
          Dashboard
        </Link>
        <Link to="/v0" className={`sidebar-link ${isActive('/v0') ? 'active' : ''}`}>
          v0.dev
        </Link>
        <Link to="/models" className={`sidebar-link ${isActive('/models') ? 'active' : ''}`}>
          Models
        </Link>
        <Link to="/system" className={`sidebar-link ${isActive('/system') ? 'active' : ''}`}>
          System
        </Link>
        <Link to="/platform" className={`sidebar-link ${isActive('/platform') ? 'active' : ''}`}>
          Platform
        </Link>

        <div className="sidebar-section">Projectes</div>
        {projects.map(p => (
          <Link
            key={p.name}
            to={`/project/${p.name}`}
            className={`sidebar-link truncate ${isActive(`/project/${p.name}`) ? 'active' : ''}`}
          >
            {p.name}
          </Link>
        ))}
        {projects.length === 0 && (
          <div className="sidebar-link text-dim">Cap projecte</div>
        )}
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
