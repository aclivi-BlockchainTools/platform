import { readFileSync, existsSync, readdirSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const PLATFORM_DIR = join(homedir(), 'platform');
const PROJECTS_DIR = process.env.PROJECTS_DIR || join(homedir(), 'Projects');
const CONFIG_DIR = join(homedir(), '.platform');

function readEnvConfig() {
  const envPath = join(CONFIG_DIR, '.env');
  const config = {};
  try {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      // Expand $HOME
      value = value.replace(/\$HOME/g, homedir());
      config[key] = value;
    }
  } catch (_) {
    // Config file doesn't exist
  }
  return config;
}

function findClaudeMd(projectName) {
  // Check both locations: .claude/CLAUDE.md (template) and CLAUDE.md (root, existing projects)
  const inClaude = join(PROJECTS_DIR, projectName, '.claude', 'CLAUDE.md');
  if (existsSync(inClaude)) return inClaude;
  const inRoot = join(PROJECTS_DIR, projectName, 'CLAUDE.md');
  if (existsSync(inRoot)) return inRoot;
  return null;
}

function listProjects() {
  const projects = [];
  if (!existsSync(PROJECTS_DIR)) return projects;
  const entries = readdirSync(PROJECTS_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
    const claudeMd = findClaudeMd(entry.name);
    if (claudeMd) {
      projects.push(entry.name);
    }
  }
  return projects.sort();
}

export { PLATFORM_DIR, PROJECTS_DIR, CONFIG_DIR, readEnvConfig, listProjects, findClaudeMd };
