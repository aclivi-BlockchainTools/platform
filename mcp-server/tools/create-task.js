import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

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

function classifyTask(desc) {
  const d = desc.toLowerCase();
  if (d.match(/\busa claude\b|utilitza claude/)) return 'claude-sonnet';
  if (d.match(/\busa flash\b|utilitza flash/)) return 'deepseek-v4-flash';
  if (d.match(/\bresum\b|resumeix|classifica|consulta ràpida/)) return 'claude-haiku';
  if (d.match(/revisar|revisió|seguretat|auditoria|segona opinió|risc alt/)) return 'claude-sonnet';
  if (d.match(/\bboilerplate\b|petita modificació|tasca repetitiva|afegir camps?|rename/)) return 'deepseek-v4-flash';
  return 'deepseek-v4-pro';
}

async function callLiteLLM(model, prompt) {
  const config = readEnvConfig();
  const host = config.LITELLM_HOST || '127.0.0.1';
  const port = config.LITELLM_PORT || '4000';
  const key = config.LITELLM_MASTER_KEY || 'sk-local-platform';
  const url = `http://${host}:${port}/v1/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 4096 })
  });

  if (!response.ok) throw new Error(`LiteLLM HTTP ${response.status}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content;
}

function extractSection(content, heading) {
  const regex = new RegExp(`^## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, 'im');
  const m = content.match(regex);
  return m ? m[1].trim() : '';
}

export default async function createTask({ projectName, taskDescription, forceModel }) {
  const projectDir = join(PROJECTS_DIR, projectName);
  if (!existsSync(projectDir)) {
    return `ERROR: Projecte '${projectName}' no trobat a ${PROJECTS_DIR}/`;
  }

  // Find CLAUDE.md
  let claudePath = join(projectDir, '.claude', 'CLAUDE.md');
  if (!existsSync(claudePath)) claudePath = join(projectDir, 'CLAUDE.md');
  const hasClaudeMd = existsSync(claudePath);

  // Determine model
  const model = forceModel || classifyTask(taskDescription);

  // Build full context
  let fullPrompt = `Projecte: ${projectName}`;

  if (hasClaudeMd) {
    const content = readFileSync(claudePath, 'utf-8');

    // Stack
    const stackMatch = content.match(/<!-- AUTO-GENERATED-STACK-START -->([\s\S]*?)<!-- AUTO-GENERATED-STACK-END -->/);
    if (stackMatch) {
      const stackLines = stackMatch[1].split('\n').filter(l => l.trim().startsWith('- ')).map(l => l.trim().slice(2));
      if (stackLines.length) fullPrompt += `\nStack: ${stackLines.join(', ')}`;
    }

    const status = extractSection(content, 'Estat actual');
    if (status) fullPrompt += `\n\n## Estat actual del projecte\n\n${status}`;

    const decisions = extractSection(content, 'Decisions clau');
    if (decisions) fullPrompt += `\n\n## Decisions clau\n\n${decisions.slice(0, 800)}`;

    const strategy = extractSection(content, 'Model Strategy');
    if (strategy) fullPrompt += `\n\n## Model Strategy\n\n${strategy}`;
  }

  // Last task
  const tasksDir = join(projectDir, 'docs', 'tasks');
  if (existsSync(tasksDir)) {
    const taskFiles = readdirSync(tasksDir).filter(f => f.endsWith('.md')).sort().reverse();
    if (taskFiles.length > 0) {
      const lastContent = readFileSync(join(tasksDir, taskFiles[0]), 'utf-8');
      const lastTitle = (lastContent.match(/^# Tasca:\s*(.+)/m) || [])[1] || '?';
      const lastImpl = (lastContent.match(/^Implementat:\s*(.+)/im) || [])[1] || '?';
      fullPrompt += `\n\nÚltima tasca: ${lastTitle} (implementat: ${lastImpl})`;
    }
  }

  fullPrompt += `\n\n## Tasca sol·licitada\n\n${taskDescription}

## Instruccions

1. NO proposis implementar funcionalitats que l'Estat actual indica com a completades o funcionals.
2. Si una àrea ja està implementada però no verificada, marca-la com a 'verificar', no com a 'implementar'.
3. Si la tasca és d'anàlisi o següents passos, estructura la resposta en:
   - ✅ Ja fet
   - 🔧 Pendent real
   - ⚠️ Riscos
   - 📋 10 següents passos prioritzats
4. Proposa sempre el camí més simple. No afegeixis complexitat innecessària.`;

  // Execute
  let response;
  let executionMode;

  if (model.startsWith('deepseek-')) {
    const deepseekKey = (readEnvConfig()).DEEPSEEK_API_KEY || '';
    if (!deepseekKey || deepseekKey.length < 2) {
      return 'ERROR: DEEPSEEK_API_KEY no configurada. Executa: platform config';
    }
    try {
      response = await callLiteLLM(model, fullPrompt);
      executionMode = 'litellm';
    } catch (e) {
      response = `ERROR LiteLLM: ${e.message}`;
      executionMode = 'error';
    }
  } else {
    // Claude
    const config = readEnvConfig();
    const hasAnthropicKey = config.ANTHROPIC_API_KEY && config.ANTHROPIC_API_KEY.length > 2;
    if (hasAnthropicKey) {
      try {
        response = await callLiteLLM(model, fullPrompt);
        executionMode = 'litellm';
      } catch (e) {
        response = `ERROR LiteLLM: ${e.message}`;
        executionMode = 'error';
      }
    } else {
      response = `## Prompt preparat per Claude Code

Copia el contingut següent com a prompt a Claude Code:

---

${fullPrompt}

---

**Model recomanat:** ${model}
`;
      executionMode = 'manual';
    }
  }

  // Save task file
  mkdirSync(tasksDir, { recursive: true });
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').slice(0, 15).replace('T', '-');
  const slug = taskDescription.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 40).replace(/-$/, '');
  const filename = `${timestamp}-${slug}.md`;
  const title = taskDescription.slice(0, 60);

  const taskContent = `# Tasca: ${title}

Data: ${now.toISOString().slice(0, 19).replace('T', ' ')}
Projecte: ${projectName}
Model recomanat: ${model}
Categoria: ${model.startsWith('deepseek-') ? 'implementació' : 'auditoria'}

## Prompt

${taskDescription}

## Context usat

${fullPrompt.slice(0, 500)}...

## Resposta del model

${response}

## Estat

Implementat: no
Verificat: no
Completat: no

## Notes

-
`;

  writeFileSync(join(tasksDir, filename), taskContent, 'utf-8');

  return {
    model,
    executionMode,
    filename,
    ruta: `~/Projects/${projectName}/docs/tasks/${filename}`,
    resum: response.slice(0, 1500)
  };
}
