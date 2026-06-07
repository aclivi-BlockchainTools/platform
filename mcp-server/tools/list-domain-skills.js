import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const PLATFORM_DIR = join(homedir(), 'platform');
const PROJECTS_DIR = process.env.PROJECTS_DIR || join(homedir(), 'Projects');

export default async function listDomainSkills({ projectName }) {
  const domainDir = join(PLATFORM_DIR, 'skills', 'domain');
  if (!existsSync(domainDir)) return 'Cap skill de domini disponible.';

  const skills = [];
  for (const entry of readdirSync(domainDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

    const skillMd = join(domainDir, entry.name, 'skill.md');
    let description = '';
    if (existsSync(skillMd)) {
      const content = readFileSync(skillMd, 'utf-8');
      const titleMatch = content.match(/^#\s*(.+)/m);
      description = titleMatch ? titleMatch[1].trim() : entry.name;
    }

    let active = false;
    if (projectName) {
      const activeDir = join(PROJECTS_DIR, projectName, '.claude', 'active-skills', 'domain');
      if (existsSync(activeDir)) {
        for (const item of readdirSync(activeDir, { withFileTypes: true })) {
          if (item.name === entry.name && (item.isSymbolicLink() || item.isDirectory())) {
            active = true;
            break;
          }
        }
      }
    }

    skills.push({ name: entry.name, description: description || entry.name, active });
  }

  // Also list universal skills
  const universalDir = join(PLATFORM_DIR, 'skills', 'universal');
  const universal = [];
  if (existsSync(universalDir)) {
    for (const f of readdirSync(universalDir)) {
      if (f.endsWith('.md')) {
        universal.push(f.replace('.md', ''));
      }
    }
  }

  return {
    universal: universal,
    universalsActives: universal.length,
    domain: skills,
    domainActives: skills.filter(s => s.active).map(s => s.name),
    total: skills.length
  };
}
