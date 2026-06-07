import { Router } from 'express';
import { execCommand } from '../lib/shell.js';
import { PLATFORM_DIR } from '../lib/config.js';

export const routingRouter = Router();

// POST /api/routing/classify — Classify a task
routingRouter.post('/classify', async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const { stdout } = await execCommand(
      `bash ${PLATFORM_DIR}/scripts/platform.sh route "${description.replace(/"/g, '\\"')}"`,
      { allowError: true, timeout: 15000 }
    );

    // Parse cmd_route output:
    // Tasca:
    //   <desc>
    // Categoria:
    //   <category>
    // Model recomanat:
    //   <model>
    // Motiu:
    //   <reason>
    // Alternativa:
    //   <alternative>
    const parsed = { category: '', model: '', reason: '', alternative: '' };
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
        parsed[currentKey] = trimmed;
        currentKey = '';
      }
    }

    res.json(parsed);
  } catch (e) {
    // Fallback: default to deepseek-v4-pro if script fails
    res.json({
      category: 'implementació',
      model: 'deepseek-v4-pro',
      reason: 'Implementació principal de software (routing offline).',
      alternative: 'deepseek-v4-flash si la tasca és repetitiva.'
    });
  }
});
