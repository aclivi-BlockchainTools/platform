import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const PROJECTS_DIR = process.env.PROJECTS_DIR || join(homedir(), 'Projects');

export default async function canCommit({ projectName, gitStatus, verificationSummary }) {
  const projectDir = join(PROJECTS_DIR, projectName);
  if (!existsSync(projectDir)) {
    return { allowed: false, reason: `Projecte '${projectName}' no trobat` };
  }

  const checks = [];
  let allowed = true;
  const pending = [];

  // Check 1: Task exists
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

  if (!lastTask) {
    allowed = false;
    pending.push('Crear tasca que documenti els canvis (platform_create_task)');
    checks.push({ check: 'Tasca associada', status: 'fail', detail: 'No hi ha tasques a docs/tasks/' });
  } else {
    checks.push({ check: 'Tasca associada', status: 'ok', detail: lastTask.title });

    if (lastTask.implementat !== 'sí' && lastTask.implementat !== 'si') {
      checks.push({ check: 'Implementat', status: 'warn', detail: `Marcat com: ${lastTask.implementat}` });
    } else {
      checks.push({ check: 'Implementat', status: 'ok', detail: 'sí' });
    }

    if (lastTask.verificat !== 'sí' && lastTask.verificat !== 'si') {
      allowed = false;
      pending.push('Verificar els canvis abans de commit');
      checks.push({ check: 'Verificat', status: 'fail', detail: `Marcat com: ${lastTask.verificat}. Cal verificar.` });
    } else {
      checks.push({ check: 'Verificat', status: 'ok', detail: 'sí' });
    }
  }

  // Check 2: Verification summary provided
  if (!verificationSummary || verificationSummary.trim().length < 10) {
    allowed = false;
    pending.push('Documentar resum de verificació (què s\'ha provat, com, resultat)');
    checks.push({ check: 'Resum verificació', status: 'fail', detail: 'No proporcionat' });
  } else {
    // Check for test failures in verification
    if (verificationSummary.match(/error|fail|✗|falla|FAIL|Error/)) {
      allowed = false;
      pending.push('Corregir errors de verificació');
      checks.push({ check: 'Tests/Build', status: 'fail', detail: 'Hi ha errors en la verificació' });
    } else {
      checks.push({ check: 'Tests/Build', status: 'ok', detail: 'Sense errors detectats' });
    }
  }

  // Check 3: Code modified
  if (!gitStatus || gitStatus.trim().length < 3) {
    allowed = false;
    pending.push('No hi ha canvis per commitar');
    checks.push({ check: 'Canvis detectats', status: 'fail', detail: 'git status buit' });
  } else {
    checks.push({ check: 'Canvis detectats', status: 'ok', detail: 'git status no buit' });
  }

  return {
    allowed,
    reason: allowed
      ? 'Tot correcte. Pots fer commit.'
      : `No es pot fer commit. Verificacions pendents: ${pending.join('; ')}`,
    checks,
    pending,
    recomanacio: allowed
      ? 'git add <fitxers> && git commit -m "missatge descriptiu"'
      : pending.map((p, i) => `${i + 1}. ${p}`).join('\n'),
    lastTask: lastTask ? {
      title: lastTask.title,
      implementat: lastTask.implementat,
      verificat: lastTask.verificat,
      completat: lastTask.completat
    } : null
  };
}
