# Plataforma de desenvolupament assistit per IA — Pla d'implementació

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la plataforma `platform/` com a font de veritat central de skills, templates, patterns i scripts per a tots els projectes.

**Architecture:** Tres nivells en cascada (personal → plataforma → projecte) amb airlock per a skills de domini. Skills universals sempre actives, skills de domini amb activació manual via symlink. Patterns abstractes versionats sense referències a projectes concrets.

**Tech Stack:** Claude Code, DeepSeek (fallback), GitHub (font de veritat), Bash (scripts), Markdown (skills/patterns/templates)

---

## Fase 1 — Fonaments

### Task 1: Crear repo GitHub i estructura base de directoris

**Files:**
- Create: `platform/README.md`
- Create: `platform/.gitignore`
- Create: `platform/skills/universal/.gitkeep`
- Create: `platform/skills/domain/.gitkeep`
- Create: `platform/patterns/architecture/.gitkeep`
- Create: `platform/patterns/database/.gitkeep`
- Create: `platform/patterns/api-design/.gitkeep`
- Create: `platform/patterns/testing/.gitkeep`
- Create: `platform/patterns/deployment/.gitkeep`
- Create: `platform/patterns/security/.gitkeep`
- Create: `platform/patterns/product/.gitkeep`

- [ ] **Step 1: Crear el repo a GitHub**

```bash
cd /home/usuari/platform
gh repo create platform --private --description "Plataforma de desenvolupament assistit per IA — skills, templates, patterns i scripts" --source=. --remote=origin --push
```

Si `gh` no està autenticat, fer-ho manualment.

- [ ] **Step 2: Crear .gitignore**

```bash
cat > /home/usuari/platform/.gitignore << 'GITIGNORE'
.DS_Store
*.swp
*.swo
*~
GITIGNORE
```

- [ ] **Step 3: Crear estructura de directoris buida**

```bash
mkdir -p /home/usuari/platform/skills/universal
mkdir -p /home/usuari/platform/skills/domain
mkdir -p /home/usuari/platform/templates/project-new/.claude/active-skills/domain
mkdir -p /home/usuari/platform/templates/project-existing/.claude/active-skills/domain
mkdir -p /home/usuari/platform/patterns/architecture
mkdir -p /home/usuari/platform/patterns/database
mkdir -p /home/usuari/platform/patterns/api-design
mkdir -p /home/usuari/platform/patterns/testing
mkdir -p /home/usuari/platform/patterns/deployment
mkdir -p /home/usuari/platform/patterns/security
mkdir -p /home/usuari/platform/patterns/product
mkdir -p /home/usuari/platform/mcp/configs
mkdir -p /home/usuari/platform/scripts
```

- [ ] **Step 4: Verificar estructura**

```bash
find /home/usuari/platform -type d | sort
```

Expected: Totes les carpetes llistades existeixen.

- [ ] **Step 5: Commit inicial**

```bash
cd /home/usuari/platform
git add -A
git commit -m "$(cat <<'EOF'
chore: initial platform directory structure

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

### Task 2: Escriure platform/CLAUDE.md

**Files:**
- Create: `platform/CLAUDE.md`

- [ ] **Step 1: Escriure platform/CLAUDE.md**

```bash
cat > /home/usuari/platform/CLAUDE.md << 'CLAUDEMD'
# Plataforma de desenvolupament assistit per IA

## On trobar les coses

- `skills/universal/` — Skills sempre actives a tots els projectes
- `skills/domain/` — Skills de domini específiques (activació manual)
- `patterns/` — Lliçons apreses abstractes
- `templates/` — Plantilles per inicialitzar projectes
- `scripts/` — Eines d'inicialització i activació
- `mcp/registry.json` — Catàleg de MCPs disponibles

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
CLAUDEMD
```

- [ ] **Step 2: Verificar que s'ha escrit correctament**

```bash
wc -l /home/usuari/platform/CLAUDE.md
```

Expected: ~50 línies.

### Task 3: Escriure les 6 skills universals

**Files:**
- Create: `platform/skills/universal/product-architecture.md`
- Create: `platform/skills/universal/planning-and-execution.md`
- Create: `platform/skills/universal/engineering-quality.md`
- Create: `platform/skills/universal/testing-and-verification.md`
- Create: `platform/skills/universal/debugging.md`
- Create: `platform/skills/universal/code-review.md`

- [ ] **Step 1: product-architecture.md**

```bash
cat > /home/usuari/platform/skills/universal/product-architecture.md << 'SKILL'
# Product Architecture

Skill universal per a disseny d'arquitectura, patrons i decisions estructurals.

## Responsabilitats

- Dissenyar arquitectura de projectes nous
- Proposar patrons estructurals segons el stack
- Avaluar tradeoffs de decisions arquitectòniques
- Mantenir la documentació de decisions a `docs/decisions/`

## Quan s'activa

Sempre. Aquesta skill forma part del nucli universal.

## Com treballar

1. Entendre el problema abans de proposar arquitectura
2. Proposar l'enfocament més simple que funcioni
3. Si hi ha alternativa més robusta, documentar-la amb tradeoffs
4. Documentar cada decisió a `docs/decisions/YYYY-MM-DD-decisio.md`

## Format de decisió

```markdown
# Decisió: <títol>

Data: YYYY-MM-DD
Context: (què estàvem fent)
Decisió: (què hem decidit)
Alternatives considerades: (què hem descartat i per què)
Conseqüències: (què implica)
```
SKILL
```

- [ ] **Step 2: planning-and-execution.md**

```bash
cat > /home/usuari/platform/skills/universal/planning-and-execution.md << 'SKILL'
# Planning and Execution

Skill universal per a planificació i execució de tasques de desenvolupament.

## Responsabilitats

- Escriure plans d'implementació pas a pas
- Executar plans amb verificació a cada pas
- Descompondre tasques grans en passos petits (2-5 minuts)
- Mantenir el CLAUDE.md del projecte actualitzat

## Quan s'activa

Sempre. Aquesta skill forma part del nucli universal.

## Com treballar

1. Tasca de més d'un fitxer o no trivial: primer un pla numerat curt. No tocar codi fins que l'usuari validi.
2. Passos petits: un canvi, una verificació.
3. Després de cada canvi de codi, córrer els tests.
4. No dir que una cosa funciona si no han passat els tests.

## Format del pla

Cada tasca del pla ha de contenir:
- Fitxers a crear/modificar amb rutes exactes
- Passos amb checkboxes `- [ ]`
- Codi complet a cada pas
- Comandes exactes amb sortida esperada
- Commits petits amb missatges clars
SKILL
```

- [ ] **Step 3: engineering-quality.md**

```bash
cat > /home/usuari/platform/skills/universal/engineering-quality.md << 'SKILL'
# Engineering Quality

Skill universal per a qualitat de codi, simplicitat i decisions tècniques.

## Responsabilitats

- Assegurar que el codi segueix els principis de simplicitat
- Detectar i evitar sobreenginyeria
- Proposar alternatives més simples quan calgui
- Revisar dependències innecessàries

## Quan s'activa

Sempre. Aquesta skill forma part del nucli universal.

## Principis

1. Per defecte, implementar la solució més simple que funcioni.
2. Si existeix una opció més robusta, escriure EXACTAMENT una línia:
   "Alternativa: <opció> — tradeoff: <cost/benefici>"
   Després implementar la simple, tret que l'usuari digui el contrari.
3. Si hi ha dues opcions vàlides amb tradeoffs reals, llistar-les (màx. 3 línies) i esperar.
4. No afegir dependències, abstraccions ni capes sense avisar en una línia.
5. No crear helpers, utilitats o abstraccions per a operacions d'un sol ús.
6. Tres línies similars és millor que una abstracció prematura.
SKILL
```

- [ ] **Step 4: testing-and-verification.md**

```bash
cat > /home/usuari/platform/skills/universal/testing-and-verification.md << 'SKILL'
# Testing and Verification

Skill universal per a TDD, tests i verificació abans de completar.

## Responsabilitats

- Escriure tests abans del codi d'implementació
- Verificar que els tests fallen abans d'implementar
- Verificar que els tests passen després d'implementar
- No cometre codi sense tests

## Quan s'activa

Sempre. Aquesta skill forma part del nucli universal.

## Regles

1. Tests abans d'implementació (TDD).
2. Mai usar .skip(), .only() ni comentar un test per fer-lo passar.
3. Si un test falla, arreglar la causa o aturar-se i preguntar.
4. No dir que una cosa funciona si no han passat els tests.
5. Després de cada canvi de codi, córrer els tests.
6. Si el projecte no té tests, dir-ho explícitament.

## Cicle TDD

1. Escriure el test que falla
2. Verificar que falla per la raó esperada
3. Implementar el codi mínim per passar-lo
4. Verificar que passa
5. Refactoritzar si cal (amb tests en verd)
6. Commit
SKILL
```

- [ ] **Step 5: debugging.md**

```bash
cat > /home/usuari/platform/skills/universal/debugging.md << 'SKILL'
# Debugging

Skill universal per a debugging sistemàtic i anàlisi d'errors.

## Responsabilitats

- Diagnosticar errors de forma sistemàtica
- No proposar solucions sense entendre la causa
- Documentar errors recurrents al CLAUDE.md del projecte

## Quan s'activa

Sempre. Aquesta skill forma part del nucli universal.

## Com treballar

1. Llegir l'error complet. No saltar a conclusions.
2. Reproduir l'error de forma fiable.
3. Identificar la causa arrel, no el símptoma.
4. Proposar una solució que tracti la causa.
5. Verificar que la solució funciona.
6. Si un error apareix dos cops, proposar afegir-lo al CLAUDE.md del projecte:
   Error → Causa → Solució

## Què NO fer

- No proposar solucions sense haver entès l'error.
- No silenciar errors amb try/catch buits.
- No modificar codi que "podria estar relacionat" sense evidència.
- No reiniciar serveis o esborrar caches com a primera opció.
SKILL
```

- [ ] **Step 6: code-review.md**

```bash
cat > /home/usuari/platform/skills/universal/code-review.md << 'SKILL'
# Code Review

Skill universal per a revisió de codi, feedback i millora contínua.

## Responsabilitats

- Revisar codi abans de fer merge
- Verificar que els canvis compleixen les especificacions
- Detectar problemes de seguretat, rendiment o mantenibilitat
- Proporcionar feedback constructiu i concret

## Quan s'activa

Sempre. Aquesta skill forma part del nucli universal.

## Com treballar

1. Entendre què fa el canvi i per què.
2. Revisar que els tests cobreixin el comportament esperat.
3. Revisar que el codi segueixi els principis d'engineering-quality.
4. Comprovar que no hi ha valors hardcodejats, secrets o credencials.
5. Comprovar que no s'han introduït dependències innecessàries.
6. Suggerir millores concretes, no genèriques.

## Què revisar

- Tests: cobreixen el comportament?
- Simplicitat: és la solució més simple?
- Seguretat: hi ha vectors d'atac?
- Dependències: s'ha afegit alguna cosa innecessària?
- Documentació: les decisions estan documentades?
SKILL
```

- [ ] **Step 7: Verificar que totes les skills s'han creat**

```bash
ls -la /home/usuari/platform/skills/universal/
```

Expected: 6 fitxers `.md`.

### Task 4: Escriure plantilla de projecte nou

**Files:**
- Create: `platform/templates/project-new/.claude/CLAUDE.md`
- Create: `platform/templates/project-new/.claude/settings.json`

- [ ] **Step 1: CLAUDE.md del projecte nou**

```bash
cat > /home/usuari/platform/templates/project-new/.claude/CLAUDE.md << 'TEMPLATE'
# Projecte: <nom>

## Descripció
<!-- Una frase que descrigui el projecte -->

## Stack
Stack detectat (confiança alta):
<!-- Frameworks i eines confirmades -->

Stack detectat (confiança baixa):
<!-- Referències trobades en documentació -->

## Estat actual
<!-- Què fem ara, què està fet, què queda, següent pas -->

## Decisions clau
### Decisions clau confirmades
<!-- decisió → per què → data -->

### Decisions inferides (pendent validació)
<!-- decisió → evidència → validar -->

## Skills de domini actives
<!-- skill (activat el YYYY-MM-DD) -->

## Errors resolts
<!-- error → causa → solució -->

## Fora de context
- No reutilitzar decisions d'altres projectes.
- No activar skills de domini sense confirmació.
- No copiar patrons específics sense adaptar-los.
- No referenciar codi d'altres projectes.

Excepció:
- Si l'usuari demana explícitament comparar, migrar o reutilitzar coneixement
  d'un altre projecte, es pot accedir a aquell projecte de forma temporal i documentada.
TEMPLATE
```

- [ ] **Step 2: settings.json del projecte nou**

```bash
cat > /home/usuari/platform/templates/project-new/.claude/settings.json << 'JSON'
{
  "enabledPlugins": {
    "superpowers@claude-plugins-official": true,
    "context7@claude-plugins-official": true
  }
}
JSON
```

- [ ] **Step 3: Verificar la plantilla**

```bash
find /home/usuari/platform/templates/project-new -type f
```

Expected: 2 fitxers + `active-skills/domain/` (buit).

### Task 5: Escriure plantilla de projecte existent

**Files:**
- Create: `platform/templates/project-existing/.claude/CLAUDE.md`
- Create: `platform/templates/project-existing/.claude/settings.json`

- [ ] **Step 1: CLAUDE.md del projecte existent**

```bash
cat > /home/usuari/platform/templates/project-existing/.claude/CLAUDE.md << 'TEMPLATE'
# Projecte: <nom>

## Descripció
<!-- Una frase que descrigui el projecte -->

## Stack
Stack detectat (confiança alta):
<!-- S'omple automàticament amb init-existing-project.sh -->

Stack detectat (confiança baixa):
<!-- S'omple automàticament amb init-existing-project.sh -->

## Estat actual
<!-- Per omplir amb Claude a la primera sessió -->

## Decisions clau
### Decisions clau confirmades
<!-- Per omplir amb Claude + usuari -->

### Decisions inferides (pendent validació)
<!-- Per omplir amb Claude. L'usuari les valida. -->

## Skills de domini actives
<!-- skill (activat el YYYY-MM-DD) -->

## Errors resolts
<!-- error → causa → solució -->

## Fora de context
- No reutilitzar decisions d'altres projectes.
- No activar skills de domini sense confirmació.
- No copiar patrons específics sense adaptar-los.
- No referenciar codi d'altres projectes.

Excepció:
- Si l'usuari demana explícitament comparar, migrar o reutilitzar coneixement
  d'un altre projecte, es pot accedir a aquell projecte de forma temporal i documentada.
TEMPLATE
```

- [ ] **Step 2: settings.json del projecte existent**

```bash
cat > /home/usuari/platform/templates/project-existing/.claude/settings.json << 'JSON'
{
  "enabledPlugins": {
    "superpowers@claude-plugins-official": true,
    "context7@claude-plugins-official": true
  }
}
JSON
```

### Task 6: Escriure init-new-project.sh

**Files:**
- Create: `platform/scripts/init-new-project.sh`

- [ ] **Step 1: Escriure l'script**

```bash
cat > /home/usuari/platform/scripts/init-new-project.sh << 'SCRIPT'
#!/bin/bash
set -euo pipefail

# init-new-project.sh — Inicialitza un projecte verge amb la plantilla de la plataforma
# Ús: init-new-project.sh <nom-projecte>

if [ $# -ne 1 ]; then
    echo "Ús: $0 <nom-projecte>"
    exit 1
fi

PROJECT_NAME="$1"
PROJECT_DIR="/home/usuari/Projects/$PROJECT_NAME"
TEMPLATE_DIR="/home/usuari/platform/templates/project-new"
PLATFORM_DIR="/home/usuari/platform"

echo "=== Init projecte nou: $PROJECT_NAME ==="

# 1. Crear repo a GitHub
echo "[1/6] Creant repo a GitHub..."
cd /home/usuari/Projects
gh repo create "$PROJECT_NAME" --private --clone
cd "$PROJECT_NAME"

# 2. Copiar plantilla .claude/
echo "[2/6] Copiant plantilla .claude/..."
cp -r "$TEMPLATE_DIR/.claude" .

# 3. Personalitzar CLAUDE.md amb el nom del projecte
echo "[3/6] Personalitzant CLAUDE.md..."
sed -i "s/<nom>/$PROJECT_NAME/" .claude/CLAUDE.md

# 4. Crear estructura de directoris del projecte
echo "[4/6] Creant estructura de directoris..."
mkdir -p docs/decisions
mkdir -p src

# 5. Crear fitxers base
echo "[5/6] Creant fitxers base..."
echo "# $PROJECT_NAME" > README.md
cat > .env.example << 'ENV'
# Variables d'entorn
ENV
cat > .gitignore << 'GITIGNORE'
.env
node_modules/
dist/
.DS_Store
*.log
GITIGNORE

# 6. Commit inicial
echo "[6/6] Commit inicial..."
git add -A
git commit -m "$(cat <<EOF
chore: initial project setup from platform template

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"

echo ""
echo "=== Projecte '$PROJECT_NAME' creat correctament ==="
echo "Directori: $PROJECT_DIR"
echo ""
echo "Següents passos:"
echo "  1. cd $PROJECT_DIR"
echo "  2. Inicia Claude Code i fes brainstorming"
echo "  3. Les skills universals estan actives. Les de domini, sota demanda."
echo ""
echo "Per activar una skill de domini:"
echo "  $PLATFORM_DIR/scripts/activate-skill.sh <skill> $PROJECT_NAME"
SCRIPT

chmod +x /home/usuari/platform/scripts/init-new-project.sh
```

- [ ] **Step 2: Verificar que l'script és executable**

```bash
ls -la /home/usuari/platform/scripts/init-new-project.sh
```

Expected: `-rwxr-xr-x` (executable).

### Task 7: Escriure activate-skill.sh

**Files:**
- Create: `platform/scripts/activate-skill.sh`

- [ ] **Step 1: Escriure l'script**

```bash
cat > /home/usuari/platform/scripts/activate-skill.sh << 'SCRIPT'
#!/bin/bash
set -euo pipefail

# activate-skill.sh — Activa una skill de domini a un projecte
# Ús: activate-skill.sh <skill> <nom-projecte>

if [ $# -ne 2 ]; then
    echo "Ús: $0 <skill> <nom-projecte>"
    echo ""
    echo "Skills disponibles:"
    ls -1 /home/usuari/platform/skills/domain/ 2>/dev/null || echo "  (cap)"
    exit 1
fi

SKILL="$1"
PROJECT_NAME="$2"
SKILL_DIR="/home/usuari/platform/skills/domain/$SKILL"
TARGET_DIR="/home/usuari/Projects/$PROJECT_NAME/.claude/active-skills/domain/$SKILL"
CLAUDE_MD="/home/usuari/Projects/$PROJECT_NAME/.claude/CLAUDE.md"
TODAY=$(date +%Y-%m-%d)

echo "=== Activant skill '$SKILL' al projecte '$PROJECT_NAME' ==="

# 1. Verificar que la skill existeix
if [ ! -d "$SKILL_DIR" ]; then
    echo "ERROR: La skill '$SKILL' no existeix a platform/skills/domain/"
    echo ""
    echo "Skills disponibles:"
    ls -1 /home/usuari/platform/skills/domain/ 2>/dev/null || echo "  (cap)"
    exit 1
fi

# 2. Verificar que el projecte existeix
if [ ! -d "/home/usuari/Projects/$PROJECT_NAME" ]; then
    echo "ERROR: El projecte '$PROJECT_NAME' no existeix a Projects/"
    exit 1
fi

# 3. Verificar que la skill no estigui ja activada
if [ -L "$TARGET_DIR" ] || [ -d "$TARGET_DIR" ]; then
    echo "AVÍS: La skill '$SKILL' ja està activada al projecte '$PROJECT_NAME'."
    exit 0
fi

# 4. Crear symlink
echo "[1/2] Creant symlink..."
mkdir -p "$(dirname "$TARGET_DIR")"
ln -s "$SKILL_DIR" "$TARGET_DIR"

# 5. Anotar al CLAUDE.md
echo "[2/2] Anotant al CLAUDE.md..."
if grep -q "## Skills de domini actives" "$CLAUDE_MD"; then
    sed -i "/## Skills de domini actives/a - $SKILL (activat el $TODAY)" "$CLAUDE_MD"
else
    echo "" >> "$CLAUDE_MD"
    echo "## Skills de domini actives" >> "$CLAUDE_MD"
    echo "- $SKILL (activat el $TODAY)" >> "$CLAUDE_MD"
fi

echo ""
echo "=== Skill '$SKILL' activada correctament al projecte '$PROJECT_NAME' ==="
SCRIPT

chmod +x /home/usuari/platform/scripts/activate-skill.sh
```

- [ ] **Step 2: Verificar que l'script és executable**

```bash
ls -la /home/usuari/platform/scripts/activate-skill.sh
```

Expected: `-rwxr-xr-x`.

### Task 8: Escriure init-existing-project.sh

**Files:**
- Create: `platform/scripts/init-existing-project.sh`

- [ ] **Step 1: Escriure l'script**

```bash
cat > /home/usuari/platform/scripts/init-existing-project.sh << 'SCRIPT'
#!/bin/bash
set -euo pipefail

# init-existing-project.sh — Adapta un projecte existent a la plataforma
# Ús: init-existing-project.sh <nom-projecte>

if [ $# -ne 1 ]; then
    echo "Ús: $0 <nom-projecte>"
    exit 1
fi

PROJECT_NAME="$1"
PROJECT_DIR="/home/usuari/Projects/$PROJECT_NAME"
TEMPLATE_DIR="/home/usuari/platform/templates/project-existing"
PLATFORM_DIR="/home/usuari/platform"

echo "=== Adaptant projecte existent: $PROJECT_NAME ==="

# 1. Verificar que el projecte existeix
if [ ! -d "$PROJECT_DIR" ]; then
    echo "ERROR: El projecte '$PROJECT_NAME' no existeix a Projects/"
    exit 1
fi

cd "$PROJECT_DIR"

# 2. Si ja té .claude/, fer merge (no sobreescriure)
echo "[1/4] Verificant .claude/ existent..."
if [ -d ".claude" ]; then
    echo "  .claude/ ja existeix. Afegint només el que falta..."
    # Crear active-skills/domain/ si no existeix
    mkdir -p .claude/active-skills/domain
    # No sobreescriure CLAUDE.md ni settings.json existents
else
    echo "  Creant .claude/ des de plantilla..."
    cp -r "$TEMPLATE_DIR/.claude" .
    sed -i "s/<nom>/$PROJECT_NAME/" .claude/CLAUDE.md
fi

# 3. Detectar stack
echo "[2/4] Detectant stack..."

# Alta confiança
if [ -f "package.json" ]; then
    echo "  package.json detectat"
    if grep -q '"react"' package.json 2>/dev/null; then
        echo "  [confiança alta] React"
    fi
    if grep -q '"next"' package.json 2>/dev/null; then
        echo "  [confiança alta] Next.js"
    fi
    if grep -q '"express"' package.json 2>/dev/null; then
        echo "  [confiança alta] Express"
    fi
fi

if [ -f "composer.json" ]; then
    echo "  composer.json detectat"
    if grep -q 'wp-cli' composer.json 2>/dev/null || grep -q 'wordpress' composer.json 2>/dev/null; then
        echo "  [confiança alta] WordPress"
    fi
fi

if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ]; then
    echo "  Python detectat [confiança alta]"
fi

if [ -f "Cargo.toml" ]; then
    echo "  Rust detectat [confiança alta]"
fi

if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
    echo "  Docker Compose detectat [confiança alta]"
    if grep -q 'postgres' docker-compose.yml docker-compose.yaml 2>/dev/null; then
        echo "  [confiança alta] PostgreSQL"
    fi
    if grep -q 'mysql' docker-compose.yml docker-compose.yaml 2>/dev/null; then
        echo "  [confiança alta] MySQL"
    fi
fi

# Baixa confiança
if [ -f "README.md" ]; then
    if grep -qi 'redis' README.md 2>/dev/null; then
        echo "  [confiança baixa] Redis (referència a README.md)"
    fi
fi

# 4. Crear estructura si falta
echo "[3/4] Creant estructura de directoris..."
mkdir -p docs/decisions

# 5. Mostrar suggeriments
echo "[4/4] Suggeriments de skills de domini..."
echo ""
echo "=== Projecte '$PROJECT_NAME' adaptat correctament ==="
echo ""
echo "Següents passos:"
echo "  1. cd $PROJECT_DIR"
echo "  2. Inicia Claude Code per omplir el context del projecte"
echo "  3. Revisa el stack detectat i les decisions inferides"
echo ""
echo "Skills de domini que podrien aplicar (revisa-ho amb Claude):"
for skill_dir in "$PLATFORM_DIR/skills/domain/"*/; do
    skill=$(basename "$skill_dir")
    echo "  - $skill"
done
SCRIPT

chmod +x /home/usuari/platform/scripts/init-existing-project.sh
```

- [ ] **Step 2: Verificar que l'script és executable**

```bash
ls -la /home/usuari/platform/scripts/init-existing-project.sh
```

Expected: `-rwxr-xr-x`.

### Task 9: Escriure suggest-skills.sh

**Files:**
- Create: `platform/scripts/suggest-skills.sh`

- [ ] **Step 1: Escriure l'script**

```bash
cat > /home/usuari/platform/scripts/suggest-skills.sh << 'SCRIPT'
#!/bin/bash
set -euo pipefail

# suggest-skills.sh — Analitza un projecte i suggereix skills de domini
# Ús: suggest-skills.sh <nom-projecte>

if [ $# -ne 1 ]; then
    echo "Ús: $0 <nom-projecte>"
    exit 1
fi

PROJECT_NAME="$1"
PROJECT_DIR="/home/usuari/Projects/$PROJECT_NAME"
PLATFORM_DIR="/home/usuari/platform"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "ERROR: El projecte '$PROJECT_NAME' no existeix a Projects/"
    exit 1
fi

cd "$PROJECT_DIR"

echo "=== Analitzant projecte '$PROJECT_NAME' ==="
echo ""

# Detectar skills de domini suggerides segons stack
SUGGESTIONS=()

# WordPress
if [ -f "composer.json" ]; then
    if grep -q 'wp-cli\|wordpress\|wpackagist' composer.json 2>/dev/null; then
        SUGGESTIONS+=("wordpress")
    fi
fi
if [ -f "wp-config.php" ] || [ -d "wp-content" ]; then
    SUGGESTIONS+=("wordpress")
fi

# WhatsApp
if grep -rqi 'whatsapp\|wa-\|wa_' --include="*.md" --include="*.json" --include="*.ts" --include="*.js" --include="*.py" . 2>/dev/null | head -5 > /dev/null; then
    SUGGESTIONS+=("whatsapp")
fi

# SEO
if grep -rqi 'seo\|sitemap\|meta.*tag\|schema.org' --include="*.md" --include="*.php" --include="*.html" . 2>/dev/null | head -5 > /dev/null; then
    SUGGESTIONS+=("seo")
fi

# Email
if grep -rqi 'newsletter\|campaign\|smtp\|sendgrid\|mailchimp\|mailgun' --include="*.md" --include="*.json" --include="*.ts" --include="*.js" --include="*.py" . 2>/dev/null | head -5 > /dev/null; then
    SUGGESTIONS+=("email")
fi

# Blockchain
if grep -rqi 'blockchain\|web3\|ethereum\|solidity\|smart.contract' --include="*.md" --include="*.json" --include="*.sol" --include="*.ts" --include="*.js" . 2>/dev/null | head -5 > /dev/null; then
    SUGGESTIONS+=("blockchain")
fi

# Mostrar resultats
if [ ${#SUGGESTIONS[@]} -eq 0 ]; then
    echo "Cap skill de domini suggerida per aquest projecte."
else
    echo "Skills de domini suggerides:"
    for skill in "${SUGGESTIONS[@]}"; do
        # Verificar si ja està activada
        if [ -L "$PROJECT_DIR/.claude/active-skills/domain/$skill" ]; then
            echo "  - $skill (ja activada)"
        else
            echo "  - $skill → $PLATFORM_DIR/scripts/activate-skill.sh $skill $PROJECT_NAME"
        fi
    done
fi

echo ""
echo "Per activar-ne una: $PLATFORM_DIR/scripts/activate-skill.sh <skill> $PROJECT_NAME"
SCRIPT

chmod +x /home/usuari/platform/scripts/suggest-skills.sh
```

- [ ] **Step 2: Verificar que l'script és executable**

```bash
ls -la /home/usuari/platform/scripts/suggest-skills.sh
```

Expected: `-rwxr-xr-x`.

### Task 10: Escriure mcp/registry.json

**Files:**
- Create: `platform/mcp/registry.json`

- [ ] **Step 1: Escriure el registre de MCPs**

```bash
cat > /home/usuari/platform/mcp/registry.json << 'JSON'
{
  "mcpServers": {
    "context7": {
      "description": "Documentació actualitzada de llibreries i frameworks",
      "plugin": "context7@claude-plugins-official",
      "category": "development",
      "alwaysEnabled": true
    },
    "playwright": {
      "description": "Automatització de navegador per testing i screenshots",
      "plugin": "playwright@claude-plugins-official",
      "category": "testing",
      "alwaysEnabled": false
    },
    "github": {
      "description": "Integració amb GitHub: issues, PRs, repos",
      "plugin": "github@claude-plugins-official",
      "category": "development",
      "alwaysEnabled": false
    },
    "supabase": {
      "description": "Integració amb Supabase",
      "plugin": "supabase@claude-plugins-official",
      "category": "infrastructure",
      "alwaysEnabled": false
    },
    "wordpress": {
      "description": "Integració amb WordPress.com",
      "plugin": "wordpress.com@claude-plugins-official",
      "category": "domain",
      "alwaysEnabled": false,
      "requiresSkill": "wordpress"
    }
  }
}
JSON
```

### Task 11: Escriure README.md de la plataforma

**Files:**
- Create: `platform/README.md`

- [ ] **Step 1: Escriure README.md**

```bash
cat > /home/usuari/platform/README.md << 'README'
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
README
```

### Task 12: Configurar hook SessionStart per a l'airlock

**Files:**
- Modify: `/home/usuari/.claude/settings.json`

- [ ] **Step 1: Llegir settings.json actual**

```bash
cat /home/usuari/.claude/settings.json
```

- [ ] **Step 2: Afegir hook SessionStart**

Afegir dins de `settings.json`:

```json
"hooks": {
  "SessionStart": [
    {
      "type": "command",
      "command": "bash -c 'platform/scripts/suggest-skills.sh $(basename $CLAUDE_PROJECT_DIR)'"
    }
  ]
}
```

Nota: Verificar la variable d'entorn correcta de Claude Code per al directori del projecte. Si no existeix, adaptar.

- [ ] **Step 3: Verificar JSON vàlid**

```bash
python3 -m json.tool /home/usuari/.claude/settings.json > /dev/null && echo "JSON vàlid"
```

Expected: `JSON vàlid`.

### Task 13: Commit i push final de Fase 1

- [ ] **Step 1: Verificar l'estructura completa**

```bash
find /home/usuari/platform -type f | sort
```

- [ ] **Step 2: Commit**

```bash
cd /home/usuari/platform
git add -A
git commit -m "$(cat <<'EOF'
feat: platform foundation — universal skills, templates, scripts, and airlock

- 6 universal skills: product-architecture, planning-and-execution,
  engineering-quality, testing-and-verification, debugging, code-review
- Project templates: new and existing
- Scripts: init-new-project, init-existing-project, activate-skill, suggest-skills
- MCP registry
- Airlock rules in CLAUDE.md
- SessionStart hook for skill suggestions

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Push**

```bash
git push origin main
```

---

## Fase 2 — Skills de domini i automatització

*(A implementar després de la Fase 1)*

### Task 14: Migrar skills existents a platform/skills/domain/

- Copiar skills de `.claude/skills/` a `platform/skills/domain/<nom>/skill.md`
- Per a cada skill, crear `patterns.md` amb referències a patterns relacionats
- Revisar que no continguin codi de projectes anteriors
- Verificar el format: conceptes, bones pràctiques, guies de decisió

### Task 15: Refinar suggest-skills.sh amb més deteccions

- Afegir detecció per `package.json` dependencies
- Afegir detecció per estructura de directoris
- Afegir detecció per paraules clau al README.md

### Task 16: Crear primer pattern de prova

- Extreure un patró d'un projecte madur (si n'hi ha cap)
- Aplicar el format amb score i historial
- Validar que no té referències concretes

---

## Fase 3 — Evolució

*(Quan hi hagi massa lliçons al cap)*

### Task 17: Extreure patterns de projectes madurs

- Per a cada projecte madur, executar `suggest-skills.sh` per detectar patrons
- Validar manualment quins patrons val la pena abstraure
- Aplicar el format estàndard de pattern

### Task 18: Crear scripts d'evolució

- `extract-pattern.sh`: assistant interactiu per extreure un patró d'un projecte
- `validate-pattern.sh`: comprova que un pattern no té referències concretes
- `list-patterns.sh`: llista tots els patterns amb scores

### Task 19: Configurar CI/CD bàsic a GitHub Actions

- Validar JSON de `mcp/registry.json`
- Validar que els patterns segueixen el format
- Comprovar que no hi ha referències a projectes als patterns
