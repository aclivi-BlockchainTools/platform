# Platform

Plataforma personal de desenvolupament assistit per IA.

## Principi 0

La plataforma existeix per augmentar la qualitat de les decisions, no per reduir la creativitat.

## Instal·lació ràpida

```bash
git clone https://github.com/aclivi-BlockchainTools/platform.git ~/platform
cd ~/platform
bash scripts/install.sh
platform config
platform doctor
platform models start
platform models test
platform mcp-install              # Registra el MCP a Claude Code
platform install-claude-profile   # Instal·la perfil global (opcional, recomanat)
claude
```

Després d'instal·lar, dins Claude Code Platform s'usa automàticament. No cal recordar comandes.

## Modes d'ús de Claude

### Mode recomanat: Claude Code amb compte

```bash
claude
```

Inicia sessió amb el teu compte Claude.

Aquest mode **NO requereix** `ANTHROPIC_API_KEY`.

DeepSeek V4 Pro/Flash funcionen via API key + LiteLLM.

### Mode API opcional

Si vols usar Claude també via LiteLLM (per `platform models test` o per routing):

Afegeix a `~/.platform/.env`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Després de configurar-la, `platform models test` mostrarà `claude-sonnet: OK`.

## Què és

Font de veritat central de skills, templates, patterns i scripts per a tots els projectes a `$HOME/Projects/`.

## Estructura

```
platform/
├── skills/
│   ├── universal/     ← Sempre actives a tots els projectes (8 skills)
│   └── domain/        ← Activació manual per projecte
├── prompts/v0/        ← Prompts per v0.dev (UI premium)
├── templates/         ← Plantilles per nous projectes i existents
├── patterns/          ← Lliçons apreses abstractes
├── litellm/           ← Configuració LiteLLM (Docker, models Claude + DeepSeek)
├── mcp/               ← Catàleg i configuracions de MCPs
└── scripts/           ← Eines d'inicialització, instal·lació i activació
```

## Workflow diari

### Comanda principal

```bash
platform/scripts/platform.sh
```

O amb subcomanda directa:

```bash
platform/scripts/platform.sh new <nom>
platform/scripts/platform.sh import <nom>
platform/scripts/platform.sh open <nom>
platform/scripts/platform.sh status <nom>
platform/scripts/platform.sh skills <nom>
platform/scripts/platform.sh activate <skill> <projecte>
platform/scripts/platform.sh v0 <tipus> [projecte]
platform/scripts/platform.sh resume <nom>
platform/scripts/platform.sh config
platform/scripts/platform.sh doctor
platform/scripts/platform.sh models start
platform/scripts/platform.sh models status
platform/scripts/platform.sh skills --list
```

### Crear un projecte nou

```bash
platform/scripts/platform.sh new <nom>
```

- Requereix `gh` (GitHub CLI) instal·lat i autenticat.
- Crea un repo privat a GitHub, clona, aplica la plantilla i fa commit inicial.
- Deixa `.claude/active-skills/domain/` buit (les skills de domini s'activen manualment).

### Connectar un projecte existent

```bash
platform import <nom>
```

**És l'únic pas necessari.** No cal editar el CLAUDE.md manualment.

Què fa:

- Crea backup del CLAUDE.md original (`.claude/CLAUDE.md.bak-YYYYMMDD-HHMMSS`).
- Si el CLAUDE.md és a l'arrel (`CLAUDE.md`), el mou a `.claude/CLAUDE.md`.
- Afegeix **només les seccions que falten**, sense tocar contingut existent:
  - `## Descripció`, `## Stack`, `## Estat actual`, `## Decisions clau`
  - `## Model Strategy`, `## Skills de domini actives`, `## Errors resolts`, `## Fora de context`
- Detecta stack en arrel i subdirectoris (`frontend/`, `backend/`).
- Crea directoris: `.claude/active-skills/domain/`, `docs/decisions/`, `docs/tasks/`.
- Si detecta decisions inline al CLAUDE.md original, afegeix `## Migració pendent` amb instruccions.
- No activa skills de domini automàticament.

### Activar una skill de domini

```bash
platform/scripts/platform.sh activate <skill> <projecte>
```

- Crea un symlink a `.claude/active-skills/domain/<skill>`.
- Anota l'activació al CLAUDE.md sota `## Skills de domini actives`.
- Evita duplicats: si la skill ja hi és, no l'afegeix dos cops.

### Suggerir skills per a un projecte

```bash
platform/scripts/platform.sh skills <projecte>
```

- Separa stack detectat (tecnologies) de skills de domini suggerides.
- Mostra cada detecció amb confiança (alta/mitjana/baixa) i motiu.
- Només suggereix skills que existeixen a `platform/skills/domain/`.
- No activa res automàticament — l'usuari decideix.

### Estat del projecte

```bash
platform/scripts/platform.sh status <projecte>
```

Mostra: stack, skills actives, última decisió, estat actual.

### Reprendre un projecte

```bash
platform/scripts/platform.sh resume <projecte>
```

Mostra una vista completa per continuar treballant:

- Projecte i ruta
- Stack detectat
- Skills actives
- Estat actual (resumit)
- Pròxim pas
- Última decisió (de `docs/decisions/`)
- Criteri de completitud (Implementat / Verificat / Completat)

No modifica cap fitxer. Només llegeix i mostra.

### Configurar la plataforma

```bash
platform config
```

- Crea o mostra `~/.platform/.env`.
- Indica quines claus API falten (Anthropic, DeepSeek).
- No mostra mai les claus senceres.

### Verificar l'estat del sistema

```bash
platform doctor
```

Comprova: platform, PATH, PROJECTS_DIR, Claude Code, Docker, Docker Compose, LiteLLM, claus API, GitHub CLI.

### Gestionar models (LiteLLM)

```bash
platform models start     # Arrencar LiteLLM
platform models stop      # Aturar LiteLLM
platform models status    # Estat de LiteLLM
platform models test      # Test de connexió als models
platform models logs      # Logs de LiteLLM
```

LiteLLM exposa DeepSeek V4 Flash, DeepSeek V4 Pro, Claude Sonnet i Claude Haiku via `http://127.0.0.1:4000`.

### Test de models

```bash
platform models test
```

Valida la connexió a cada model i mostra un resum.

## Model Routing

### Jerarquia de models

| Model | Rol | Per a què |
|-------|-----|-----------|
| **DeepSeek V4 Pro** | Principal | Arquitectura, backend, frontend, refactors, debugging, desenvolupament diari |
| **DeepSeek V4 Flash** | Ràpid | CRUDs, components, scripts, tests, modificacions petites |
| **Claude Sonnet** | Auditor | Revisió, seguretat, UX, segona opinió, auditories |
| **Claude Haiku** | Lleuger | Resums, classificació, consultes ràpides |

### Model Strategy

```
Model principal:  deepseek-v4-pro
Model ràpid:      deepseek-v4-flash
Model auditor:    claude-sonnet
```

Escalar a Claude només quan: risc alt, calgui revisió independent, validació d'arquitectura, seguretat, o DeepSeek no resolgui el problema.

## Filosofia de costos

Maximitzar qualitat per euro invertit.

Estratègia recomanada:

- **70-80% DeepSeek V4 Pro** — desenvolupament principal
- **15-25% DeepSeek V4 Flash** — tasques simples i repetitives
- **5-10% Claude Sonnet** — auditories i revisions crítiques

Claude s'utilitza quan el seu valor afegit justifica el cost.

## Workflow UI premium

Per a interfícies importants (dashboards, landing pages, apps):

```
1. DeepSeek V4 Pro defineix producte, UX i arquitectura
        ↓
2. DeepSeek V4 Pro genera un brief de UI (guiat per ui-ux-design.md)
        ↓
3. L'usuari genera el prompt amb: platform v0 <tipus> <projecte>
        ↓
4. L'usuari copia el prompt a v0.dev
        ↓
5. v0.dev genera la UI React/Tailwind/shadcn/ui
        ↓
6. L'usuari copia o exporta el codi al projecte
        ↓
7. Claude Code / DeepSeek V4 Pro integra la UI amb backend, estat, rutes i dades reals
        ↓
8. Playwright o verificació manual valida el flux principal
        ↓
9. task-completion.md decideix si està completat
```

Principi: **v0.dev genera interfícies. DeepSeek V4 Pro + Claude Code integren producte real.**

### Generar prompt per v0.dev

```bash
platform/scripts/platform.sh v0 landing-page <projecte>
platform/scripts/platform.sh v0 saas-dashboard <projecte>
platform/scripts/platform.sh v0 admin-panel <projecte>
platform/scripts/platform.sh v0 app-shell <projecte>
```

El prompt inclou context del projecte (si existeix) i és llest per copiar a v0.dev.

## Routing Engine v1

La plataforma pot classificar tasques, triar model i executar consultes via LiteLLM. DeepSeek V4 Pro és el model principal operatiu, no només documentat.

### `platform route`

Classifica una tasca i mostra el model recomanat. No executa res.

```bash
platform route "crear CRUD de clients amb React i Express"
```

Retorna: categoria, model recomanat, motiu i alternativa.

### `platform ask`

Executa un prompt directament contra un model via LiteLLM.

```bash
platform ask deepseek-v4-pro "Crea un esquema d'API REST per clients"
```

Models acceptats: `deepseek-v4-pro`, `deepseek-v4-flash`, `claude-sonnet`, `claude-haiku`

Si el model és Claude i `ANTHROPIC_API_KEY` no està configurada, mostra instrucció per usar Claude Code amb login de compte.

### `platform task`

Combina classificació + consulta a LiteLLM + persistència. Genera un pla o resposta i el guarda a `docs/tasks/` del projecte.

```bash
platform task demo-crm "Crear CRUD de clients amb frontend i backend"
```

- Si el model és **DeepSeek**: consulta LiteLLM amb context complet del projecte (Stack, Estat actual complet, Decisions clau, Model Strategy, última tasca), guarda resposta a `docs/tasks/`.
- Si el model és **Claude**: guarda el prompt preparat i mostra instrucció per usar Claude Code.
- El prompt inclou instruccions fortes per no proposar funcionalitats ja completades i estructurar la resposta segons el tipus de tasca.

**Important:** `platform task` NO modifica codi. Genera plans, respostes o prompts de treball.

**Test manual recomanat:**
```bash
platform task wa-desk2 "Analitza el projecte i proposa els següents passos"
```
La resposta ha de respectar l'Estat actual i no proposar implementar funcionalitats ja completades.

### Regles de routing

| Tipus de tasca | Model |
|----------------|-------|
| Implementació, CRUD, API, React, debugging | `deepseek-v4-pro` |
| Boilerplate, petites modificacions, repetitiu | `deepseek-v4-flash` |
| Revisió, seguretat, auditoria, decisions d'alt impacte | `claude-sonnet` |
| Resums, classificació, consultes ràpides | `claude-haiku` |
| L'usuari diu "usa Claude" | `claude-sonnet` |
| L'usuari diu "usa Flash" | `deepseek-v4-flash` |

### Flux recomanat

```
platform task demo-crm "Crear CRUD de clients"
        ↓
DeepSeek V4 Pro genera pla/resposta via LiteLLM
        ↓
Claude Code integra o revisa
        ↓
task-completion verifica
```

### Format de fitxers `docs/tasks/`

Cada execució de `platform task` guarda un fitxer `YYYY-MM-DD-HHMMSS-<slug>.md` al directori `docs/tasks/` del projecte amb: prompt, context usat, resposta del model i estat (Implementat/Verificat/Completat).

## Platform com a capa obligatòria dins Claude Code

Platform MCP és el controlador de context, routing, verificació i completitud. Claude Code és l'editor/executor.

### Flux obligatori

Cada ordre de l'usuari passa per:

1. `platform_before_action` — classifica, avalua risc, pot bloquejar
2. Claude Code executa l'acció
3. Verificació (tests, build o manual)
4. `platform_after_action` — actualitza DoD, guarda notes
5. `platform_can_commit` — permet o bloqueja commit

### Exemple real

Usuari: "afegeix validació al formulari de login"

Claude:
1. `platform_before_action` → implementació, DeepSeek V4 Pro, risc mitjà
2. Implementa el codi
3. Verifica (test o comprovació)
4. `platform_after_action` → Implementat: sí, Verificat: sí
5. `platform_can_commit` → allowed: true → commit

### Per commits

"Fes-ho" o "commita" NO implica fer commit directe. Cal:

1. `platform_before_action` detecta acció commit
2. Si no hi ha verificació → **bloqueja**
3. Verificar → `platform_update_completion`
4. `platform_can_commit` → si allowed, commit

## Platform MCP Server

Integració nativa amb Claude Code via MCP (Model Context Protocol). 14 tools.

### Instal·lació

```bash
claude mcp add platform -- node /home/usuari/platform/mcp-server/index.js
```

Per verificar:

```bash
claude mcp list
```

### Tools

| Tool | Què fa |
|------|--------|
| `platform_resume_project` | Estat complet: stack, skills, tasques, decisions, pròxim pas |
| `platform_route_task` | Classifica tasca i recomana model |
| `platform_ask_model` | Envia prompt a DeepSeek/Claude via LiteLLM |
| `platform_create_task` | Crea tasca: classifica + executa + guarda a docs/tasks/ |
| `platform_save_task` | Guarda tasca manualment a docs/tasks/ |
| `platform_list_projects` | Llista tots els projectes a ~/Projects/ |
| `platform_list_domain_skills` | Llista skills de domini disponibles |
| `platform_activate_skill` | Activa skill de domini (requereix confirmació) |

### Exemple d'ús dins Claude Code

L'usuari escriu:

> Analitza wa-desk2 i proposa següents passos

Claude Code:
1. Crida `platform_resume_project` per entendre l'estat
2. Crida `platform_route_task` per classificar
3. Crida `platform_create_task` per generar el pla
4. Mostra el resultat i la ruta del fitxer guardat

### Limitacions

- El MCP llegeix context i guarda tasques, però no modifica codi.
- Claude Code continua sent qui edita fitxers del projecte.
- L'airlock de skills es manté: `platform_activate_skill` requereix confirmació.
- Sense ANTHROPIC_API_KEY, els models Claude responen amb instruccions per Claude Code.

## Skills universals (8)

| Skill | Funció |
|-------|--------|
| `product-architecture.md` | Disseny d'arquitectura, patrons, decisions estructurals |
| `planning-and-execution.md` | Plans d'implementació, execució en passos, verificació |
| `engineering-quality.md` | Qualitat de codi, simplicitat, decisions tècniques |
| `testing-and-verification.md` | TDD, tests, verificació abans de completar |
| `task-completion.md` | Criteri de completitud: implementat != verificat != completat |
| `debugging.md` | Debugging sistemàtic, anàlisi d'errors |
| `code-review.md` | Revisió de codi, feedback, millora contínua |
| `ui-ux-design.md` | Disseny d'interfícies: pensar com a Product Designer abans de codificar |

## Criteri de completitud

Una tasca no es considera completada fins que:
1. El codi està implementat.
2. El projecte compila (si aplica).
3. Els tests passen (si n'hi ha).
4. El flux principal s'ha verificat.

Vegeu `skills/universal/task-completion.md` per al detall complet.

## Principis

1. Creativitat neta en projectes nous
2. Skills universals sempre, skills de domini sota demanda
3. Airlock: suggerir sense aplicar
4. Patterns abstractes, no codi copiat
5. GitHub com a font de veritat
6. Implementat != completat: verificar abans de declarar fet
7. v0.dev genera interfícies, DeepSeek V4 Pro + Claude Code integren producte real
