import { Router } from 'express';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { PLATFORM_DIR, PROJECTS_DIR, findClaudeMd } from '../lib/config.js';

export const v0Router = Router();

// GET /api/v0/types — List available v0 prompt types
v0Router.get('/types', (_req, res) => {
  try {
    const v0Dir = join(PLATFORM_DIR, 'prompts', 'v0');
    if (!existsSync(v0Dir)) {
      return res.json([]);
    }
    const types = readdirSync(v0Dir)
      .filter(f => f.endsWith('.md'))
      .map(f => ({
        name: f.replace('.md', ''),
        label: formatTypeName(f.replace('.md', ''))
      }));
    res.json(types);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/v0/generate — Generate v0 prompt
v0Router.post('/generate', (req, res) => {
  try {
    const { type, projectName } = req.body;
    if (!type) {
      return res.status(400).json({ error: 'Type is required' });
    }

    const promptFile = join(PLATFORM_DIR, 'prompts', 'v0', `${type}.md`);
    if (!existsSync(promptFile)) {
      return res.status(404).json({ error: `Prompt type '${type}' not found` });
    }

    let prompt = readFileSync(promptFile, 'utf-8');

    // Inject project context if available
    let contextHeader = '';
    if (projectName) {
      const claudeMd = findClaudeMd(projectName);
      if (claudeMd) {
        const content = readFileSync(claudeMd, 'utf-8');
        const descMatch = content.match(/^## Descripció\s*\n([\s\S]*?)(?=\n## |$)/i);
        const description = descMatch ? descMatch[1].trim().split('\n').filter(l => !l.startsWith('<!--'))[0] : '';

        // Extract stack
        const stackMatch = content.match(/<!-- AUTO-GENERATED-STACK-START -->([\s\S]*?)<!-- AUTO-GENERATED-STACK-END -->/);
        let stackLines = [];
        if (stackMatch) {
          const lines = stackMatch[1].split('\n');
          for (const line of lines) {
            if (line.trim().startsWith('- ')) stackLines.push(line.trim());
          }
        }

        contextHeader = `\n<!-- Context del projecte '${projectName}' -->\n`;
        if (description) contextHeader += `\n${description}\n`;
        if (stackLines.length > 0) {
          contextHeader += `\nStack del projecte:\n${stackLines.join('\n')}\n`;
        }
        contextHeader += `\n---\n`;
      }
    }

    const finalPrompt = contextHeader ? prompt + '\n\n' + contextHeader : prompt;

    res.json({ prompt: finalPrompt, type });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function formatTypeName(name) {
  const map = {
    'landing-page': 'Landing Page',
    'saas-dashboard': 'SaaS Dashboard',
    'admin-panel': 'Admin Panel',
    'app-shell': 'App Shell'
  };
  return map[name] || name;
}
