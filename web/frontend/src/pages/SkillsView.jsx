import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { get, post } from '../api';
import SkillCard from '../components/SkillCard';

export default function SkillsView() {
  const { name } = useParams();
  const [skills, setSkills] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const [activating, setActivating] = useState(null);

  useEffect(() => {
    get(`/api/projects/${name}/skills`)
      .then(setSkills)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [name]);

  const handleSuggest = async () => {
    setSuggesting(true);
    setError('');
    try {
      const data = await post(`/api/projects/${name}/skills/suggest`, {});
      setSuggestions(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setSuggesting(false);
    }
  };

  const handleActivate = async (skillName) => {
    setActivating(skillName);
    setError('');
    try {
      await post(`/api/projects/${name}/skills/${skillName}/activate`, {});
      // Reload skills
      const data = await get(`/api/projects/${name}/skills`);
      setSkills(data);
      // Remove from suggestions
      setSuggestions(prev => prev.filter(s => s.name !== skillName));
    } catch (e) {
      setError(e.message);
    } finally {
      setActivating(null);
    }
  };

  if (loading) return <div className="loading">Carregant skills...</div>;

  return (
    <div>
      <div className="page-header">
        <h2>Skills — {name}</h2>
        <p>Gestió de skills universals i de domini</p>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="card">
        <h3 className="mb-3">Skills universals</h3>
        <p className="text-sm text-dim mb-4">Sempre actives a tots els projectes.</p>
        <div className="grid-2">
          {(skills?.universal || []).map(s => (
            <SkillCard key={s.name} skill={s} active={true} onActivate={() => {}} />
          ))}
        </div>
      </div>

      <div className="card">
        <div className="flex-between mb-3">
          <h3>Skills de domini</h3>
          <button className="btn" onClick={handleSuggest} disabled={suggesting}>
            {suggesting ? 'Analitzant...' : 'Suggerir skills'}
          </button>
        </div>
        <p className="text-sm text-dim mb-4">Activació manual. Les skills no actives no influeixen en les decisions.</p>

        <div className="grid-2">
          {(skills?.domain || []).map(s => (
            <SkillCard
              key={s.name}
              skill={s}
              active={s.active}
              onActivate={handleActivate}
              activating={activating === s.name}
            />
          ))}
        </div>

        {(!skills?.domain || skills.domain.length === 0) && (
          <p className="text-dim">Cap skill de domini disponible</p>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="card">
          <h3 className="mb-3">Suggeriments</h3>
          <div className="grid-2">
            {suggestions.map(s => (
              <SkillCard
                key={s.name}
                skill={s}
                active={s.alreadyActive}
                onActivate={handleActivate}
                activating={activating === s.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
