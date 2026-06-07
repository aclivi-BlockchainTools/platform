import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const PLATFORM_DIR = join(homedir(), 'platform');
const PROJECTS_DIR = process.env.PROJECTS_DIR || join(homedir(), 'Projects');

function readEnvConfig() {
  const envPath = join(homedir(), '.platform', '.env');
  const config = {};
  try {
    for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      config[key] = value;
    }
  } catch {}
  return config;
}

export default async function askModel({ model, prompt, projectName }) {
  const validModels = ['deepseek-v4-pro', 'deepseek-v4-flash', 'claude-sonnet', 'claude-haiku'];
  if (!validModels.includes(model)) {
    return `ERROR: Model no vàlid: ${model}. Models acceptats: ${validModels.join(', ')}`;
  }

  const config = readEnvConfig();

  // Claude sense API key
  if (model.startsWith('claude-')) {
    const anthropicKey = config.ANTHROPIC_API_KEY || '';
    if (!anthropicKey || anthropicKey === '""' || anthropicKey === "''" || anthropicKey.length < 2) {
      return `Claude via LiteLLM no està configurat (ANTHROPIC_API_KEY no definida).

Usa Claude Code directament per a aquesta tasca. El model recomanat és ${model}.

Si vols usar Claude via API, afegeix ANTHROPIC_API_KEY a ~/.platform/.env.`;
    }
  }

  // Build context if projectName provided
  let fullPrompt = prompt;
  if (projectName) {
    let claudePath = join(PROJECTS_DIR, projectName, '.claude', 'CLAUDE.md');
    if (!existsSync(claudePath)) claudePath = join(PROJECTS_DIR, projectName, 'CLAUDE.md');
    if (existsSync(claudePath)) {
      const content = readFileSync(claudePath, 'utf-8');
      const extract = (h) => {
        const regex = new RegExp(`^## ${h}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, 'im');
        const m = content.match(regex);
        return m ? m[1].trim() : '';
      };
      const status = extract('Estat actual');
      if (status) {
        fullPrompt = `Context del projecte ${projectName}:\n${status.slice(0, 2000)}\n\n---\n\n${prompt}`;
      }
    }
  }

  const host = config.LITELLM_HOST || '127.0.0.1';
  const port = config.LITELLM_PORT || '4000';
  const key = config.LITELLM_MASTER_KEY || 'sk-local-platform';
  const url = `http://${host}:${port}/v1/chat/completions`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: fullPrompt }],
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      return `ERROR: LiteLLM ha retornat HTTP ${response.status}. Comprova que LiteLLM estigui actiu: platform models start`;
    }

    const data = await response.json();
    if (data.error) {
      return `ERROR: ${data.error.message || 'LiteLLM error'}`;
    }

    return { model, response: data.choices[0].message.content };
  } catch (e) {
    return `ERROR: No s'ha pogut connectar a LiteLLM (${url}): ${e.message}. Comprova: platform models start`;
  }
}
