# Platform

Plataforma personal de desenvolupament assistit per IA.

## Principi 0

La plataforma existeix per augmentar la qualitat de les decisions, no per reduir la creativitat.

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
├── mcp/               ← Catàleg i configuracions de MCPs
└── scripts/           ← Eines d'inicialització i activació
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
platform/scripts/platform.sh skills --list
```

### Crear un projecte nou

```bash
platform/scripts/platform.sh new <nom>
```

- Requereix `gh` (GitHub CLI) instal·lat i autenticat.
- Crea un repo privat a GitHub, clona, aplica la plantilla i fa commit inicial.
- Deixa `.claude/active-skills/domain/` buit (les skills de domini s'activen manualment).

### Adaptar un projecte existent

```bash
platform/scripts/platform.sh import <nom>
```

- Detecta l'stack automàticament amb nivells de confiança (alta/mitjana/baixa).
- Escriu l'stack al CLAUDE.md entre marcadors (no sobreescriu info manual).
- Si no hi ha skills de domini, ho indica sense fallar.

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

### Reprendre treball

```bash
platform/scripts/platform.sh open <projecte>
```

Mostra: skills actives, última decisió, pròxim pas.

## Workflow UI premium

Per a interfícies importants (dashboards, landing pages, apps):

```
1. Claude/DeepSeek defineix producte, UX i arquitectura
        ↓
2. Claude/DeepSeek genera un brief de UI (guiat per ui-ux-design.md)
        ↓
3. L'usuari genera el prompt amb: platform v0 <tipus> <projecte>
        ↓
4. L'usuari copia el prompt a v0.dev
        ↓
5. v0.dev genera la UI React/Tailwind/shadcn/ui
        ↓
6. L'usuari copia o exporta el codi al projecte
        ↓
7. Claude Code integra la UI amb backend, estat, rutes i dades reals
        ↓
8. Playwright o verificació manual valida el flux principal
        ↓
9. task-completion.md decideix si està completat
```

Principi: **v0.dev genera interfícies. Claude/DeepSeek integra producte real.**

### Generar prompt per v0.dev

```bash
platform/scripts/platform.sh v0 landing-page <projecte>
platform/scripts/platform.sh v0 saas-dashboard <projecte>
platform/scripts/platform.sh v0 admin-panel <projecte>
platform/scripts/platform.sh v0 app-shell <projecte>
```

El prompt inclou context del projecte (si existeix) i és llest per copiar a v0.dev.

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
7. v0.dev genera interfícies, Claude/DeepSeek integra producte real
