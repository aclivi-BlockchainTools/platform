import { useState, useEffect } from 'react';
import { get } from '../api';

function Section({ title, children }) {
  return (
    <div className="card">
      <h3 className="mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function PlatformView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    get('/api/platform/overview')
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Carregant estructura del repo...</div>;
  if (error) return <div className="error-box">{error}</div>;
  if (!data) return <div className="error-box">No data</div>;

  const { universalSkills, domainSkills, mcps, scripts, routing, litellm, templates, v0Prompts, patterns, web } = data;

  return (
    <div>
      <div className="page-header">
        <h2>Platform</h2>
        <p>Estructura completa del repo — què porta i què fa cada peça</p>
      </div>

      {/* Skills */}
      <Section title={`Skills universals (${universalSkills.length})`}>
        <p className="text-sm text-dim mb-4">Sempre actives a tots els projectes. Fitxers a <code>skills/universal/</code>.</p>
        <div className="grid-2">
          {universalSkills.map(s => (
            <div key={s.name} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <strong>{s.title}</strong>
              <div className="text-sm text-dim"><code>{s.file}</code></div>
            </div>
          ))}
        </div>
      </Section>

      <Section title={`Skills de domini (${domainSkills.length})`}>
        <p className="text-sm text-dim mb-4">
          Activació manual per projecte via airlock. Directori: <code>skills/domain/</code>.
          {domainSkills.length === 0 && ' Encara no hi ha skills de domini creades.'}
        </p>
        {domainSkills.length > 0 && (
          <div className="grid-2">
            {domainSkills.map(s => (
              <div key={s.name} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <strong>{s.title}</strong>
                <div className="text-sm text-dim"><code>{s.name}/</code></div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* MCPs */}
      <Section title={`MCPs (${mcps.length})`}>
        <p className="text-sm text-dim mb-4">Registrats a <code>mcp/registry.json</code>. Només context7 s'activa automàticament.</p>
        <div>
          {mcps.map(mcp => (
            <div key={mcp.name} className="flex-between" style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <strong>{mcp.name}</strong>
                <div className="text-sm text-dim">{mcp.description}</div>
              </div>
              <div className="flex gap-2">
                <span className="badge badge-gray">{mcp.category}</span>
                {mcp.alwaysEnabled && <span className="badge badge-green">auto</span>}
                {mcp.requiresSkill && <span className="badge badge-yellow">necessita {mcp.requiresSkill}</span>}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Scripts */}
      <Section title={`Scripts (${scripts.length})`}>
        <p className="text-sm text-dim mb-4">Eines a <code>scripts/</code>. Totes executables via <code>platform &lt;comanda&gt;</code>.</p>
        <div>
          {scripts.map(s => (
            <div key={s.name} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="flex-between">
                <strong>{s.name}</strong>
                <span className="text-sm text-dim">{s.lines} línies</span>
              </div>
              {s.description && <div className="text-sm text-dim mt-1">{s.description}</div>}
            </div>
          ))}
        </div>
      </Section>

      {/* Routing */}
      {routing && (
        <Section title="Routing Engine">
          <p className="text-sm text-dim mb-4"><code>{routing.file}</code> — Jerarquia de models per tipus de tasca.</p>
          <div className="grid-2">
            {routing.models.map((m, i) => (
              <div key={i} style={{ padding: '12px', background: 'var(--bg)', borderRadius: 6 }}>
                <div className="flex gap-2 mb-2">
                  <strong>{m.title}</strong>
                  {m.role && <span className={`badge ${m.role === 'Principal' ? 'badge-purple' : m.role === 'Auditor' ? 'badge-yellow' : m.role === 'Ràpid' ? 'badge-green' : 'badge-gray'}`}>{m.role}</span>}
                </div>
                <ul className="text-sm text-dim" style={{ paddingLeft: 16 }}>
                  {m.uses.map((u, j) => <li key={j}>{u}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* LiteLLM */}
      <Section title="LiteLLM">
        <p className="text-sm text-dim mb-4">
          Container Docker <code>{litellm.containerName || 'platform-litellm'}</code>.
          Configuració a <code>litellm/config.yaml</code>.
        </p>
        <div>
          {litellm.models.map(m => (
            <div key={m.name} className="flex-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <strong>{m.name}</strong>
              <code className="text-sm text-dim">{m.litellmModel}</code>
            </div>
          ))}
        </div>
      </Section>

      {/* Templates */}
      <Section title={`Templates (${templates.length})`}>
        <p className="text-sm text-dim mb-4">Plantilles a <code>templates/</code> per inicialitzar projectes.</p>
        <div className="flex gap-4">
          {templates.map(t => (
            <div key={t.name} className="flex gap-2" style={{ alignItems: 'center' }}>
              <span className="dot dot-green" />
              <div>
                <strong>{t.name}</strong>
                <div className="text-sm text-dim">CLAUDE.md: {t.hasClaudeMd ? 'sí' : 'no'}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* v0 Prompts */}
      <Section title={`Prompts v0.dev (${v0Prompts.length})`}>
        <p className="text-sm text-dim mb-4">Prompts reutilitzables a <code>prompts/v0/</code> per generar UI premium.</p>
        <div className="grid-2">
          {v0Prompts.map(p => (
            <div key={p.name} style={{ padding: '12px', background: 'var(--bg)', borderRadius: 6 }}>
              <strong>{p.title}</strong>
              <div className="text-sm text-dim mt-1"><code>{p.file}</code></div>
              <div className="flex gap-2 mt-2" style={{ flexWrap: 'wrap' }}>
                {p.sections.slice(0, 5).map((s, i) => (
                  <span key={i} className="badge badge-gray" style={{ fontSize: 10 }}>{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Patterns */}
      <Section title={`Patterns (${patterns.length} categories)`}>
        <p className="text-sm text-dim mb-4">
          Lliçons apreses abstractes a <code>patterns/</code>. Creixen amb l'ús.
        </p>
        <div className="flex gap-3" style={{ flexWrap: 'wrap' }}>
          {patterns.map(p => (
            <div key={p.name} style={{ padding: '10px 16px', background: 'var(--bg)', borderRadius: 6 }}>
              <strong>{p.name}</strong>
              <div className="text-sm text-dim">
                {p.patterns > 0 ? `${p.patterns} patterns` : 'buit'}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Web */}
      {web && (
        <Section title="Platform Web">
          <p className="text-sm text-dim mb-4">Consola visual local. <code>web/</code> — {web.files} fitxers.</p>
          <div className="flex gap-4">
            <div className="flex gap-2" style={{ alignItems: 'center' }}>
              <span className={`dot ${web.hasBackend ? 'dot-green' : 'dot-gray'}`} />
              <span>Backend (Express)</span>
            </div>
            <div className="flex gap-2" style={{ alignItems: 'center' }}>
              <span className={`dot ${web.hasFrontend ? 'dot-green' : 'dot-gray'}`} />
              <span>Frontend (React + Vite)</span>
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}
