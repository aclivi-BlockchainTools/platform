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
│   ├── universal/     ← Sempre actives a tots els projectes
│   └── domain/        ← Activació manual per projecte
├── templates/         ← Plantilles per nous projectes i existents
├── patterns/          ← Lliçons apreses abstractes
├── mcp/               ← Catàleg i configuracions de MCPs
└── scripts/           ← Eines d'inicialització i activació
```

## Workflow diari

### Crear un projecte nou

```bash
platform/scripts/init-new-project.sh <nom>
```

- Requereix `gh` (GitHub CLI) instal·lat i autenticat.
- Crea un repo privat a GitHub, clona, aplica la plantilla i fa commit inicial.
- Deixa `.claude/active-skills/domain/` buit (les skills de domini s'activen manualment).

### Adaptar un projecte existent

```bash
platform/scripts/init-existing-project.sh <nom>
```

- Detecta l'stack automàticament amb nivells de confiança (alta/mitjana/baixa).
- No sobreescriu `.claude/CLAUDE.md` existent — si ja hi és, només afegeix directoris que faltin.
- Si no hi ha skills de domini, ho indica sense fallar.

### Activar una skill de domini

```bash
platform/scripts/activate-skill.sh <skill> <projecte>
```

- Crea un symlink a `.claude/active-skills/domain/<skill>`.
- Anota l'activació al CLAUDE.md sota `## Skills de domini actives`.
- Evita duplicats: si la skill ja hi és, no l'afegeix dos cops.

### Suggerir skills per a un projecte

```bash
platform/scripts/suggest-skills.sh <projecte>
```

- Analitza el projecte amb detecció dirigida (no escaneja recursivament).
- Mostra cada skill suggerida amb confiança (alta/mitjana/baixa) i motiu.
- No activa res automàticament — l'usuari decideix.

### Analitzar stack i skills

```bash
platform/scripts/suggest-skills.sh <projecte>
```

- Separa stack detectat (tecnologies) de skills de domini suggerides.
- Mostra cada detecció amb confiança (alta/mitjana/baixa) i motiu.
- Només suggereix skills que existeixen a `platform/skills/domain/`.
- No activa res automàticament — l'usuari decideix.

### Criteri de completitud

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
