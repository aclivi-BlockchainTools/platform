# Task Completion

Skill universal per al criteri de completitud de tasques.

## Per què existeix

Els models de codi tendeixen a declarar una tasca "completada" quan han escrit codi, sense verificar que funcioni. Aquesta skill estableix un criteri objectiu per evitar entregues incompletes.

## Les 3 fases d'una tasca

| Fase | Definició | Condició |
|------|-----------|----------|
| **Implementat** | S'ha escrit el codi | Fitxers modificats |
| **Verificat** | S'ha comprovat que funciona | Tests passen, compilació ok |
| **Completat** | Implementat + verificat | Totes dues |

Una tasca no es considera **completada** fins que no està **verificada**.

## Checklist de completitud

Abans de declarar una tasca completada, verificar:

1. **Fitxers modificats** — Els canvis existeixen i són correctes.
2. **Compilació** — El projecte compila sense errors (si aplica).
3. **Tests** — Tots els tests passen (si n'hi ha). Si no n'hi ha, dir-ho.
4. **Flux principal** — El camí feliç funciona (manual o Playwright).
5. **Errors resolts** — No queden errors coneguts sense tractar.
6. **Documentat** — Al CLAUDE.md o al commit: què s'ha verificat i què no.

## Què NO fer

- No dir "fet" si només està implementat.
- No dir "funciona" si no s'han executat els tests.
- No declarar "completat" si hi ha errors pendents.
- No saltar-se verificacions per pressa.

## Com reportar l'estat

En acabar una tasca, indicar explícitament:

```
Implementat: sí/no
Verificat: sí/no (com?)
Completat: sí/no
```

Si alguna verificació no s'ha pogut fer, dir-ho i explicar per què.

## Quan s'activa

Sempre. Aquesta skill forma part del nucli universal.
