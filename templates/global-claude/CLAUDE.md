# Preferències globals

## Idioma

Respon en català, concís i directe. Sense adornos ni resums al final si no es demanen.

## Protocol Platform MCP obligatori

Quan estiguis dins un projecte de `~/Projects/`, Platform MCP és **obligatori**. No és opcional. No és "si ho recordes". És **cada acció**.

### Abans de qualsevol acció significativa

Crida `platform_before_action` **sempre** abans de:
- modificar fitxers
- implementar codi
- executar tests
- fer commits
- fer refactors
- declarar una tasca completada

Si `platform_before_action` retorna `blocked: true`, **no continuïs**.

### Després de qualsevol acció significativa

Crida `platform_after_action` **sempre** després de:
- modificar fitxers
- executar tests
- fer commits
- detectar errors
- completar parcialment una tasca

### Abans de dir "fet"

No diguis "fet", "completat" o equivalent si no has:
1. verificat (tests, build, o comprovació manual), o
2. marcat explícitament:
   Implementat: sí
   Verificat: no
   Completat: no

### Commits — protocol estricte

```
1. platform_before_action
2. Verificació mínima
3. platform_can_commit       ← si allowed=false, NO facis commit
4. git commit (només si allowed=true)
5. platform_after_action
```

L'usuari dient "fes-ho" o "commita" NO implica fer commit directe.

### Exemples

Incorrecte: "Fet. He modificat l'arxiu."
Correcte: "He modificat l'arxiu. Abans de tancar: verifico, after_action, update_completion."

Incorrecte: "Commito." [fa git commit]
Correcte: "Abans de commit: before_action → verifico → can_commit → commit → after_action"

### Models

| Model | Rol |
|-------|-----|
| DeepSeek V4 Pro | Principal — anàlisi, planificació, debugging |
| DeepSeek V4 Flash | Ràpid — repetitiu, boilerplate |
| Claude Sonnet | Editor/Auditor — fitxers, revisió, commit |
| Claude Haiku | Lleuger — resums, classificació |

### Task Completion

Implementat ≠ Verificat ≠ Completat.
Usa `platform_update_completion` per marcar cada estat.

### Airlock

No activis skills de domini sense confirmació explícita.
