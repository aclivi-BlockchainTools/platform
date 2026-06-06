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
