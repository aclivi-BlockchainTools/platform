import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const PROJECTS_DIR = process.env.PROJECTS_DIR || join(homedir(), 'Projects');

export default async function resumeProject({ projectName }) {
  const projectDir = join(PROJECTS_DIR, projectName);
  if (!existsSync(projectDir)) {
    return `ERROR: Projecte '${projectName}' no trobat a ${PROJECTS_DIR}/`;
  }

  // Find CLAUDE.md
  let claudePath = join(projectDir, '.claude', 'CLAUDE.md');
  if (!existsSync(claudePath)) claudePath = join(projectDir, 'CLAUDE.md');
  if (!existsSync(claudePath)) return `ERROR: CLAUDE.md no trobat a ${projectName}`;

  const content = readFileSync(claudePath, 'utf-8');

  // Extract sections
  const extract = (heading) => {
    const regex = new RegExp(`^## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, 'im');
    const m = content.match(regex);
    return m ? m[1].trim() : '';
  };

  // Stack from AUTO-GENERATED markers
  let stack = { alta: [], mitjana: [], baixa: [] };
  const stackMatch = content.match(/<!-- AUTO-GENERATED-STACK-START -->([\s\S]*?)<!-- AUTO-GENERATED-STACK-END -->/);
  if (stackMatch) {
    let level = null;
    for (const line of stackMatch[1].split('\n')) {
      const lm = line.match(/### Stack detectat \(confiança (alta|mitjana|baixa)\)/i);
      if (lm) { level = lm[1].toLowerCase(); continue; }
      if (level && line.trim().startsWith('- ')) stack[level].push(line.trim().slice(2));
    }
  }

  const status = extract('Estat actual');
  const decisions = extract('Decisions clau');
  const modelStrategy = extract('Model Strategy');
  const activeSkillsSection = extract('Skills de domini actives');

  // Active skills
  const activeSkills = [];
  for (const line of activeSkillsSection.split('\n')) {
    const m = line.trim().match(/^- (\S+)/);
    if (m) activeSkills.push(m[1]);
  }

  // Also check symlinks
  const domainDir = join(projectDir, '.claude', 'active-skills', 'domain');
  if (existsSync(domainDir)) {
    for (const entry of readdirSync(domainDir, { withFileTypes: true })) {
      if (entry.name === '.gitkeep') continue;
      if ((entry.isSymbolicLink() || entry.isDirectory()) && !activeSkills.includes(entry.name)) {
        activeSkills.push(entry.name);
      }
    }
  }

  // Tasks
  const tasksDir = join(projectDir, 'docs', 'tasks');
  const tasks = [];
  if (existsSync(tasksDir)) {
    for (const f of readdirSync(tasksDir).filter(f => f.endsWith('.md')).sort().reverse().slice(0, 5)) {
      const taskContent = readFileSync(join(tasksDir, f), 'utf-8');
      const title = (taskContent.match(/^# Tasca:\s*(.+)/m) || [])[1] || f;
      const impl = (taskContent.match(/^Implementat:\s*(.+)/im) || [])[1] || 'no';
      const verif = (taskContent.match(/^Verificat:\s*(.+)/im) || [])[1] || 'no';
      const comp = (taskContent.match(/^Completat:\s*(.+)/im) || [])[1] || 'no';
      tasks.push({ filename: f, title, implementat: impl, verificat: verif, completat: comp });
    }
  }

  // Decisions
  const decisionsDir = join(projectDir, 'docs', 'decisions');
  const decisionFiles = existsSync(decisionsDir)
    ? readdirSync(decisionsDir).filter(f => f.endsWith('.md')).sort().reverse().slice(0, 5)
    : [];

  // Determine next step from status
  let nextStep = '';
  for (const line of status.split('\n')) {
    if (line.match(/següent pas|proper pas|next step|pendent|qued/i)) {
      nextStep = line.trim();
      break;
    }
  }

  const result = {
    project: projectName,
    ruta: projectDir,
    stack: stack.alta.length > 0 ? stack.alta.join(', ') : '(no detectat)',
    stackDetall: stack,
    estatActual: status.slice(0, 3000),
    modelStrategy: modelStrategy || 'deepseek-v4-pro (principal), deepseek-v4-flash (ràpid), claude-sonnet (auditor)',
    skillsActives: activeSkills,
    tasques: tasks.map(t => `  ${t.title} [implementat:${t.implementat} verificat:${t.verificat} completat:${t.completat}]`),
    decisions: decisionFiles.length,
    proximPas: nextStep || '(revisar estat actual)'
  };

  return result;
}
