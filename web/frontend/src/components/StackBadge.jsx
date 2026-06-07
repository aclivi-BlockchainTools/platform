export default function StackBadge({ tech, level }) {
  const colors = {
    alta: 'badge-green',
    mitjana: 'badge-yellow',
    baixa: 'badge-gray'
  };
  const cls = colors[level] || 'badge-gray';
  return <span className={`badge ${cls}`} title={`Confiança: ${level}`}>{tech}</span>;
}
