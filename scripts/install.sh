#!/bin/bash
set -euo pipefail

# install.sh — Instal·la la plataforma al sistema
# Ús: bash scripts/install.sh

PLATFORM_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PLATFORM_CONFIG_DIR="$HOME/.platform"

echo ""
echo "================================================"
echo "  PLATFORM — Instal·lació"
echo "================================================"
echo ""

# ============================================================
# 1. Crear directoris necessaris
# ============================================================

echo "[1/6] Creant directoris..."

mkdir -p "$HOME/Projects"
echo "  OK: $HOME/Projects"

mkdir -p "$PLATFORM_CONFIG_DIR"
echo "  OK: $PLATFORM_CONFIG_DIR"

mkdir -p "$HOME/.local/bin"
echo "  OK: $HOME/.local/bin"

# ============================================================
# 2. Crear .env de plataforma si no existeix
# ============================================================

echo ""
echo "[2/6] Configurant .env..."

if [ -f "$PLATFORM_CONFIG_DIR/.env" ]; then
    echo "  ~/.platform/.env ja existeix. No es sobreescriu."
else
    cp "$PLATFORM_DIR/.env.example" "$PLATFORM_CONFIG_DIR/.env"
    echo "  OK: ~/.platform/.env creat des de .env.example"
    echo "  Edita'l amb: platform config"
fi

# Crear litellm/.env si no existeix
if [ ! -f "$PLATFORM_DIR/litellm/.env" ]; then
    cp "$PLATFORM_DIR/litellm/.env.example" "$PLATFORM_DIR/litellm/.env"
    echo "  OK: litellm/.env creat des de .env.example"
fi

# ============================================================
# 3. Crear symlink global
# ============================================================

echo ""
echo "[3/6] Creant symlink..."

PLATFORM_BIN="$HOME/.local/bin/platform"

if [ -L "$PLATFORM_BIN" ] || [ -f "$PLATFORM_BIN" ]; then
    echo "  $PLATFORM_BIN ja existeix. No es sobreescriu."
else
    ln -s "$PLATFORM_DIR/scripts/platform.sh" "$PLATFORM_BIN"
    echo "  OK: $PLATFORM_BIN -> $PLATFORM_DIR/scripts/platform.sh"
fi

# ============================================================
# 4. Afegir ~/.local/bin al PATH
# ============================================================

echo ""
echo "[4/6] Verificant PATH..."

if echo "$PATH" | grep -q "$HOME/.local/bin"; then
    echo "  ~/.local/bin ja és al PATH"
else
    # Detectar shell
    SHELL_RC=""
    case "$SHELL" in
        */bash) SHELL_RC="$HOME/.bashrc" ;;
        */zsh)  SHELL_RC="$HOME/.zshrc" ;;
    esac

    if [ -n "$SHELL_RC" ]; then
        echo "" >> "$SHELL_RC"
        echo "# Platform" >> "$SHELL_RC"
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$SHELL_RC"
        echo "  Afegit a $SHELL_RC"
        echo "  Executa 'source $SHELL_RC' o obre un terminal nou."
    else
        echo "  AVÍS: No s'ha pogut detectar el shell."
        echo "  Afegeix manualment: export PATH=\"\$HOME/.local/bin:\$PATH\""
    fi
fi

# ============================================================
# 5. Permisos d'execució
# ============================================================

echo ""
echo "[5/6] Permisos d'execució..."

chmod +x "$PLATFORM_DIR/scripts/"*.sh
echo "  OK: Tots els scripts executables"

# ============================================================
# 6. Comprovar dependències
# ============================================================

echo ""
echo "[6/6] Comprovant dependències..."
echo ""

CRITICAL_MISSING=false
OPTIONAL_MISSING=false

check_cmd() {
    local cmd="$1"
    local desc="$2"
    local level="$3"  # critical o optional

    if command -v "$cmd" &> /dev/null; then
        echo "  [✓] $desc ($cmd)"
        return 0
    else
        if [ "$level" = "critical" ]; then
            echo "  [✗] $desc ($cmd) — CRÍTIC"
            CRITICAL_MISSING=true
        else
            echo "  [✗] $desc ($cmd) — opcional"
            OPTIONAL_MISSING=true
        fi
        return 1
    fi
}

check_cmd "git"        "Git"                 "critical"
check_cmd "bash"       "Bash"                "critical"
check_cmd "curl"       "curl"                "critical"
check_cmd "node"       "Node.js"             "optional"
check_cmd "npm"        "npm"                 "optional"
check_cmd "docker"     "Docker"              "optional"
check_cmd "gh"         "GitHub CLI"          "optional"

# Docker compose (pot ser docker compose o docker-compose)
if docker compose version &> /dev/null 2>&1; then
    echo "  [✓] Docker Compose (docker compose)"
elif command -v docker-compose &> /dev/null; then
    echo "  [✓] Docker Compose (docker-compose)"
else
    echo "  [✗] Docker Compose — opcional"
    OPTIONAL_MISSING=true
fi

# Claude Code
if command -v claude &> /dev/null; then
    echo "  [✓] Claude Code (claude)"
else
    echo "  [✗] Claude Code (claude) — opcional"
    OPTIONAL_MISSING=true
fi

echo ""

# ============================================================
# Resum
# ============================================================

echo "================================================"
echo "  INSTAL·LACIÓ COMPLETADA"
echo "================================================"
echo ""
echo "  Directori:     $PLATFORM_DIR"
echo "  Config:        $PLATFORM_CONFIG_DIR/.env"
echo "  Binari:        $PLATFORM_BIN"
echo "  Comanda:       platform"
echo ""

if [ "$CRITICAL_MISSING" = true ]; then
    echo "ATENCIÓ: Falten dependències crítiques. Instal·la-les abans de continuar."
    echo ""
fi

echo "Següents passos:"
echo "  1. source ~/.bashrc (o obre un terminal nou)"
echo "  2. platform config    (configura les claus API)"
echo "  3. platform doctor    (verifica que tot funcioni)"
echo "  4. platform models start (arrenca LiteLLM)"
echo "  5. platform           (obre el menú principal)"
echo ""
