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
