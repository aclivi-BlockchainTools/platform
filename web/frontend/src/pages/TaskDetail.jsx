import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { get, patch } from '../api';

export default function TaskDetail() {
  const { name, filename } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dod, setDod] = useState({ implementat: '', verificat: '', completat: '' });
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTask();
  }, [name, filename]);

  const loadTask = async () => {
    setLoading(true);
    try {
      const data = await get(`/api/projects/${name}/tasks/${filename}`);
      setTask(data);
      setDod({
        implementat: data.implementat || 'no',
        verificat: data.verificat || 'no',
        completat: data.completat || 'no'
      });
      setNotes(data.notes || '');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDoD = async () => {
    setSaving(true);
    try {
      const updated = await patch(`/api/projects/${name}/tasks/${filename}/status`, {
        implementat: dod.implementat,
        verificat: dod.verificat,
        completat: dod.completat,
        notes
      });
      setTask(updated);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Carregant tasca...</div>;
  if (error) return <div className="error-box">{error}</div>;
  if (!task) return <div className="error-box">Tasca no trobada</div>;

  const dofFields = [
    { key: 'implementat', label: 'Implementat' },
    { key: 'verificat', label: 'Verificat' },
    { key: 'completat', label: 'Completat' }
  ];

  return (
    <div>
      <div className="page-header">
        <Link to={`/project/${name}`} className="text-sm text-dim mb-2" style={{ display: 'block' }}>
          ← {name}
        </Link>
        <h2>{task.title}</h2>
        <div className="flex gap-3 text-sm text-dim mt-2">
          <span>{task.date}</span>
          <span className="badge badge-purple">{task.model}</span>
          <span className="badge badge-gray">{task.category}</span>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-3">Prompt</h3>
        <pre>{task.prompt}</pre>
      </div>

      <div className="card">
        <h3 className="mb-3">Resposta del model</h3>
        <pre style={{ maxHeight: 500, overflow: 'auto' }}>{task.response}</pre>
      </div>

      <div className="card">
        <h3 className="mb-3">Definition of Done</h3>

        <div className="grid-2 mb-4">
          {dofFields.map(({ key, label }) => (
            <div key={key} className="form-group">
              <label>{label}</label>
              <select
                value={dod[key]}
                onChange={e => setDod(prev => ({ ...prev, [key]: e.target.value }))}
              >
                <option value="no">No</option>
                <option value="sí">Sí</option>
              </select>
              <span className="text-sm text-dim">
                <span className={`dot ${dod[key] === 'sí' ? 'dot-green' : 'dot-gray'}`} />
                {dod[key] === 'sí' ? 'Completat' : 'Pendent'}
              </span>
            </div>
          ))}
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={4}
            placeholder="Notes addicionals..."
          />
        </div>

        <div className="flex gap-3">
          <button className="btn btn-primary" onClick={handleSaveDoD} disabled={saving}>
            {saving ? 'Guardant...' : 'Guardar canvis'}
          </button>
          <Link to={`/project/${name}/tasks/new`} className="btn">Nova tasca</Link>
        </div>
      </div>
    </div>
  );
}
