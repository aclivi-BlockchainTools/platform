import { Router } from 'express';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join, basename } from 'path';
import { PLATFORM_DIR, PROJECTS_DIR } from '../lib/config.js';
import { execScript } from '../lib/shell.js';

export const skillsRouter = Router();

// GET /api/skills — List all skills
skillsRouter.get('/skills', (_req, res) => {
  try {
    const universalDir = join(PLATFORM_DIR, 'skills', 'universal');
    const domainDir = join(PLATFORM_DIR, 'skills', 'domain');

    const universal = [];
    if (existsSync(universalDir)) {
      for (const f of readdirSync(universalDir)) {
        if (!f.endsWith('.md')) continue;
        const content = readFileSync(join(universalDir, f), 'utf-8');
        const descMatch = content.match(/^#\s*(.+)/m);
        universal.push({
          name: basename(f, '.md'),
          title: descMatch ? descMatch[1].trim() : basename(f, '.md')
        });
      }
    }

    const domain = [];
    if (existsSync(domainDir)) {
      for (const entry of readdirSync(domainDir, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
        const skillDir = join(domainDir, entry.name);
        const skillMd = join(skillDir, 'skill.md');
        let title = entry.name;
        if (existsSync(skillMd)) {
          const content = readFileSync(skillMd, 'utf-8');
          const descMatch = content.match(/^#\s*(.+)/m);
          title = descMatch ? descMatch[1].trim() : entry.name;
        }
        domain.push({ name: entry.name, title });
      }
    }

    res.json({ universal, domain });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/projects/:name/skills — Skills for a specific project
skillsRouter.get('/projects/:name/skills', (req, res) => {
  try {
    const { name } = req.params;
    // Universal
    const universalDir = join(PLATFORM_DIR, 'skills', 'universal');
    const universal = [];
    if (existsSync(universalDir)) {
      for (const f of readdirSync(universalDir)) {
        if (!f.endsWith('.md')) continue;
        universal.push({ name: basename(f, '.md'), active: true });
      }
    }

    // Domain (all available)
    const domainDir = join(PLATFORM_DIR, 'skills', 'domain');
    const domain = [];
    if (existsSync(domainDir)) {
      for (const entry of readdirSync(domainDir, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
        domain.push(entry.name);
      }
    }

    // Active domain skills (symlinks)
    const activeDomainDir = join(PROJECTS_DIR, name, '.claude', 'active-skills', 'domain');
    const active = [];
    if (existsSync(activeDomainDir)) {
      for (const entry of readdirSync(activeDomainDir, { withFileTypes: true })) {
        if (entry.name === '.gitkeep') continue;
        if (entry.isSymbolicLink() || entry.isDirectory()) {
          active.push(entry.name);
        }
      }
    }

    // Merge: domain skills with active flag
    const domainWithStatus = domain.map(d => ({
      name: d,
      active: active.includes(d)
    }));

    res.json({ universal, domain: domainWithStatus, active });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/projects/:name/skills/suggest — Suggest skills
skillsRouter.post('/projects/:name/skills/suggest', async (req, res) => {
  try {
    const { name } = req.params;
    const script = join(PLATFORM_DIR, 'scripts', 'suggest-skills.sh');
    const { stdout } = await execScript(script, [name], { allowError: true, timeout: 15000 });

    // Parse suggest-skills.sh output
    const suggestions = [];
    const lines = stdout.split('\n');
    let current = null;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('===') || trimmed.startsWith('Stack') || trimmed.startsWith('Recorda')) continue;
      if (trimmed.startsWith('Skills de domini') || trimmed.startsWith('Cap skill')) continue;

      const confMatch = trimmed.match(/confiança:\s*(alta|mitjana|baixa)/i);
      const motiuMatch = trimmed.match(/motiu:\s*(.+)/i);
      const activeMatch = trimmed.match(/estat:\s*ja activada/i);
      const activaMatch = trimmed.match(/activa amb:\s*(.+)/i);

      if (confMatch) {
        if (current) current.confidence = confMatch[1];
      } else if (motiuMatch) {
        if (current) current.reason = motiuMatch[1];
      } else if (activeMatch) {
        if (current) current.alreadyActive = true;
      } else if (activaMatch) {
        // skip
      } else if (trimmed && !trimmed.startsWith('-') && !trimmed.includes(':')) {
        // New skill name
        if (current && current.name) suggestions.push(current);
        current = { name: trimmed, confidence: '', reason: '', alreadyActive: false };
      }
    }
    if (current && current.name) suggestions.push(current);

    // If no suggestions parsed, try simpler parsing
    if (suggestions.length === 0) {
      // The output may just be listing skills
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('===') && !trimmed.startsWith('Stack') && !trimmed.startsWith('Skills') && !trimmed.startsWith('Cap') && !trimmed.startsWith('Recorda')) {
          if (trimmed.match(/^[a-z]/i) && !trimmed.includes(':')) {
            suggestions.push({ name: trimmed, confidence: '', reason: '', alreadyActive: false });
          }
        }
      }
    }

    res.json(suggestions);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/projects/:name/skills/:skill/activate — Activate a skill
skillsRouter.post('/projects/:name/skills/:skill/activate', async (req, res) => {
  try {
    const { name, skill } = req.params;
    const script = join(PLATFORM_DIR, 'scripts', 'activate-skill.sh');
    const { stdout } = await execScript(script, [skill, name], { allowError: true, timeout: 15000 });

    const alreadyActive = stdout.includes('ja està activada');
    const success = stdout.includes('activada correctament') || alreadyActive;

    res.json({ ok: success, message: stdout.trim(), alreadyActive });
  } catch (e) {
    res.status(500).json({ error: e.message || e.stderr });
  }
});
