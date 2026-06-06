#!/bin/bash
set -euo pipefail

# init-existing-project.sh — Adapta un projecte existent a la plataforma
# Ús: init-existing-project.sh <nom-projecte>

PLATFORM_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECTS_DIR="${PROJECTS_DIR:-$HOME/Projects}"

if [ $# -ne 1 ]; then
    echo "Ús: $0 <nom-projecte>"
    exit 1
fi

PROJECT_NAME="$1"
PROJECT_DIR="$PROJECTS_DIR/$PROJECT_NAME"
TEMPLATE_DIR="$PLATFORM_DIR/templates/project-existing"

echo "=== Adaptant projecte existent: $PROJECT_NAME ==="

# 1. Verificar que el projecte existeix
if [ ! -d "$PROJECT_DIR" ]; then
    echo "ERROR: El projecte '$PROJECT_NAME' no existeix a $PROJECTS_DIR/"
    exit 1
fi

cd "$PROJECT_DIR"

# 2. Gestionar .claude/ (merge, no sobreescriure)
echo "[1/4] Verificant .claude/ existent..."
CLAUDE_EXISTIA=false
if [ -d ".claude" ]; then
    echo "  .claude/ ja existeix. Afegint només directoris que falten..."
    CLAUDE_EXISTIA=true
else
    echo "  Creant .claude/ des de plantilla..."
    cp -r "$TEMPLATE_DIR/.claude" .
    sed -i "s/<nom>/$PROJECT_NAME/" .claude/CLAUDE.md
fi

# Afegir directoris que sempre han d'existir
mkdir -p .claude/active-skills/domain
mkdir -p docs/decisions

# Si el CLAUDE.md ja existia, no el sobreescrivim
if [ "$CLAUDE_EXISTIA" = true ] && [ ! -f ".claude/CLAUDE.md" ]; then
    cp "$TEMPLATE_DIR/.claude/CLAUDE.md" .claude/CLAUDE.md
    sed -i "s/<nom>/$PROJECT_NAME/" .claude/CLAUDE.md
fi

# 3. Detectar stack
echo "[2/4] Detectant stack..."

STACK_ALTA=()
STACK_MITJANA=()
STACK_BAIXA=()

# --- Alta confiança: fitxers de configuració/manifest ---

if [ -f "package.json" ]; then
    if grep -q '"next"' package.json 2>/dev/null; then
        STACK_ALTA+=("Next.js")
        echo "  [alta] Next.js — package.json"
    fi
    if grep -q '"react"' package.json 2>/dev/null; then
        STACK_ALTA+=("React")
        echo "  [alta] React — package.json"
    fi
    if grep -q '"express"' package.json 2>/dev/null; then
        STACK_ALTA+=("Express")
        echo "  [alta] Express — package.json"
    fi
    if grep -q '"tailwindcss"\|"tailwind"' package.json 2>/dev/null; then
        STACK_ALTA+=("Tailwind CSS")
        echo "  [alta] Tailwind CSS — package.json"
    fi
    if grep -q '"prisma"' package.json 2>/dev/null; then
        STACK_MITJANA+=("Prisma")
        echo "  [mitjana] Prisma — package.json"
    fi
    if grep -q '"next-auth"\|"@auth"' package.json 2>/dev/null; then
        STACK_MITJANA+=("NextAuth.js")
        echo "  [mitjana] NextAuth.js — package.json"
    fi
fi

if [ -f "composer.json" ]; then
    STACK_ALTA+=("PHP/Composer")
    echo "  [alta] PHP/Composer — composer.json"
    if grep -q 'wp-cli\|wpackagist\|wordpress' composer.json 2>/dev/null; then
        STACK_ALTA+=("WordPress")
        echo "  [alta] WordPress — composer.json"
    fi
    if grep -q 'laravel/framework' composer.json 2>/dev/null; then
        STACK_ALTA+=("Laravel")
        echo "  [alta] Laravel — composer.json"
    fi
fi

if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
    STACK_ALTA+=("Python")
    echo "  [alta] Python — fitxer de dependències"
    if [ -f "pyproject.toml" ] && grep -q 'django' pyproject.toml 2>/dev/null; then
        STACK_ALTA+=("Django")
    fi
    if [ -f "requirements.txt" ] && grep -q 'fastapi' requirements.txt 2>/dev/null; then
        STACK_ALTA+=("FastAPI")
    fi
    if [ -f "requirements.txt" ] && grep -q 'django' requirements.txt 2>/dev/null; then
        STACK_ALTA+=("Django")
    fi
fi

if [ -f "Cargo.toml" ]; then
    STACK_ALTA+=("Rust")
    echo "  [alta] Rust — Cargo.toml"
fi

if [ -f "go.mod" ]; then
    STACK_ALTA+=("Go")
    echo "  [alta] Go — go.mod"
fi

if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
    STACK_ALTA+=("Docker Compose")
    echo "  [alta] Docker Compose — docker-compose"
    if grep -q 'postgres\|postgresql' docker-compose.yml docker-compose.yaml 2>/dev/null; then
        STACK_ALTA+=("PostgreSQL")
    fi
    if grep -q 'mysql\|mariadb' docker-compose.yml docker-compose.yaml 2>/dev/null; then
        STACK_ALTA+=("MySQL/MariaDB")
    fi
    if grep -q 'redis' docker-compose.yml docker-compose.yaml 2>/dev/null; then
        STACK_ALTA+=("Redis")
    fi
fi

if [ -f "Dockerfile" ]; then
    STACK_ALTA+=("Docker")
    echo "  [alta] Docker — Dockerfile"
fi

# --- Confiança mitjana ---

GHA_WORKFLOWS=$(find .github/workflows -maxdepth 1 -name '*.yml' -o -name '*.yaml' 2>/dev/null | head -1 || true)
if [ -n "$GHA_WORKFLOWS" ]; then
    STACK_MITJANA+=("GitHub Actions")
    echo "  [mitjana] GitHub Actions — workflows"
fi

if [ -f ".env.example" ] && grep -q 'DATABASE_URL\|REDIS_URL\|SMTP_' .env.example 2>/dev/null; then
    STACK_MITJANA+=("Serveis externs (DB, Redis, email)")
    echo "  [mitjana] Serveis externs — .env.example"
fi

# --- Confiança baixa: referències en documentació ---

if [ -f "README.md" ]; then
    if grep -qi '\bredis\b' README.md 2>/dev/null; then
        STACK_BAIXA+=("Redis")
        echo "  [baixa] Redis — menció a README.md"
    fi
    if grep -qi '\bgraphql\b' README.md 2>/dev/null; then
        STACK_BAIXA+=("GraphQL")
        echo "  [baixa] GraphQL — menció a README.md"
    fi
    if grep -qi '\bmongo(db)?\b' README.md 2>/dev/null; then
        STACK_BAIXA+=("MongoDB")
        echo "  [baixa] MongoDB — menció a README.md"
    fi
    if grep -qi '\belasticsearch\|elastic\b' README.md 2>/dev/null; then
        STACK_BAIXA+=("Elasticsearch")
        echo "  [baixa] Elasticsearch — menció a README.md"
    fi
fi

# 4. Escriure stack al CLAUDE.md
echo "[3/4] Actualitzant CLAUDE.md amb l'stack detectat..."

CLAUDE_MD=".claude/CLAUDE.md"
STACK_TMP=$(mktemp)

# Construir el bloc d'stack en un fitxer temporal
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
    # Reemplaçar el bloc existent entre marcadors
    START_LINE=$(grep -n "AUTO-GENERATED-STACK-START" "$CLAUDE_MD" | head -1 | cut -d: -f1)
    END_LINE=$(grep -n "AUTO-GENERATED-STACK-END" "$CLAUDE_MD" | head -1 | cut -d: -f1)
    if [ -n "$START_LINE" ] && [ -n "$END_LINE" ]; then
        # Eliminar bloc antic
        sed -i "${START_LINE},${END_LINE}d" "$CLAUDE_MD"
        # Inserir fitxer temporal a la posició del marcador
        sed -i "$((START_LINE - 1))r $STACK_TMP" "$CLAUDE_MD"
    fi
elif grep -q "^## Stack" "$CLAUDE_MD"; then
    # Inserir després de la línia ## Stack
    STACK_LINE=$(grep -n "^## Stack" "$CLAUDE_MD" | head -1 | cut -d: -f1)
    sed -i "${STACK_LINE}r $STACK_TMP" "$CLAUDE_MD"
else
    # Crear secció Stack sencera
    echo "" >> "$CLAUDE_MD"
    echo "## Stack" >> "$CLAUDE_MD"
    cat "$STACK_TMP" >> "$CLAUDE_MD"
fi

rm -f "$STACK_TMP"

# 5. Mostrar suggeriments de skills
echo "[4/4] Suggeriments de skills de domini..."
echo ""

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
    echo "Per activar-ne una: $PLATFORM_DIR/scripts/activate-skill.sh <skill> $PROJECT_NAME"
else
    echo "  No hi ha skills de domini disponibles encara."
fi

echo ""
echo "=== Projecte '$PROJECT_NAME' adaptat correctament ==="
echo ""
echo "Següents passos:"
echo "  1. cd $PROJECT_DIR"
echo "  2. Inicia Claude Code per omplir el context del projecte"
echo "  3. Revisa l'stack detectat al CLAUDE.md i valida'l"
echo "  4. Mou les tecnologies confirmades a 'Stack confirmat'"
