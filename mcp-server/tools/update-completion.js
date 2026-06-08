import { writeFileSync, readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const PROJECTS_DIR = process.env.PROJECTS_DIR || join(homedir(), 'Projects');

export default async function updateCompletion({ projectName, taskFile, implemented, verified, completed, notes }) {
  const tasksDir = join(PROJECTS_DIR, projectName, 'docs', 'tasks');

  if (!existsSync(tasksDir)) {
    return { error: `No hi ha directori de tasques a ${projectName}/docs/tasks/` };
  }

  // Find task file
  let filename = taskFile;
  if (!filename) {
    const files = readdirSync(tasksDir).filter(f => f.endsWith('.md')).sort().reverse();
    if (files.length === 0) {
      return { error: 'No hi ha tasques. Crea una tasca primer amb platform_create_task.' };
    }
    filename = files[0];
  }

  const taskPath = join(tasksDir, filename);
  if (!existsSync(taskPath)) {
    return { error: `Tasca no trobada: ${filename}` };
  }

  const content = readFileSync(taskPath, 'utf-8');
  const title = (content.match(/^# Tasca:\s*(.+)/m) || [])[1] || filename;

  let newContent = content;

  if (implemented !== undefined) {
    newContent = newContent.replace(/^Implementat:\s*.+/im, `Implementat: ${implemented}`);
  }
  if (verified !== undefined) {
    newContent = newContent.replace(/^Verificat:\s*.+/im, `Verificat: ${verified}`);
  }
  if (completed !== undefined) {
    newContent = newContent.replace(/^Completat:\s*.+/im, `Completat: ${completed}`);
  }
  if (notes) {
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const noteLine = `- ${timestamp}: ${notes}`;
    if (!newContent.includes(notes)) {
      newContent = newContent.replace('## Notes\n\n', `## Notes\n\n${noteLine}\n`);
    }
  }

  writeFileSync(taskPath, newContent, 'utf-8');

  // Re-read to confirm
  const updated = readFileSync(taskPath, 'utf-8');
  const impl = (updated.match(/^Implementat:\s*(.+)/im) || [])[1] || '?';
  const verif = (updated.match(/^Verificat:\s*(.+)/im) || [])[1] || '?';
  const comp = (updated.match(/^Completat:\s*(.+)/im) || [])[1] || '?';

  const allDone = (impl === 'sí' || impl === 'si') &&
                  (verif === 'sí' || verif === 'si') &&
                  (comp === 'sí' || comp === 'si');

  return {
    taskFile: filename,
    title,
    implementat: impl,
    verificat: verif,
    completat: comp,
    allDone,
    verdict: allDone ? 'COMPLETADA' : 'PENDENT',
    ruta: `~/Projects/${projectName}/docs/tasks/${filename}`
  };
}
