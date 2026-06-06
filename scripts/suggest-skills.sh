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
