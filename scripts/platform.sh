#!/bin/bash
set -euo pipefail

# platform.sh — Eina principal de la plataforma de desenvolupament assistit per IA
# Ús: platform.sh [new|import|open|status|skills|activate|v0|resume] [args...]

PLATFORM_DIR="$(cd "$(dirname "$(readlink -f "$0")")/.." && pwd)"
PROJECTS_DIR="${PROJECTS_DIR:-$HOME/Projects}"
SCRIPTS_DIR="$PLATFORM_DIR/scripts"
PLATFORM_CONFIG_DIR="$HOME/.platform"

# Carregar configuració d'entorn si existeix
# Guardar valor original per si ve de l'entorn (prioritat més alta)
_ORIG_PROJECTS_DIR="${PROJECTS_DIR:-}"
if [ -f "$PLATFORM_CONFIG_DIR/.env" ]; then
    set -a
    source "$PLATFORM_CONFIG_DIR/.env"
    set +a
fi
# L'entorn sobrescrit té prioritat sobre el fitxer .env
PROJECTS_DIR="${_ORIG_PROJECTS_DIR:-${PROJECTS_DIR:-$HOME/Projects}}"

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
    echo " 10. Configuració          platform config"
    echo " 11. Doctor                platform doctor"
    echo " 12. Models                platform models <start|stop|status|test>"
    echo " 13. Routing               platform route \"<tasca>\""
    echo " 14. Ask model             platform ask <model> \"<prompt>\""
    echo " 15. Task projecte         platform task <projecte> \"<tasca>\""
    echo " 16. Instal·lar perfil     platform install-claude-profile"
    echo " 17. Instal·lar MCP        platform mcp-install"
    echo " 18. Sortir"
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
    # Alias de resume — compatibilitat
    cmd_resume "$@"
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

    # --- Última tasca ---
    echo "Última tasca:"
    local tasks_dir="$project_dir/docs/tasks"
    if [ -d "$tasks_dir" ] && ls "$tasks_dir"/*.md &>/dev/null 2>&1; then
        local last_task_file
        last_task_file=$(ls -1t "$tasks_dir"/*.md 2>/dev/null | head -1)
        if [ -n "$last_task_file" ]; then
            local task_title
            task_title=$(grep '^# Tasca:' "$last_task_file" 2>/dev/null | head -1 | sed 's/^# Tasca: //')
            local task_date
            task_date=$(grep '^Data:' "$last_task_file" 2>/dev/null | head -1 | sed 's/^Data: //')
            local task_impl
            task_impl=$(grep '^Implementat:' "$last_task_file" 2>/dev/null | head -1 | sed 's/^Implementat: //')
            local task_verif
            task_verif=$(grep '^Verificat:' "$last_task_file" 2>/dev/null | head -1 | sed 's/^Verificat: //')
            local task_comp
            task_comp=$(grep '^Completat:' "$last_task_file" 2>/dev/null | head -1 | sed 's/^Completat: //')
            echo "  ${task_title:-sense títol}"
            echo "  Data: ${task_date:-?}"
            echo "  Implementat: ${task_impl:-?} | Verificat: ${task_verif:-?} | Completat: ${task_comp:-?}"
        fi
    else
        echo "  Cap"
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

    # --- Model Strategy ---
    echo ""
    echo "Model Strategy:"
    echo "  Principal:  deepseek-v4-pro"
    echo "  Ràpid:      deepseek-v4-flash"
    echo "  Auditor:    claude-sonnet"

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
# Routing Engine v1
# ============================================================

classify_task() {
    local desc="$1"
    local desc_lower
    desc_lower=$(echo "$desc" | tr '[:upper:]' '[:lower:]')

    ROUTE_CATEGORY=""
    ROUTE_MODEL=""
    ROUTE_REASON=""
    ROUTE_ALTERNATIVE=""

    # Overrides explícits de l'usuari
    if echo "$desc_lower" | grep -qE '\busa claude\b|utilitza claude'; then
        ROUTE_CATEGORY="auditoria"
        ROUTE_MODEL="claude-sonnet"
        ROUTE_REASON="L'usuari ha demanat explícitament Claude."
        ROUTE_ALTERNATIVE="deepseek-v4-pro si no cal revisió independent."
        return
    fi

    if echo "$desc_lower" | grep -qE '\busa flash\b|utilitza flash'; then
        ROUTE_CATEGORY="simple"
        ROUTE_MODEL="deepseek-v4-flash"
        ROUTE_REASON="L'usuari ha demanat explícitament Flash."
        ROUTE_ALTERNATIVE="deepseek-v4-pro per a tasques més complexes."
        return
    fi

    # Claude Haiku: resums, classificació, consultes ràpides
    if echo "$desc_lower" | grep -qE '\bresum\b|resumeix|classifica|classificació|consulta ràpida|llista breu'; then
        ROUTE_CATEGORY="consulta"
        ROUTE_MODEL="claude-haiku"
        ROUTE_REASON="Tasca lleugera de consulta o classificació."
        ROUTE_ALTERNATIVE="deepseek-v4-flash per a generació de text breu."
        return
    fi

    # Claude Sonnet: revisió, seguretat, auditoria, arquitectura crítica
    if echo "$desc_lower" | grep -qE 'revisar|revisió|seguretat|auditoria|audita|segona opinió|decisió d.alt impacte|arquitectura crítica|validar arquitectura|risc alt'; then
        ROUTE_CATEGORY="auditoria"
        ROUTE_MODEL="claude-sonnet"
        ROUTE_REASON="Tasca de revisió, seguretat o decisió d'alt impacte."
        ROUTE_ALTERNATIVE="deepseek-v4-pro si és una revisió de codi rutinària."
        return
    fi

    # DeepSeek Flash: boilerplate, petites modificacions, generació massiva
    if echo "$desc_lower" | grep -qE '\bboilerplate\b|petita modificació|modificació petita|tasca repetitiva|generació massiva|afegir camps?|rename|reanomena'; then
        ROUTE_CATEGORY="simple"
        ROUTE_MODEL="deepseek-v4-flash"
        ROUTE_REASON="Tasca simple, repetitiva o de boilerplate."
        ROUTE_ALTERNATIVE="deepseek-v4-pro si hi ha lògica de negoci."
        return
    fi

    # Default: DeepSeek V4 Pro
    ROUTE_CATEGORY="implementació"
    ROUTE_MODEL="deepseek-v4-pro"
    ROUTE_REASON="Implementació principal de software."
    ROUTE_ALTERNATIVE="deepseek-v4-flash si la tasca és purament repetitiva o boilerplate."
}

cmd_route() {
    if [ $# -lt 1 ]; then
        echo "Ús: platform route \"<descripció de la tasca>\""
        exit 1
    fi

    local desc="$*"
    classify_task "$desc"

    echo ""
    echo "Tasca:"
    echo "  $desc"
    echo ""
    echo "Categoria:"
    echo "  $ROUTE_CATEGORY"
    echo ""
    echo "Model recomanat:"
    echo "  $ROUTE_MODEL"
    echo ""
    echo "Motiu:"
    echo "  $ROUTE_REASON"
    echo ""
    echo "Alternativa:"
    echo "  $ROUTE_ALTERNATIVE"
    echo ""
}

cmd_ask() {
    if [ $# -lt 2 ]; then
        echo "Ús: platform ask <model> \"<prompt>\""
        echo ""
        echo "Models: deepseek-v4-pro, deepseek-v4-flash, claude-sonnet, claude-haiku"
        exit 1
    fi

    local model="$1"
    shift
    local prompt="$*"

    case "$model" in
        deepseek-v4-pro|deepseek-v4-flash|claude-sonnet|claude-haiku) ;;
        *)
            echo "Model no reconegut: $model"
            echo "Models acceptats: deepseek-v4-pro, deepseek-v4-flash, claude-sonnet, claude-haiku"
            exit 1
            ;;
    esac

    local litellm_host="${LITELLM_HOST:-127.0.0.1}"
    local litellm_port="${LITELLM_PORT:-4000}"
    local litellm_key="${LITELLM_MASTER_KEY:-sk-local-platform}"
    local base_url="http://${litellm_host}:${litellm_port}"

    if [[ "$model" == claude-* ]]; then
        local anthropic_key="${ANTHROPIC_API_KEY:-}"
        if [ -z "$anthropic_key" ] || [ "$anthropic_key" = '""' ] || [ "$anthropic_key" = "''" ]; then
            echo "Claude via LiteLLM no configurat. Usa Claude Code amb login o configura ANTHROPIC_API_KEY."
            exit 0
        fi
    fi

    echo "Model: $model"
    echo "..."
    echo ""

    local response_file
    response_file=$(mktemp)
    local prompt_json
    prompt_json=$(python3 -c "import json,sys; print(json.dumps(sys.stdin.read()))" <<< "$prompt")
    local http_code
    http_code=$(curl -s -o "$response_file" -w "%{http_code}" \
        -X POST "$base_url/v1/chat/completions" \
        -H "Authorization: Bearer $litellm_key" \
        -H "Content-Type: application/json" \
        -d "{\"model\":\"$model\",\"messages\":[{\"role\":\"user\",\"content\":$prompt_json}],\"max_tokens\":4096}" \
        2>/dev/null || echo "000")

    if [ "$http_code" = "200" ]; then
        python3 -c "
import json, sys
d = json.load(sys.stdin)
if 'error' in d:
    print('ERROR:', d['error'].get('message', 'error desconegut'))
else:
    print(d['choices'][0]['message']['content'])
" < "$response_file"
    else
        echo "ERROR HTTP $http_code"
        cat "$response_file"
    fi

    rm -f "$response_file"
}

cmd_task() {
    local project_name="$1"
    shift
    local task_desc="$*"

    local project_dir="$PROJECTS_DIR/$project_name"
    if [ ! -d "$project_dir" ]; then
        echo "ERROR: El projecte '$project_name' no existeix a $PROJECTS_DIR/"
        exit 1
    fi

    # Trobar CLAUDE.md (a .claude/ o arrel)
    local claude_md="$project_dir/.claude/CLAUDE.md"
    [ -f "$claude_md" ] || claude_md="$project_dir/CLAUDE.md"

    classify_task "$task_desc"
    local model="$ROUTE_MODEL"
    local category="$ROUTE_CATEGORY"
    local reason="$ROUTE_REASON"

    echo ""
    echo "Projecte: $project_name"
    echo "Tasca:    $task_desc"
    echo "Model:    $model ($category)"
    echo ""

    # Context del projecte — complet, no resumit
    local stack=""
    local estat=""
    local decisions=""
    local model_strategy=""
    local skills=""

    if [ -f "$claude_md" ]; then
        # Stack
        if grep -q "AUTO-GENERATED-STACK-START" "$claude_md" 2>/dev/null; then
            stack=$(sed -n '/AUTO-GENERATED-STACK-START/,/AUTO-GENERATED-STACK-END/p' "$claude_md" \
                | grep '^- ' | sed 's/^- //' | tr '\n' ',' | sed 's/,$//')
        fi

        # Estat actual COMPLET (no només 3 línies)
        estat=$(sed -n '/^## Estat actual/,/^## /p' "$claude_md" 2>/dev/null \
            | grep -v '^## ' | grep -v '^<!--' | sed '/^$/N;/^\n$/d')

        # Decisions clau
        decisions=$(sed -n '/^## Decisions clau/,/^## /p' "$claude_md" 2>/dev/null \
            | grep -v '^## ' | grep -v '^<!--' | sed '/^$/N;/^\n$/d' | head -30)

        # Model Strategy
        model_strategy=$(sed -n '/^## Model Strategy/,/^## /p' "$claude_md" 2>/dev/null \
            | grep -v '^## ' | grep -v '^<!--' | sed '/^$/N;/^\n$/d')
    fi

    # Skills actives
    local domain_dir="$project_dir/.claude/active-skills/domain"
    if [ -d "$domain_dir" ]; then
        for item in "$domain_dir"/*; do
            [ -L "$item" ] || [ -d "$item" ] || continue
            local sname
            sname=$(basename "$item")
            [ "$sname" = ".gitkeep" ] && continue
            skills="${skills}${sname},"
        done
        skills="${skills%,}"
    fi

    # Última tasca
    local last_task_info=""
    local tasks_dir="$project_dir/docs/tasks"
    if [ -d "$tasks_dir" ] && [ -n "$(ls -A "$tasks_dir"/*.md 2>/dev/null)" ]; then
        local last_task_file
        last_task_file=$(ls -1t "$tasks_dir"/*.md 2>/dev/null | head -1)
        if [ -n "$last_task_file" ]; then
            local last_title last_model last_impl last_verif last_comp
            last_title=$(grep '^# Tasca:' "$last_task_file" 2>/dev/null | head -1 | sed 's/^# Tasca: //')
            last_model=$(grep '^Model recomanat:' "$last_task_file" 2>/dev/null | head -1 | sed 's/^Model recomanat: //')
            last_impl=$(grep '^Implementat:' "$last_task_file" 2>/dev/null | head -1 | sed 's/^Implementat: //')
            last_verif=$(grep '^Verificat:' "$last_task_file" 2>/dev/null | head -1 | sed 's/^Verificat: //')
            last_comp=$(grep '^Completat:' "$last_task_file" 2>/dev/null | head -1 | sed 's/^Completat: //')
            last_task_info="Última tasca: ${last_title:-?} (model: ${last_model:-?}, implementat: ${last_impl:-no}, verificat: ${last_verif:-no}, completat: ${last_comp:-no})"
        fi
    fi

    # Fitxer de tasca
    mkdir -p "$tasks_dir"
    local timestamp
    timestamp=$(date '+%Y-%m-%d-%H%M%S')
    local slug
    slug=$(echo "$task_desc" | tr '[:upper:]' '[:lower:]' \
        | sed 's/[^a-z0-9]/-/g; s/-\+/-/g' | cut -c1-40 | sed 's/-$//')
    local task_file="$tasks_dir/${timestamp}-${slug}.md"

    # Prompt amb context COMPLET + instrucció forta
    local full_prompt="Projecte: $project_name"
    [ -n "$stack" ]  && full_prompt="${full_prompt}
Stack: $stack"
    [ -n "$skills" ] && full_prompt="${full_prompt}
Skills actives: $skills"
    [ -n "$estat" ]  && full_prompt="${full_prompt}

## Estat actual del projecte

$estat"
    [ -n "$decisions" ] && full_prompt="${full_prompt}

## Decisions clau

$decisions"
    [ -n "$model_strategy" ] && full_prompt="${full_prompt}

## Model Strategy

$model_strategy"
    [ -n "$last_task_info" ] && full_prompt="${full_prompt}

$last_task_info"
    full_prompt="${full_prompt}

## Tasca sol·licitada

$task_desc

## Instruccions

1. NO proposis implementar funcionalitats que l'Estat actual indica com a completades o funcionals. Llegeix atentament què ja està fet.
2. Si una àrea ja està implementada però no verificada, marca-la com a 'verificar', no com a 'implementar'.
3. Si la tasca és d'anàlisi o següents passos, estructura la resposta en:
   - ✅ Ja fet (funcionalitats que el context confirma completades)
   - 🔧 Pendent (funcionalitats reals pendents, no repetir les ja fetes)
   - ⚠️ Riscos (riscos detectats segons l'estat actual)
   - 📋 10 següents passos prioritzats (concrets, accionables, no genèrics)
4. Si la tasca és d'implementació, proposa un pla concret que respongui a la tasca, sense reimplementar el que ja funciona.
5. Sigues específic amb noms de fitxers, rutes i tecnologies existents.
6. Proposa sempre el camí més simple. No afegeixis complexitat innecessària."

    local response=""

    if [[ "$model" == deepseek-* ]]; then
        local deepseek_key="${DEEPSEEK_API_KEY:-}"
        if [ -z "$deepseek_key" ] || [ "$deepseek_key" = '""' ] || [ "$deepseek_key" = "''" ]; then
            echo "ERROR: DEEPSEEK_API_KEY no configurada. Executa: platform config"
            exit 1
        fi

        local litellm_host="${LITELLM_HOST:-127.0.0.1}"
        local litellm_port="${LITELLM_PORT:-4000}"
        local litellm_key="${LITELLM_MASTER_KEY:-sk-local-platform}"
        local base_url="http://${litellm_host}:${litellm_port}"

        echo "Consultant $model via LiteLLM..."
        echo ""

        local response_file
        response_file=$(mktemp)
        local prompt_json
        prompt_json=$(python3 -c "import json,sys; print(json.dumps(sys.stdin.read()))" <<< "$full_prompt")
        local http_code
        http_code=$(curl -s -o "$response_file" -w "%{http_code}" \
            -X POST "$base_url/v1/chat/completions" \
            -H "Authorization: Bearer $litellm_key" \
            -H "Content-Type: application/json" \
            -d "{\"model\":\"$model\",\"messages\":[{\"role\":\"user\",\"content\":$prompt_json}],\"max_tokens\":4096}" \
            2>/dev/null || echo "000")

        if [ "$http_code" = "200" ]; then
            response=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
if 'error' in d:
    print('ERROR:', d['error'].get('message', 'error desconegut'))
else:
    print(d['choices'][0]['message']['content'])
" < "$response_file")
            echo "$response"
        else
            response="ERROR HTTP $http_code — LiteLLM no disponible o model incorrecte."
            echo "$response"
        fi
        rm -f "$response_file"

    else
        response="Obre Claude Code en aquest projecte i executa aquesta tasca.

Prompt preparat:

$full_prompt"
        echo "Model recomanat: $model"
        echo "Claude via LiteLLM no s'usa per defecte."
        echo ""
        echo "Obre Claude Code en aquest projecte i executa aquesta tasca."
        echo ""
        echo "Prompt preparat (també guardat al fitxer de tasca):"
        echo "---"
        echo "$full_prompt"
        echo "---"
    fi

    # Guardar fitxer de tasca
    local title
    title=$(echo "$task_desc" | cut -c1-60)

    local response=""

    if [[ "$model" == deepseek-* ]]; then
        local deepseek_key="${DEEPSEEK_API_KEY:-}"
        if [ -z "$deepseek_key" ] || [ "$deepseek_key" = '""' ] || [ "$deepseek_key" = "''" ]; then
            echo "ERROR: DEEPSEEK_API_KEY no configurada. Executa: platform config"
            exit 1
        fi

        local litellm_host="${LITELLM_HOST:-127.0.0.1}"
        local litellm_port="${LITELLM_PORT:-4000}"
        local litellm_key="${LITELLM_MASTER_KEY:-sk-local-platform}"
        local base_url="http://${litellm_host}:${litellm_port}"

        echo "Consultant $model via LiteLLM..."
        echo ""

        local response_file
        response_file=$(mktemp)
        local prompt_json
        prompt_json=$(python3 -c "import json,sys; print(json.dumps(sys.stdin.read()))" <<< "$full_prompt")
        local http_code
        http_code=$(curl -s -o "$response_file" -w "%{http_code}" \
            -X POST "$base_url/v1/chat/completions" \
            -H "Authorization: Bearer $litellm_key" \
            -H "Content-Type: application/json" \
            -d "{\"model\":\"$model\",\"messages\":[{\"role\":\"user\",\"content\":$prompt_json}],\"max_tokens\":4096}" \
            2>/dev/null || echo "000")

        if [ "$http_code" = "200" ]; then
            response=$(python3 -c "
import json, sys
d = json.load(sys.stdin)
if 'error' in d:
    print('ERROR:', d['error'].get('message', 'error desconegut'))
else:
    print(d['choices'][0]['message']['content'])
" < "$response_file")
            echo "$response"
        else
            response="ERROR HTTP $http_code — LiteLLM no disponible o model incorrecte."
            echo "$response"
        fi
        rm -f "$response_file"

    else
        # Claude → instrucció manual
        response="Obre Claude Code en aquest projecte i executa aquesta tasca.

Prompt preparat:

$full_prompt"
        echo "Model recomanat: $model"
        echo "Claude via LiteLLM no s'usa per defecte."
        echo ""
        echo "Obre Claude Code en aquest projecte i executa aquesta tasca."
        echo ""
        echo "Prompt preparat (també guardat al fitxer de tasca):"
        echo "---"
        echo "$full_prompt"
        echo "---"
    fi

    # Guardar fitxer de tasca
    local title
    title=$(echo "$task_desc" | cut -c1-60)

    cat > "$task_file" <<TASKEOF
# Tasca: $title

Data: $(date '+%Y-%m-%d %H:%M:%S')
Projecte: $project_name
Model recomanat: $model
Categoria: $category

## Prompt

$task_desc

## Context usat

- Stack: ${stack:-no disponible}
- Skills actives: ${skills:-cap}
- Estat actual: ${estat:-no disponible}

## Resposta del model

$response

## Estat

Implementat: no
Verificat: no
Completat: no

## Notes

-
TASKEOF

    echo ""
    echo "Tasca guardada: $task_file"
    echo ""
}

# ============================================================
# Sistema i models
# ============================================================

cmd_config() {
    local env_file="$PLATFORM_CONFIG_DIR/.env"

    if [ ! -f "$env_file" ]; then
        echo "Creant ~/.platform/.env des de la plantilla..."
        mkdir -p "$PLATFORM_CONFIG_DIR"
        cp "$PLATFORM_DIR/.env.example" "$env_file"
        echo "Fitxer creat: $env_file"
    fi

    echo ""
    echo "=== CONFIGURACIÓ ==="
    echo ""
    echo "Fitxer: $env_file"
    echo ""

    local missing=false

    check_key() {
        local key="$1"
        local desc="$2"
        local val
        val=$(grep -E "^${key}=" "$env_file" 2>/dev/null | cut -d= -f2- || echo "")

        if [ -z "$val" ] || [ "$val" = '""' ] || [ "$val" = "''" ]; then
            echo "  [✗] $desc — PENDENT"
            missing=true
        else
            local masked
            if [ ${#val} -gt 8 ]; then
                masked="${val:0:4}...${val: -4}"
            else
                masked="****"
            fi
            echo "  [✓] $desc — $masked"
        fi
    }

    check_key_optional() {
        local key="$1"
        local desc="$2"
        local hint="$3"
        local val
        val=$(grep -E "^${key}=" "$env_file" 2>/dev/null | cut -d= -f2- || echo "")

        if [ -z "$val" ] || [ "$val" = '""' ] || [ "$val" = "''" ]; then
            echo "  [!] $desc — opcional ($hint)"
        else
            local masked
            if [ ${#val} -gt 8 ]; then
                masked="${val:0:4}...${val: -4}"
            else
                masked="****"
            fi
            echo "  [✓] $desc — $masked"
        fi
    }

    check_key_optional "ANTHROPIC_API_KEY" "Anthropic API Key" "només cal si uses Claude via LiteLLM; Claude Code usa login de compte"
    check_key "DEEPSEEK_API_KEY"   "DeepSeek API Key"
    check_key "LITELLM_MASTER_KEY" "LiteLLM Master Key"
    check_key "LITELLM_HOST"       "LiteLLM Host"
    check_key "LITELLM_PORT"       "LiteLLM Port"
    check_key "PROJECTS_DIR"       "Directori de projectes"
    check_key "PLATFORM_DIR"       "Directori de la plataforma"

    echo ""
    if [ "$missing" = true ]; then
        echo "Claus pendents. Edita el fitxer:"
        echo "  $env_file"
        echo ""
        echo "O executa: nano $env_file"
    else
        echo "Totes les claus configurades."
    fi
    echo ""
}

cmd_doctor() {
    echo ""
    echo "================================================"
    echo "  DOCTOR"
    echo "================================================"
    echo ""

    local ok=true
    local warn=false

    check_ok() {
        echo "  [✓] $1"
    }

    check_warn() {
        echo "  [!] $1"
        warn=true
    }

    check_fail() {
        echo "  [✗] $1"
        ok=false
    }

    # Platform instal·lat
    if [ -L "$HOME/.local/bin/platform" ] || [ -f "$HOME/.local/bin/platform" ]; then
        check_ok "platform al PATH (~/.local/bin/platform)"
    else
        check_warn "platform no enllaçat a ~/.local/bin/platform"
    fi

    # PATH
    if echo "$PATH" | grep -q "$HOME/.local/bin"; then
        check_ok "~/.local/bin al PATH"
    else
        check_warn "~/.local/bin no és al PATH"
    fi

    # PROJECTS_DIR
    if [ -d "$PROJECTS_DIR" ]; then
        check_ok "PROJECTS_DIR: $PROJECTS_DIR"
    else
        check_warn "PROJECTS_DIR no existeix: $PROJECTS_DIR"
    fi

    # Claude Code
    if command -v claude &> /dev/null; then
        check_ok "Claude Code instal·lat (usa login de compte Claude)"
    else
        check_warn "Claude Code no instal·lat. Instal·la'l amb: npm install -g @anthropic-ai/claude-code"
    fi

    # Docker
    if command -v docker &> /dev/null; then
        if docker info &> /dev/null 2>&1; then
            check_ok "Docker funciona"
        else
            check_warn "Docker instal·lat però no respon (potser necessites permisos)"
        fi
    else
        check_warn "Docker no instal·lat"
    fi

    # Docker Compose
    if docker compose version &> /dev/null 2>&1 || command -v docker-compose &> /dev/null; then
        check_ok "Docker Compose disponible"
    else
        check_warn "Docker Compose no disponible"
    fi

    # LiteLLM config
    if [ -f "$PLATFORM_CONFIG_DIR/.env" ]; then
        check_ok "~/.platform/.env existeix"
    else
        check_warn "~/.platform/.env no existeix. Executa: platform config"
    fi

    if [ -f "$PLATFORM_DIR/litellm/config.yaml" ]; then
        check_ok "LiteLLM config.yaml existeix"
    else
        check_fail "LiteLLM config.yaml no existeix"
    fi

    # LiteLLM reachable + models DeepSeek
    local litellm_host="${LITELLM_HOST:-127.0.0.1}"
    local litellm_port="${LITELLM_PORT:-4000}"
    local litellm_key="${LITELLM_MASTER_KEY:-sk-local-platform}"
    local base_url="http://${litellm_host}:${litellm_port}"
    local lm_reachable=false
    local http_health
    http_health=$(curl -s -o /dev/null -w "%{http_code}" \
        --max-time 3 "$base_url/health" 2>/dev/null || echo "000")
    if [ "$http_health" = "200" ] || [ "$http_health" = "307" ] || [ "$http_health" = "401" ]; then
        check_ok "LiteLLM accessible a $base_url"
        lm_reachable=true
    else
        check_warn "LiteLLM no accessible a $base_url (HTTP $http_health). Arrenca'l: platform models start"
    fi

    if [ "$lm_reachable" = true ]; then
        for ds_model in deepseek-v4-pro deepseek-v4-flash; do
            local rf
            rf=$(mktemp)
            local hc
            hc=$(curl -s -o "$rf" -w "%{http_code}" --max-time 10 \
                -X POST "$base_url/v1/chat/completions" \
                -H "Authorization: Bearer $litellm_key" \
                -H "Content-Type: application/json" \
                -d "{\"model\":\"$ds_model\",\"messages\":[{\"role\":\"user\",\"content\":\"ping\"}],\"max_tokens\":10}" \
                2>/dev/null || echo "000")
            if [ "$hc" = "200" ] && ! grep -q '"error"' "$rf" 2>/dev/null; then
                check_ok "$ds_model operatiu"
            else
                check_warn "$ds_model no respon correctament (HTTP $hc)"
            fi
            rm -f "$rf"
        done
    fi

    # API keys
    local platform_env="$PLATFORM_CONFIG_DIR/.env"
    if [ -f "$platform_env" ]; then
        local deepseek_key
        deepseek_key=$(grep -E '^DEEPSEEK_API_KEY=' "$platform_env" 2>/dev/null | cut -d= -f2- || echo "")
        if [ -n "$deepseek_key" ] && [ "$deepseek_key" != '""' ] && [ "$deepseek_key" != "''" ]; then
            check_ok "DEEPSEEK_API_KEY configurada (DeepSeek V4 Pro/Flash)"
        else
            check_warn "DEEPSEEK_API_KEY pendent — necessària per DeepSeek"
        fi

        local anthropic_key
        anthropic_key=$(grep -E '^ANTHROPIC_API_KEY=' "$platform_env" 2>/dev/null | cut -d= -f2- || echo "")
        if [ -n "$anthropic_key" ] && [ "$anthropic_key" != '""' ] && [ "$anthropic_key" != "''" ]; then
            check_ok "ANTHROPIC_API_KEY configurada (Claude via API)"
        else
            check_ok "ANTHROPIC_API_KEY opcional si uses Claude Code amb login"
        fi
    else
        check_warn "~/.platform/.env no existeix. Executa: platform config"
    fi

    # gh
    if command -v gh &> /dev/null; then
        if gh auth status &> /dev/null 2>&1; then
            check_ok "GitHub CLI autenticat"
        else
            check_warn "GitHub CLI instal·lat però no autenticat. Executa: gh auth login"
        fi
    else
        check_warn "GitHub CLI no instal·lat"
    fi

    echo ""
    if [ "$ok" = true ] && [ "$warn" = false ]; then
        echo "Tot correcte."
    elif [ "$ok" = true ]; then
        echo "Algunes comprovacions opcionals pendents (marcades amb [!])."
    else
        echo "Hi ha errors que cal resoldre (marcats amb [✗])."
    fi
    echo ""
}

cmd_models() {
    local action="${1:-}"
    local litellm_dir="$PLATFORM_DIR/litellm"
    local compose_file="$litellm_dir/docker-compose.yml"
    local container_name="platform-litellm"

    if [ ! -f "$compose_file" ]; then
        echo "ERROR: No es troba $compose_file"
        exit 1
    fi

    case "$action" in
        start)
            echo "Arrencant LiteLLM..."
            cd "$litellm_dir"
            docker compose up -d
            echo ""
            echo "LiteLLM arrencat a http://${LITELLM_HOST:-127.0.0.1}:${LITELLM_PORT:-4000}"
            echo "Comprova amb: platform models status"
            ;;
        stop)
            echo "Aturant LiteLLM..."
            cd "$litellm_dir"
            docker compose down
            echo "LiteLLM aturat."
            ;;
        status)
            if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${container_name}$"; then
                echo "LiteLLM actiu a http://${LITELLM_HOST:-127.0.0.1}:${LITELLM_PORT:-4000}"
                echo ""
                docker ps --filter "name=${container_name}" --format "  ID: {{.ID}} | Estat: {{.Status}} | Ports: {{.Ports}}"
            else
                echo "LiteLLM no està actiu."
                echo "Arrenca'l amb: platform models start"
            fi
            ;;
        test)
            echo ""
            echo "===================================="
            echo "  Model Connectivity Test"
            echo "===================================="
            echo ""

            local litellm_host="${LITELLM_HOST:-127.0.0.1}"
            local litellm_port="${LITELLM_PORT:-4000}"
            local litellm_key="${LITELLM_MASTER_KEY:-sk-local-platform}"
            local base_url="http://${litellm_host}:${litellm_port}"
            local errors=0
            local skipped=0
            local ok=0

            test_model() {
                local model="$1"
                local label="$2"

                # Comprovar si la clau API necessària existeix
                local env_key
                local key_name
                case "$model" in
                    claude-sonnet|claude-haiku)
                        env_key="${ANTHROPIC_API_KEY:-}"
                        key_name="ANTHROPIC_API_KEY"
                        ;;
                    deepseek-v4-flash|deepseek-v4-pro)
                        env_key="${DEEPSEEK_API_KEY:-}"
                        key_name="DEEPSEEK_API_KEY"
                        ;;
                esac

                if [ -z "$env_key" ] || [ "$env_key" = '""' ] || [ "$env_key" = "''" ]; then
                    # Claude sense API key és opcional (Mode A: Claude Code amb login)
                    if [ "$key_name" = "ANTHROPIC_API_KEY" ]; then
                        printf "  %-20s SKIPPED %s no configurada (usa Claude Code amb login)\n" "$label" "$key_name"
                        skipped=$((skipped + 1))
                    else
                        printf "  %-20s ERROR   %s no configurada\n" "$label" "$key_name"
                        errors=$((errors + 1))
                    fi
                    return
                fi

                # Test de connexió real a LiteLLM
                local response_file
                response_file=$(mktemp)
                local http_code
                http_code=$(curl -s -o "$response_file" -w "%{http_code}" \
                    -X POST "$base_url/v1/chat/completions" \
                    -H "Authorization: Bearer $litellm_key" \
                    -H "Content-Type: application/json" \
                    -d "{\"model\":\"$model\",\"messages\":[{\"role\":\"user\",\"content\":\"ping\"}],\"max_tokens\":100}" \
                    2>/dev/null || echo "000")

                if [ "$http_code" = "200" ]; then
                    # Verificar que la resposta és JSON vàlid sense error
                    if grep -q '"error"' "$response_file" 2>/dev/null; then
                        local err_msg
                        err_msg=$(grep -o '"message":"[^"]*"' "$response_file" 2>/dev/null | head -1 | cut -d'"' -f4 || echo "error desconegut")
                        printf "  %-20s ERROR   %s\n" "$label" "$err_msg"
                        errors=$((errors + 1))
                    else
                        printf "  %-20s OK\n" "$label"
                        ok=$((ok + 1))
                    fi
                else
                    printf "  %-20s ERROR   HTTP %s\n" "$label" "$http_code"
                    errors=$((errors + 1))
                fi
                rm -f "$response_file"
            }

            test_model "deepseek-v4-pro"     "deepseek-v4-pro"
            test_model "deepseek-v4-flash"   "deepseek-v4-flash"
            test_model "claude-haiku"       "claude-haiku"
            test_model "claude-sonnet"      "claude-sonnet"

            echo ""
            local total=$((ok + errors + skipped))
            if [ "$errors" -eq 0 ] && [ "$skipped" -eq 0 ]; then
                echo "Resultat: Tots els models operatius ($total/$total)"
            elif [ "$errors" -eq 0 ]; then
                echo "Resultat: $ok OK, $skipped omesos (opcionals) — tot correcte"
            else
                echo "Resultat: $ok OK, $errors error(s), $skipped omesos"
            fi
            echo ""
            ;;
        logs)
            echo "Mostrant logs de LiteLLM (Ctrl+C per sortir)..."
            cd "$litellm_dir"
            docker compose logs -f --tail=50 2>/dev/null || echo "No s'han pogut recuperar els logs. LiteLLM està actiu?"
            ;;
        *)
            echo "Ús: platform models <start|stop|status|test|logs>"
            echo ""
            echo "  start   Arrencar LiteLLM"
            echo "  stop    Aturar LiteLLM"
            echo "  status  Estat de LiteLLM"
            echo "  test    Test de connexió als models"
            echo "  logs    Logs de LiteLLM"
            ;;
    esac
}

# ============================================================
# Instal·lació del perfil global Claude
# ============================================================

cmd_install_claude_profile() {
    local global_template="$PLATFORM_DIR/templates/global-claude/CLAUDE.md"
    local target="$HOME/.claude/CLAUDE.md"

    echo ""
    echo "=== Instal·lant perfil global Claude ==="
    echo ""

    if [ ! -f "$global_template" ]; then
        echo "ERROR: Plantilla global no trobada a $global_template"
        exit 1
    fi

    # Backup si ja existeix
    if [ -f "$target" ]; then
        local backup_ts
        backup_ts=$(date +%Y%m%d-%H%M%S)
        cp "$target" "$HOME/.claude/CLAUDE.md.bak-$backup_ts"
        echo "Backup creat: ~/.claude/CLAUDE.md.bak-$backup_ts"
    fi

    cp "$global_template" "$target"
    echo "Perfil global instal·lat: ~/.claude/CLAUDE.md"
    echo ""
    echo "Aquest perfil s'aplica a TOTS els projectes."
    echo "Inclou: política de models, ús obligatori de Platform MCP, airlock, task completion."
    echo ""
}

# ============================================================
# Registre del MCP a Claude Code
# ============================================================

cmd_mcp_install() {
    local mcp_server="$PLATFORM_DIR/mcp-server/index.js"

    echo ""
    echo "=== Registrant Platform MCP a Claude Code ==="
    echo ""

    if [ ! -f "$mcp_server" ]; then
        echo "ERROR: MCP server no trobat a $mcp_server"
        exit 1
    fi

    # Verificar que claude està instal·lat
    if ! command -v claude &> /dev/null; then
        echo "ERROR: Claude Code no instal·lat."
        echo "  Instal·la'l: npm install -g @anthropic-ai/claude-code"
        exit 1
    fi

    echo "Executant: claude mcp add platform --scope user -- node $mcp_server"
    echo ""

    if claude mcp add platform --scope user -- node "$mcp_server" 2>&1; then
        echo ""
        echo "=== Platform MCP registrat correctament ==="
        echo ""
        echo "Verifica amb: claude mcp list"
        echo ""
        echo "Tools disponibles:"
        echo "  platform_current_project     Detecta projecte actual"
        echo "  platform_resume_project      Estat complet del projecte"
        echo "  platform_route_task          Classificar tasca"
        echo "  platform_ask_model           Enviar prompt a LiteLLM"
        echo "  platform_create_task         Crear tasca: classificar + executar + guardar"
        echo "  platform_save_task           Guardar tasca manualment"
        echo "  platform_list_projects       Llistar projectes"
        echo "  platform_list_domain_skills  Skills disponibles"
        echo "  platform_activate_skill      Activar skill (airlock)"
        echo "  platform_check_completion    Verificar DoD"
        echo ""
    else
        echo "ERROR: No s'ha pogut registrar el MCP."
        echo "Prova manualment: claude mcp add platform -- node $mcp_server"
        exit 1
    fi
}

# ============================================================
# Punt d'entrada
# ============================================================

if [ $# -eq 0 ]; then
    show_menu
    read -p "  Tria una opció (1-16): " choice
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
            cmd_config
            ;;
        11)
            cmd_doctor
            ;;
        12)
            echo "  Accions: start | stop | status | test | logs"
            read -p "  Acció: " maction
            cmd_models "$maction"
            ;;
        13)
            read -p "  Descripció de la tasca: " tdesc
            cmd_route "$tdesc"
            ;;
        14)
            echo "  Models: deepseek-v4-pro, deepseek-v4-flash, claude-sonnet, claude-haiku"
            read -p "  Model: " mname
            read -p "  Prompt: " mprompt
            cmd_ask "$mname" "$mprompt"
            ;;
        15)
            read -p "  Nom del projecte: " pname
            read -p "  Descripció de la tasca: " tdesc
            cmd_task "$pname" "$tdesc"
            ;;
        16)
            cmd_install_claude_profile
            ;;
        17)
            cmd_mcp_install
            ;;
        18)
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
            if [ $# -lt 1 ]; then echo "Ús: platform new <nom>"; exit 1; fi
            cmd_new "$1"
            ;;
        import)
            shift
            if [ $# -lt 1 ]; then echo "Ús: platform import <nom>"; exit 1; fi
            cmd_import "$1"
            ;;
        open)
            shift
            if [ $# -lt 1 ]; then echo "Ús: platform open <projecte>  (alias de resume)"; exit 1; fi
            cmd_open "$1"
            ;;
        status)
            shift
            if [ $# -lt 1 ]; then echo "Ús: platform status <nom>"; exit 1; fi
            cmd_status "$1"
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
        config)
            cmd_config
            ;;
        doctor)
            cmd_doctor
            ;;
        models)
            shift
            cmd_models "${1:-}"
            ;;
        route)
            shift
            cmd_route "$@"
            ;;
        ask)
            shift
            if [ $# -lt 2 ]; then echo "Ús: platform ask <model> \"<prompt>\""; exit 1; fi
            cmd_ask "$@"
            ;;
        task)
            shift
            if [ $# -lt 2 ]; then echo "Ús: platform task <projecte> \"<descripció>\""; exit 1; fi
            cmd_task "$@"
            ;;
        install-claude-profile)
            cmd_install_claude_profile
            ;;
        mcp-install)
            cmd_mcp_install
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
