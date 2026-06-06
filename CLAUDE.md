# Plataforma de desenvolupament assistit per IA

## On trobar les coses

- `skills/universal/` — Skills sempre actives a tots els projectes (8 skills: product-architecture, planning-and-execution, engineering-quality, testing-and-verification, task-completion, debugging, code-review, ui-ux-design)
- `prompts/v0/` — Prompts reutilitzables per generar UI premium amb v0.dev
- `skills/domain/` — Skills de domini específiques (activació manual)
- `patterns/` — Lliçons apreses abstractes
- `templates/` — Plantilles per inicialitzar projectes
- `scripts/` — Eines d'inicialització i activació
- `mcp/registry.json` — Catàleg de MCPs disponibles

## Model Routing

La plataforma exposa 4 models via LiteLLM. Utilitzar cada model segons el tipus de tasca.

### Claude Sonnet (claude-sonnet-4-6)

Utilitzar per a:

- Arquitectura i disseny de producte
- Decisions complexes
- Refactors grans
- Revisió de codi
- Coordinació global del projecte
- Planificació

### Claude Haiku (claude-haiku-4-5)

Utilitzar per a:

- Consultes ràpides
- Tasques simples
- Resums
- Petites modificacions

### DeepSeek Chat

Utilitzar per a:

- Generació de codi
- CRUDs
- APIs
- Components React
- Scripts
- Tasques repetitives

### DeepSeek Reasoner

Utilitzar per a:

- Debugging complex
- Algoritmes
- Investigació de problemes difícils
- Anàlisi profunda
- Resolució d'errors persistents

**Principi:** Claude decideix. DeepSeek implementa.

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
