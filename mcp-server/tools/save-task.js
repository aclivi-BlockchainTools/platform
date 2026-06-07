import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const PROJECTS_DIR = process.env.PROJECTS_DIR || join(homedir(), 'Projects');

export default async function saveTask({ projectName, title, content, model, status }) {
  const projectDir = join(PROJECTS_DIR, projectName);
  if (!existsSync(projectDir)) {
    return `ERROR: Projecte '${projectName}' no trobat a ${PROJECTS_DIR}/`;
  }

  const tasksDir = join(projectDir, 'docs', 'tasks');
  mkdirSync(tasksDir, { recursive: true });

  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:]/g, '').slice(0, 15).replace('T', '-');
  const slug = (title || 'tasca').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 40).replace(/-$/, '');
  const filename = `${timestamp}-${slug}.md`;

  const taskContent = `# Tasca: ${title || 'Sense títol'}

Data: ${now.toISOString().slice(0, 19).replace('T', ' ')}
Projecte: ${projectName}
Model recomanat: ${model || 'claude-sonnet'}
Categoria: manual

## Contingut

${content || '(buit)'}

## Estat

Implementat: ${status === 'implementat' ? 'sí' : 'no'}
Verificat: ${status === 'verificat' ? 'sí' : 'no'}
Completat: ${status === 'completat' ? 'sí' : 'no'}

## Notes

-
`;

  writeFileSync(join(tasksDir, filename), taskContent, 'utf-8');

  return {
    ok: true,
    filename,
    ruta: `~/Projects/${projectName}/docs/tasks/${filename}`
  };
}
