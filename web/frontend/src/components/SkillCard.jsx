export default function SkillCard({ skill, active, onActivate, activating }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="flex-between">
        <div>
          <strong>{skill.title || skill.name}</strong>
          {skill.reason && <p className="text-sm text-dim mt-1">{skill.reason}</p>}
          {skill.confidence && (
            <span className={`badge ${skill.confidence === 'alta' ? 'badge-green' : skill.confidence === 'mitjana' ? 'badge-yellow' : 'badge-gray'} mt-2`}>
              {skill.confidence}
            </span>
          )}
        </div>
        <div>
          {active ? (
            <span className="badge badge-green">Activa</span>
          ) : (
            <button
              className="btn btn-sm btn-primary"
              onClick={() => onActivate(skill.name)}
              disabled={activating}
            >
              {activating ? 'Activant...' : 'Activar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
