import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const PROJECTS_DIR = process.env.PROJECTS_DIR || join(homedir(), 'Projects');

export default async function afterAction({ projectName, userRequest, actionTaken, filesChanged, verificationRun, result }) {
  const tasksDir = join(PROJECTS_DIR, projectName, 'docs', 'tasks');
  mkdirSync(tasksDir, { recursive: true });

  // Determine DoD status
  const codeModified = actionTaken?.match(/modificat|editat|creat|escrit|canviat|codi|implementat/) ||
                       (filesChanged && filesChanged.length > 0);
  const verified = verificationRun?.match(/passat|ok|exit 0|success|✓|correcte|funciona/) ||
                   result?.match(/passat|ok|success|✓|correcte/);
  const hasErrors = result?.match(/error|fail|✗|falla|incorrecte/) ||
                    verificationRun?.match(/error|fail|✗|falla/);

  const implemented = codeModified ? 'sí' : (hasErrors ? 'parcial' : 'no');
  const verifiedStatus = verified ? 'sí' : 'no';
  const completedStatus = (implemented === 'sí' && verifiedStatus === 'sí') ? 'sí' : 'no';

  // Find or create task file
  let taskFile;
  const files = existsSync(tasksDir) ? readdirSync(tasksDir).filter(f => f.endsWith('.md')).sort().reverse() : [];

  if (files.length > 0) {
    // Update the most recent task
    taskFile = files[0];
    const taskPath = join(tasksDir, taskFile);
    const content = readFileSync(taskPath, 'utf-8');

    let newContent = content
      .replace(/^Implementat:\s*.+/im, `Implementat: ${implemented}`)
      .replace(/^Verificat:\s*.+/im, `Verificat: ${verifiedStatus}`)
      .replace(/^Completat:\s*.+/im, `Completat: ${completedStatus}`);

    // Append notes about this action
    const actionNote = `- ${new Date().toISOString().slice(0, 16).replace('T', ' ')}: ${actionTaken || userRequest || 'Acció'} → Implementat:${implemented} Verificat:${verifiedStatus} Completat:${completedStatus}`;
    if (!newContent.includes(actionNote)) {
      newContent = newContent.replace('## Notes\n\n', `## Notes\n\n${actionNote}\n`);
    }

    writeFileSync(taskPath, newContent, 'utf-8');
  } else {
    // Create new task
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').slice(0, 15).replace('T', '-');
    const slug = (userRequest || 'tasca').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 40).replace(/-$/, '');
    taskFile = `${timestamp}-${slug}.md`;

    const title = (userRequest || 'Tasca').slice(0, 60);
    const taskContent = `# Tasca: ${title}

Data: ${now.toISOString().slice(0, 19).replace('T', ' ')}
Projecte: ${projectName}
Model recomanat: claude-sonnet
Categoria: acció

## Prompt

${userRequest || 'Acció directa'}

## Context usat

Acció: ${actionTaken || 'No especificada'}
Fitxers: ${filesChanged || 'No especificats'}

## Resposta del model

Acció executada per Claude Code.

## Estat

Implementat: ${implemented}
Verificat: ${verifiedStatus}
Completat: ${completedStatus}

## Notes

- ${new Date().toISOString().slice(0, 16).replace('T', ' ')}: ${actionTaken || userRequest || 'Acció'} → Resultat: ${result || 'No documentat'}
`;

    writeFileSync(join(tasksDir, taskFile), taskContent, 'utf-8');
  }

  const nextStep = completedStatus === 'sí'
    ? 'Tasca completada. Pots fer commit si toca i passar a la següent.'
    : verifiedStatus === 'sí'
      ? 'Verificació OK. Marca completat quan acabis.'
      : implemented === 'sí'
        ? 'Codi implementat. Executa verificació (tests/build).'
        : 'Continua implementant.';

  return {
    taskFile,
    implemented,
    verified: verifiedStatus,
    completed: completedStatus,
    nextStep,
    ruta: `~/Projects/${projectName}/docs/tasks/${taskFile}`
  };
}
