import { Router } from 'express';
import { readFileSync, readdirSync, existsSync, lstatSync } from 'fs';
import { join, basename } from 'path';
import { PLATFORM_DIR } from '../lib/config.js';

export const platformRouter = Router();

// GET /api/platform/overview — Complete repo structure
platformRouter.get('/overview', (_req, res) => {
  try {
    const data = {
      universalSkills: getUniversalSkills(),
      domainSkills: getDomainSkills(),
      mcps: getMCPRegistry(),
      scripts: getScripts(),
      routing: getRouting(),
      litellm: getLitellmConfig(),
      templates: getTemplates(),
      v0Prompts: getV0Prompts(),
      patterns: getPatternCategories(),
      web: getWebStructure()
    };
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function getUniversalSkills() {
  const dir = join(PLATFORM_DIR, 'skills', 'universal');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const content = readFileSync(join(dir, f), 'utf-8');
      const titleMatch = content.match(/^#\s*(.+)/m);
      const descMatch = content.match(/^\s*(.+)/m); // first line after title
      return {
        name: basename(f, '.md'),
        file: f,
        title: titleMatch ? titleMatch[1].trim() : basename(f, '.md')
      };
    });
}

function getDomainSkills() {
  const dir = join(PLATFORM_DIR, 'skills', 'domain');
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('.'))
    .map(e => {
      const skillMd = join(dir, e.name, 'skill.md');
      let title = e.name;
      if (existsSync(skillMd)) {
        const content = readFileSync(skillMd, 'utf-8');
        const m = content.match(/^#\s*(.+)/m);
        title = m ? m[1].trim() : e.name;
      }
      return { name: e.name, title };
    });
}

function getMCPRegistry() {
  const f = join(PLATFORM_DIR, 'mcp', 'registry.json');
  if (!existsSync(f)) return [];
  try {
    const data = JSON.parse(readFileSync(f, 'utf-8'));
    return Object.entries(data.mcpServers || {}).map(([name, cfg]) => ({
      name,
      description: cfg.description || '',
      category: cfg.category || '',
      alwaysEnabled: cfg.alwaysEnabled || false,
      requiresSkill: cfg.requiresSkill || null
    }));
  } catch {
    return [];
  }
}

function getScripts() {
  const dir = join(PLATFORM_DIR, 'scripts');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith('.sh'))
    .map(f => {
      const content = readFileSync(join(dir, f), 'utf-8');
      // Extract the description comment (line 2-4)
      const lines = content.split('\n');
      let desc = '';
      for (let i = 1; i < Math.min(lines.length, 5); i++) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('#') && trimmed.length > 3) {
          desc = trimmed.replace(/^#\s*/, '');
          break;
        }
      }
      const linesCount = lines.length;
      return { name: f, description: desc, lines: linesCount };
    });
}

function getRouting() {
  const f = join(PLATFORM_DIR, 'routing', 'task-routing.md');
  if (!existsSync(f)) return null;
  const content = readFileSync(f, 'utf-8');
  // Extract model strategy
  const models = [];
  const sections = content.split(/^##\s+/m);
  for (const section of sections) {
    const lines = section.trim().split('\n');
    const title = lines[0]?.trim() || '';
    if (title.includes('DeepSeek V4 Pro') || title.includes('DeepSeek V4 Flash') ||
        title.includes('Claude Sonnet') || title.includes('Claude Haiku')) {
      const role = title.includes('Principal') ? 'Principal' :
                   title.includes('ràpid') || title.includes('Flash') ? 'Ràpid' :
                   title.includes('Auditor') || title.includes('Sonnet') ? 'Auditor' :
                   title.includes('Haiku') ? 'Lleuger' : '';
      const items = lines.slice(1).filter(l => l.trim().startsWith('- ')).map(l => l.trim().slice(2));
      models.push({ title, role, uses: items });
    }
  }
  return { file: 'routing/task-routing.md', models };
}

function getLitellmConfig() {
  const composeFile = join(PLATFORM_DIR, 'litellm', 'docker-compose.yml');
  const configFile = join(PLATFORM_DIR, 'litellm', 'config.yaml');
  const models = [];

  if (existsSync(configFile)) {
    const content = readFileSync(configFile, 'utf-8');
    const modelMatches = content.matchAll(/model_name:\s*(\S+)\s*\n\s+litellm_params:\s*\n\s+model:\s*(\S+)/g);
    for (const m of modelMatches) {
      models.push({ name: m[1], litellmModel: m[2] });
    }
  }

  const hasCompose = existsSync(composeFile);
  let containerName = '';
  if (hasCompose) {
    const content = readFileSync(composeFile, 'utf-8');
    const m = content.match(/container_name:\s*(\S+)/);
    containerName = m ? m[1] : '';
  }

  return { models, containerName, hasCompose };
}

function getTemplates() {
  const dir = join(PLATFORM_DIR, 'templates');
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => {
      const claudeMd = join(dir, e.name, '.claude', 'CLAUDE.md');
      const hasClaudeMd = existsSync(claudeMd);
      return { name: e.name, hasClaudeMd };
    });
}

function getV0Prompts() {
  const dir = join(PLATFORM_DIR, 'prompts', 'v0');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const content = readFileSync(join(dir, f), 'utf-8');
      const titleMatch = content.match(/^#\s*(.+)/m);
      const sections = (content.match(/^##\s+.+/gm) || []).map(s => s.replace('## ', ''));
      return {
        name: basename(f, '.md'),
        file: f,
        title: titleMatch ? titleMatch[1].trim() : basename(f, '.md'),
        sections
      };
    });
}

function getPatternCategories() {
  const dir = join(PLATFORM_DIR, 'patterns');
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => {
      const patternDir = join(dir, e.name);
      const files = readdirSync(patternDir).filter(f => f.endsWith('.md') && f !== '.gitkeep');
      return { name: e.name, patterns: files.length, files };
    });
}

function getWebStructure() {
  const dir = join(PLATFORM_DIR, 'web');
  if (!existsSync(dir)) return null;
  const countFiles = (d, depth = 0) => {
    if (depth > 4) return 0;
    if (!existsSync(d)) return 0;
    let count = 0;
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
      if (entry.isDirectory()) {
        count += countFiles(join(d, entry.name), depth + 1);
      } else {
        count++;
      }
    }
    return count;
  };
  return {
    files: countFiles(dir),
    hasBackend: existsSync(join(dir, 'backend', 'server.js')),
    hasFrontend: existsSync(join(dir, 'frontend', 'vite.config.js'))
  };
}
