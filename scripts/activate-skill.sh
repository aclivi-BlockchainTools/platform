#!/bin/bash
set -euo pipefail

# activate-skill.sh — Activa una skill de domini a un projecte
# Ús: activate-skill.sh <skill> <nom-projecte>

PLATFORM_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECTS_DIR="${PROJECTS_DIR:-$HOME/Projects}"
SKILLS_DIR="$PLATFORM_DIR/skills/domain"

if [ $# -ne 2 ]; then
    echo "Ús: $0 <skill> <nom-projecte>"
    echo ""
    echo "Skills disponibles:"
    if [ -d "$SKILLS_DIR" ] && [ -n "$(ls -A "$SKILLS_DIR" 2>/dev/null)" ]; then
        ls -1 "$SKILLS_DIR"
    else
        echo "  (cap)"
    fi
    exit 1
fi

SKILL="$1"
PROJECT_NAME="$2"
SKILL_DIR="$SKILLS_DIR/$SKILL"
TARGET_DIR="$PROJECTS_DIR/$PROJECT_NAME/.claude/active-skills/domain/$SKILL"
CLAUDE_MD="$PROJECTS_DIR/$PROJECT_NAME/.claude/CLAUDE.md"
TODAY=$(date +%Y-%m-%d)

echo "=== Activant skill '$SKILL' al projecte '$PROJECT_NAME' ==="

# 1. Verificar que la skill existeix
if [ ! -d "$SKILL_DIR" ]; then
    echo "ERROR: La skill '$SKILL' no existeix a platform/skills/domain/"
    echo ""
    echo "Skills disponibles:"
    if [ -d "$SKILLS_DIR" ] && [ -n "$(ls -A "$SKILLS_DIR" 2>/dev/null)" ]; then
        ls -1 "$SKILLS_DIR"
    else
        echo "  (cap)"
    fi
    exit 1
fi

# 2. Verificar que el projecte existeix
if [ ! -d "$PROJECTS_DIR/$PROJECT_NAME" ]; then
    echo "ERROR: El projecte '$PROJECT_NAME' no existeix a $PROJECTS_DIR/"
    exit 1
fi

# 3. Verificar que .claude/CLAUDE.md existeix
if [ ! -f "$CLAUDE_MD" ]; then
    echo "ERROR: El fitxer .claude/CLAUDE.md no existeix al projecte '$PROJECT_NAME'."
    echo "  Executa primer: $PLATFORM_DIR/scripts/init-existing-project.sh $PROJECT_NAME"
    exit 1
fi

# 4. Verificar que la skill no estigui ja activada (symlink)
if [ -L "$TARGET_DIR" ]; then
    echo "AVÍS: La skill '$SKILL' ja està activada al projecte '$PROJECT_NAME' (symlink)."
    exit 0
fi

# 5. Verificar que no sigui un directori normal (no symlink)
if [ -d "$TARGET_DIR" ]; then
    echo "ERROR: Hi ha un directori normal a '$TARGET_DIR'. Esborra'l primer si vols reemplaçar-lo."
    exit 1
fi

# 6. Crear symlink
echo "[1/2] Creant symlink..."
mkdir -p "$(dirname "$TARGET_DIR")"
ln -s "$SKILL_DIR" "$TARGET_DIR"

# 7. Anotar al CLAUDE.md (evitar duplicats)
echo "[2/2] Actualitzant CLAUDE.md..."

SKILL_ENTRY="- $SKILL (activat el $TODAY)"

# Comprovar si l'entrada ja existeix (per evitar duplicats)
if grep -qF "$SKILL (activat el" "$CLAUDE_MD" 2>/dev/null; then
    echo "  La skill ja consta al CLAUDE.md. No s'afegeix entrada duplicada."
else
    if grep -q "## Skills de domini actives" "$CLAUDE_MD"; then
        # Afegir sota la secció existent (primera línia buida després de la capçalera)
        sed -i "/## Skills de domini actives/a $SKILL_ENTRY" "$CLAUDE_MD"
    else
        # Crear la secció al final
        echo "" >> "$CLAUDE_MD"
        echo "## Skills de domini actives" >> "$CLAUDE_MD"
        echo "$SKILL_ENTRY" >> "$CLAUDE_MD"
    fi
fi

echo ""
echo "=== Skill '$SKILL' activada correctament al projecte '$PROJECT_NAME' ==="
