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

### Model per defecte: DeepSeek Chat

Utilitzar per a:

- Generació de codi normal
- CRUDs
- Components React
- APIs Express
- Scripts Bash/Node
- Tests simples
- Refactors mecànics
- Implementacions llargues amb risc baix o mitjà

### Model de raonament barat: DeepSeek Reasoner

Utilitzar per a:

- Debugging complex inicial
- Anàlisi de problemes tècnics
- Comparar alternatives
- Arquitectura preliminar
- Errors que requereixen pensar però encara no justifiquen Claude

### Model premium: Claude Sonnet

Utilitzar només quan aporti valor clar:

- Decisions d'arquitectura importants
- Revisió final abans de merge
- Refactors grans amb risc alt
- Entendre repos grans o confusos
- Errors persistents que DeepSeek no resol
- Disseny de producte/UX crític
- Validació de seguretat o privacitat
- Quan la tasca pot trencar producció

### Model ràpid premium: Claude Haiku

Utilitzar per a:

- Resums curts
- Classificacions
- Petites revisions
- Quan es vol resposta Claude però amb menys cost que Sonnet

### Principi de cost

1. Primer intentar amb DeepSeek.
2. Escalar a Claude només si:
   - hi ha risc alt,
   - DeepSeek falla,
   - cal judici arquitectònic,
   - cal revisió premium,
   - o l'usuari ho demana explícitament.

**Frase guia:** DeepSeek construeix. Claude revisa quan importa.

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
