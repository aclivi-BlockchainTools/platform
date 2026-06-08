import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const PROJECTS_DIR = process.env.PROJECTS_DIR || join(homedir(), 'Projects');

export default async function checkCompletion({ projectName, taskFilename }) {
  const tasksDir = join(PROJECTS_DIR, projectName, 'docs', 'tasks');

  // If taskFilename provided, check that specific task
  if (taskFilename) {
    const taskPath = join(tasksDir, taskFilename);
    if (!existsSync(taskPath)) {
      return { error: `Task not found: ${taskFilename}` };
    }
    const content = readFileSync(taskPath, 'utf-8');
    const title = (content.match(/^# Tasca:\s*(.+)/m) || [])[1] || taskFilename;
    const implementat = (content.match(/^Implementat:\s*(.+)/im) || [])[1] || 'no';
    const verificat = (content.match(/^Verificat:\s*(.+)/im) || [])[1] || 'no';
    const completat = (content.match(/^Completat:\s*(.+)/im) || [])[1] || 'no';

    const allDone = (implementat === 'sí' || implementat === 'si') &&
                    (verificat === 'sí' || verificat === 'si') &&
                    (completat === 'sí' || completat === 'si');

    return {
      task: taskFilename,
      title,
      implementat,
      verificat,
      completat,
      allDone,
      verdict: allDone ? 'COMPLETADA' : 'PENDENT'
    };
  }

  // No taskFilename: check all tasks
  if (!existsSync(tasksDir)) {
    return { project: projectName, tasks: [], summary: 'Cap tasca' };
  }

  const files = readdirSync(tasksDir).filter(f => f.endsWith('.md')).sort().reverse();
  const tasks = files.map(f => {
    const content = readFileSync(join(tasksDir, f), 'utf-8');
    const title = (content.match(/^# Tasca:\s*(.+)/m) || [])[1] || f;
    const implementat = (content.match(/^Implementat:\s*(.+)/im) || [])[1] || 'no';
    const verificat = (content.match(/^Verificat:\s*(.+)/im) || [])[1] || 'no';
    const completat = (content.match(/^Completat:\s*(.+)/im) || [])[1] || 'no';
    return { filename: f, title, implementat, verificat, completat };
  });

  const completades = tasks.filter(t =>
    (t.implementat === 'sí' || t.implementat === 'si') &&
    (t.verificat === 'sí' || t.verificat === 'si') &&
    (t.completat === 'sí' || t.completat === 'si')
  ).length;

  return {
    project: projectName,
    totalTasks: tasks.length,
    completades,
    pendents: tasks.length - completades,
    tasks: tasks.slice(0, 10)
  };
}
