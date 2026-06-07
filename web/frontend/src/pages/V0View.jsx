import { useState, useEffect } from 'react';
import { get, post } from '../api';

export default function V0View() {
  const [types, setTypes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      get('/api/v0/types'),
      get('/api/projects')
    ])
      .then(([typesData, projectsData]) => {
        setTypes(typesData);
        setProjects(projectsData);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    if (!selectedType) return;
    setGenerating(true);
    setError('');
    setPrompt('');
    try {
      const data = await post('/api/v0/generate', {
        type: selectedType,
        projectName: selectedProject || undefined
      });
      setPrompt(data.prompt);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="loading">Carregant...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>v0.dev</h2>
        <p>Generar prompts per a interfícies premium amb v0.dev</p>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="card">
        <div className="form-group">
          <label htmlFor="v0-type">Tipus de prompt</label>
          <select
            id="v0-type"
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
          >
            <option value="">— Selecciona —</option>
            {types.map(t => (
              <option key={t.name} value={t.name}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="v0-project">Projecte (opcional — contextualitza el prompt)</label>
          <select
            id="v0-project"
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
          >
            <option value="">— Sense projecte —</option>
            {projects.map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={!selectedType || generating}
        >
          {generating ? 'Generant...' : 'Generar prompt'}
        </button>
      </div>

      {prompt && (
        <div className="card" style={{ position: 'relative' }}>
          <div className="flex-between mb-3">
            <h3>Prompt generat</h3>
            <button className="btn btn-sm" onClick={handleCopy}>
              {copied ? 'Copiat!' : 'Copiar'}
            </button>
          </div>
          <pre style={{ maxHeight: 600, overflow: 'auto' }}>{prompt}</pre>

          <div className="mt-4 p-3" style={{ background: 'var(--bg)', borderRadius: 6 }}>
            <h4 className="mb-2">Instruccions</h4>
            <ol className="text-sm text-dim" style={{ paddingLeft: 20 }}>
              <li>Copia el prompt generat</li>
              <li>Reemplaça els placeholders [ENTRE CLAUDÀTORS]</li>
              <li>Enganxa a <a href="https://v0.dev" target="_blank" rel="noopener noreferrer">v0.dev</a></li>
              <li>Itera amb v0.dev fins a obtenir el resultat desitjat</li>
              <li>Exporta el codi i integra'l amb Claude Code</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
