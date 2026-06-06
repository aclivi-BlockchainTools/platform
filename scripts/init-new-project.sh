#!/bin/bash
set -euo pipefail

# init-new-project.sh — Inicialitza un projecte verge amb la plantilla de la plataforma
# Ús: init-new-project.sh <nom-projecte>

PLATFORM_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECTS_DIR="${PROJECTS_DIR:-$HOME/Projects}"

if [ $# -ne 1 ]; then
    echo "Ús: $0 <nom-projecte>"
    exit 1
fi

PROJECT_NAME="$1"
PROJECT_DIR="$PROJECTS_DIR/$PROJECT_NAME"
TEMPLATE_DIR="$PLATFORM_DIR/templates/project-new"

echo "=== Init projecte nou: $PROJECT_NAME ==="

# 1. Verificar que gh està instal·lat i autenticat
if ! command -v gh &> /dev/null; then
    echo "ERROR: 'gh' (GitHub CLI) no està instal·lat."
    echo "  Instal·la'l: https://cli.github.com/"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo "ERROR: 'gh' no està autenticat."
    echo "  Executa: gh auth login"
    exit 1
fi

# 2. Verificar que el repo no existeix ja localment
if [ -d "$PROJECT_DIR" ]; then
    echo "ERROR: El directori '$PROJECT_DIR' ja existeix."
    echo "  Si és un projecte existent, usa: init-existing-project.sh $PROJECT_NAME"
    exit 1
fi

# 3. Crear repo a GitHub
echo "[1/5] Creant repo a GitHub..."
mkdir -p "$PROJECTS_DIR"
cd "$PROJECTS_DIR"
gh repo create "$PROJECT_NAME" --private --clone
cd "$PROJECT_NAME"

# 4. Copiar plantilla .claude/
echo "[2/5] Copiant plantilla .claude/..."
cp -r "$TEMPLATE_DIR/.claude" .

# Assegurar que active-skills/domain/ existeix i és buit
mkdir -p .claude/active-skills/domain

# 5. Personalitzar CLAUDE.md amb el nom del projecte
echo "[3/5] Personalitzant CLAUDE.md..."
sed -i "s/<nom>/$PROJECT_NAME/" .claude/CLAUDE.md

# 6. Crear estructura de directoris del projecte
echo "[4/5] Creant estructura de directoris..."
mkdir -p docs/decisions
mkdir -p src

cat > README.md << READMEEOF
# $PROJECT_NAME
READMEEOF

cat > .env.example << 'ENVEOF'
# Variables d'entorn
ENVEOF

cat > .gitignore << 'GITIGNOREEOF'
.env
node_modules/
dist/
.DS_Store
*.log
GITIGNOREEOF

# 7. Commit inicial
echo "[5/5] Commit inicial..."
git add -A
git commit -m "$(cat <<'EOF'
chore: initial project setup from platform template
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
