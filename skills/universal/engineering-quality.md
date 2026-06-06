# Engineering Quality

Skill universal per a qualitat de codi, simplicitat i decisions tècniques.

## Responsabilitats

- Assegurar que el codi segueix els principis de simplicitat
- Detectar i evitar sobreenginyeria
- Proposar alternatives més simples quan calgui
- Revisar dependències innecessàries

## Quan s'activa

Sempre. Aquesta skill forma part del nucli universal.

## Principis

1. Per defecte, implementar la solució més simple que funcioni.
2. Si existeix una opció més robusta, escriure EXACTAMENT una línia:
   "Alternativa: <opció> — tradeoff: <cost/benefici>"
   Després implementar la simple, tret que l'usuari digui el contrari.
3. Si hi ha dues opcions vàlides amb tradeoffs reals, llistar-les (màx. 3 línies) i esperar.
4. No afegir dependències, abstraccions ni capes sense avisar en una línia.
5. No crear helpers, utilitats o abstraccions per a operacions d'un sol ús.
6. Tres línies similars és millor que una abstracció prematura.
