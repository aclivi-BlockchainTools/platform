#!/bin/bash
set -euo pipefail

# init-existing-project.sh — Connecta un projecte existent a la plataforma
# Ús: init-existing-project.sh <nom-projecte>
#
# No sobreescriu contingut existent.
# Afegeix només les seccions de platform que falten.
# Crea backup abans de modificar.
# No activa skills de domini automàticament.
# Detecta stack en subdirectoris (frontend/, backend/).

PLATFORM_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECTS_DIR="${PROJECTS_DIR:-$HOME/Projects}"
TEMPLATE_DIR="$PLATFORM_DIR/templates/project-existing"
TODAY=$(date +%Y-%m-%d)
BACKUP_TS=$(date +%Y%m%d-%H%M%S)

if [ $# -ne 1 ]; then
    echo "Ús: $0 <nom-projecte>"
    exit 1
fi

PROJECT_NAME="$1"
PROJECT_DIR="$PROJECTS_DIR/$PROJECT_NAME"
CLAUDE_MD="$PROJECT_DIR/.claude/CLAUDE.md"
ROOT_CLAUDE_MD="$PROJECT_DIR/CLAUDE.md"

echo "=== Connectant '$PROJECT_NAME' a la plataforma ==="
echo ""

# 1. Verificar que el projecte existeix
if [ ! -d "$PROJECT_DIR" ]; then
    echo "ERROR: El projecte '$PROJECT_NAME' no existeix a $PROJECTS_DIR/"
    exit 1
fi

cd "$PROJECT_DIR"

# 2. Crear .claude/ si no existeix
echo "[1/7] Connectant .claude/..."
mkdir -p .claude/active-skills/domain
mkdir -p docs/decisions
mkdir -p docs/tasks

# 3. Gestionar CLAUDE.md: si és a l'arrel, moure'l a .claude/
if [ -f "$ROOT_CLAUDE_MD" ] && [ ! -f "$CLAUDE_MD" ]; then
    echo "  CLAUDE.md detectat a l'arrel. Movent a .claude/CLAUDE.md..."
    cp "$ROOT_CLAUDE_MD" "$CLAUDE_MD"
    # Deixar una nota al fitxer arrel
    echo "# Aquest fitxer ha estat mogut a .claude/CLAUDE.md per la plataforma." > "$ROOT_CLAUDE_MD"
    echo "# Pots esborrar-lo o mantenir-lo com a referència." >> "$ROOT_CLAUDE_MD"
    echo "  OK: .claude/CLAUDE.md creat des de CLAUDE.md arrel"
elif [ ! -f "$CLAUDE_MD" ]; then
    echo "  CLAUDE.md no existeix. Creant des de plantilla..."
    cp "$TEMPLATE_DIR/.claude/CLAUDE.md" "$CLAUDE_MD"
    sed -i "s/<nom>/$PROJECT_NAME/" "$CLAUDE_MD"
fi

# 4. Settings.json
SETTINGS_JSON="$PROJECT_DIR/.claude/settings.json"
if [ ! -f "$SETTINGS_JSON" ]; then
    cp "$TEMPLATE_DIR/.claude/settings.json" "$SETTINGS_JSON"
    echo "  settings.json creat."
fi

# 5. Backup del CLAUDE.md actual (abans de tocar-lo)
echo "[2/7] Creant backup..."
BACKUP_PATH="$PROJECT_DIR/.claude/CLAUDE.md.bak-$BACKUP_TS"
cp "$CLAUDE_MD" "$BACKUP_PATH"
echo "  Backup: .claude/CLAUDE.md.bak-$BACKUP_TS"

# 6. Afegir seccions que falten
echo "[3/7] Afegint seccions de platform..."

CURRENT=$(cat "$CLAUDE_MD")

declare -A SECTIONS
SECTIONS["## Descripció"]="<!-- Una frase que descrigui el projecte -->"
SECTIONS["## Stack"]='<!-- AUTO-GENERATED-STACK-START -->
### Stack detectat (confiança alta)
<!-- S'"'"'omple automàticament amb platform import -->

### Stack detectat (confiança mitjana)
<!-- S'"'"'omple automàticament amb platform import -->

### Stack detectat (confiança baixa)
<!-- S'"'"'omple automàticament amb platform import -->
<!-- AUTO-GENERATED-STACK-END -->

### Stack confirmat
<!-- Validat manualment per l'"'"'usuari. No sobreescrit per scripts. -->'
SECTIONS["## Estat actual"]="<!-- Per omplir amb Claude a la primera sessió -->"
SECTIONS["## Decisions clau"]='### Decisions clau confirmades
<!-- decisió → per què → data -->

### Decisions inferides (pendent validació)
<!-- decisió → evidència → validar -->'
SECTIONS["## Model Strategy"]='Model principal:
deepseek-v4-pro

Model ràpid:
deepseek-v4-flash

Model auditor:
claude-sonnet

Escalar a Claude només quan:

- hi hagi risc alt
- calgui revisió independent
- calgui validar arquitectura
- hi hagi requisits de seguretat
- DeepSeek no resolgui el problema'
SECTIONS["## Skills de domini actives"]="<!-- skill (activat el YYYY-MM-DD) -->"
SECTIONS["## Errors resolts"]="<!-- error → causa → solució -->"
SECTIONS["## Fora de context"]='- No reutilitzar decisions d'"'"'altres projectes.
- No activar skills de domini sense confirmació.
- No copiar patrons específics sense adaptar-los.
- No referenciar codi d'"'"'altres projectes.

Excepció:
- Si l'"'"'usuari demana explícitament comparar, migrar o reutilitzar coneixement
  d'"'"'un altre projecte, es pot accedir a aquell projecte de forma temporal i documentada.'

ADDED=0
UPDATED=0

for SECTION_TITLE in "## Descripció" "## Stack" "## Estat actual" "## Decisions clau" "## Model Strategy" "## Skills de domini actives" "## Errors resolts" "## Fora de context"; do
    if ! echo "$CURRENT" | grep -qF "$SECTION_TITLE"; then
        CURRENT="$CURRENT

${SECTION_TITLE}
${SECTIONS[$SECTION_TITLE]}"
        echo "  + $SECTION_TITLE"
        ADDED=$((ADDED + 1))
    else
        echo "  · $SECTION_TITLE (ja existeix)"
    fi
done

# Escriure CLAUDE.md amb seccions noves
echo "$CURRENT" > "$CLAUDE_MD"

# 7. Detectar stack (arrel + subdirectoris)
echo "[4/7] Detectant stack..."

STACK_ALTA=()
STACK_MITJANA=()
STACK_BAIXA=()

# Funció per detectar stack des d'un package.json
detect_package_json() {
    local pkg="$1"
    [ ! -f "$pkg" ] && return
    if grep -q '"next"' "$pkg" 2>/dev/null; then STACK_ALTA+=("Next.js"); fi
    if grep -q '"react"' "$pkg" 2>/dev/null; then STACK_ALTA+=("React"); fi
    if grep -q '"express"' "$pkg" 2>/dev/null; then STACK_ALTA+=("Express"); fi
    if grep -q '"tailwindcss"\|"tailwind"' "$pkg" 2>/dev/null; then STACK_ALTA+=("Tailwind CSS"); fi
    if grep -q '"prisma"' "$pkg" 2>/dev/null; then STACK_MITJANA+=("Prisma"); fi
    if grep -q '"next-auth"\|"@auth"' "$pkg" 2>/dev/null; then STACK_MITJANA+=("NextAuth.js"); fi
    if grep -q '"vite"' "$pkg" 2>/dev/null; then STACK_ALTA+=("Vite"); fi
    if grep -q '"typescript"' "$pkg" 2>/dev/null; then STACK_ALTA+=("TypeScript"); fi
    if grep -q '"fastify"' "$pkg" 2>/dev/null; then STACK_ALTA+=("Fastify"); fi
    if grep -q '"vue"' "$pkg" 2>/dev/null; then STACK_ALTA+=("Vue.js"); fi
    if grep -q '"fastapi"' "$pkg" 2>/dev/null; then STACK_ALTA+=("FastAPI"); fi
    if grep -q '"django"' "$pkg" 2>/dev/null; then STACK_ALTA+=("Django"); fi
    if grep -q '"zx"' "$pkg" 2>/dev/null; then STACK_ALTA+=("zx"); fi
}

# Buscar package.json a arrel i subdirectoris comuns
for pkg in package.json frontend/package.json backend/package.json server/package.json client/package.json; do
    detect_package_json "$pkg"
done

# composer.json
if [ -f "composer.json" ]; then
    STACK_ALTA+=("PHP/Composer")
    if grep -q 'wp-cli\|wpackagist\|wordpress' composer.json 2>/dev/null; then STACK_ALTA+=("WordPress"); fi
    if grep -q 'laravel/framework' composer.json 2>/dev/null; then STACK_ALTA+=("Laravel"); fi
fi

# Python
for req in requirements.txt backend/requirements.txt server/requirements.txt pyproject.toml setup.py; do
    [ -f "$req" ] && STACK_ALTA+=("Python") && break
done
if [ -f "requirements.txt" ]; then
    if grep -q 'fastapi' requirements.txt 2>/dev/null; then STACK_ALTA+=("FastAPI"); fi
    if grep -q 'django' requirements.txt 2>/dev/null; then STACK_ALTA+=("Django"); fi
    if grep -q 'flask' requirements.txt 2>/dev/null; then STACK_ALTA+=("Flask"); fi
fi

# Rust, Go
[ -f "Cargo.toml" ] && STACK_ALTA+=("Rust")
[ -f "go.mod" ] && STACK_ALTA+=("Go")

# Docker
for dc in docker-compose.yml docker-compose.yaml docker-compose.yml; do
    [ -f "$dc" ] && STACK_ALTA+=("Docker Compose") && break
done
if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
    if grep -q 'postgres\|postgresql' docker-compose.yml docker-compose.yaml 2>/dev/null; then STACK_ALTA+=("PostgreSQL"); fi
    if grep -q 'mysql\|mariadb' docker-compose.yml docker-compose.yaml 2>/dev/null; then STACK_ALTA+=("MySQL/MariaDB"); fi
    if grep -q 'redis' docker-compose.yml docker-compose.yaml 2>/dev/null; then STACK_ALTA+=("Redis"); fi
    if grep -qi 'minio' docker-compose.yml docker-compose.yaml 2>/dev/null; then STACK_ALTA+=("MinIO"); fi
fi
[ -f "Dockerfile" ] && STACK_ALTA+=("Docker")

# GitHub Actions
if [ -d ".github/workflows" ] && [ -n "$(ls -A .github/workflows 2>/dev/null)" ]; then
    STACK_MITJANA+=("GitHub Actions")
    echo "  [mitjana] GitHub Actions"
fi

# Env hints
if [ -f ".env.example" ]; then
    if grep -q 'DATABASE_URL\|REDIS_URL\|SMTP_' .env.example 2>/dev/null; then
        STACK_MITJANA+=("Serveis externs (DB, Redis, email)")
        echo "  [mitjana] Serveis externs — .env.example"
    fi
fi

# README hints
if [ -f "README.md" ]; then
    if grep -qi '\bredis\b' README.md 2>/dev/null; then STACK_BAIXA+=("Redis"); echo "  [baixa] Redis — README"; fi
    if grep -qi '\bgraphql\b' README.md 2>/dev/null; then STACK_BAIXA+=("GraphQL"); echo "  [baixa] GraphQL — README"; fi
    if grep -qi '\bmongo(db)?\b' README.md 2>/dev/null; then STACK_BAIXA+=("MongoDB"); echo "  [baixa] MongoDB — README"; fi
    if grep -qi '\belasticsearch\|elastic\b' README.md 2>/dev/null; then STACK_BAIXA+=("Elasticsearch"); echo "  [baixa] Elasticsearch — README"; fi
fi

# Eliminar duplicats preservant ordre
STACK_ALTA=($(printf '%s\n' "${STACK_ALTA[@]}" | awk '!seen[$0]++'))
STACK_MITJANA=($(printf '%s\n' "${STACK_MITJANA[@]}" | awk '!seen[$0]++'))
STACK_BAIXA=($(printf '%s\n' "${STACK_BAIXA[@]}" | awk '!seen[$0]++'))

# Actualitzar CLAUDE.md amb stack
echo "[5/7] Actualitzant stack al CLAUDE.md..."

STACK_TMP=$(mktemp)
{
    echo "<!-- AUTO-GENERATED-STACK-START -->"
    echo "### Stack detectat (confiança alta)"
    if [ ${#STACK_ALTA[@]} -gt 0 ]; then
        for item in "${STACK_ALTA[@]}"; do
            echo "- $item"
        done
    else
        echo "(cap detectat)"
    fi
    echo ""
    echo "### Stack detectat (confiança mitjana)"
    if [ ${#STACK_MITJANA[@]} -gt 0 ]; then
        for item in "${STACK_MITJANA[@]}"; do
            echo "- $item"
        done
    else
        echo "(cap detectat)"
    fi
    echo ""
    echo "### Stack detectat (confiança baixa)"
    if [ ${#STACK_BAIXA[@]} -gt 0 ]; then
        for item in "${STACK_BAIXA[@]}"; do
            echo "- $item"
        done
    else
        echo "(cap detectat)"
    fi
    echo "<!-- AUTO-GENERATED-STACK-END -->"
} > "$STACK_TMP"

if grep -q "AUTO-GENERATED-STACK-START" "$CLAUDE_MD" 2>/dev/null; then
    START_LINE=$(grep -n "AUTO-GENERATED-STACK-START" "$CLAUDE_MD" | head -1 | cut -d: -f1)
    END_LINE=$(grep -n "AUTO-GENERATED-STACK-END" "$CLAUDE_MD" | head -1 | cut -d: -f1)
    if [ -n "$START_LINE" ] && [ -n "$END_LINE" ]; then
        sed -i "${START_LINE},${END_LINE}d" "$CLAUDE_MD"
        sed -i "$((START_LINE - 1))r $STACK_TMP" "$CLAUDE_MD"
        UPDATED=$((UPDATED + 1))
        echo "  Stack actualitzat."
    fi
fi

rm -f "$STACK_TMP"

# 8. Detectar decisions inline
echo "[6/7] Verificant decisions..."

if grep -q "## Decisions clau" "$CLAUDE_MD"; then
    # Mirar si el backup original té decisions inline (abans de la migració)
    DECISION_LINES=$(grep -cinE '[Dd]ecisi[oó]|[Dd]ecidit|[Tt]riat|[Ee]scollit|[Aa]rquitectura.*:' "$BACKUP_PATH" 2>/dev/null | grep -o '[0-9]\+' | head -1 || echo "0")
    if [ "${DECISION_LINES:-0}" -gt 5 ]; then
        if ! grep -q "## Migració pendent" "$CLAUDE_MD"; then
            cat >> "$CLAUDE_MD" << EOF

## Migració pendent

> **Nota de platform import ($TODAY):** S'han detectat decisions prèvies al CLAUDE.md original (backup: \`.claude/CLAUDE.md.bak-$BACKUP_TS\`). Revisa-les i mou les rellevants a \`## Decisions clau → Decisions clau confirmades\` amb format: decisió → per què → data.
EOF
            echo "  S'han detectat decisions prèvies. Afegit ## Migració pendent."
        fi
    fi
fi

# 9. Resum
echo "[7/7] Resum de la connexió..."
echo ""

echo "=== Projecte '$PROJECT_NAME' connectat a la plataforma ==="
echo ""

if [ $ADDED -gt 0 ]; then
    echo "Seccions noves afegides: $ADDED"
fi
if [ $UPDATED -gt 0 ]; then
    echo "Seccions actualitzades: $UPDATED"
fi

echo ""
echo "Stack detectat:"
if [ ${#STACK_ALTA[@]} -gt 0 ]; then
    for item in "${STACK_ALTA[@]}"; do
        echo "  - $item (confiança alta)"
    done
fi
if [ ${#STACK_MITJANA[@]} -gt 0 ]; then
    for item in "${STACK_MITJANA[@]}"; do
        echo "  - $item (confiança mitjana)"
    done
fi
if [ ${#STACK_BAIXA[@]} -gt 0 ]; then
    for item in "${STACK_BAIXA[@]}"; do
        echo "  - $item (confiança baixa)"
    done
fi
if [ ${#STACK_ALTA[@]} -eq 0 ] && [ ${#STACK_MITJANA[@]} -eq 0 ] && [ ${#STACK_BAIXA[@]} -eq 0 ]; then
    echo "  (cap tecnologia detectada)"
fi

echo ""
echo "Directoris creats:"
echo "  .claude/active-skills/domain/"
echo "  docs/decisions/"
echo "  docs/tasks/"
echo "  Backup: .claude/CLAUDE.md.bak-$BACKUP_TS"
echo ""

# Skills de domini disponibles
SKILLS_DIR="$PLATFORM_DIR/skills/domain"
if [ -d "$SKILLS_DIR" ] && [ -n "$(ls -A "$SKILLS_DIR" 2>/dev/null)" ]; then
    echo "Skills de domini disponibles:"
    for skill_dir in "$SKILLS_DIR/"*/; do
        [ -d "$skill_dir" ] || continue
        skill=$(basename "$skill_dir")
        if [ -L ".claude/active-skills/domain/$skill" ]; then
            echo "  - $skill (ja activada)"
        else
            echo "  - $skill"
        fi
    done
    echo ""
    echo "Per activar-ne una: platform activate <skill> $PROJECT_NAME"
else
    echo "Cap skill de domini disponible."
fi

echo ""
echo "Següents passos:"
echo "  1. cd $PROJECT_DIR"
echo "  2. Revisa el CLAUDE.md i valida l'stack detectat"
echo "  3. Inicia Claude Code per omplir el context del projecte"
echo "  4. platform status $PROJECT_NAME"
echo "  5. platform resume $PROJECT_NAME"
echo ""
