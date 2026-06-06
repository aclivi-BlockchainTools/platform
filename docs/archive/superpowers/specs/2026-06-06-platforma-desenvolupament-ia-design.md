# Plataforma de desenvolupament assistit per IA — Disseny

Data: 2026-06-06
Autor: Arquitecte + Usuari
Estat: Aprovat

---

## 1. Estructura de directoris

```
/home/usuari/
├── .claude/
│   ├── CLAUDE.md                  ← Preferències personals
│   └── settings.json              ← Plugins, hooks globals
│
├── platform/                      ← REPO GITHUB: font de veritat central
│   ├── README.md
│   ├── CLAUDE.md                  ← Normes de la plataforma + airlock
│   │
│   ├── skills/
│   │   ├── universal/            ← Sempre actives a qualsevol projecte
│   │   │   ├── product-architecture.md
│   │   │   ├── planning-and-execution.md
│   │   │   ├── engineering-quality.md
│   │   │   ├── testing-and-verification.md
│   │   │   ├── debugging.md
│   │   │   └── code-review.md
│   │   │
│   │   └── domain/               ← Activació manual (airlock)
│   │       ├── whatsapp/
│   │       ├── wordpress/
│   │       ├── seo/
│   │       ├── email/
│   │       └── blockchain/
│   │
│   ├── templates/
│   │   ├── project-new/
│   │   │   └── .claude/
│   │   │       ├── CLAUDE.md     ← Esquelet amb Fora de context
│   │   │       ├── active-skills/
│   │   │       │   └── domain/   ← Buit. Buit sempre.
│   │   │       └── settings.json
│   │   │
│   │   └── project-existing/
│   │       └── .claude/
│   │           ├── CLAUDE.md
│   │           ├── active-skills/
│   │           │   └── domain/
│   │           └── settings.json
│   │
│   ├── patterns/                  ← Lliçons apreses abstractes
│   │   ├── architecture/
│   │   ├── database/
│   │   ├── api-design/
│   │   ├── testing/
│   │   ├── deployment/
│   │   ├── security/
│   │   └── product/
│   │       ├── mvp-first.md
│   │       ├── feature-flags.md
│   │       ├── multi-tenant-onboarding.md
│   │       ├── pricing-strategy.md
│   │       └── user-activation-flows.md
│   │
│   ├── mcp/
│   │   ├── registry.json          ← Catàleg de MCPs disponibles
│   │   └── configs/               ← Configuracions per MCP
│   │
│   └── scripts/
│       ├── init-new-project.sh
│       ├── init-existing-project.sh
│       ├── suggest-skills.sh
│       └── activate-skill.sh
│
└── Projects/
    └── projecte/
        ├── .claude/
        │   ├── CLAUDE.md         ← Específic del projecte
        │   ├── active-skills/
        │   │   └── domain/       ← Airlock: només skills activades
        │   └── settings.json
        ├── docs/
        │   └── decisions/        ← Decisions d'arquitectura
        ├── .env.example
        ├── README.md
        ├── .gitignore
        └── src/
```

### Explicació de cada carpeta

| Carpeta | Responsabilitat |
|---------|----------------|
| `.claude/` | Configuració personal de l'usuari. Preferències de comunicació, workflow, decisions tècniques |
| `platform/` | Repo GitHub central. Font de veritat de skills, templates, patterns, scripts i configuracions |
| `platform/skills/universal/` | Skills sempre actives a tots els projectes. Arquitectura, planificació, qualitat, testing, debugging, code review |
| `platform/skills/domain/` | Skills de domini específiques. Activació manual per projecte via symlink. WhatsApp, WordPress, SEO, email, blockchain... |
| `platform/templates/` | Plantilles per inicialitzar projectes nous o adaptar-ne d'existents |
| `platform/patterns/` | Lliçons apreses abstractes. Problemes, solucions i tradeoffs. Mai codi concret ni referències a projectes |
| `platform/mcp/` | Catàleg i configuracions de MCP servers disponibles |
| `platform/scripts/` | Eines d'inicialització, suggeriment i activació de skills |
| `projecte/.claude/CLAUDE.md` | Context específic del projecte: stack, estat, decisions, errors resolts |
| `projecte/active-skills/domain/` | Airlock: quines skills de domini estan actives al projecte |
| `projecte/docs/decisions/` | Documentació de decisions d'arquitectura del projecte |

---

## 2. Organització de skills

### Skills universals (sempre actives)

| Skill | Funció |
|-------|--------|
| `product-architecture.md` | Disseny d'arquitectura, patrons, decisions estructurals |
| `planning-and-execution.md` | Plans d'implementació, execució en passos, verificació |
| `engineering-quality.md` | Qualitat de codi, simplicitat, decisions tècniques |
| `testing-and-verification.md` | TDD, tests, verificació abans de completar |
| `debugging.md` | Debugging sistemàtic, anàlisi d'errors |
| `code-review.md` | Revisió de codi, feedback, millora contínua |

### Skills de domini (activació manual)

Cada skill de domini conté:
- `skill.md` — Instruccions i bones pràctiques del domini
- `patterns.md` — Referències a patterns relacionats

Les skills de domini **no contenen**:
- Codi de projectes anteriors
- Noms de clients, taules o endpoints
- Decisions concretes d'altres projectes

### Activació de skills de domini

```
Detecció (automàtica) → Suggeriment (automàtic) → Activació (manual)
```

Una skill de domini no activa:
- **Pot ser:** suggerida, mencionada
- **No pot ser:** executada, usada com a criteri de decisió, carregada al context

---

## 3. Organització de CLAUDE.md

3 nivells en cascada:

```
Nivell 1: .claude/CLAUDE.md (personal)
  ↓
Nivell 2: platform/CLAUDE.md (plataforma + airlock)
  ↓
Nivell 3: Projects/X/.claude/CLAUDE.md (projecte)
```

### Nivell 1 — `.claude/CLAUDE.md` (personal)

Preferències de l'usuari: català, workflow, decisions tècniques, git. No canvia entre projectes.

### Nivell 2 — `platform/CLAUDE.md` (plataforma)

Instruccions per a Claude sobre com fer servir la plataforma:
- On trobar skills (`platform/skills/`)
- Com activar skills de domini (`activate-skill.sh`)
- Les regles de l'airlock
- Com consultar i escriure patterns
- Com inicialitzar projectes

### Nivell 3 — `Projects/X/.claude/CLAUDE.md` (projecte)

Estructura estàndard:

```markdown
# Projecte: <nom>

## Descripció
(una frase)

## Stack
Stack detectat (confiança alta):
- React (package.json)
- PostgreSQL (docker-compose)

Stack detectat (confiança baixa):
- Redis (referència trobada en documentació)

## Estat actual
(què fem ara, què està fet, què queda, següent pas)

## Decisions clau
### Decisions clau confirmades
(decisió → per què → data)

### Decisions inferides (pendent validació)
(decisió → evidència → validar)

## Skills de domini actives
- whatsapp (activat el 2026-06-06)

## Errors resolts
(error → causa → solució)

## Fora de context
- No reutilitzar decisions d'altres projectes.
- No activar skills de domini sense confirmació.
- No copiar patrons específics sense adaptar-los.
- No referenciar codi d'altres projectes.

Excepció:
- Si l'usuari demana explícitament comparar, migrar o reutilitzar coneixement
  d'un altre projecte, es pot accedir a aquell projecte de forma temporal i documentada.
```

---

## 4. Flux de treball per a projectes nous

```
1. Crear repo a GitHub (manual o gh repo create)
   ↓
2. init-new-project.sh <nom-projecte>
   ├── Clona el repo buit
   ├── Copia templates/project-new/.claude/
   ├── Genera CLAUDE.md amb esquelet buit
   ├── Crea active-skills/domain/ (buit)
   ├── Crea docs/decisions/ i src/
   ├── Crea .env.example
   ├── Crea README.md
   └── Crea .gitignore
   ↓
3. brainstorm amb Claude
   ├── Només skills universals actives
   ├── Cap skill de domini present
   ├── Creativitat neta, pàgina en blanc
   └── Genera sempre:
       ├── MVP
       ├── Usuaris
       ├── Fluxos principals
       ├── Pantalles
       ├── Model de dades inicial
       ├── Riscos
       └── Pla de fases
   ↓
4. Durant el brainstorming, Claude pot suggerir:
   "Sembla que aquest projecte necessitarà <skill-domini>.
    Vols que l'activi? Si és aviat, ho apunto per més tard."
   ↓
5. Quan calgui: activate-skill.sh <skill-domini>
   ├── Symlink de platform/skills/domain/<skill> → active-skills/domain/<skill>
   └── Anota al CLAUDE.md: <skill> (activat el YYYY-MM-DD)
   ↓
6. Desenvolupament normal (plans, tests, commits, branches)
   ↓
7. suggest-skills.sh al tancar feature/branch:
   Detecta patrons potencials i pregunta:
   "Possible pattern detectat:
    - Nom:
    - Problema:
    - Solució:
    - És reutilitzable? sí/no
    - Vols guardar-lo?"
   No guarda mai res sense confirmació explícita.
```

---

## 5. Flux de treball per a projectes existents

```
1. init-existing-project.sh <nom-projecte>
   ├── NO toca el codi ni l'estructura existent
   ├── Afegeix només .claude/ dins del projecte:
   │   ├── CLAUDE.md (esquelet per omplir)
   │   └── active-skills/domain/ (buit)
   ├── Si ja existeix .claude/, fa merge (no sobreescriu)
   └── Analitza el projecte i omple automàticament:
       ├── Stack detectat (confiança alta): frameworks i eines confirmades
       └── Stack detectat (confiança baixa): referències trobades en docs
   ↓
2. Primera sessió amb Claude: omplir el context
   ├── Claude llegeix el codi existent
   ├── Omple CLAUDE.md amb la teva validació:
   │   ├── Descripció
   │   ├── Stack confirmat
   │   ├── Estat actual
   │   ├── Decisions clau confirmades
   │   └── Decisions inferides (pendent validació)
   └── Claude suggereix skills de domini segons el stack detectat
       "Detecto WordPress a composer.json. Vols activar la skill wordpress?"
   ↓
3. Activar skills de domini manualment
   ↓
4. Desenvolupament normal
```

---

## 6. Sistema d'activació de skills segons context

### Capa de detecció — `suggest-skills.sh`

| Font | Què detecta | Exemple |
|------|-------------|---------|
| Stack | Llibreries, frameworks, serveis | `composer.json` amb `wp-cli` → wordpress |
| Patrons de codi | Estructures recurrents | `/whatsapp/` al path → whatsapp |
| Paraules clau | Termes al README, docs, CLAUDE.md | "campanya", "newsletter" → email |

### Capa de suggeriment — hook `SessionStart`

En iniciar sessió, si `active-skills/domain/` està buit o incomplet, Claude rep:

```
[airlock] Skills de domini disponibles no actives: whatsapp, seo, email.
Per activar-ne una: activate-skill.sh <skill>
No les facis servir fins que estiguin activades.
```

Si detecta stack rellevant:
```
[suggeriment] Stack detectat: WordPress. Considera: activate-skill.sh wordpress
```

### Capa d'activació — `activate-skill.sh`

Sempre manual:
- Crea symlink de `platform/skills/domain/<skill>` → `active-skills/domain/<skill>`
- Anota al CLAUDE.md: `<skill> (activat el YYYY-MM-DD)`

### Regles de l'airlock al `platform/CLAUDE.md`

```markdown
## Airlock
- No activar mai una skill de domini automàticament.
- Pots suggerir-ne l'activació un cop per sessió.
- Si l'usuari diu "no", no tornar-hi en aquesta sessió.
- Si una skill no és a active-skills/domain/:
  - Pot ser: suggerida, mencionada
  - No pot ser: executada, usada com a criteri de decisió, carregada al context
```

---

## 7. Sistema d'aïllament de creativitat

### Barrera estructural

Cada projecte és una unitat estanca. Claude no llegeix altres projectes tret que l'usuari ho demani explícitament.

```
Projecte A              Projecte B (nou)
├── .claude/             ├── .claude/
│   ├── CLAUDE.md        │   ├── CLAUDE.md        ← NO llegeix el d'A
│   └── active-skills/   │   └── active-skills/
│       └── domain/      │       └── domain/       ← Buit. Sempre buit.
│           └── seo/     │
├── docs/decisions/      ├── docs/decisions/       ← NO llegeix les d'A
└── src/                 └── src/
```

### Barrera al CLAUDE.md del projecte

La secció `Fora de context` actua com a mur de contenció amb l'excepció documentada per a comparacions explícites.

### Barrera a les skills

Les skills no contenen exemples de codi de projectes anteriors. Contenen:
- Conceptes
- Millors pràctiques del domini
- Guies de decisió

### Barrera al SessionStart hook

El hook carrega `CLAUDE.md` del projecte actual + `CLAUDE.md` personal + `platform/CLAUDE.md`. Mai carrega context d'altres projectes.

### Com es manté la creativitat

El brainstorming d'un projecte nou comença amb:
- Stack triat per l'usuari
- Objectiu de producte
- Skills universals (arquitectura, testing, qualitat)
- Zero referències a projectes anteriors

És una pàgina en blanc amb bones eines, no una plantilla prefabricada.

---

## 8. Sistema d'evolució de lliçons apreses

### Cicle de vida

```
Projecte → Detecció → Validació → Abstracció → Retroalimentació
```

### Format de pattern

```markdown
# <nom del patró>

## Score
Reutilitzabilitat: X/10
Abstracció: X/10
Dependència de domini: X/10

## Context
(quan aplica)

## Problema
(què intentes resoldre)

## Solució
(l'enfocament abstracte)

## Tradeoffs
(què guanyes / què perds)

## Relacionat amb
- skill: <si n'hi ha>
- patterns: <si en referència d'altres>

## Historial
v1 - 2026-06-06 - Creació
v2 - 2026-09-10 - Afegit tradeoff de rendiment
```

### Què NO fa el sistema

- Extreure patterns automàticament
- Suggerir patterns de projecte A durant el brainstorming del B
- Barrejar lliçons entre projectes sense passar per la capa d'abstracció
- Incloure noms de projectes, taules, endpoints o clients en els patterns

### Què SÍ fa

- Detectar patrons potencials al tancar features/branches
- Forçar l'abstracció abans de guardar (validar absència de referències concretes)
- Versionar-ho tot a `platform` (GitHub)
- Permetre consulta explícita des de skills de domini

---

## 9. Resum de components

| Component | Responsabilitat |
|-----------|----------------|
| `.claude/CLAUDE.md` | Preferències personals |
| `platform/CLAUDE.md` | Normes de la plataforma + airlock |
| `platform/skills/universal/` | Sempre actives a tots els projectes |
| `platform/skills/domain/` | Activació manual per projecte |
| `platform/patterns/` | Lliçons abstractes, mai codi concret |
| `platform/templates/` | Plantilles per inicialitzar projectes |
| `platform/scripts/` | Eines d'inicialització, suggeriment i activació |
| `projecte/.claude/CLAUDE.md` | Context del projecte + Fora de context |
| `projecte/active-skills/domain/` | Airlock: quines skills de domini estan actives |
| `projecte/docs/decisions/` | Decisions d'arquitectura del projecte |

---

## 10. Avantatges i inconvenients

### Avantatges

- **Creativitat neta:** Projectes nous parteixen de zero amb skills universals
- **Catàleg versionat:** Skills i patterns versionats a GitHub, traçabilitat completa
- **Airlock intel·ligent:** Suggeriments sense imposició, control manual de l'activació
- **Evolució controlada:** Lliçons apreses passen per abstracció abans de ser reutilitzables
- **Aïllament estructural:** Projectes estancs, sense contaminació creuada
- **Fallback DeepSeek:** No quedar-se parat si Claude s'esgota
- **Simetria estructural:** `active-skills/domain/` igual per a tots els projectes

### Inconvenients

- **Disciplina requerida:** L'usuari ha de seguir el procés d'activació manual
- **Setup inicial:** Cal crear i mantenir el repo `platform`
- **Abstracció costosa:** Extreure un pattern requereix generalitzar correctament
- **Possible duplicació:** Dos projectes amb mateix stack poden acabar resolent el mateix problema de forma diferent (tot i que això també és un avantatge: no hi ha solucions prefabricades)

---

## 11. Recomanació final

Implementar per fases:

**Fase 1 — Fonaments (ara)**
1. Crear repo `platform` a GitHub
2. Crear `platform/skills/universal/` amb les 6 skills consolidades
3. Crear `platform/templates/project-new/`
4. Crear `platform/templates/project-existing/`
5. Escriure `platform/CLAUDE.md` amb les regles de l'airlock
6. Crear `init-new-project.sh` i `activate-skill.sh`

**Fase 2 — Skills de domini (segona setmana)**
1. Migrar skills existents a `platform/skills/domain/`
2. Crear `suggest-skills.sh`
3. Configurar hook SessionStart

**Fase 3 — Evolució (quan hi hagi massa lliçons al cap)**
1. Crear estructura `platform/patterns/`
2. Extreure primers patrons de projectes madurs
3. Versionar i iterar

La plataforma ha de créixer amb l'ús, no abans. Començar amb l'estructura mínima i anar-hi afegint capes quan els problemes reals ho demanin.
