#!/bin/bash
set -euo pipefail

# suggest-skills.sh — Analitza un projecte i suggereix skills de domini
# Ús: suggest-skills.sh <nom-projecte>

PLATFORM_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECTS_DIR="${PROJECTS_DIR:-$HOME/Projects}"

if [ $# -ne 1 ]; then
    echo "Ús: $0 <nom-projecte>"
    exit 1
fi

PROJECT_NAME="$1"
PROJECT_DIR="$PROJECTS_DIR/$PROJECT_NAME"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "ERROR: El projecte '$PROJECT_NAME' no existeix a $PROJECTS_DIR/"
    exit 1
fi

echo "=== Analitzant projecte '$PROJECT_NAME' ==="
echo ""

# Array associatiu per evitar duplicats i guardar (confiança, motiu)
declare -A SEEN

# Funció per registrar una suggerència sense duplicats
suggest() {
    local skill="$1"
    local confianca="$2"
    local motiu="$3"

    if [ -z "${SEEN[$skill]:-}" ]; then
        SEEN[$skill]="$confianca|$motiu"
        SEEN_ANY=1
    else
        # Si ja hi és, pugem la confiança si la nova és més alta
        local old_conf="${SEEN[$skill]%%|*}"
        case "$old_conf" in
            baixa) SEEN[$skill]="$confianca|$motiu" ;;  # qualsevol cosa millora
            mitjana) [ "$confianca" = "alta" ] && SEEN[$skill]="$confianca|$motiu" ;;
        esac
    fi
}

cd "$PROJECT_DIR"

# === Detecció dirigida per fitxers concrets (no grep -r massiu) ===

# --- WordPress ---
if [ -f "composer.json" ]; then
    if grep -q 'wp-cli\|wpackagist\|wordpress' composer.json 2>/dev/null; then
        suggest "wordpress" "alta" "composer.json amb dependències WP (wp-cli, wpackagist o wordpress)"
    fi
fi
if [ -f "wp-config.php" ]; then
    suggest "wordpress" "alta" "wp-config.php detectat"
fi
if [ -d "wp-content" ]; then
    suggest "wordpress" "alta" "directori wp-content/ detectat"
fi

# --- Laravel ---
if [ -f "composer.json" ]; then
    if grep -q 'laravel/framework' composer.json 2>/dev/null; then
        suggest "laravel" "alta" "composer.json amb laravel/framework"
    fi
fi
if [ -f "artisan" ] && [ -d "app" ] && [ -d "routes" ]; then
    suggest "laravel" "alta" "artisan + app/ + routes/ (estructura Laravel)"
fi

# --- Node.js ---
if [ -f "package.json" ]; then
    if grep -q '"react"' package.json 2>/dev/null; then
        suggest "react" "alta" "package.json amb react"
    fi
    if grep -q '"next"' package.json 2>/dev/null; then
        suggest "nextjs" "alta" "package.json amb next"
    fi
    if grep -q '"express"' package.json 2>/dev/null; then
        suggest "express" "alta" "package.json amb express"
    fi
    # Mitjana: dependències indirectes
    if grep -q '"prisma"' package.json 2>/dev/null; then
        suggest "prisma" "mitjana" "package.json amb prisma (ORM)"
    fi
    if grep -q '"tailwindcss"\|"tailwind"' package.json 2>/dev/null; then
        suggest "tailwind" "mitjana" "package.json amb tailwind"
    fi
fi

# --- Python ---
if [ -f "requirements.txt" ]; then
    if grep -q 'django' requirements.txt 2>/dev/null; then
        suggest "django" "alta" "requirements.txt amb django"
    fi
    if grep -q 'fastapi' requirements.txt 2>/dev/null; then
        suggest "fastapi" "alta" "requirements.txt amb fastapi"
    fi
fi
if [ -f "pyproject.toml" ]; then
    if grep -q 'django' pyproject.toml 2>/dev/null; then
        suggest "django" "alta" "pyproject.toml amb django"
    fi
fi

# --- Docker ---
if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
    suggest "docker" "alta" "docker-compose detectat"
fi

# --- SEO (només en projectes amb HTML/PHP, no grep -r) ---
if [ -f "robots.txt" ]; then
    suggest "seo" "mitjana" "robots.txt detectat"
fi
if [ -f "sitemap.xml" ] || [ -f "sitemap.xml.gz" ]; then
    suggest "seo" "mitjana" "sitemap.xml detectat"
fi

# --- Blockchain (només si hi ha fitxers .sol o configs) ---
if ls *.sol 2>/dev/null | head -1 | grep -q '.sol'; then
    suggest "blockchain" "alta" "fitxers .sol (Solidity) detectats"
fi
if [ -f "hardhat.config.js" ] || [ -f "hardhat.config.ts" ] || [ -f "truffle-config.js" ]; then
    suggest "blockchain" "alta" "entorn de desenvolupament blockchain detectat (hardhat/truffle)"
fi

# --- Email (fitxers de configuració específics, no grep -r) ---
if [ -f "sendgrid.env" ] || [ -f ".sendgrid.env" ]; then
    suggest "email" "mitjana" "configuració de SendGrid detectada"
fi

# --- WhatsApp (fitxers específics) ---
if ls whatsapp*.* 2>/dev/null | head -1 | grep -q 'whatsapp'; then
    suggest "whatsapp" "mitjana" "fitxers amb prefix whatsapp detectats"
fi

# Mostrar resultats
echo "Skills de domini suggerides:"
echo ""

if [ -z "${SEEN_ANY:-}" ]; then
    echo "  Cap skill de domini suggerida per aquest projecte."
else
    for skill in "${!SEEN[@]}"; do
        IFS='|' read -r confianca motiu <<< "${SEEN[$skill]}"

        # Verificar si ja està activada
        if [ -L "$PROJECT_DIR/.claude/active-skills/domain/$skill" ]; then
            echo "  $skill"
            echo "    confiança: $confianca"
            echo "    motiu: $motiu"
            echo "    estat: ja activada"
        else
            echo "  $skill"
            echo "    confiança: $confianca"
            echo "    motiu: $motiu"
            echo "    activa amb: $PLATFORM_DIR/scripts/activate-skill.sh $skill $PROJECT_NAME"
        fi
        echo ""
    done
fi

echo "Recorda: Les skills de domini requereixen activació manual. No s'activa res automàticament."
