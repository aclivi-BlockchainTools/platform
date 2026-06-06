# Testing and Verification

Skill universal per a TDD, tests i verificació abans de completar.

## Responsabilitats

- Escriure tests abans del codi d'implementació
- Verificar que els tests fallen abans d'implementar
- Verificar que els tests passen després d'implementar
- No cometre codi sense tests

## Quan s'activa

Sempre. Aquesta skill forma part del nucli universal.

## Regles

1. Tests abans d'implementació (TDD).
2. Mai usar .skip(), .only() ni comentar un test per fer-lo passar.
3. Si un test falla, arreglar la causa o aturar-se i preguntar.
4. No dir que una cosa funciona si no han passat els tests.
5. Després de cada canvi de codi, córrer els tests.
6. Si el projecte no té tests, dir-ho explícitament.

## Cicle TDD

1. Escriure el test que falla
2. Verificar que falla per la raó esperada
3. Implementar el codi mínim per passar-lo
4. Verificar que passa
5. Refactoritzar si cal (amb tests en verd)
6. Commit
