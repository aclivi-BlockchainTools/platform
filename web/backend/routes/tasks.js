import { Router } from 'express';
import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { PROJECTS_DIR, PLATFORM_DIR, readEnvConfig, findClaudeMd } from '../lib/config.js';
import { listProjectTasks, getTask, updateTaskStatus, parseClaudeMd } from '../lib/markdown.js';
import { callLiteLLM } from '../lib/litellm.js';
import { execCommand } from '../lib/shell.js';

export const tasksRouter = Router();

// GET /api/projects/:name/tasks — List tasks
tasksRouter.get('/projects/:name/tasks', (req, res) => {
  try {
    const { name } = req.params;
    const tasks = listProjectTasks(name);
    res.json(tasks);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/projects/:name/tasks/:filename — Get task detail
tasksRouter.get('/projects/:name/tasks/:filename', (req, res) => {
  try {
    const { name, filename } = req.params;
    const task = getTask(name, filename);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/projects/:name/tasks — Create + execute task
tasksRouter.post('/projects/:name/tasks', async (req, res) => {
  try {
    const { name } = req.params;
    const { description, forceModel } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    // Verify project exists
    const projectDir = join(PROJECTS_DIR, name);
    if (!existsSync(projectDir)) {
      return res.status(404).json({ error: `Project '${name}' not found` });
    }

    const config = readEnvConfig();

    // Determine model
    let model, category, reason;
    if (forceModel) {
      model = forceModel;
      category = 'manual';
      reason = "Model forçat per l'usuari.";
    } else {
      // Call the routing engine via platform script
      try {
        const { stdout } = await execCommand(
          `bash ${PLATFORM_DIR}/scripts/platform.sh route "${description.replace(/"/g, '\\"')}"`,
          { allowError: true, timeout: 15000 }
        );
        const parsed = parseRouteOutput(stdout);
        model = parsed.model || 'deepseek-v4-pro';
        category = parsed.category || 'implementació';
        reason = parsed.reason || '';
      } catch {
        model = 'deepseek-v4-pro';
        category = 'implementació';
        reason = 'Implementació principal de software.';
      }
    }

    // Build context for prompt
    const claudePath = findClaudeMd(name);
    let contextStr = `Projecte: ${name}`;
    try {
      if (claudePath) {
        const claudeContent = readFileSync(claudePath, 'utf-8');
        const parsed = parseClaudeMd(claudeContent);
        const allStack = [...parsed.stack.alta, ...parsed.stack.mitjana];
        if (allStack.length) contextStr += `\nStack: ${allStack.join(', ')}`;
        if (parsed.activeSkills.length) contextStr += `\nSkills actives: ${parsed.activeSkills.join(', ')}`;
        if (parsed.status) contextStr += `\nEstat actual: ${parsed.status.slice(0, 200)}`;
      }
    } catch {}

    const fullPrompt = `${contextStr}\n\nTasca: ${description}`;
    let responseText;
    let executionMode;

    if (model.startsWith('deepseek-')) {
      // Execute via LiteLLM
      try {
        responseText = await callLiteLLM(model, fullPrompt, config);
        executionMode = 'litellm';
      } catch (e) {
        responseText = `ERROR: No s'ha pogut executar la tasca via LiteLLM.\n\n${e.message}\n\nComprova que LiteLLM estigui actiu: platform models start`;
        executionMode = 'error';
      }
    } else if (model.startsWith('claude-')) {
      const hasAnthropicKey = config.ANTHROPIC_API_KEY && config.ANTHROPIC_API_KEY.length > 2;
      if (hasAnthropicKey) {
        try {
          responseText = await callLiteLLM(model, fullPrompt, config);
          executionMode = 'litellm';
        } catch (e) {
          responseText = `ERROR: No s'ha pogut executar via Claude API.\n\n${e.message}`;
          executionMode = 'error';
        }
      } else {
        responseText = `## Prompt preparat per Claude Code

Obre Claude Code al projecte i executa aquesta tasca:

\`\`\`bash
cd ~/Projects/${name} && claude
\`\`\`

Copia el contingut següent com a prompt inicial:

---

${fullPrompt}

---

**Model recomanat:** ${model}
**Categoria:** ${category}
**Motiu:** ${reason}
`;
        executionMode = 'manual';
      }
    }

    // Save task file
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').slice(0, 15).replace('T', '-');
    const slug = description
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40)
      .replace(/-$/, '');
    const filename = `${timestamp}-${slug}.md`;
    const tasksDir = join(PROJECTS_DIR, name, 'docs', 'tasks');
    mkdirSync(tasksDir, { recursive: true });

    const title = description.slice(0, 60);
    const taskContent = `# Tasca: ${title}

Data: ${now.toISOString().slice(0, 19).replace('T', ' ')}
Projecte: ${name}
Model recomanat: ${model}
Categoria: ${category}

## Prompt

${description}

## Context usat

${contextStr}

## Resposta del model

${responseText}

## Estat

Implementat: no
Verificat: no
Completat: no

## Notes

-
`;

    writeFileSync(join(tasksDir, filename), taskContent, 'utf-8');

    res.json({
      filename,
      title,
      model,
      category,
      reason,
      executionMode,
      response: responseText
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/projects/:name/tasks/:filename/status — Update DoD
tasksRouter.patch('/projects/:name/tasks/:filename/status', (req, res) => {
  try {
    const { name, filename } = req.params;
    const task = getTask(name, filename);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updates = {};
    if ('implementat' in req.body) updates.implementat = req.body.implementat;
    if ('verificat' in req.body) updates.verificat = req.body.verificat;
    if ('completat' in req.body) updates.completat = req.body.completat;
    if ('notes' in req.body) updates.notes = req.body.notes;

    const newContent = updateTaskStatus(task.raw, updates);
    const taskPath = join(PROJECTS_DIR, name, 'docs', 'tasks', filename);
    writeFileSync(taskPath, newContent, 'utf-8');

    const updated = getTask(name, filename);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Parse output from platform route command
function parseRouteOutput(stdout) {
  const result = { category: '', model: '', reason: '', alternative: '' };
  const lines = stdout.split('\n');
  let currentKey = '';
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed === 'Tasca:') { currentKey = ''; continue; }
    if (trimmed === 'Categoria:') { currentKey = 'category'; continue; }
    if (trimmed === 'Model recomanat:') { currentKey = 'model'; continue; }
    if (trimmed === 'Motiu:') { currentKey = 'reason'; continue; }
    if (trimmed === 'Alternativa:') { currentKey = 'alternative'; continue; }
    if (currentKey) {
      result[currentKey] = trimmed;
      currentKey = '';
    }
  }
  return result;
}
