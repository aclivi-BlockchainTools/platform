import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const PROJECTS_DIR = process.env.PROJECTS_DIR || join(homedir(), 'Projects');

export default async function listProjects() {
  if (!existsSync(PROJECTS_DIR)) return 'ERROR: PROJECTS_DIR no existeix';

  const entries = readdirSync(PROJECTS_DIR, { withFileTypes: true });
  const projects = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

    // Find CLAUDE.md
    let claudePath = join(PROJECTS_DIR, entry.name, '.claude', 'CLAUDE.md');
    if (!existsSync(claudePath)) claudePath = join(PROJECTS_DIR, entry.name, 'CLAUDE.md');
    if (!existsSync(claudePath)) {
      projects.push({ name: entry.name, hasClaudeMd: false });
      continue;
    }

    const content = readFileSync(claudePath, 'utf-8');

    // Name
    const nameMatch = content.match(/^# (?:Projecte:\s*|CLAUDE\.md\s*[—–-]\s*)?(.+)/m);
    const displayName = nameMatch ? nameMatch[1].trim() : entry.name;

    // Stack
    const stack = [];
    const stackMatch = content.match(/<!-- AUTO-GENERATED-STACK-START -->([\s\S]*?)<!-- AUTO-GENERATED-STACK-END -->/);
    if (stackMatch) {
      for (const line of stackMatch[1].split('\n')) {
        if (line.trim().startsWith('- ')) stack.push(line.trim().slice(2));
      }
    }

    // Status snippet
    const extract = (h) => {
      const regex = new RegExp(`^## ${h}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, 'im');
      const m = content.match(regex);
      return m ? m[1].trim().slice(0, 300) : '';
    };
    const status = extract('Estat actual');

    // Last task
    const tasksDir = join(PROJECTS_DIR, entry.name, 'docs', 'tasks');
    let lastTask = null;
    if (existsSync(tasksDir)) {
      const taskFiles = readdirSync(tasksDir).filter(f => f.endsWith('.md')).sort().reverse();
      if (taskFiles.length > 0) {
        const t = readFileSync(join(tasksDir, taskFiles[0]), 'utf-8');
        const tTitle = (t.match(/^# Tasca:\s*(.+)/m) || [])[1] || '';
        const tImpl = (t.match(/^Implementat:\s*(.+)/im) || [])[1] || 'no';
        lastTask = { title: tTitle, implementat: tImpl };
      }
    }

    projects.push({
      name: entry.name,
      displayName,
      hasClaudeMd: true,
      stack: stack.slice(0, 8),
      statusSnippet: status.slice(0, 200),
      lastTask
    });
  }

  return projects.sort((a, b) => a.name.localeCompare(b.name));
}
