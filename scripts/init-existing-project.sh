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

# Alta confiança: fitxers de configuració presents
if [ -f "package.json" ]; then
    if grep -q '"next"' package.json 2>/dev/null; then
        echo "  [alta] Next.js — package.json amb dependència next"
    fi
    if grep -q '"react"' package.json 2>/dev/null; then
        echo "  [alta] React — package.json amb dependència react"
    fi
    if grep -q '"express"' package.json 2>/dev/null; then
        echo "  [alta] Express — package.json amb dependència express"
    fi
    if grep -q '"tailwindcss"\|"tailwind"' package.json 2>/dev/null; then
        echo "  [alta] Tailwind CSS — package.json amb dependència tailwind"
    fi
    if grep -q '"prisma"' package.json 2>/dev/null; then
        echo "  [alta] Prisma — package.json amb dependència prisma"
    fi
    if grep -q '"next-auth"\|"@auth"' package.json 2>/dev/null; then
        echo "  [alta] NextAuth.js — package.json amb dependència auth"
    fi
fi

if [ -f "composer.json" ]; then
    echo "  [alta] PHP/Composer — composer.json detectat"
    if grep -q 'wp-cli\|wpackagist\|wordpress' composer.json 2>/dev/null; then
        echo "  [alta] WordPress — composer.json amb dependències WP"
    fi
    if grep -q 'laravel' composer.json 2>/dev/null; then
        echo "  [alta] Laravel — composer.json amb dependència laravel"
    fi
fi

if [ -f "requirements.txt" ] || [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
    echo "  [alta] Python — fitxer de dependències detectat"
    if [ -f "pyproject.toml" ] && grep -q 'django' pyproject.toml 2>/dev/null; then
        echo "  [alta] Django — pyproject.toml amb dependència django"
    fi
    if [ -f "requirements.txt" ] && grep -q 'fastapi' requirements.txt 2>/dev/null; then
        echo "  [alta] FastAPI — requirements.txt amb fastapi"
    fi
fi

if [ -f "Cargo.toml" ]; then
    echo "  [alta] Rust — Cargo.toml detectat"
fi

if [ -f "go.mod" ]; then
    echo "  [alta] Go — go.mod detectat"
fi

if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
    echo "  [alta] Docker Compose — docker-compose detectat"
fi

if [ -f "Dockerfile" ]; then
    echo "  [alta] Docker — Dockerfile detectat"
fi

# Confiança baixa: referències en docs
if [ -f "README.md" ]; then
    if grep -qi 'redis' README.md 2>/dev/null; then
        echo "  [baixa] Redis — menció a README.md"
    fi
    if grep -qi 'graphql' README.md 2>/dev/null; then
        echo "  [baixa] GraphQL — menció a README.md"
    fi
    if grep -qi 'mongodb\|mongo' README.md 2>/dev/null; then
        echo "  [baixa] MongoDB — menció a README.md"
    fi
fi

# Confiança mitjana: presència de fitxers específics
# GitHub Actions: comprovar sense que el glob faci fallar set -e
GHA_WORKFLOWS=$(find .github/workflows -maxdepth 1 -name '*.yml' -o -name '*.yaml' 2>/dev/null | head -1)
if [ -n "$GHA_WORKFLOWS" ]; then
    echo "  [mitjana] GitHub Actions — workflows detectats"
fi

# 4. Suggeriments de skills
echo "[3/4] Suggeriments de skills de domini..."
echo ""

SKILLS_DIR="$PLATFORM_DIR/skills/domain"
if [ -d "$SKILLS_DIR" ] && [ -n "$(ls -A "$SKILLS_DIR" 2>/dev/null)" ]; then
    echo "Skills de domini disponibles:"
    for skill_dir in "$SKILLS_DIR/"*/; do
        skill=$(basename "$skill_dir")
        # Verificar si ja està activada
        if [ -L ".claude/active-skills/domain/$skill" ]; then
            echo "  - $skill (ja activada)"
        else
            echo "  - $skill"
        fi
    done
    echo ""
    echo "Per activar-ne una: $PLATFORM_DIR/scripts/activate-skill.sh <skill> $PROJECT_NAME"
else
    echo "  No hi ha skills de domini disponibles encara. Crea-les a $SKILLS_DIR/"
fi

echo ""
echo "=== Projecte '$PROJECT_NAME' adaptat correctament ==="
echo ""
echo "Següents passos:"
echo "  1. cd $PROJECT_DIR"
echo "  2. Inicia Claude Code per omplir el context del projecte"
echo "  3. Revisa el stack detectat i les decisions inferides"
