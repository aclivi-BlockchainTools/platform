# Platform Web

Consola visual local per a la plataforma de desenvolupament assistit per IA.

```
http://localhost:3333
```

## Quickstart

```bash
cd platform/web
npm run install:all
npm run dev
```

Això arrenca:
- Backend: http://localhost:3333 (Express API)
- Frontend: http://localhost:5175 (Vite + React, proxy a :3333)

Obre `http://localhost:5175` al navegador.

## Què fa

Capa visual damunt del motor existent de `platform`. No substitueix la CLI.

### Funcionalitats

- **Dashboard** — Tots els projectes de ~/Projects amb stack, skills, última tasca i estat DoD
- **Vista de projecte** — CLAUDE.md, stack, skills, tasques, decisions
- **Nova tasca** — Classificació amb routing engine + execució via LiteLLM (DeepSeek) o prompt preparat (Claude)
- **Skills** — Suggerir i activar skills de domini (airlock)
- **v0.dev** — Generar prompts per a interfícies premium
- **Models** — Gestionar LiteLLM (start/stop/test)
- **System** — Doctor i configuració

### Flux d'ús

1. Obre `http://localhost:5175`
2. Tria un projecte
3. Crea una tasca: "Afegir dashboard multi-sessió WhatsApp"
4. La plataforma classifica, tria DeepSeek V4 Pro, genera resposta
5. Copia el pla generat
6. Obre Claude Code: `cd ~/Projects/<projecte> && claude`
7. Implementa amb Claude, verifica amb task-completion

## Arquitectura

```
web/
├── backend/         # Node.js + Express, port 3333
│   ├── server.js
│   ├── routes/      # API REST (projects, tasks, skills, models, v0, routing, system)
│   └── lib/         # config, shell, markdown, litellm
├── frontend/        # React + Vite, port 5175
│   └── src/
│       ├── pages/       # Dashboard, ProjectView, NewTask, TaskDetail, SkillsView, V0View, ModelsView, SystemView
│       └── components/  # Layout, ProjectCard, TaskList, SkillCard, StackBadge, ModelStatus, ClassificationResult, MarkdownView
└── package.json     # Root: concurrently per backend+frontend
```

## Restriccions

- Sense login, només local
- No multi-agents (LangGraph, CrewAI, AutoGen)
- No commits automàtics
- No edició automàtica de codi
- No saltar-se l'airlock de skills
- Llegeix/escriu fitxers markdown/json existents (cap base de dades)

## Requisits

- Node.js 18+
- Docker (per LiteLLM)
- Claude Code (per implementar)
- `~/Projects/` amb projectes inicialitzats
