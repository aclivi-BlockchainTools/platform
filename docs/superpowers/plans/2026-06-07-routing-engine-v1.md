# Routing Engine v1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Afegir `platform route`, `platform ask` i `platform task` perquè DeepSeek V4 Pro sigui el model principal operatiu, no només documentat.

**Architecture:** Una funció de classificació per keyword (`classify_task`) dins `platform.sh` decideix el model. `cmd_route` el mostra. `cmd_ask` fa la crida curl a LiteLLM. `cmd_task` combina classificació + crida + persistència a `docs/tasks/` del projecte.

**Tech Stack:** Bash, curl, python3 (parse JSON), LiteLLM `/v1/chat/completions`

---

## File Structure

| Fitxer | Acció | Responsabilitat |
|--------|-------|-----------------|
| `scripts/platform.sh` | Modificar | Afegir `classify_task`, `cmd_route`, `cmd_ask`, `cmd_task`; actualitzar `cmd_resume`, `cmd_doctor`, menú i dispatch |
| `README.md` | Modificar | Afegir secció "Routing Engine v1" |

Tot el codi nou va a `platform.sh` — consistent amb el patró existent. No s'afegeix cap fitxer de script nou.

---

## Task 1: Funció `classify_task` (nucli del routing)

**Files:**
- Modify: `scripts/platform.sh` — afegir funció just abans de `cmd_config` (~línia 429)

La funció rep la descripció de la tasca i assigna 4 variables globals:
`ROUTE_CATEGORY`, `ROUTE_MODEL`, `ROUTE_REASON`, `ROUTE_ALTERNATIVE`.

Ordre d'avaluació: overrides explícits → claude-haiku → claude-sonnet → deepseek-v4-flash → deepseek-v4-pro (default).

- [ ] **Step 1: Definir el bloc de codi a inserir**

Inserir just abans de la línia `cmd_config() {` a `scripts/platform.sh`:

```bash
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

    # DeepSeek V4 Pro: tot the rest (implementació, debugging, arquitectura, CRUD, APIs...)
    ROUTE_CATEGORY="implementació"
    ROUTE_MODEL="deepseek-v4-pro"
    ROUTE_REASON="Implementació principal de software."
    ROUTE_ALTERNATIVE="deepseek-v4-flash si la tasca és purament repetitiva o boilerplate."
}
```

- [ ] **Step 2: Inserir el bloc a platform.sh**

Localitzar la línia `cmd_config() {` i inserir el bloc JUST ABANS (deixar una línia en blanc de separació).

- [ ] **Step 3: Verificar que el fitxer és sintàcticament vàlid**

```bash
bash -n scripts/platform.sh && echo "OK"
```

Esperat: `OK` sense errors.

- [ ] **Step 4: Commit**

```bash
git add scripts/platform.sh
git commit -m "feat(routing): afegir funció classify_task — nucli del Routing Engine v1"
```

---

## Task 2: Subcomanda `platform route`

**Files:**
- Modify: `scripts/platform.sh` — afegir `cmd_route`, registrar al dispatch i al menú

- [ ] **Step 1: Afegir funció `cmd_route` just després de `classify_task`**

```bash
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
```

- [ ] **Step 2: Registrar al dispatch (bloc `case "$1" in` al final de platform.sh)**

Afegir just abans de `help|--help|-h)`:

```bash
        route)
            shift
            cmd_route "$@"
            ;;
        ask)
            shift
            cmd_ask "$@"
            ;;
        task)
            shift
            if [ $# -lt 2 ]; then echo "Ús: platform task <projecte> \"<descripció>\""; exit 1; fi
            cmd_task "$@"
            ;;
```

(ask i task es registren aquí conjuntament per evitar tornar-hi en tasques posteriors)

- [ ] **Step 3: Afegir al menú `show_menu`**

Afegir a la llista del menú:

```bash
    echo " 14. Routing                platform route \"<tasca>\""
    echo " 15. Ask model              platform ask <model> \"<prompt>\""
    echo " 16. Task projecte          platform task <projecte> \"<tasca>\""
```

I al bloc `case "$choice" in` del menú interactiu:

```bash
        14)
            read -p "  Descripció de la tasca: " tdesc
            cmd_route "$tdesc"
            ;;
        15)
            echo "  Models: deepseek-v4-pro, deepseek-v4-flash, claude-sonnet, claude-haiku"
            read -p "  Model: " mname
            read -p "  Prompt: " mprompt
            cmd_ask "$mname" "$mprompt"
            ;;
        16)
            read -p "  Nom del projecte: " pname
            read -p "  Descripció de la tasca: " tdesc
            cmd_task "$pname" "$tdesc"
            ;;
```

- [ ] **Step 4: Verificar sintaxi**

```bash
bash -n scripts/platform.sh && echo "OK"
```

- [ ] **Step 5: Provar**

```bash
./scripts/platform.sh route "crear CRUD de clients amb React i Express"
```

Esperat:
```
Tasca:
  crear CRUD de clients amb React i Express

Categoria:
  implementació

Model recomanat:
  deepseek-v4-pro

Motiu:
  Implementació principal de software.

Alternativa:
  deepseek-v4-flash si la tasca és purament repetitiva o boilerplate.
```

```bash
./scripts/platform.sh route "revisar seguretat de l'API"
```

Esperat: `Model recomanat: claude-sonnet`

```bash
./scripts/platform.sh route "usa flash per generar fitxers de tipus"
```

Esperat: `Model recomanat: deepseek-v4-flash`

- [ ] **Step 6: Commit**

```bash
git add scripts/platform.sh
git commit -m "feat(routing): afegir subcomanda platform route"
```

---

## Task 3: Subcomanda `platform ask`

**Files:**
- Modify: `scripts/platform.sh` — afegir `cmd_ask`

Crida curl a LiteLLM i mostra la resposta. Usa python3 per parsejar JSON (ja usat al codi base).

- [ ] **Step 1: Afegir funció `cmd_ask` just després de `cmd_route`**

```bash
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

    # Validar model
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

    # Claude sense API key → instrucció
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
    local http_code
    http_code=$(curl -s -o "$response_file" -w "%{http_code}" \
        -X POST "$base_url/v1/chat/completions" \
        -H "Authorization: Bearer $litellm_key" \
        -H "Content-Type: application/json" \
        -d "{\"model\":\"$model\",\"messages\":[{\"role\":\"user\",\"content\":$(python3 -c \"import json,sys; print(json.dumps(sys.stdin.read()))\" <<< \"$prompt\")}],\"max_tokens\":4096}" \
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
```

- [ ] **Step 2: Verificar sintaxi**

```bash
bash -n scripts/platform.sh && echo "OK"
```

- [ ] **Step 3: Provar (LiteLLM ha d'estar actiu)**

```bash
./scripts/platform.sh ask deepseek-v4-pro "Diga'm 'hola' en una paraula"
```

Esperat: resposta breu de DeepSeek o error HTTP si LiteLLM no està actiu.

```bash
./scripts/platform.sh ask claude-sonnet "test" 2>/dev/null
```

Esperat (si no hi ha ANTHROPIC_API_KEY): `Claude via LiteLLM no configurat. Usa Claude Code amb login o configura ANTHROPIC_API_KEY.`

```bash
./scripts/platform.sh ask model-inexistent "test"
```

Esperat: `Model no reconegut: model-inexistent`

- [ ] **Step 4: Commit**

```bash
git add scripts/platform.sh
git commit -m "feat(routing): afegir subcomanda platform ask"
```

---

## Task 4: Subcomanda `platform task`

**Files:**
- Modify: `scripts/platform.sh` — afegir `cmd_task`

Combina classificació + crida LiteLLM + persistència a `$PROJECT_DIR/docs/tasks/`.

- [ ] **Step 1: Afegir funció `cmd_task` just després de `cmd_ask`**

```bash
cmd_task() {
    local project_name="$1"
    shift
    local task_desc="$*"

    local project_dir="$PROJECTS_DIR/$project_name"
    if [ ! -d "$project_dir" ]; then
        echo "ERROR: El projecte '$project_name' no existeix a $PROJECTS_DIR/"
        exit 1
    fi

    local claude_md="$project_dir/.claude/CLAUDE.md"

    # Classificar tasca
    classify_task "$task_desc"
    local model="$ROUTE_MODEL"
    local category="$ROUTE_CATEGORY"
    local reason="$ROUTE_REASON"

    echo ""
    echo "Projecte: $project_name"
    echo "Tasca:    $task_desc"
    echo "Model:    $model ($category)"
    echo ""

    # Extreure context del projecte
    local stack=""
    local skills=""
    local estat=""

    if [ -f "$claude_md" ]; then
        if grep -q "AUTO-GENERATED-STACK-START" "$claude_md" 2>/dev/null; then
            stack=$(sed -n '/AUTO-GENERATED-STACK-START/,/AUTO-GENERATED-STACK-END/p' "$claude_md" \
                | grep '^- ' | sed 's/^- //' | tr '\n' ',' | sed 's/,$//')
        fi
        estat=$(sed -n '/## Estat actual/,/^## /p' "$claude_md" 2>/dev/null \
            | grep -v '^## ' | grep -v '^<!--' | grep -v '^$' | head -3 \
            | tr '\n' ' ' | sed 's/^[[:space:]]*//')
    fi

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

    # Preparar slug i fitxer de tasca
    local timestamp
    timestamp=$(date '+%Y-%m-%d-%H%M%S')
    local slug
    slug=$(echo "$task_desc" | tr '[:upper:]' '[:lower:]' \
        | sed 's/[^a-z0-9]/-/g; s/-\+/-/g' | cut -c1-40 | sed 's/-$//')
    local tasks_dir="$project_dir/docs/tasks"
    mkdir -p "$tasks_dir"
    local task_file="$tasks_dir/${timestamp}-${slug}.md"

    # Construir prompt amb context
    local full_prompt
    full_prompt="Projecte: $project_name"
    [ -n "$stack" ]  && full_prompt="${full_prompt}
Stack: $stack"
    [ -n "$skills" ] && full_prompt="${full_prompt}
Skills actives: $skills"
    [ -n "$estat" ]  && full_prompt="${full_prompt}
Estat actual: $estat"
    full_prompt="${full_prompt}

Tasca: $task_desc"

    local response=""

    if [[ "$model" == deepseek-* ]]; then
        # Verificar clau DeepSeek
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
        local http_code
        local prompt_json
        prompt_json=$(python3 -c "import json,sys; print(json.dumps(sys.stdin.read()))" <<< "$full_prompt")
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
```

- [ ] **Step 2: Verificar sintaxi**

```bash
bash -n scripts/platform.sh && echo "OK"
```

- [ ] **Step 3: Commit**

```bash
git add scripts/platform.sh
git commit -m "feat(routing): afegir subcomanda platform task"
```

---

## Task 5: Actualitzar `cmd_resume` — mostrar última tasca

**Files:**
- Modify: `scripts/platform.sh` — bloc `cmd_resume` (~línia 93)

La secció "Pròxim pas" existeix. Afegir "Última tasca" just abans de "Criteri de completitud".

- [ ] **Step 1: Localitzar el punt d'inserció**

A `cmd_resume`, localitzar el bloc:

```bash
    # --- Criteri de completitud ---
    echo "Criteri de completitud:"
```

Inserir just ABANS d'aquest bloc:

```bash
    # --- Última tasca ---
    echo "Última tasca:"
    local tasks_dir="$project_dir/docs/tasks"
    if [ -d "$tasks_dir" ] && [ -n "$(ls -A "$tasks_dir"/*.md 2>/dev/null)" ]; then
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
            echo "  $task_title"
            echo "  Data: $task_date"
            echo "  Implementat: ${task_impl:-?} | Verificat: ${task_verif:-?} | Completat: ${task_comp:-?}"
        fi
    else
        echo "  Cap"
    fi
    echo ""

```

- [ ] **Step 2: Verificar sintaxi**

```bash
bash -n scripts/platform.sh && echo "OK"
```

- [ ] **Step 3: Provar (si hi ha projectes a PROJECTS_DIR)**

```bash
./scripts/platform.sh resume <nom-projecte-existent>
```

Esperat: mostra "Última tasca: Cap" si no hi ha docs/tasks/, o el títol si n'hi ha.

- [ ] **Step 4: Commit**

```bash
git add scripts/platform.sh
git commit -m "feat(routing): platform resume mostra última tasca de docs/tasks/"
```

---

## Task 6: Actualitzar `cmd_doctor` — verificar LiteLLM i models DeepSeek

**Files:**
- Modify: `scripts/platform.sh` — bloc `cmd_doctor` (~línia 488)

Afegir comprovacions just després de la comprovació de `LiteLLM config.yaml`.

- [ ] **Step 1: Localitzar el punt d'inserció**

A `cmd_doctor`, localitzar el bloc final de comprovació de config.yaml:

```bash
    if [ -f "$PLATFORM_DIR/litellm/config.yaml" ]; then
        check_ok "LiteLLM config.yaml existeix"
    else
        check_fail "LiteLLM config.yaml no existeix"
    fi
```

Inserir just DESPRÉS d'aquest bloc:

```bash
    # LiteLLM reachable + models DeepSeek
    local litellm_host="${LITELLM_HOST:-127.0.0.1}"
    local litellm_port="${LITELLM_PORT:-4000}"
    local litellm_key="${LITELLM_MASTER_KEY:-sk-local-platform}"
    local base_url="http://${litellm_host}:${litellm_port}"

    local lm_reachable=false
    local http_health
    http_health=$(curl -s -o /dev/null -w "%{http_code}" \
        --max-time 3 "$base_url/health" 2>/dev/null || echo "000")
    if [ "$http_health" = "200" ] || [ "$http_health" = "307" ]; then
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
```

- [ ] **Step 2: Verificar sintaxi**

```bash
bash -n scripts/platform.sh && echo "OK"
```

- [ ] **Step 3: Provar**

```bash
./scripts/platform.sh doctor
```

Esperat: línies noves `[✓] LiteLLM accessible` i `[✓] deepseek-v4-pro operatiu` (o `[!]` si no està actiu).

- [ ] **Step 4: Commit**

```bash
git add scripts/platform.sh
git commit -m "feat(routing): platform doctor comprova LiteLLM i models DeepSeek"
```

---

## Task 7: Actualitzar README.md

**Files:**
- Modify: `README.md` — afegir secció "Routing Engine v1" just abans de "Skills universals (8)"

- [ ] **Step 1: Inserir la secció al README**

Localitzar la línia `## Skills universals (8)` i inserir just ABANS:

```markdown
## Routing Engine v1

La plataforma pot classificar tasques, triar model i executar consultes via LiteLLM.

### `platform route`

Classifica una tasca i mostra el model recomanat. No executa res.

```bash
platform route "crear CRUD de clients amb React i Express"
```

### `platform ask`

Executa un prompt directament contra un model via LiteLLM.

```bash
platform ask deepseek-v4-pro "Crea un esquema d'API REST per clients"
```

Models acceptats: `deepseek-v4-pro`, `deepseek-v4-flash`, `claude-sonnet`, `claude-haiku`

Si el model és Claude i `ANTHROPIC_API_KEY` no està configurada, mostra instrucció per usar Claude Code amb login.

### `platform task`

Combina classificació + consulta a LiteLLM + persistència. Genera un pla o resposta i el guarda a `docs/tasks/` del projecte.

```bash
platform task demo-crm "Crear CRUD de clients amb frontend i backend"
```

- Si el model és DeepSeek: consulta LiteLLM, inclou context del projecte, guarda resposta a `docs/tasks/`.
- Si el model és Claude: guarda el prompt preparat i mostra instrucció per usar Claude Code.

**Important:** `platform task` NO modifica codi. Genera plans, respostes o prompts de treball.

### Flux recomanat

```
platform task demo-crm "Crear CRUD de clients"
        ↓
DeepSeek V4 Pro genera pla/resposta
        ↓
Claude Code integra o revisa
        ↓
task-completion verifica
```

### DeepSeek V4 Pro com a model principal real

DeepSeek V4 Pro és el model que s'executa via `platform task` per defecte. Claude Code (amb login de compte) s'usa per a integració, revisió i tasques d'alt impacte. Claude via LiteLLM és opcional i requereix `ANTHROPIC_API_KEY`.

```

- [ ] **Step 2: Verificar que el README no té errors de format**

```bash
grep -n "^##" README.md
```

Esperat: veure la nova secció `## Routing Engine v1` a la llista.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: afegir secció Routing Engine v1 al README"
```

---

## Task 8: Test complet end-to-end

Verificació final de tots els components junts.

- [ ] **Step 1: Test `platform route`**

```bash
cd ~/platform

./scripts/platform.sh route "crear CRUD de clients amb React i Express"
# Esperat: deepseek-v4-pro, categoria implementació

./scripts/platform.sh route "revisar la seguretat de l'autenticació"
# Esperat: claude-sonnet, categoria auditoria

./scripts/platform.sh route "resumeix el fitxer CHANGELOG"
# Esperat: claude-haiku, categoria consulta

./scripts/platform.sh route "afegir camp email al formulari"
# Esperat: deepseek-v4-flash o deepseek-v4-pro (boilerplate → flash)

./scripts/platform.sh route "usa flash per generar els tests unitaris"
# Esperat: deepseek-v4-flash (override explícit)
```

- [ ] **Step 2: Test `platform ask`**

```bash
# Model vàlid (necessita LiteLLM actiu)
./scripts/platform.sh ask deepseek-v4-pro "Respon 'ok' en una sola paraula"

# Model Claude sense API key
./scripts/platform.sh ask claude-sonnet "test"
# Esperat: missatge d'instrucció per Claude Code

# Model invàlid
./scripts/platform.sh ask model-xyz "test"
# Esperat: "Model no reconegut: model-xyz"
```

- [ ] **Step 3: Test `platform task` amb projecte inexistent**

```bash
./scripts/platform.sh task projecte-que-no-existeix "fer una cosa"
# Esperat: ERROR: El projecte 'projecte-que-no-existeix' no existeix
```

- [ ] **Step 4: Test `platform task` amb projecte real (si existeix)**

```bash
# Si tens un projecte a ~/Projects/demo-crm:
./scripts/platform.sh task demo-crm "Crear CRUD de clients amb frontend i backend"
# Esperat:
# - Consulta a deepseek-v4-pro via LiteLLM
# - Resposta mostrada per pantalla
# - Fitxer guardat a ~/Projects/demo-crm/docs/tasks/YYYY-MM-DD-HHMMSS-crear-crud-de-clients-amb-.md
```

- [ ] **Step 5: Test `platform doctor`**

```bash
./scripts/platform.sh doctor
# Esperat: noves línies sobre LiteLLM accessible i models DeepSeek
```

- [ ] **Step 6: Test `platform resume` amb tasca existent**

```bash
./scripts/platform.sh resume demo-crm
# Esperat: secció "Última tasca" amb el títol i estat de la tasca guardada
```

- [ ] **Step 7: Push final**

```bash
git push origin main
```

---

## Self-Review

### Cobertura del spec

| Requisit | Task | Cobert |
|----------|------|--------|
| `platform route` | Task 2 | ✓ |
| `platform ask` | Task 3 | ✓ |
| `platform task` | Task 4 | ✓ |
| Format docs/tasks/ | Task 4 | ✓ |
| `platform resume` última tasca | Task 5 | ✓ |
| `platform doctor` LiteLLM + DeepSeek | Task 6 | ✓ |
| README Routing Engine v1 | Task 7 | ✓ |
| Restriccions (no codi auto, no agents) | Totes | ✓ |
| Claude opcional via LiteLLM | Task 3, 4 | ✓ |
| Regles routing (overrides explícits) | Task 1 | ✓ |

### Placeholders

Cap. Tot el codi és complet i executables.

### Consistència de tipus

- `classify_task` assigna `ROUTE_MODEL`, `ROUTE_CATEGORY`, `ROUTE_REASON`, `ROUTE_ALTERNATIVE` — usats a `cmd_route` i `cmd_task` ✓
- `cmd_ask` i `cmd_task` usen el mateix patró curl + python3 ✓
- Format fitxer tasca consistents amb el spec ✓
