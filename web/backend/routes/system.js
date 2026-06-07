import { Router } from 'express';
import { homedir } from 'os';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execCommand } from '../lib/shell.js';
import { PLATFORM_DIR, CONFIG_DIR, readEnvConfig } from '../lib/config.js';

const ENV_FILE = join(CONFIG_DIR, '.env');

export const systemRouter = Router();

// GET /api/system/doctor — Run platform doctor
systemRouter.get('/doctor', async (_req, res) => {
  try {
    const platformScript = `${PLATFORM_DIR}/scripts/platform.sh`;
    const { stdout } = await execCommand(`bash ${platformScript} doctor`, { allowError: true, timeout: 30000 });
    const lines = stdout.split('\n');
    const items = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (trimmed.includes('[✓]')) {
        items.push({ status: 'ok', message: trimmed.replace('[✓]', '').trim() });
      } else if (trimmed.includes('[!]')) {
        items.push({ status: 'warn', message: trimmed.replace('[!]', '').trim() });
      } else if (trimmed.includes('[✗]')) {
        items.push({ status: 'error', message: trimmed.replace('[✗]', '').trim() });
      } else if (trimmed.startsWith('===')) {
        items.push({ status: 'header', message: trimmed.replace(/=+/g, '').trim() });
      } else {
        items.push({ status: 'info', message: trimmed });
      }
    }
    res.json({ raw: stdout, items });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Doctor failed' });
  }
});

// GET /api/system/config — Show config status (masked keys)
systemRouter.get('/config', (_req, res) => {
  try {
    const envConfig = readEnvConfig();
    const keys = [
      { key: 'ANTHROPIC_API_KEY', label: 'Anthropic API Key', required: false, hint: 'Claude via API/LiteLLM. Claude Code amb login NO necessita aquesta clau.' },
      { key: 'DEEPSEEK_API_KEY', label: 'DeepSeek API Key', required: true, hint: 'Necessària per DeepSeek V4 Pro i Flash.' },
      { key: 'LITELLM_MASTER_KEY', label: 'LiteLLM Master Key', required: true },
      { key: 'LITELLM_HOST', label: 'LiteLLM Host', required: true },
      { key: 'LITELLM_PORT', label: 'LiteLLM Port', required: true },
      { key: 'PROJECTS_DIR', label: 'Projects Directory', required: true },
      { key: 'PLATFORM_DIR', label: 'Platform Directory', required: true }
    ];

    const items = keys.map(({ key, label, required, hint }) => {
      const val = envConfig[key] || '';
      const set = val.length > 0 && val !== '""' && val !== "''";
      let masked = '';
      if (set) {
        if (key.endsWith('_KEY') || key.endsWith('_API_KEY')) {
          masked = val.length > 8 ? `${val.slice(0, 8)}...${val.slice(-4)}` : '****';
        } else {
          masked = val;
        }
      }
      return { key, label, required, set, masked, hint };
    });

    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/system/config — Update one or more config keys
systemRouter.put('/config', (req, res) => {
  try {
    const updates = req.body;
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No keys provided' });
    }

    // Allowed keys (security: only allow specific env vars)
    const allowedKeys = ['ANTHROPIC_API_KEY', 'DEEPSEEK_API_KEY', 'LITELLM_MASTER_KEY'];
    let envContent = '';
    try {
      envContent = readFileSync(ENV_FILE, 'utf-8');
    } catch {
      envContent = '';
    }

    const lines = envContent.split('\n');
    const updatedKeys = new Set();

    for (const key of Object.keys(updates)) {
      if (!allowedKeys.includes(key)) continue;
      const value = String(updates[key]).trim();
      let found = false;

      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith(`${key}=`) || trimmed.startsWith(`# ${key}=`)) {
          lines[i] = `${key}=${value}`;
          found = true;
          updatedKeys.add(key);
          break;
        }
      }

      if (!found) {
        lines.push(`${key}=${value}`);
        updatedKeys.add(key);
      }
    }

    writeFileSync(ENV_FILE, lines.join('\n') + '\n', 'utf-8');

    // Return updated config
    const envConfig = readEnvConfig();
    const result = {};
    for (const key of updatedKeys) {
      const val = envConfig[key] || '';
      result[key] = {
        set: val.length > 0,
        masked: val.length > 8 ? `${val.slice(0, 8)}...${val.slice(-4)}` : '****'
      };
    }

    res.json({ ok: true, updated: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/system/claude-status — Claude Code login status
systemRouter.get('/claude-status', (_req, res) => {
  try {
    const claudeJson = join(homedir(), '.claude.json');
    let loggedIn = false;
    let email = '';
    let tier = '';
    let organization = '';

    try {
      const data = JSON.parse(readFileSync(claudeJson, 'utf-8'));
      const oa = data.oauthAccount;
      if (oa && oa.emailAddress) {
        loggedIn = true;
        email = oa.emailAddress || '';
        tier = oa.seatTier || '';
        organization = oa.organizationName || '';
      }
    } catch {}

    res.json({ loggedIn, email, tier, organization });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
