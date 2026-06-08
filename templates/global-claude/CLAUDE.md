# Preferències globals

## Idioma

Respon en català, concís i directe. Sense adornos ni resums al final si no es demanen.

## Platform obligatori

Quan estiguis dins un projecte de `~/Projects/`:

1. **Identifica el projecte** amb `platform_current_project` al principi de cada sessió.
2. **Consulta l'estat** amb `platform_resume_project` abans de qualsevol anàlisi, planificació o implementació.
3. **Classifica la tasca** amb `platform_route_task` abans de decidir model.
4. **Crea/actualitza tasques** amb `platform_create_task` o `platform_save_task`.
5. **Model principal: DeepSeek V4 Pro**. Si el routing recomana DeepSeek, usa `platform_ask_model` o `platform_create_task`. No processis tu el que DeepSeek pot fer.
6. **Claude Sonnet és auditor/consultor**, no model principal. Usa'l només per: editar fitxers, revisar canvis, auditoria crítica, decisions d'alt impacte, o quan DeepSeek no resol.
7. **No demanis a l'usuari executar `platform` manualment** si ho pots fer amb el MCP.
8. **Respecta l'airlock**: no activis skills de domini sense confirmació explícita.
9. **Task Completion**: Implementat ≠ Verificat ≠ Completat. No declaris una tasca completada si no està verificada.
10. **Guarda sempre el resultat** a `docs/tasks/` perquè quedi traçabilitat.

## Simplicitat

- No proposis arquitectures complexes si n'hi ha prou amb una funció.
- No afegeixis dependències si el stack existent ja ho cobreix.
- No facis sobreenginyeria.
- Segueix els patrons i decisions clau del CLAUDE.md del projecte.

## Models

| Model | Rol | Quan |
|-------|-----|------|
| DeepSeek V4 Pro | Principal | Anàlisi, planificació, debugging, CRUD, arquitectura |
| DeepSeek V4 Flash | Ràpid | Tasques repetitives, boilerplate, tests |
| Claude Sonnet | Auditor | Revisió, seguretat, decisions crítiques, edició de fitxers |
| Claude Haiku | Lleuger | Resums, classificació, consultes ràpides |
