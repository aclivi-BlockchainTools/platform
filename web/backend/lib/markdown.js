import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { PROJECTS_DIR } from './config.js';

// Extract a section between two ## headings (or end of file)
function extractSection(content, heading) {
  const regex = new RegExp(`## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, 'i');
  const match = content.match(regex);
  if (!match) return '';
  return match[1].trim();
}

// Parse stack from AUTO-GENERATED markers OR from ## Stack section
function parseStack(content) {
  const stack = { alta: [], mitjana: [], baixa: [] };

  // First try AUTO-GENERATED markers (template format)
  const autoMatch = content.match(/<!-- AUTO-GENERATED-STACK-START -->([\s\S]*?)<!-- AUTO-GENERATED-STACK-END -->/);
  if (autoMatch) {
    const stackContent = autoMatch[1];
    let currentLevel = null;
    for (const line of stackContent.split('\n')) {
      const levelMatch = line.match(/### Stack detectat \(confiança (alta|mitjana|baixa)\)/i);
      if (levelMatch) {
        currentLevel = levelMatch[1].toLowerCase();
        continue;
      }
      if (currentLevel && line.trim().startsWith('- ')) {
        stack[currentLevel].push(line.trim().slice(2));
      }
    }
    if (stack.alta.length > 0 || stack.mitjana.length > 0 || stack.baixa.length > 0) return stack;
  }

  // Try ## Stack section (simpler format) — extract tech mentions
  const stackSection = extractSection(content, 'Stack');
  if (stackSection) {
    const techs = [];
    for (const line of stackSection.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ')) {
        stack.alta.push(trimmed.slice(2));
      }
    }
  }

  // Fallback: detect known tech from content
  if (stack.alta.length === 0) {
    const techPatterns = [
      { pattern: /\bReact\b/i, name: 'React' },
      { pattern: /\bNext\.js\b/i, name: 'Next.js' },
      { pattern: /\bTypeScript\b/i, name: 'TypeScript' },
      { pattern: /\bTailwind\b/i, name: 'Tailwind CSS' },
      { pattern: /\bNode\.js\b/i, name: 'Node.js' },
      { pattern: /\bExpress\b/i, name: 'Express' },
      { pattern: /\bPostgreSQL\b/i, name: 'PostgreSQL' },
      { pattern: /\bDocker\b/i, name: 'Docker' },
      { pattern: /\bRedis\b/i, name: 'Redis' },
      { pattern: /\bPrisma\b/i, name: 'Prisma' },
      { pattern: /\bVite\b/i, name: 'Vite' },
      { pattern: /\bPython\b/i, name: 'Python' },
      { pattern: /\bRust\b/i, name: 'Rust' },
      { pattern: /\bGo\b/i, name: 'Go' },
      { pattern: /\bPHP\b/i, name: 'PHP' },
      { pattern: /\bLaravel\b/i, name: 'Laravel' },
      { pattern: /\bWordPress\b/i, name: 'WordPress' },
      { pattern: /\bGraphQL\b/i, name: 'GraphQL' },
      { pattern: /\bMongoDB\b/i, name: 'MongoDB' },
      { pattern: /\bMinIO\b/i, name: 'MinIO' },
      { pattern: /\bOpenWA\b/i, name: 'OpenWA' },
      { pattern: /\bWhatsApp\b/i, name: 'WhatsApp' },
      { pattern: /\bWebSocket\b/i, name: 'WebSocket' },
      { pattern: /\bJWT\b/i, name: 'JWT' },
    ];
    for (const { pattern, name } of techPatterns) {
      if (pattern.test(content)) {
        stack.alta.push(name);
      }
    }
  }

  return stack;
}

// Parse active domain skills from CLAUDE.md
function parseActiveSkills(content) {
  const section = extractSection(content, 'Skills de domini actives');
  if (!section) return [];
  const skills = [];
  for (const line of section.split('\n')) {
    const match = line.trim().match(/^- (\S+)\s/);
    if (match) skills.push(match[1]);
  }
  return skills;
}

// Parse full CLAUDE.md
export function parseClaudeMd(content) {
  // Handle multiple name formats: "# Projecte: <nom>" or "# CLAUDE.md — <nom>" or "# <nom>"
  let nameMatch = content.match(/^# Projecte:\s*(.+)/m);
  if (!nameMatch) nameMatch = content.match(/^# CLAUDE\.md\s*[—–-]\s*(.+)/m);
  if (!nameMatch) nameMatch = content.match(/^#\s*(.+)/m);
  const name = nameMatch ? nameMatch[1].trim() : '';

  const descSection = extractSection(content, 'Descripció');
  const descLines = descSection.split('\n').filter(l => !l.trim().startsWith('<!--') && l.trim());
  const description = descLines[0] || '';

  const stack = parseStack(content);
  const activeSkills = parseActiveSkills(content);
  const status = extractSection(content, 'Estat actual');

  // Model strategy
  const strategySection = extractSection(content, 'Model Strategy');
  const principalMatch = strategySection.match(/Model principal:\s*(.+)/);
  const rapidMatch = strategySection.match(/Model ràpid:\s*(.+)/);
  const auditorMatch = strategySection.match(/Model auditor:\s*(.+)/);
  const modelStrategy = {
    principal: principalMatch ? principalMatch[1].trim() : 'deepseek-v4-pro',
    rapid: rapidMatch ? rapidMatch[1].trim() : 'deepseek-v4-flash',
    auditor: auditorMatch ? auditorMatch[1].trim() : 'claude-sonnet'
  };

  // Errors
  const errorsSection = extractSection(content, 'Errors resolts');
  const errors = errorsSection ? errorsSection.split('\n').filter(l => l.trim().startsWith('- ')).map(l => l.trim().slice(2)) : [];

  return { name, description, stack, activeSkills, status, modelStrategy, errors };
}

// Parse task file metadata (lightweight, for list views)
export function parseTaskMetadata(content) {
  const titleMatch = content.match(/^# Tasca:\s*(.+)/m);
  const dateMatch = content.match(/^Data:\s*(.+)/m);
  const modelMatch = content.match(/^Model recomanat:\s*(.+)/m);
  const catMatch = content.match(/^Categoria:\s*(.+)/m);

  const statusSection = extractSection(content, 'Estat');
  const implMatch = statusSection.match(/Implementat:\s*(.+)/i);
  const verMatch = statusSection.match(/Verificat:\s*(.+)/i);
  const compMatch = statusSection.match(/Completat:\s*(.+)/i);

  return {
    title: titleMatch ? titleMatch[1].trim() : '',
    date: dateMatch ? dateMatch[1].trim() : '',
    model: modelMatch ? modelMatch[1].trim() : '',
    category: catMatch ? catMatch[1].trim() : '',
    implementat: implMatch ? implMatch[1].trim().toLowerCase() : 'no',
    verificat: verMatch ? verMatch[1].trim().toLowerCase() : 'no',
    completat: compMatch ? compMatch[1].trim().toLowerCase() : 'no'
  };
}

// Parse full task file
export function parseTaskFile(content) {
  const meta = parseTaskMetadata(content);
  const promptSection = extractSection(content, 'Prompt');
  const responseSection = extractSection(content, 'Resposta del model');
  const contextSection = extractSection(content, 'Context usat');
  const notesSection = extractSection(content, 'Notes');

  return {
    ...meta,
    prompt: promptSection,
    response: responseSection,
    context: contextSection,
    notes: notesSection
  };
}

// Update task status (DoD fields) in the markdown content
export function updateTaskStatus(content, updates) {
  let result = content;
  if ('implementat' in updates) {
    result = result.replace(/^Implementat:\s*.+/im, `Implementat: ${updates.implementat}`);
  }
  if ('verificat' in updates) {
    result = result.replace(/^Verificat:\s*.+/im, `Verificat: ${updates.verificat}`);
  }
  if ('completat' in updates) {
    result = result.replace(/^Completat:\s*.+/im, `Completat: ${updates.completat}`);
  }
  if ('notes' in updates) {
    // Replace the Notes section content
    const notesMatch = result.match(/## Notes\s*\n([\s\S]*?)(?=\n## |$)/);
    if (notesMatch) {
      result = result.replace(notesMatch[0], `## Notes\n\n${updates.notes}`);
    }
  }
  return result;
}

// List tasks for a project
export function listProjectTasks(projectName) {
  const tasksDir = join(PROJECTS_DIR, projectName, 'docs', 'tasks');
  if (!existsSync(tasksDir)) return [];
  const files = readdirSync(tasksDir).filter(f => f.endsWith('.md')).sort().reverse();
  return files.map(f => {
    const content = readFileSync(join(tasksDir, f), 'utf-8');
    const meta = parseTaskMetadata(content);
    return { filename: f, ...meta };
  });
}

// Get a single task
export function getTask(projectName, filename) {
  const taskPath = join(PROJECTS_DIR, projectName, 'docs', 'tasks', filename);
  if (!existsSync(taskPath)) return null;
  const content = readFileSync(taskPath, 'utf-8');
  return { filename, ...parseTaskFile(content), raw: content };
}

// List decisions for a project
export function listProjectDecisions(projectName) {
  const decisionsDir = join(PROJECTS_DIR, projectName, 'docs', 'decisions');
  if (!existsSync(decisionsDir)) return [];
  const files = readdirSync(decisionsDir).filter(f => f.endsWith('.md')).sort().reverse();
  return files.map(f => {
    const content = readFileSync(join(decisionsDir, f), 'utf-8');
    const titleMatch = content.match(/^#\s*(.+)/m);
    return {
      filename: f,
      title: titleMatch ? titleMatch[1].trim() : f,
      date: f.startsWith('20') ? f.slice(0, 10) : ''
    };
  });
}

// Check active domain skills via symlinks
export function getActiveDomainSkills(projectName) {
  const domainDir = join(PROJECTS_DIR, projectName, '.claude', 'active-skills', 'domain');
  if (!existsSync(domainDir)) return [];
  const entries = readdirSync(domainDir, { withFileTypes: true });
  return entries
    .filter(e => e.name !== '.gitkeep' && (e.isSymbolicLink() || e.isDirectory()))
    .map(e => e.name);
}
