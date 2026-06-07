import { Router } from 'express';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { PROJECTS_DIR, listProjects, findClaudeMd } from '../lib/config.js';
import { parseClaudeMd, listProjectTasks, listProjectDecisions, getActiveDomainSkills } from '../lib/markdown.js';

export const projectsRouter = Router();

// GET /api/projects — List all projects with summary
projectsRouter.get('/', (_req, res) => {
  try {
    const projectNames = listProjects();
    const projects = projectNames.map(name => {
      const claudePath = findClaudeMd(name);
      let data = { name, stack: { alta: [], mitjana: [], baixa: [] }, activeSkills: [], status: '', description: '' };
      if (claudePath) {
        const content = readFileSync(claudePath, 'utf-8');
        const parsed = parseClaudeMd(content);
        data = { ...data, ...parsed };
      }
      // Get last task
      const tasks = listProjectTasks(name);
      data.lastTask = tasks.length > 0 ? tasks[0] : null;
      data.activeSkills = getActiveDomainSkills(name);
      return data;
    });
    res.json(projects);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/projects/:name — Full project detail
projectsRouter.get('/:name', (req, res) => {
  try {
    const { name } = req.params;
    const claudePath = findClaudeMd(name);
    if (!claudePath) {
      return res.status(404).json({ error: `Project '${name}' not found` });
    }
    const content = readFileSync(claudePath, 'utf-8');
    const parsed = parseClaudeMd(content);
    const tasks = listProjectTasks(name);
    const decisions = listProjectDecisions(name);
    const activeSkills = getActiveDomainSkills(name);

    res.json({
      name,
      ...parsed,
      activeSkills,
      tasks,
      decisions,
      rawClaudeMd: content
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/projects/:name/status — Quick status
projectsRouter.get('/:name/status', (req, res) => {
  try {
    const { name } = req.params;
    const claudePath = findClaudeMd(name);
    if (!claudePath) {
      return res.status(404).json({ error: `Project '${name}' not found` });
    }
    const content = readFileSync(claudePath, 'utf-8');
    const parsed = parseClaudeMd(content);
    const activeSkills = getActiveDomainSkills(name);
    const tasks = listProjectTasks(name);

    res.json({
      name,
      stack: parsed.stack,
      activeSkills,
      status: parsed.status,
      lastTask: tasks.length > 0 ? tasks[0] : null
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
