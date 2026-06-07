import { execSync } from 'child_process';
import { join } from 'path';
import { homedir } from 'os';

const PLATFORM_DIR = join(homedir(), 'platform');

export default async function routeTask({ taskDescription }) {
  const desc = taskDescription.toLowerCase();

  // Overrides explícits
  if (desc.match(/\busa claude\b|utilitza claude/)) {
    return {
      category: 'auditoria',
      model: 'claude-sonnet',
      reason: "L'usuari ha demanat explícitament Claude.",
      alternative: 'deepseek-v4-pro si no cal revisió independent.'
    };
  }
  if (desc.match(/\busa flash\b|utilitza flash/)) {
    return {
      category: 'simple',
      model: 'deepseek-v4-flash',
      reason: "L'usuari ha demanat explícitament Flash.",
      alternative: 'deepseek-v4-pro per a tasques més complexes.'
    };
  }

  // Claude Haiku
  if (desc.match(/\bresum\b|resumeix|classifica|classificació|consulta ràpida|llista breu/)) {
    return {
      category: 'consulta',
      model: 'claude-haiku',
      reason: 'Tasca lleugera de consulta o classificació.',
      alternative: 'deepseek-v4-flash per a generació de text breu.'
    };
  }

  // Claude Sonnet
  if (desc.match(/revisar|revisió|seguretat|auditoria|audita|segona opinió|decisió d.alt impacte|arquitectura crítica|validar arquitectura|risc alt/)) {
    return {
      category: 'auditoria',
      model: 'claude-sonnet',
      reason: "Tasca de revisió, seguretat o decisió d'alt impacte.",
      alternative: 'deepseek-v4-pro si és una revisió de codi rutinària.'
    };
  }

  // DeepSeek Flash
  if (desc.match(/\bboilerplate\b|petita modificació|modificació petita|tasca repetitiva|generació massiva|afegir camps?|rename|reanomena/)) {
    return {
      category: 'simple',
      model: 'deepseek-v4-flash',
      reason: 'Tasca simple, repetitiva o de boilerplate.',
      alternative: 'deepseek-v4-pro si hi ha lògica de negoci.'
    };
  }

  // Default: DeepSeek V4 Pro
  return {
    category: 'implementació',
    model: 'deepseek-v4-pro',
    reason: 'Implementació principal de software.',
    alternative: 'deepseek-v4-flash si la tasca és purament repetitiva o boilerplate.'
  };
}
