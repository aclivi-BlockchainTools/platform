import { useState, useEffect } from 'react';
import { get } from '../api';

export default function SystemView() {
  const [doctor, setDoctor] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      get('/api/system/doctor'),
      get('/api/system/config')
    ])
      .then(([doctorData, configData]) => {
        setDoctor(doctorData);
        setConfig(configData);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <div className="loading">Verificant sistema...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>System</h2>
        <p>Estat del sistema i configuració</p>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="card">
        <div className="flex-between mb-4">
          <h3>Doctor</h3>
          <button className="btn btn-sm" onClick={loadData}>Refrescar</button>
        </div>

        {doctor?.items && doctor.items.length > 0 ? (
          <div>
            {doctor.items.map((item, i) => {
              const icons = { ok: 'dot-green', warn: 'dot-yellow', error: 'dot-red', header: '', info: '' };
              const icon = icons[item.status];
              return (
                <div key={i} className="flex gap-2 mb-1" style={{ alignItems: 'center' }}>
                  {icon && <span className={`dot ${icon}`} />}
                  {!icon && <span style={{ width: 8 }} />}
                  <span className={`text-sm ${item.status === 'header' ? 'text-dim' : ''}`}>
                    {item.status === 'header' ? <strong>{item.message}</strong> : item.message}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <pre style={{ maxHeight: 400, overflow: 'auto' }}>{doctor?.raw || 'No data'}</pre>
        )}
      </div>

      <div className="card">
        <h3 className="mb-4">Configuració</h3>
        <div>
          {config?.items?.map(item => (
            <div key={item.key} className="flex-between mb-3" style={{ paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
              <div>
                <strong className="text-sm">{item.label}</strong>
                <div className="text-sm text-dim">{item.key}</div>
              </div>
              <div className="flex gap-2" style={{ alignItems: 'center' }}>
                {item.set ? (
                  <>
                    <span className="dot dot-green" />
                    <span className="text-sm text-mono">{item.masked}</span>
                  </>
                ) : (
                  <>
                    <span className={`dot ${item.required ? 'dot-red' : 'dot-gray'}`} />
                    <span className="text-sm text-dim">{item.required ? 'Pendent' : 'Opcional'}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {(!config || config.items?.length === 0) && (
          <p className="text-dim">No s'ha pogut llegir la configuració de ~/.platform/.env</p>
        )}
      </div>
    </div>
  );
}
