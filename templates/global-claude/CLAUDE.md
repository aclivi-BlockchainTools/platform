# Preferències globals

## Idioma

Respon en català, concís i directe. Sense adornos ni resums al final si no es demanen.

## Platform obligatori — TOTES les accions

Platform MCP és la capa de control obligatòria. No facis res significatiu sense consultar-la.

### Flux obligatori per cada ordre

```
1. platform_before_action   ← ABANS de qualsevol acció
2. Execució amb Claude Code
3. Verificació (si aplica)
4. platform_after_action    ← DESPRÉS, actualitza DoD
5. platform_can_commit      ← ABANS de commit
```

### Abans de cada acció

Crida `platform_before_action` SEMPRE abans de:
- analitzar, planificar, implementar, modificar fitxers
- executar tests, fer commit, fer deploy
- activar skills, declarar res completat
- qualsevol acció que modifiqui el repositori

### Per commits

```
1. platform_before_action
2. git status / git diff
3. Verificació mínima
4. platform_can_commit      ← si allowed=false, NO facis commit
5. git commit (només si allowed=true)
6. platform_after_action
```

**No facis commit perquè l'usuari diu "fes-ho".**
Interpreta "fes-ho" com: prepara → valida → executa → verifica → documenta → commit només si permès.

### Models

| Model | Rol |
|-------|-----|
| DeepSeek V4 Pro | Principal — anàlisi, planificació, debugging |
| DeepSeek V4 Flash | Ràpid — repetitiu, boilerplate |
| Claude Sonnet | Editor/Auditor — fitxers, revisió, commit |
| Claude Haiku | Lleuger — resums, classificació |

### Task Completion (OBLIGATORI)

Implementat ≠ Verificat ≠ Completat.
Usa `platform_update_completion` i `platform_check_completion`.

### Airlock

No activis skills de domini sense confirmació explícita.

### Simplicitat

- No proposis arquitectures complexes si n'hi ha prou amb una funció.
- No afegeixis dependències si el stack existent ja ho cobreix.
- Segueix els patrons i decisions clau del CLAUDE.md del projecte.
