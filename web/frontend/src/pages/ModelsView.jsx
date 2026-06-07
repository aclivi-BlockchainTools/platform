import { useState, useEffect, useCallback } from 'react';
import { get, post, put } from '../api';
import ModelStatus from '../components/ModelStatus';

export default function ModelsView() {
  const [status, setStatus] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [config, setConfig] = useState(null);
  const [claudeStatus, setClaudeStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [savingKey, setSavingKey] = useState('');

  // Key form state
  const [deepseekKey, setDeepseekKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [showDeepseek, setShowDeepseek] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);

  const loadStatus = useCallback(() => {
    get('/api/models/status')
      .then(setStatus)
      .catch(e => setError(e.message));
  }, []);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      get('/api/models/status'),
      get('/api/models/test'),
      get('/api/system/config'),
      get('/api/system/claude-status')
    ])
      .then(([statusData, testData, configData, claudeData]) => {
        setStatus(statusData);
        setTestResults(testData);
        setConfig(configData);
        setClaudeStatus(claudeData);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, []);

  const handleAction = async (action) => {
    setActionLoading(action);
    setError('');
    try {
      await post(`/api/models/${action}`, {});
      setTimeout(() => {
        loadStatus();
        setActionLoading('');
      }, 2000);
    } catch (e) {
      setError(e.message);
      setActionLoading('');
    }
  };

  const handleTest = async () => {
    setActionLoading('test');
    setError('');
    try {
      const data = await get('/api/models/test');
      setTestResults(data);
      loadStatus();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading('');
    }
  };

  const handleSaveKey = async (key) => {
    setSavingKey(key);
    setError('');
    try {
      const updates = {};
      if (key === 'DEEPSEEK_API_KEY') updates.DEEPSEEK_API_KEY = deepseekKey;
      if (key === 'ANTHROPIC_API_KEY') updates.ANTHROPIC_API_KEY = anthropicKey;
      await put('/api/system/config', updates);
      const configData = await get('/api/system/config');
      setConfig(configData);
      if (key === 'DEEPSEEK_API_KEY') { setShowDeepseek(false); setDeepseekKey(''); }
      if (key === 'ANTHROPIC_API_KEY') { setShowAnthropic(false); setAnthropicKey(''); }
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingKey('');
    }
  };

  if (loading) return <div className="loading">Carregant estat dels models...</div>;

  const isRunning = status?.containerRunning && status?.healthy;
  const configItems = config?.items || [];
  const deepseekConfig = configItems.find(i => i.key === 'DEEPSEEK_API_KEY');
  const anthropicConfig = configItems.find(i => i.key === 'ANTHROPIC_API_KEY');

  return (
    <div>
      <div className="page-header">
        <h2>Models</h2>
        <p>Gestió de LiteLLM, models, claus API i login Claude</p>
      </div>

      {error && <div className="error-box">{error}</div>}

      {/* Claude Code Login */}
      <div className="card">
        <h3 className="mb-3">Claude Code</h3>
        <div className="flex-between">
          <div>
            <div className="flex gap-2 mb-2" style={{ alignItems: 'center' }}>
              <span className={`dot ${claudeStatus?.loggedIn ? 'dot-green' : 'dot-gray'}`} />
              <strong>{claudeStatus?.loggedIn ? 'Login actiu' : 'No has iniciat sessió'}</strong>
            </div>
            {claudeStatus?.loggedIn ? (
              <div className="text-sm text-dim">
                <div>{claudeStatus.email}</div>
                {claudeStatus.organization && <div>{claudeStatus.organization}</div>}
              </div>
            ) : (
              <p className="text-sm text-dim" style={{ maxWidth: 450 }}>
                Claude Code amb login de compte NO necessita Anthropic API Key.
                Per iniciar sessió, obre un terminal i executa:
              </p>
            )}
          </div>
          <div>
            {claudeStatus?.loggedIn ? (
              <span className="badge badge-green">Connectat</span>
            ) : (
              <div>
                <pre style={{ marginBottom: 8, padding: '6px 12px' }}>claude login</pre>
                <p className="text-sm text-dim">
                  Obre un terminal, executa <code>claude login</code> i segueix l'enllaç d'autenticació OAuth.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LiteLLM Control */}
      <div className="card">
        <div className="flex-between mb-4">
          <div>
            <h3>LiteLLM</h3>
            <div className="flex gap-2 mt-2" style={{ alignItems: 'center' }}>
              <span className={`dot ${isRunning ? 'dot-green' : 'dot-red'}`} />
              <span>{isRunning ? 'Actiu' : 'Aturat'}</span>
              {status?.host && status?.port && (
                <span className="text-sm text-dim">
                  http://{status.host}:{status.port}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              className="btn"
              onClick={() => handleAction('start')}
              disabled={isRunning || actionLoading === 'start'}
            >
              {actionLoading === 'start' ? 'Arrencant...' : 'Start'}
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleAction('stop')}
              disabled={!isRunning || actionLoading === 'stop'}
            >
              {actionLoading === 'stop' ? 'Aturant...' : 'Stop'}
            </button>
          </div>
        </div>

        <div className="flex-between">
          <h4 className="text-dim">Connectivitat</h4>
          <button
            className="btn btn-sm"
            onClick={handleTest}
            disabled={actionLoading === 'test'}
          >
            {actionLoading === 'test' ? 'Testant...' : 'Test models'}
          </button>
        </div>

        <div className="mt-3">
          {testResults.map(m => (
            <ModelStatus key={m.name} model={m} />
          ))}
        </div>

        {testResults.length === 0 && (
          <p className="text-dim mt-3">Prem "Test models" per verificar la connectivitat.</p>
        )}
      </div>

      {/* API Keys */}
      <div className="card">
        <h3 className="mb-4">Claus API</h3>

        {/* DeepSeek */}
        <div style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
          <div className="flex-between mb-2">
            <div>
              <strong>DeepSeek API Key</strong>
              <div className="text-sm text-dim">
                {deepseekConfig?.set
                  ? <span className="text-mono">{deepseekConfig.masked}</span>
                  : <span className="badge badge-red">No configurada</span>}
              </div>
              <div className="text-sm text-dim mt-1">Necessària per DeepSeek V4 Pro i Flash.</div>
            </div>
            <button
              className="btn btn-sm"
              onClick={() => setShowDeepseek(!showDeepseek)}
            >
              {deepseekConfig?.set ? 'Canviar' : 'Configurar'}
            </button>
          </div>
          {showDeepseek && (
            <div className="flex gap-3 mt-3" style={{ alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Nova clau DeepSeek</label>
                <input
                  type="password"
                  value={deepseekKey}
                  onChange={e => setDeepseekKey(e.target.value)}
                  placeholder="sk-..."
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={() => handleSaveKey('DEEPSEEK_API_KEY')}
                disabled={!deepseekKey.trim() || savingKey === 'DEEPSEEK_API_KEY'}
              >
                {savingKey === 'DEEPSEEK_API_KEY' ? 'Guardant...' : 'Guardar'}
              </button>
            </div>
          )}
        </div>

        {/* Anthropic */}
        <div style={{ padding: '12px 0' }}>
          <div className="flex-between mb-2">
            <div>
              <strong>Anthropic API Key (Claude API)</strong>
              <div className="text-sm text-dim">
                {anthropicConfig?.set
                  ? <span className="text-mono">{anthropicConfig.masked}</span>
                  : <span className="badge badge-gray">Opcional</span>}
              </div>
              <div className="text-sm text-dim mt-1" style={{ maxWidth: 500 }}>
                Només cal si vols usar Claude via LiteLLM (API). Si fas servir Claude Code amb login, no la necessites.
              </div>
            </div>
            <button
              className="btn btn-sm"
              onClick={() => setShowAnthropic(!showAnthropic)}
            >
              {anthropicConfig?.set ? 'Canviar' : 'Configurar'}
            </button>
          </div>
          {showAnthropic && (
            <div className="flex gap-3 mt-3" style={{ alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Nova clau Anthropic</label>
                <input
                  type="password"
                  value={anthropicKey}
                  onChange={e => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={() => handleSaveKey('ANTHROPIC_API_KEY')}
                disabled={!anthropicKey.trim() || savingKey === 'ANTHROPIC_API_KEY'}
              >
                {savingKey === 'ANTHROPIC_API_KEY' ? 'Guardant...' : 'Guardar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
