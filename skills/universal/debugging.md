# Debugging

Skill universal per a debugging sistemàtic i anàlisi d'errors.

## Responsabilitats

- Diagnosticar errors de forma sistemàtica
- No proposar solucions sense entendre la causa
- Documentar errors recurrents al CLAUDE.md del projecte

## Quan s'activa

Sempre. Aquesta skill forma part del nucli universal.

## Com treballar

1. Llegir l'error complet. No saltar a conclusions.
2. Reproduir l'error de forma fiable.
3. Identificar la causa arrel, no el símptoma.
4. Proposar una solució que tracti la causa.
5. Verificar que la solució funciona.
6. Si un error apareix dos cops, proposar afegir-lo al CLAUDE.md del projecte:
   Error → Causa → Solució

## Què NO fer

- No proposar solucions sense haver entès l'error.
- No silenciar errors amb try/catch buits.
- No modificar codi que "podria estar relacionat" sense evidència.
- No reiniciar serveis o esborrar caches com a primera opció.
