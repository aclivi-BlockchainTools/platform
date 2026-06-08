import { existsSync } from 'fs';
import { join, basename } from 'path';
import { homedir } from 'os';

const PROJECTS_DIR = process.env.PROJECTS_DIR || join(homedir(), 'Projects');

export default async function currentProject() {
  const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();

  // Check if cwd is inside a ~/Projects/<name> directory
  for (const part of cwd.split('/')) {
    const projectDir = join(PROJECTS_DIR, part);
    if (existsSync(projectDir) && cwd.startsWith(projectDir)) {
      // Found a project directory
      let claudePath = join(projectDir, '.claude', 'CLAUDE.md');
      if (!existsSync(claudePath)) claudePath = join(projectDir, 'CLAUDE.md');

      const hasClaudeMd = existsSync(claudePath);
      const isExact = cwd === projectDir;

      return {
        projectName: part,
        projectDir,
        hasClaudeMd,
        isExactProject: isExact,
        cwd
      };
    }
  }

  // Check if cwd itself is a project
  const cwdName = basename(cwd);
  let claudePath = join(cwd, '.claude', 'CLAUDE.md');
  if (!existsSync(claudePath)) claudePath = join(cwd, 'CLAUDE.md');
  if (existsSync(claudePath)) {
    return {
      projectName: cwdName,
      projectDir: cwd,
      hasClaudeMd: true,
      isExactProject: true,
      cwd
    };
  }

  return {
    projectName: null,
    projectDir: null,
    hasClaudeMd: false,
    isExactProject: false,
    message: 'No project detected. cd to a project in ~/Projects/ or run platform list-projects.',
    cwd
  };
}
