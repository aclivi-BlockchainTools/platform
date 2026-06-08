import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const PROJECTS_DIR = process.env.PROJECTS_DIR || join(homedir(), 'Projects');

function classifyTask(desc) {
  const d = desc.toLowerCase();
  if (d.match(/\bcommit\b|commita|git add|git commit|puja|push/)) return { category: 'commit', model: 'claude-sonnet', risk: 'alt' };
  if (d.match(/\bimplementa|crea|afegeix|codifica|desenvolupa|build|construeix/)) return { category: 'implementació', model: 'deepseek-v4-pro', risk: 'mitjà' };
  if (d.match(/\btest|prova|verifica|valida|comprova|playwright/)) return { category: 'verificació', model: 'deepseek-v4-pro', risk: 'baix' };
  if (d.match(/\banalitza|revisa|audita|analitza|revisió|proposa/)) return { category: 'anàlisi', model: 'deepseek-v4-pro', risk: 'baix' };
  if (d.match(/\bdeploy|desplega|producci[oó]/)) return { category: 'deploy', model: 'claude-sonnet', risk: 'alt' };
  if (d.match(/\bskill|activa|domini/)) return { category: 'skill', model: 'claude-sonnet', risk: 'baix' };
  if (d.match(/\bfes-ho|endavant|tira|ok\b|vale|d'acord/)) return { category: 'confirmació', model: 'claude-sonnet', risk: 'mitjà' };
  return { category: 'altra', model: 'deepseek-v4-pro', risk: 'baix' };
}

export default async function beforeAction({ projectName, userRequest, intendedAction }) {
  const projectDir = join(PROJECTS_DIR, projectName);
  if (!existsSync(projectDir)) {
    return { error: `Projecte '${projectName}' no trobat`, block: true };
  }

  const desc = intendedAction || userRequest || '';
  const { category, model, risk } = classifyTask(desc);

  // Check for existing tasks
  const tasksDir = join(projectDir, 'docs', 'tasks');
  let lastTask = null;
  if (existsSync(tasksDir)) {
    const files = readdirSync(tasksDir).filter(f => f.endsWith('.md')).sort().reverse();
    if (files.length > 0) {
      const content = readFileSync(join(tasksDir, files[0]), 'utf-8');
      lastTask = {
        filename: files[0],
        title: (content.match(/^# Tasca:\s*(.+)/m) || [])[1] || '',
        implementat: (content.match(/^Implementat:\s*(.+)/im) || [])[1] || 'no',
        verificat: (content.match(/^Verificat:\s*(.+)/im) || [])[1] || 'no',
        completat: (content.match(/^Completat:\s*(.+)/im) || [])[1] || 'no'
      };
    }
  }

  const needsTask = category === 'implementació' || category === 'anàlisi' || !lastTask;
  const needsVerificationBeforeComplete = category === 'implementació' || category === 'commit';

  // Commit-specific rules
  let block = false;
  let blockReason = '';
  let instructions = '';

  if (category === 'commit') {
    if (!lastTask) {
      block = true;
      blockReason = 'No hi ha cap tasca registrada a docs/tasks/. Crea una tasca abans de fer commit.';
      instructions = '1. Crea tasca amb platform_create_task\n2. Implementa\n3. Verifica\n4. Torna a intentar commit';
    } else if (lastTask.verificat !== 'sí' && lastTask.verificat !== 'si') {
      block = true;
      blockReason = `La tasca "${lastTask.title}" no està verificada. Executa verificació abans de commit.`;
      instructions = '1. Executa tests o verificació manual\n2. Marca verificat: sí amb platform_update_completion\n3. Torna a intentar commit';
    } else if (!lastTask.filename) {
      block = true;
      blockReason = 'No hi ha tasca associada. Crea una tasca.';
      instructions = 'Usa platform_create_task per crear una tasca que documenti els canvis.';
    }
  }

  if (category === 'confirmació') {
    instructions = "L'usuari diu \"fes-ho\". Abans d'executar:\n1. Confirma què vols fer exactament\n2. Valida amb platform_before_action amb l'acció real\n3. Executa\n4. Verifica\n5. Documenta amb platform_after_action";
  }

  return {
    category,
    modelRecomanat: model,
    risk,
    needsTask,
    needsVerificationBeforeComplete,
    block,
    blockReason,
    instructions: instructions || `Acció: ${category}. Model recomanat: ${model}. ${needsTask ? 'Cal crear o actualitzar tasca.' : ''} ${needsVerificationBeforeComplete ? 'Cal verificar abans de completar.' : ''}`,
    lastTask: lastTask ? {
      title: lastTask.title,
      implementat: lastTask.implementat,
      verificat: lastTask.verificat,
      completat: lastTask.completat
    } : null
  };
}
