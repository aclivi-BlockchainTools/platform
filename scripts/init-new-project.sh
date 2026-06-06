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
