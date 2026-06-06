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
