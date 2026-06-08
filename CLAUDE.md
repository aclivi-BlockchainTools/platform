# Plataforma de desenvolupament assistit per IA

## On trobar les coses

- `skills/universal/` — Skills sempre actives a tots els projectes (8 skills: product-architecture, planning-and-execution, engineering-quality, testing-and-verification, task-completion, debugging, code-review, ui-ux-design)
- `prompts/v0/` — Prompts reutilitzables per generar UI premium amb v0.dev
- `skills/domain/` — Skills de domini específiques (activació manual)
- `routing/` — Política de routing de models per tipus de tasca
- `patterns/` — Lliçons apreses abstractes
- `templates/` — Plantilles per inicialitzar projectes
- `scripts/` — Eines d'inicialització i activació
- `mcp/registry.json` — Catàleg de MCPs disponibles

## Model Routing

La plataforma està optimitzada per a desenvolupament de software: SaaS, React, Node.js, PostgreSQL, APIs, automatitzacions i repositoris grans.

### DeepSeek V4 Pro — Model principal

Model per defecte per al desenvolupament diari.

Utilitzar per a:

- Arquitectura
- Implementació principal
- Desenvolupament diari
- APIs, Backend, Frontend
- Refactors
- Debugging
- Disseny tècnic
- Agents
- Repositoris grans
- Anàlisi de codi

### DeepSeek V4 Flash — Model ràpid

Per minimitzar cost. Utilitzar per a:

- CRUDs
- Components React
- Scripts
- Tests
- Tasques repetitives
- Modificacions petites

### Claude Sonnet — Model auditor

Consultor especialitzat. NO és el model principal.

Utilitzar només quan aporti valor clar:

- Revisió crítica
- Seguretat
- Product thinking
- UX complexa
- Segona opinió arquitectònica
- Problemes persistents que DeepSeek no resol
- Auditories
- Decisions d'alt impacte

### Claude Haiku

Utilitzar per a:

- Resums
- Classificació
- Consultes ràpides
- Tasques lleugeres

### Model Strategy

```
Model principal:  deepseek-v4-pro
Model ràpid:      deepseek-v4-flash
Model auditor:    claude-sonnet
```

Escalar a Claude només quan:

- hi hagi risc alt
- calgui revisió independent
- calgui validar arquitectura
- hi hagi requisits de seguretat
- DeepSeek no resolgui el problema

**Frase guia:** DeepSeek V4 Pro és el model principal de desenvolupament. Claude s'utilitza quan aporta una validació premium o una perspectiva diferent.

## Ús obligatori de Platform — TOTES les accions

Platform MCP és la capa de control obligatòria. No facis res significatiu sense consultar-la.

### Flux obligatori per cada ordre

```
1. platform_before_action   ← ABANS de qualsevol acció
2. Execució amb Claude Code
3. Verificació (si aplica)
4. platform_after_action    ← DESPRÉS, actualitza DoD
5. platform_can_commit      ← ABANS de commit, verifica permisos
```

### Abans de cada acció significativa

Crida `platform_before_action` ABANS de:
- analitzar codi o projecte
- planificar feina
- implementar funcionalitats
- modificar fitxers
- executar tests
- fer commit
- fer deploy
- activar skills
- declarar res completat
- qualsevol acció que modifiqui el repositori

`platform_before_action` classifica l'acció, avalua el risc i pot **bloquejar** accions perilloses (ex: commit sense verificació).

### Per commits

```
1. platform_before_action   ← detecta acció commit
2. git status / git diff    ← mira què hi ha
3. Verificació mínima       ← tests, build, o comprovació manual
4. platform_can_commit      ← si allowed=false, NO facis commit
5. git commit (només si allowed=true)
6. platform_after_action    ← documenta el commit
```

**No facis commit només perquè l'usuari diu "fes-ho".**
"Fes-ho" vol dir:
- prepara l'acció
- valida amb `platform_before_action`
- executa
- verifica
- documenta amb `platform_after_action`
- commit només si `platform_can_commit` ho permet

### Models

| Model | Rol | Quan |
|-------|-----|------|
| DeepSeek V4 Pro | Principal | Anàlisi, planificació, debugging, CRUD |
| DeepSeek V4 Flash | Ràpid | Tasques repetitives, boilerplate |
| Claude Sonnet | Editor/Auditor | Editar fitxers, revisar, commit, decisions crítiques |
| Claude Haiku | Lleuger | Resums, classificació |

### Task Completion (OBLIGATORI)

Una tasca NO està feta fins que:
- **Implementat: sí** (codi escrit)
- **Verificat: sí** (tests passen o comprovació manual)
- **Completat: sí** (tot el cicle tancat)

Usa `platform_update_completion` per marcar cada estat.
Usa `platform_check_completion` per verificar l'estat actual.

## Platform MCP

El MCP server (`mcp-server/`) exposa 10 tools. No cal executar `platform` manualment.

### Tools

| Tool | Què fa |
|------|--------|
| `platform_current_project` | Detecta el projecte actual segons el directori |
| `platform_resume_project` | Estat complet (stack, estat, skills, tasques) |
| `platform_route_task` | Classificar tasca i recomanar model |
| `platform_ask_model` | Enviar prompt a un model via LiteLLM |
| `platform_create_task` | Crear tasca: classificar + executar + guardar |
| `platform_save_task` | Guardar manualment una tasca a docs/tasks/ |
| `platform_list_projects` | Llistar tots els projectes |
| `platform_list_domain_skills` | Llistar skills de domini disponibles |
| `platform_activate_skill` | Activar skill de domini (amb confirmació) |
| `platform_check_completion` | Verificar DoD d'una tasca o projecte |

### Instal·lació

```bash
platform mcp-install
```

Equivalent manual:

```bash
claude mcp add platform --scope user -- node /home/usuari/platform/mcp-server/index.js
```

Per instal·lar el perfil global Claude (opcional però recomanat):

```bash
platform install-claude-profile
```

## Airlock

- No activar mai una skill de domini automàticament.
- Pots suggerir-ne l'activació un cop per sessió.
- Si l'usuari diu "no", no tornar-hi en aquesta sessió.
- Si una skill no és a active-skills/domain/:
  - Pot ser: suggerida, mencionada
  - No pot ser: executada, usada com a criteri de decisió, carregada al context

## Com activar una skill de domini

L'usuari ha d'executar manualment:

```bash
platform/scripts/activate-skill.sh <skill> <projecte>
```

Això crea un symlink a `Projects/<projecte>/.claude/active-skills/domain/<skill>`.

## Com suggerir skills

En iniciar sessió en un projecte, si veus stack que encaixa amb una skill de domini no activada:

```
[suggeriment] Stack detectat: WordPress. Considera: platform/scripts/activate-skill.sh wordpress <projecte>
```

Màxim un suggeriment per sessió. No insistir si l'usuari ho rebutja.

## Com consultar un pattern

Els patterns són a `platform/patterns/<categoria>/<nom>.md`. Si l'usuari demana consultar-ne un, llegeix-lo. No els injectis automàticament al context.

## Com guardar un pattern

Quan l'usuari vulgui guardar una lliçó apresa:

1. Abstreure: eliminar noms de projectes, clients, taules, endpoints
2. Puntuar: Reutilitzabilitat X/10, Abstracció X/10, Dependència de domini X/10
3. Versionar: afegir `## Historial` amb data
4. Guardar a `platform/patterns/<categoria>/<nom>.md`
