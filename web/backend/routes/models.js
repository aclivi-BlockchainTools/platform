import { Router } from 'express';
import { homedir } from 'os';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execCommand } from '../lib/shell.js';
import { readEnvConfig } from '../lib/config.js';
import { checkLiteLLMHealth, testModel } from '../lib/litellm.js';
import { PLATFORM_DIR } from '../lib/config.js';

export const modelsRouter = Router();

// GET /api/models/status — LiteLLM container status + health
modelsRouter.get('/status', async (_req, res) => {
  try {
    const config = readEnvConfig();
    // Check if Docker container is running
    const { stdout: dockerPs } = await execCommand(
      "docker ps --format '{{.Names}}' --filter name=platform-litellm 2>/dev/null || echo ''",
      { allowError: true, timeout: 10000 }
    );
    const containerRunning = dockerPs.includes('platform-litellm');

    // Check health endpoint
    const healthy = containerRunning ? await checkLiteLLMHealth(config) : false;

    res.json({
      containerRunning,
      healthy,
      host: config.LITELLM_HOST || '127.0.0.1',
      port: config.LITELLM_PORT || '4000'
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/models/test — Test all models
modelsRouter.get('/test', async (_req, res) => {
  try {
    const config = readEnvConfig();
    const models = [
      { name: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro', requiresKey: 'DEEPSEEK_API_KEY' },
      { name: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash', requiresKey: 'DEEPSEEK_API_KEY' },
      { name: 'claude-haiku', label: 'Claude Haiku', requiresKey: 'ANTHROPIC_API_KEY', optionalKey: true },
      { name: 'claude-sonnet', label: 'Claude Sonnet', requiresKey: 'ANTHROPIC_API_KEY', optionalKey: true }
    ];

    const results = [];
    // Check Claude Code login for oauth-based availability
    let claudeLogin = null;
    try {
      const claudeJson = join(homedir(), '.claude.json');
      if (existsSync(claudeJson)) {
        const data = JSON.parse(readFileSync(claudeJson, 'utf-8'));
        const oa = data.oauthAccount;
        if (oa && oa.emailAddress) {
          claudeLogin = { email: oa.emailAddress };
        }
      }
    } catch {}

    for (const m of models) {
      const key = config[m.requiresKey];
      if (!key || key === '""' || key === "''" || key.length < 2) {
        if (m.optionalKey) {
          // Claude models: check if Claude Code login is active
          if (claudeLogin) {
            results.push({ name: m.name, label: m.label, status: 'ok', message: `Disponible via Claude Code (${claudeLogin.email})`, viaClaudeCode: true });
          } else {
            results.push({ name: m.name, label: m.label, status: 'skipped', message: 'Sense API key ni login Claude Code. Executa claude login.' });
          }
        } else {
          results.push({ name: m.name, label: m.label, status: 'error', message: `${m.requiresKey} no configurada` });
        }
        continue;
      }
      const test = await testModel(m.name, config);
      results.push({
        name: m.name,
        label: m.label,
        status: test.ok ? 'ok' : 'error',
        message: test.ok ? 'OK' : test.error
      });
    }

    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/models/start — Start LiteLLM
modelsRouter.post('/start', async (_req, res) => {
  try {
    const litellmDir = `${PLATFORM_DIR}/litellm`;
    const { stdout, stderr } = await execCommand(
      `cd ${litellmDir} && docker compose up -d 2>&1`,
      { allowError: true, timeout: 30000 }
    );
    res.json({ ok: true, output: stdout || stderr });
  } catch (e) {
    res.status(500).json({ error: e.stderr || e.message });
  }
});

// POST /api/models/stop — Stop LiteLLM
modelsRouter.post('/stop', async (_req, res) => {
  try {
    const litellmDir = `${PLATFORM_DIR}/litellm`;
    const { stdout, stderr } = await execCommand(
      `cd ${litellmDir} && docker compose down 2>&1`,
      { allowError: true, timeout: 30000 }
    );
    res.json({ ok: true, output: stdout || stderr });
  } catch (e) {
    res.status(500).json({ error: e.stderr || e.message });
  }
});
