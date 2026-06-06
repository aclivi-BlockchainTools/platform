# Platform

Plataforma personal de desenvolupament assistit per IA.

## Què és

Font de veritat central de skills, templates, patterns i scripts per a tots els projectes a `/home/usuari/Projects/`.

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

## Ús ràpid

### Projecte nou

```bash
platform/scripts/init-new-project.sh <nom>
```

### Projecte existent

```bash
platform/scripts/init-existing-project.sh <nom>
```

### Activar skill de domini

```bash
platform/scripts/activate-skill.sh <skill> <projecte>
```

### Suggerir skills

```bash
platform/scripts/suggest-skills.sh <projecte>
```

## Principis

1. Creativitat neta en projectes nous
2. Skills universals sempre, skills de domini sota demanda
3. Airlock: suggerir sense aplicar
4. Patterns abstractes, no codi copiat
5. GitHub com a font de veritat
