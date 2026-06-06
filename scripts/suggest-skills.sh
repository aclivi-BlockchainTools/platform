#!/bin/bash
set -euo pipefail

# suggest-skills.sh — Analitza un projecte i mostra stack detectat + suggereix skills de domini
# Ús: suggest-skills.sh <nom-projecte>

PLATFORM_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECTS_DIR="${PROJECTS_DIR:-$HOME/Projects}"

if [ $# -ne 1 ]; then
    echo "Ús: $0 <nom-projecte>"
    exit 1
fi

PROJECT_NAME="$1"
PROJECT_DIR="$PROJECTS_DIR/$PROJECT_NAME"
SKILLS_DIR="$PLATFORM_DIR/skills/domain"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "ERROR: El projecte '$PROJECT_NAME' no existeix a $PROJECTS_DIR/"
    exit 1
fi

cd "$PROJECT_DIR"

echo "=== Analitzant projecte '$PROJECT_NAME' ==="
echo ""

# ============================================================
# PART 1: Stack detectat (tecnologies, frameworks, serveis)
# ============================================================

# Arrays per nivell de confiança
declare -a STACK_ALTA=()
declare -a STACK_MITJANA=()
declare -a STACK_BAIXA=()

# --- package.json ---
if [ -f "package.json" ]; then
    if grep -q '"next"' package.json 2>/dev/null; then
        STACK_ALTA+=("Next.js")
    fi
    if grep -q '"react"' package.json 2>/dev/null; then
        STACK_ALTA+=("React")
    fi
    if grep -q '"vue"' package.json 2>/dev/null; then
        STACK_ALTA+=("Vue.js")
    fi
    if grep -q '"express"' package.json 2>/dev/null; then
        STACK_ALTA+=("Express")
    fi
    if grep -q '"tailwindcss"\|"tailwind"' package.json 2>/dev/null; then
        STACK_ALTA+=("Tailwind CSS")
    fi
    if grep -q '"prisma"' package.json 2>/dev/null; then
        STACK_MITJANA+=("Prisma")
    fi
    if grep -q '"next-auth"\|"@auth"' package.json 2>/dev/null; then
        STACK_MITJANA+=("NextAuth.js")
    fi
    if grep -q '"typeorm"' package.json 2>/dev/null; then
        STACK_MITJANA+=("TypeORM")
    fi
fi

# --- composer.json ---
if [ -f "composer.json" ]; then
    STACK_ALTA+=("PHP/Composer")
    if grep -q 'wp-cli\|wpackagist\|wordpress' composer.json 2>/dev/null; then
        STACK_ALTA+=("WordPress")
    fi
    if grep -q 'laravel/framework' composer.json 2>/dev/null; then
        STACK_ALTA+=("Laravel")
    fi
fi

# --- Python (amb control de duplicats) ---
PYTHON_ADDED=false
if [ -f "requirements.txt" ]; then
    STACK_ALTA+=("Python")
    PYTHON_ADDED=true
    if grep -q 'django' requirements.txt 2>/dev/null; then
        STACK_ALTA+=("Django")
    fi
    if grep -q 'fastapi' requirements.txt 2>/dev/null; then
        STACK_ALTA+=("FastAPI")
    fi
    if grep -q 'flask' requirements.txt 2>/dev/null; then
        STACK_ALTA+=("Flask")
    fi
fi
if [ -f "pyproject.toml" ]; then
    if [ "$PYTHON_ADDED" = false ]; then
        STACK_ALTA+=("Python")
        PYTHON_ADDED=true
    fi
    if grep -q 'django' pyproject.toml 2>/dev/null; then
        # Evitar duplicar Django
        if ! printf '%s\n' "${STACK_ALTA[@]}" | grep -qx "Django"; then
            STACK_ALTA+=("Django")
        fi
    fi
fi

# --- Rust ---
if [ -f "Cargo.toml" ]; then
    STACK_ALTA+=("Rust")
fi

# --- Go ---
if [ -f "go.mod" ]; then
    STACK_ALTA+=("Go")
fi

# --- Docker ---
if [ -f "docker-compose.yml" ] || [ -f "docker-compose.yaml" ]; then
    STACK_ALTA+=("Docker Compose")
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
fi

# --- GitHub Actions ---
GHA_WORKFLOWS=$(find .github/workflows -maxdepth 1 -name '*.yml' -o -name '*.yaml' 2>/dev/null | head -1 || true)
if [ -n "$GHA_WORKFLOWS" ]; then
    STACK_MITJANA+=("GitHub Actions")
fi

# --- README hints ---
if [ -f "README.md" ]; then
    if grep -qi '\bredis\b' README.md 2>/dev/null; then
        STACK_BAIXA+=("Redis")
    fi
    if grep -qi '\bgraphql\b' README.md 2>/dev/null; then
        STACK_BAIXA+=("GraphQL")
    fi
    if grep -qi '\bmongo(db)?\b' README.md 2>/dev/null; then
        STACK_BAIXA+=("MongoDB")
    fi
    if grep -qi '\belasticsearch\|elastic\b' README.md 2>/dev/null; then
        STACK_BAIXA+=("Elasticsearch")
    fi
fi

# --- Mostrar Stack ---
echo "Stack detectat:"
echo ""

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

# ============================================================
# PART 2: Skills de domini suggerides (només les que existeixen)
# ============================================================

echo ""
echo "Skills de domini suggerides:"
echo ""

# Verificar que existeixen skills de domini
if [ ! -d "$SKILLS_DIR" ] || [ -z "$(ls -A "$SKILLS_DIR" 2>/dev/null)" ]; then
    echo "  No hi ha skills de domini disponibles a platform/skills/domain/."
    echo "  Crea-les primer abans de buscar-ne coincidències."
    echo ""
    echo "Recorda: Les skills de domini requereixen activació manual. No s'activa res automàticament."
    exit 0
fi

# Array associatiu per a suggerències (evitar duplicats)
declare -A SKILL_SEEN

# Funció: suggerir una skill només si existeix
suggest_skill() {
    local skill="$1"
    local confianca="$2"
    local motiu="$3"

    # Només suggerir si la skill existeix realment
    if [ ! -d "$SKILLS_DIR/$skill" ]; then
        return
    fi

    if [ -z "${SKILL_SEEN[$skill]:-}" ]; then
        SKILL_SEEN[$skill]="$confianca|$motiu"
        SKILL_ANY=1
    else
        # Pujar confiança si la nova és més alta
        local old_conf="${SKILL_SEEN[$skill]%%|*}"
        case "$old_conf" in
            baixa) SKILL_SEEN[$skill]="$confianca|$motiu" ;;
            mitjana) [ "$confianca" = "alta" ] && SKILL_SEEN[$skill]="$confianca|$motiu" ;;
        esac
    fi
}

# --- Detecció de skills de domini ---

# WordPress
if [ -f "composer.json" ]; then
    if grep -q 'wp-cli\|wpackagist\|wordpress' composer.json 2>/dev/null; then
        suggest_skill "wordpress" "alta" "composer.json amb dependències WP"
    fi
fi
if [ -f "wp-config.php" ]; then
    suggest_skill "wordpress" "alta" "wp-config.php detectat"
fi
if [ -d "wp-content" ]; then
    suggest_skill "wordpress" "alta" "directori wp-content/ detectat"
fi

# Laravel
if [ -f "composer.json" ] && grep -q 'laravel/framework' composer.json 2>/dev/null; then
    suggest_skill "laravel" "alta" "composer.json amb laravel/framework"
fi

# SEO
if [ -f "robots.txt" ]; then
    suggest_skill "seo" "mitjana" "robots.txt detectat"
fi
if [ -f "sitemap.xml" ] || [ -f "sitemap.xml.gz" ]; then
    suggest_skill "seo" "mitjana" "sitemap.xml detectat"
fi

# Blockchain
if ls *.sol 2>/dev/null | head -1 | grep -q '.sol' 2>/dev/null; then
    suggest_skill "blockchain" "alta" "fitxers .sol (Solidity) detectats"
fi
if [ -f "hardhat.config.js" ] || [ -f "hardhat.config.ts" ] || [ -f "truffle-config.js" ]; then
    suggest_skill "blockchain" "alta" "entorn blockchain (hardhat/truffle)"
fi

# Email
if [ -f "sendgrid.env" ] || [ -f ".sendgrid.env" ]; then
    suggest_skill "email" "mitjana" "configuració de SendGrid detectada"
fi

# WhatsApp
if ls whatsapp*.* 2>/dev/null | head -1 | grep -q 'whatsapp' 2>/dev/null; then
    suggest_skill "whatsapp" "mitjana" "fitxers amb prefix whatsapp detectats"
fi

# --- Mostrar resultats ---

if [ -z "${SKILL_ANY:-}" ]; then
    echo "  Cap skill de domini suggerida per aquest projecte."
else
    for skill in "${!SKILL_SEEN[@]}"; do
        IFS='|' read -r confianca motiu <<< "${SKILL_SEEN[$skill]}"

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
