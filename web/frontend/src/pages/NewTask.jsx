import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { post } from '../api';
import ClassificationResult from '../components/ClassificationResult';

const MODELS = [
  { value: '', label: 'Auto (routing engine)' },
  { value: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
  { value: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
  { value: 'claude-sonnet', label: 'Claude Sonnet' },
  { value: 'claude-haiku', label: 'Claude Haiku' }
];

export default function NewTask() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [classification, setClassification] = useState(null);
  const [classifying, setClassifying] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [forceModel, setForceModel] = useState('');

  const handleClassify = async () => {
    if (!description.trim()) return;
    setClassifying(true);
    setError('');
    setClassification(null);
    try {
      const data = await post('/api/routing/classify', { description });
      setClassification(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setClassifying(false);
    }
  };

  const handleExecute = async (modelOverride) => {
    setExecuting(true);
    setError('');
    setResult(null);
    try {
      const body = { description };
      if (modelOverride) body.forceModel = modelOverride;
      const data = await post(`/api/projects/${name}/tasks`, body);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setExecuting(false);
    }
  };

  const recommendedModel = classification?.model;
  const executionMode = result?.executionMode;

  return (
    <div>
      <div className="page-header">
        <h2>Nova tasca</h2>
        <p>Projecte: <strong>{name}</strong></p>
      </div>

      <div className="card">
        <div className="form-group">
          <label htmlFor="task-desc">Què vols fer?</label>
          <textarea
            id="task-desc"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="ex: Afegir dashboard multi-sessió WhatsApp"
            rows={3}
          />
        </div>

        <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={handleClassify}
            disabled={!description.trim() || classifying}
          >
            {classifying ? 'Classificant...' : 'Classificar tasca'}
          </button>

          {classification && (
            <button
              className="btn btn-primary"
              onClick={() => handleExecute(forceModel || undefined)}
              disabled={executing}
            >
              {executing ? 'Executant...' : `Executar amb ${forceModel || recommendedModel || 'routing'}`}
            </button>
          )}
        </div>

        {classification && (
          <div className="mt-3">
            <div className="form-group">
              <label htmlFor="force-model">Forçar model (opcional)</label>
              <select
                id="force-model"
                value={forceModel}
                onChange={e => setForceModel(e.target.value)}
              >
                {MODELS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {error && <div className="error-box">{error}</div>}
      {classification && <ClassificationResult classification={classification} />}

      {executing && (
        <div className="card">
          <div className="loading">Executant tasca amb {forceModel || recommendedModel || 'LiteLLM'}...</div>
        </div>
      )}

      {result && (
        <div className="card">
          <div className="flex-between mb-4">
            <h3>Resultat</h3>
            <div className="flex gap-2">
              {executionMode === 'manual' && <span className="badge badge-yellow">Prompt manual</span>}
              {executionMode === 'litellm' && <span className="badge badge-green">LiteLLM</span>}
              {executionMode === 'error' && <span className="badge badge-red">Error</span>}
              <span className="badge badge-purple">{result.model}</span>
            </div>
          </div>

          {executionMode === 'manual' && (
            <div className="mb-4">
              <p className="mb-3">
                Claude Code no està configurat via API. Obre un terminal i executa:
              </p>
              <pre>cd ~/Projects/{name} && claude</pre>
              <p className="mt-3 text-sm text-dim">
                Copia el prompt generat com a missatge inicial a Claude Code.
              </p>
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <pre style={{ maxHeight: 500, overflow: 'auto' }}>{result.response}</pre>
            <button
              className="btn btn-sm"
              style={{ position: 'absolute', top: 8, right: 8 }}
              onClick={() => navigator.clipboard.writeText(result.response)}
            >
              Copiar
            </button>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/project/${name}/tasks/${result.filename}`)}
            >
              Veure tasca guardada
            </button>
            <button
              className="btn"
              onClick={() => {
                setDescription('');
                setClassification(null);
                setResult(null);
                setError('');
              }}
            >
              Nova tasca
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
