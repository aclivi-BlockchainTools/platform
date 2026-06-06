#!/bin/bash
set -euo pipefail

# platform.sh — Eina principal de la plataforma de desenvolupament assistit per IA
# Ús: platform.sh [new|import|open|status|skills|activate|v0|resume] [args...]

PLATFORM_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROJECTS_DIR="${PROJECTS_DIR:-$HOME/Projects}"
SCRIPTS_DIR="$PLATFORM_DIR/scripts"

# ============================================================
# Funcions d'ajuda
# ============================================================

show_menu() {
    echo ""
    echo "================================================"
    echo "  PLATFORM AI"
    echo "================================================"
    echo ""
    echo "  1. Nou projecte          platform new <nom>"
    echo "  2. Importar existent     platform import <nom>"
    echo "  3. Obrir projecte        platform open <nom>"
    echo "  4. Estat projecte        platform status <nom>"
    echo "  5. Suggerir skills       platform skills <nom>"
    echo "  6. Activar skill         platform activate <skill> <projecte>"
    echo "  7. Llistar skills        platform skills --list"
    echo "  8. Prompt v0.dev         platform v0 <tipus> <projecte>"
    echo "  9. Reprendre projecte    platform resume <nom>"
    echo " 10. Sortir"
    echo ""
}

list_skills() {
    local skills_dir="$PLATFORM_DIR/skills/domain"
    echo ""
    echo "Skills de domini disponibles:"
    local found=false
    if [ -d "$skills_dir" ] && [ -n "$(ls -A "$skills_dir" 2>/dev/null)" ]; then
        for d in "$skills_dir"/*/; do
            [ -d "$d" ] || continue
            local skill
            skill=$(basename "$d")
            if [ "$skill" != ".gitkeep" ]; then
                echo "  - $skill"
                found=true
            fi
        done
    fi
    if [ "$found" = false ]; then
        echo "  (cap)"
    fi
    echo ""
    echo "Skills universals (sempre actives):"
    for f in "$PLATFORM_DIR/skills/universal/"*.md; do
        [ -f "$f" ] || continue
        local name
        name=$(basename "$f" .md)
        echo "  - $name"
    done
}

cmd_new() {
    local name="$1"
    "$SCRIPTS_DIR/init-new-project.sh" "$name"
}

cmd_import() {
    local name="$1"
    "$SCRIPTS_DIR/init-existing-project.sh" "$name"
}

cmd_open() {
    local name="$1"
    local project_dir="$PROJECTS_DIR/$name"
    local claude_md="$project_dir/.claude/CLAUDE.md"

    if [ ! -d "$project_dir" ]; then
        echo "ERROR: El projecte '$name' no existeix a $PROJECTS_DIR/"
        exit 1
    fi

    echo ""
    echo "=== $name ==="
    echo ""

    # Skills actives
    echo "Skills actives:"
    local domain_dir="$project_dir/.claude/active-skills/domain"
    if [ -d "$domain_dir" ] && [ -n "$(ls -A "$domain_dir" 2>/dev/null)" ]; then
        for d in "$domain_dir"/*/; do
            [ -d "$d" ] && echo "  - $(basename "$d")"
        done
        for link in "$domain_dir"/*; do
            [ -L "$link" ] && echo "  - $(basename "$link")"
        done
    else
        echo "  (cap)"
    fi

    # Última decisió
    echo ""
    echo "Última decisió:"
    if [ -f "$claude_md" ]; then
        # Extreure decisions de la secció confirmades
        local last_decision
        last_decision=$(sed -n '/### Decisions clau confirmades/,/###/p' "$claude_md" 2>/dev/null | grep -E '^- |^  - ' | tail -1 | sed 's/^[[:space:]]*- //' || echo "")
        if [ -n "$last_decision" ]; then
            echo "  $last_decision"
        else
            echo "  (cap)"
        fi
    else
        echo "  (no hi ha CLAUDE.md)"
    fi

    # Pròxim pas (de l'estat actual)
    echo ""
    echo "Pròxim pas:"
    if [ -f "$claude_md" ]; then
        local status
        status=$(sed -n '/## Estat actual/,/^## /p' "$claude_md" 2>/dev/null | grep -v '^## ' | grep -v '^<!--' | grep -v '^$' | head -3 || echo "")
        if [ -n "$status" ]; then
            echo "$status"
        else
            echo "  (per definir)"
        fi
    else
        echo "  (executa init-existing-project.sh primer)"
    fi

    echo ""
    echo "Directori: $project_dir"
}

cmd_resume() {
    local name="$1"
    local project_dir="$PROJECTS_DIR/$name"
    local claude_md="$project_dir/.claude/CLAUDE.md"

    if [ ! -d "$project_dir" ]; then
        echo "ERROR: El projecte '$name' no existeix a $PROJECTS_DIR/"
        exit 1
    fi

    echo ""
    echo "================================================"
    echo "  REPRENDRE PROJECTE"
    echo "================================================"
    echo ""
    echo "Projecte:   $name"
    echo "Ruta:       $project_dir"
    echo ""

    # --- Stack ---
    echo "Stack:"
    if [ -f "$claude_md" ] && grep -q "AUTO-GENERATED-STACK-START" "$claude_md" 2>/dev/null; then
        sed -n '/AUTO-GENERATED-STACK-START/,/AUTO-GENERATED-STACK-END/p' "$claude_md" \
            | grep '^- ' | sed 's/^- /  - /'
        echo ""
    else
        echo "  No disponible"
        echo ""
    fi

    # --- Skills actives ---
    echo "Skills actives:"
    local domain_dir="$project_dir/.claude/active-skills/domain"
    local found_skills=false
    if [ -d "$domain_dir" ]; then
        for item in "$domain_dir"/*; do
            if [ -L "$item" ] || [ -d "$item" ]; then
                local skill_name
                skill_name=$(basename "$item")
                if [ "$skill_name" != ".gitkeep" ]; then
                    echo "  - $skill_name"
                    found_skills=true
                fi
            fi
        done
    fi
    if [ "$found_skills" = false ]; then
        echo "  Cap"
    fi
    echo ""

    # --- Estat actual ---
    echo "Estat actual:"
    if [ -f "$claude_md" ]; then
        local status_section
        status_section=$(sed -n '/## Estat actual/,/^## /p' "$claude_md" 2>/dev/null | grep -v '^## ' | grep -v '^<!--' | grep -v '^$' | head -5 || echo "")
        if [ -n "$status_section" ]; then
            echo "$status_section" | while IFS= read -r line; do
                echo "  $line"
            done
        else
            echo "  No disponible"
        fi
    else
        echo "  No disponible"
    fi
    echo ""

    # --- Pròxim pas (extret d'Estat actual) ---
    echo "Pròxim pas:"
    if [ -f "$claude_md" ]; then
        local next_step
        next_step=$(sed -n '/## Estat actual/,/^## /p' "$claude_md" 2>/dev/null | grep -v '^## ' | grep -v '^<!--' | grep -v '^$' | grep -iE 'pròxim|proper|següent|next|pending|qued|pendent' | head -1 | sed 's/^[[:space:]]*//' || echo "")
        if [ -n "$next_step" ]; then
            echo "  $next_step"
        else
            echo "  No disponible"
        fi
    else
        echo "  No disponible"
    fi
    echo ""

    # --- Última decisió (de docs/decisions/) ---
    echo "Última decisió:"
    local decisions_dir="$project_dir/docs/decisions"
    if [ -d "$decisions_dir" ] && [ -n "$(ls -A "$decisions_dir" 2>/dev/null)" ]; then
        local last_decision_file
        last_decision_file=$(ls -1t "$decisions_dir"/*.md 2>/dev/null | head -1)
        if [ -n "$last_decision_file" ]; then
            local title
            title=$(head -5 "$last_decision_file" | grep -E '^# ' | head -1 | sed 's/^# //')
            if [ -n "$title" ]; then
                echo "  $title"
                echo "  ($(basename "$last_decision_file"))"
            else
                echo "  $(basename "$last_decision_file")"
            fi
        else
            echo "  No disponible"
        fi
    else
        echo "  No disponible"
    fi
    echo ""

    # --- Criteri de completitud ---
    echo "Criteri de completitud:"

    local implementat="no disponible"
    local verificat="no disponible"
    local completat="no disponible"

    if [ -f "$claude_md" ]; then
        local status_text
        status_text=$(sed -n '/## Estat actual/,/^## /p' "$claude_md" 2>/dev/null || echo "")

        if echo "$status_text" | grep -qi 'implementat[: ]*sí\|implementat[: ]*si\b'; then
            implementat="sí"
        elif echo "$status_text" | grep -qi 'implementat[: ]*no\b'; then
            implementat="no"
        fi

        if echo "$status_text" | grep -qi 'verificat[: ]*sí\|verificat[: ]*si\b'; then
            verificat="sí"
        elif echo "$status_text" | grep -qi 'verificat[: ]*no\b'; then
            verificat="no"
        fi

        if echo "$status_text" | grep -qi 'completat[: ]*sí\|completat[: ]*si\b'; then
            completat="sí"
        elif echo "$status_text" | grep -qi 'completat[: ]*no\b'; then
            completat="no"
        fi
    fi

    echo "  - Implementat: $implementat"
    echo "  - Verificat:   $verificat"
    echo "  - Completat:   $completat"

    echo ""
}

cmd_status() {
    local name="$1"
    local project_dir="$PROJECTS_DIR/$name"
    local claude_md="$project_dir/.claude/CLAUDE.md"

    if [ ! -d "$project_dir" ]; then
        echo "ERROR: El projecte '$name' no existeix a $PROJECTS_DIR/"
        exit 1
    fi

    echo ""
    echo "Projecte: $name"
    echo ""

    # Stack
    echo "Stack:"
    if [ -f "$claude_md" ]; then
        # Extreure stack entre marcadors AUTO-GENERATED
        if grep -q "AUTO-GENERATED-STACK-START" "$claude_md" 2>/dev/null; then
            sed -n '/AUTO-GENERATED-STACK-START/,/AUTO-GENERATED-STACK-END/p' "$claude_md" \
                | grep '^- ' | sed 's/^- /  - /'
        else
            echo "  No disponible"
        fi
    else
        echo "  No disponible"
    fi

    # Skills actives
    echo ""
    echo "Skills actives:"
    local domain_dir="$project_dir/.claude/active-skills/domain"
    local found_skills=false
    if [ -d "$domain_dir" ]; then
        for item in "$domain_dir"/*; do
            if [ -L "$item" ] || [ -d "$item" ]; then
                local skill_name
                skill_name=$(basename "$item")
                if [ "$skill_name" != ".gitkeep" ]; then
                    echo "  - $skill_name"
                    found_skills=true
                fi
            fi
        done
    fi
    if [ "$found_skills" = false ]; then
        echo "  (cap)"
    fi

    # Última decisió
    echo ""
    echo "Última decisió:"
    if [ -f "$claude_md" ]; then
        local last_decision
        last_decision=$(sed -n '/### Decisions clau confirmades/,/###/p' "$claude_md" 2>/dev/null | grep -E '^- |^  - ' | tail -1 | sed 's/^[[:space:]]*//' || echo "")
        if [ -n "$last_decision" ]; then
            echo "  $last_decision"
        else
            echo "  No disponible"
        fi
    else
        echo "  No disponible"
    fi

    # Estat (implementat/verificat/completat)
    echo ""
    echo "Estat:"
    if [ -f "$claude_md" ]; then
        local status_section
        status_section=$(sed -n '/## Estat actual/,/^## /p' "$claude_md" 2>/dev/null | grep -v '^## ' | grep -v '^<!--' | grep -v '^$' || echo "")
        if [ -n "$status_section" ]; then
            echo "$status_section" | while IFS= read -r line; do
                echo "  $line"
            done
        else
            echo "  No disponible"
        fi
    else
        echo "  No disponible"
    fi
    echo ""
}

cmd_skills() {
    if [ "${1:-}" = "--list" ]; then
        list_skills
    elif [ $# -ge 1 ]; then
        "$SCRIPTS_DIR/suggest-skills.sh" "$1"
    else
        echo "Ús: platform skills [--list | <nom-projecte>]"
        echo "  --list           Llista totes les skills disponibles"
        echo "  <nom-projecte>   Suggerir skills per a un projecte"
    fi
}

cmd_activate() {
    if [ $# -ne 2 ]; then
        echo "Ús: platform activate <skill> <projecte>"
        list_skills
        exit 1
    fi
    "$SCRIPTS_DIR/activate-skill.sh" "$1" "$2"
}

cmd_v0() {
    local v0_dir="$PLATFORM_DIR/prompts/v0"

    if [ $# -lt 1 ]; then
        echo "Ús: platform v0 <tipus> [projecte]"
        echo ""
        echo "Tipus disponibles:"
        for f in "$v0_dir"/*.md; do
            [ -f "$f" ] || continue
            local t
            t=$(basename "$f" .md)
            echo "  - $t"
        done
        echo ""
        echo "Opcional: passa un projecte per contextualitzar el prompt."
        exit 1
    fi

    local tipus="$1"
    local prompt_file="$v0_dir/$tipus.md"

    if [ ! -f "$prompt_file" ]; then
        echo "ERROR: Tipus '$tipus' no vàlid."
        echo ""
        echo "Tipus disponibles:"
        for f in "$v0_dir"/*.md; do
            [ -f "$f" ] || continue
            echo "  - $(basename "$f" .md)"
        done
        exit 1
    fi

    echo ""
    echo "=== PROMPT PER v0.dev ==="
    echo ""
    echo "Copia el contingut següent a v0.dev:"
    echo ""

    # Si hi ha un projecte, llegir CLAUDE.md per contextualitzar
    if [ $# -ge 2 ]; then
        local project_name="$2"
        local claude_md="$PROJECTS_DIR/$project_name/.claude/CLAUDE.md"
        if [ -f "$claude_md" ]; then
            echo "<!-- Context del projecte '$project_name' -->"
            echo ""
            # Extreure descripció del projecte
            local desc
            desc=$(sed -n '/^## Descripció/,/^## /p' "$claude_md" 2>/dev/null | grep -v '^## ' | grep -v '^<!--' | grep -v '^$' | head -5 || echo "")
            if [ -n "$desc" ]; then
                echo "$desc"
                echo ""
            fi
            # Extreure stack
            if grep -q "AUTO-GENERATED-STACK-START" "$claude_md" 2>/dev/null; then
                echo "Stack del projecte:"
                sed -n '/AUTO-GENERATED-STACK-START/,/AUTO-GENERATED-STACK-END/p' "$claude_md" \
                    | grep '^- ' | sed 's/^- /  - /'
                echo ""
            fi
            echo "---"
            echo ""
        fi
    fi

    # Mostrar el prompt
    cat "$prompt_file"

    echo ""
    echo "=== FI DEL PROMPT ==="
    echo ""
    echo "Instruccions:"
    echo "  1. Copia el contingut entre '=== PROMPT PER v0.dev ===' i '=== FI DEL PROMPT ==='"
    echo "  2. Reemplaça els placeholders [ENTRE CLAUDÀTORS]"
    echo "  3. Enganxa a v0.dev"
    echo "  4. Itera amb v0.dev fins a obtenir el resultat desitjat"
    echo "  5. Exporta el codi i integra'l amb Claude Code"
}

# ============================================================
# Punt d'entrada
# ============================================================

if [ $# -eq 0 ]; then
    show_menu
    read -p "  Tria una opció (1-10): " choice
    echo ""
    case "$choice" in
        1)
            read -p "  Nom del projecte: " pname
            cmd_new "$pname"
            ;;
        2)
            read -p "  Nom del projecte: " pname
            cmd_import "$pname"
            ;;
        3)
            read -p "  Nom del projecte: " pname
            cmd_open "$pname"
            ;;
        4)
            read -p "  Nom del projecte: " pname
            cmd_status "$pname"
            ;;
        5)
            read -p "  Nom del projecte: " pname
            cmd_skills "$pname"
            ;;
        6)
            read -p "  Skill: " skill
            read -p "  Projecte: " pname
            cmd_activate "$skill" "$pname"
            ;;
        7)
            list_skills
            ;;
        8)
            echo "  Tipus disponibles: landing-page, saas-dashboard, admin-panel, app-shell"
            read -p "  Tipus: " vtype
            read -p "  Projecte (opcional, Enter per saltar): " pname
            if [ -n "$pname" ]; then
                cmd_v0 "$vtype" "$pname"
            else
                cmd_v0 "$vtype"
            fi
            ;;
        9)
            read -p "  Nom del projecte: " pname
            cmd_resume "$pname"
            ;;
        10)
            echo "  Fins aviat."
            exit 0
            ;;
        *)
            echo "  Opció no vàlida."
            exit 1
            ;;
    esac
else
    # Subcomanda directa
    case "$1" in
        new)
            shift
            cmd_new "${1:?Falta el nom del projecte}"
            ;;
        import)
            shift
            cmd_import "${1:?Falta el nom del projecte}"
            ;;
        open)
            shift
            cmd_open "${1:?Falta el nom del projecte}"
            ;;
        status)
            shift
            cmd_status "${1:?Falta el nom del projecte}"
            ;;
        skills)
            shift
            cmd_skills "${@}"
            ;;
        activate)
            shift
            cmd_activate "$@"
            ;;
        v0)
            shift
            cmd_v0 "$@"
            ;;
        resume)
            shift
            if [ $# -lt 1 ]; then
                echo "Ús: platform resume <projecte>"
                exit 1
            fi
            cmd_resume "$1"
            ;;
        help|--help|-h)
            show_menu
            ;;
        *)
            echo "Comanda desconeguda: $1"
            echo ""
            show_menu
            exit 1
            ;;
    esac
fi
