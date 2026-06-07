import express from 'express';
import cors from 'cors';
import { projectsRouter } from './routes/projects.js';
import { tasksRouter } from './routes/tasks.js';
import { skillsRouter } from './routes/skills.js';
import { modelsRouter } from './routes/models.js';
import { v0Router } from './routes/v0.js';
import { routingRouter } from './routes/routing.js';
import { systemRouter } from './routes/system.js';
import { platformRouter } from './routes/platform.js';

const app = express();
const PORT = 3333;

app.use(cors());
app.use(express.json());

app.use('/api/projects', projectsRouter);
app.use('/api', tasksRouter);
app.use('/api', skillsRouter);
app.use('/api/models', modelsRouter);
app.use('/api/v0', v0Router);
app.use('/api/routing', routingRouter);
app.use('/api/system', systemRouter);
app.use('/api/platform', platformRouter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`platform-web backend → http://localhost:${PORT}`);
});
