#!/usr/bin/env node

import { homedir } from 'os';
import { join } from 'path';

const PLATFORM_DIR = join(homedir(), 'platform');
const PROJECTS_DIR = process.env.PROJECTS_DIR || join(homedir(), 'Projects');

// ============================================================
// Tool loaders (lazy to avoid top-level await)
// ============================================================

const toolLoaders = {
  platform_current_project:     () => import('./tools/current-project.js'),
  platform_resume_project:      () => import('./tools/resume-project.js'),
  platform_route_task:          () => import('./tools/route-task.js'),
  platform_ask_model:           () => import('./tools/ask-model.js'),
  platform_create_task:         () => import('./tools/create-task.js'),
  platform_save_task:           () => import('./tools/save-task.js'),
  platform_list_projects:       () => import('./tools/list-projects.js'),
  platform_list_domain_skills:   () => import('./tools/list-domain-skills.js'),
  platform_activate_skill:      () => import('./tools/activate-skill.js'),
  platform_check_completion:    () => import('./tools/check-completion.js'),
  platform_before_action:       () => import('./tools/before-action.js'),
  platform_after_action:        () => import('./tools/after-action.js'),
  platform_can_commit:          () => import('./tools/can-commit.js'),
  platform_update_completion:   () => import('./tools/update-completion.js')
};

const toolCache = {};

async function getTool(name) {
  if (toolCache[name]) return toolCache[name];
  const loader = toolLoaders[name];
  if (!loader) return null;
  const mod = await loader();
  toolCache[name] = mod.default;
  return mod.default;
}

// ============================================================
// Tool schemas
// ============================================================

const toolSchemas = {
  platform_current_project: {
    description: "Detecta el projecte actual segons el directori de treball. Usa-ho al principi de cada sessió per saber on som.",
    inputSchema: { type: 'object', properties: {} }
  },
  platform_resume_project: {
    description: "Mostra l'estat complet d'un projecte: stack, estat actual, model strategy, skills actives, última tasca i pròxim pas.",
    inputSchema: { type: 'object', properties: { projectName: { type: 'string', description: 'Nom del projecte a ~/Projects/' } }, required: ['projectName'] }
  },
  platform_route_task: {
    description: "Classifica una tasca amb el routing engine i retorna el model recomanat, categoria, motiu i alternativa.",
    inputSchema: { type: 'object', properties: { taskDescription: { type: 'string', description: 'Descripció de la tasca a classificar' } }, required: ['taskDescription'] }
  },
  platform_ask_model: {
    description: "Envia un prompt a un model via LiteLLM local. DeepSeek V4 Pro és el principal.",
    inputSchema: { type: 'object', properties: { model: { type: 'string', description: 'Model: deepseek-v4-pro, deepseek-v4-flash, claude-sonnet, claude-haiku' }, prompt: { type: 'string', description: 'Prompt a enviar' }, projectName: { type: 'string', description: 'Projecte per contextualitzar (opcional)' } }, required: ['model', 'prompt'] }
  },
  platform_create_task: {
    description: "Crea una tasca: classifica amb routing, consulta DeepSeek via LiteLLM, i guarda el resultat a docs/tasks/.",
    inputSchema: { type: 'object', properties: { projectName: { type: 'string', description: 'Nom del projecte' }, taskDescription: { type: 'string', description: 'Descripció de la tasca' }, forceModel: { type: 'string', description: 'Model a forçar (opcional)' } }, required: ['projectName', 'taskDescription'] }
  },
  platform_save_task: {
    description: "Guarda manualment una tasca a docs/tasks/ sense consultar cap model.",
    inputSchema: { type: 'object', properties: { projectName: { type: 'string', description: 'Nom del projecte' }, title: { type: 'string', description: 'Títol' }, content: { type: 'string', description: 'Contingut markdown' }, model: { type: 'string', description: 'Model usat (opcional)' }, status: { type: 'string', description: 'implementat/verificat/completat (opcional)' } }, required: ['projectName', 'title', 'content'] }
  },
  platform_list_projects: {
    description: "Llista tots els projectes a ~/Projects/ amb el seu estat bàsic.",
    inputSchema: { type: 'object', properties: {} }
  },
  platform_list_domain_skills: {
    description: "Llista les skills de domini disponibles i quines estan actives al projecte.",
    inputSchema: { type: 'object', properties: { projectName: { type: 'string', description: 'Projecte per verificar skills actives (opcional)' } } }
  },
  platform_activate_skill: {
    description: "Activa una skill de domini al projecte. Requereix confirmació explícita de l'usuari. No activar mai automàticament.",
    inputSchema: { type: 'object', properties: { projectName: { type: 'string', description: 'Nom del projecte' }, skillName: { type: 'string', description: 'Nom de la skill' } }, required: ['projectName', 'skillName'] }
  },
  platform_check_completion: {
    description: "Verifica l'estat de completitud (Implementat/Verificat/Completat) d'una tasca o de totes les tasques d'un projecte.",
    inputSchema: { type: 'object', properties: { projectName: { type: 'string', description: 'Nom del projecte' }, taskFilename: { type: 'string', description: 'Fitxer de tasca específic (opcional)' } }, required: ['projectName'] }
  },
  platform_before_action: {
    description: "ABANS de qualsevol acció significativa (implementar, commit, deploy, analitzar). Detecta el tipus d'acció, risc, model recomanat, i si cal bloquejar (ex: commit sense verificació). CRIDAR SEMPRE abans d'actuar.",
    inputSchema: { type: 'object', properties: { projectName: { type: 'string', description: 'Nom del projecte' }, userRequest: { type: 'string', description: 'Què ha demanat fer l\'usuari' }, intendedAction: { type: 'string', description: 'Què vols fer exactament (implementar, commit, analitzar, verificar...)' } }, required: ['projectName', 'userRequest'] }
  },
  platform_after_action: {
    description: "DESPRÉS d'una acció significativa. Actualitza l'estat de la tasca (Implementat/Verificat/Completat) i guarda notes. Retorna el següent pas.",
    inputSchema: { type: 'object', properties: { projectName: { type: 'string', description: 'Nom del projecte' }, userRequest: { type: 'string', description: 'Què havia demanat l\'usuari' }, actionTaken: { type: 'string', description: 'Què has fet' }, filesChanged: { type: 'string', description: 'Fitxers modificats (opcional)' }, verificationRun: { type: 'string', description: 'Resultat de verificació si s\'ha executat (opcional)' }, result: { type: 'string', description: 'Resultat de l\'acció (opcional)' } }, required: ['projectName'] }
  },
  platform_can_commit: {
    description: "Comprova si es pot fer commit. Verifica tasca associada, estat de verificació, i resum de tests. Bloqueja si no hi ha verificació.",
    inputSchema: { type: 'object', properties: { projectName: { type: 'string', description: 'Nom del projecte' }, gitStatus: { type: 'string', description: 'Output de git status (opcional)' }, verificationSummary: { type: 'string', description: 'Resum de verificació: què s\'ha provat i resultat (opcional)' } }, required: ['projectName'] }
  },
  platform_update_completion: {
    description: "Actualitza l'estat DoD (Implementat/Verificat/Completat) d'una tasca existent. Si no s'especifica taskFile, actualitza l'última tasca.",
    inputSchema: { type: 'object', properties: { projectName: { type: 'string', description: 'Nom del projecte' }, taskFile: { type: 'string', description: 'Fitxer de tasca (opcional, default: última)' }, implemented: { type: 'string', description: 'sí/no/parcial' }, verified: { type: 'string', description: 'sí/no' }, completed: { type: 'string', description: 'sí/no' }, notes: { type: 'string', description: 'Notes addicionals' } }, required: ['projectName'] }
  }
};

// ============================================================
// MCP Protocol (stdio JSON-RPC)
// ============================================================

let buffer = '';

import { fdatasyncSync } from 'fs';

// Flush after every write to avoid buffering issues
function send(msg) {
  const str = JSON.stringify(msg);
  process.stdout.write(str + '\n');
  // Force flush for MCP health checks
  if (process.stdout.writable && typeof process.stdout.fd === 'number') {
    try { fdatasyncSync(process.stdout.fd); } catch {}
  }
}

// Keep process alive even if stdin pauses
setInterval(() => {}, 60000);

// Prevent SIGPIPE from killing the process
process.stdout.on('error', () => {});

process.stdin.setEncoding('utf-8');
process.stdin.on('data', async (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      await handleMessage(msg);
    } catch (e) {
      send({ jsonrpc: '2.0', error: { code: -32700, message: `Parse error: ${e.message}` }, id: null });
    }
  }
});

async function handleMessage(msg) {
  const { id, method, params } = msg;

  try {
    switch (method) {
      case 'initialize':
        // Negotiate protocol version — use the client's version or fallback
        const clientVersion = params?.protocolVersion || '0.1.0';
        send({ jsonrpc: '2.0', id, result: { protocolVersion: clientVersion, serverInfo: { name: 'platform', version: '1.0.0' }, capabilities: { tools: {} } } });
        break;

      case 'notifications/initialized':
        break;

      case 'tools/list':
        send({ jsonrpc: '2.0', id, result: { tools: Object.entries(toolSchemas).map(([name, s]) => ({ name, ...s })) } });
        break;

      case 'tools/call':
        await handleToolCall(id, params);
        break;

      default:
        send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
    }
  } catch (e) {
    send({ jsonrpc: '2.0', id, error: { code: -32603, message: e.message } });
  }
}

async function handleToolCall(id, params) {
  const { name, arguments: args } = params || {};
  const tool = await getTool(name);

  if (!tool) {
    send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Tool not found: ${name}` } });
    return;
  }

  try {
    const output = await tool(args || {});
    const text = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
    send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text }] } });
  } catch (e) {
    send({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true } });
  }
}

// send() defined above with flush
