# Prompt v0.dev: SaaS Dashboard

Copia aquest prompt a v0.dev per generar un dashboard SaaS de qualitat premium.

---

## Producte

**Nom del producte:** [NOM]
**Descripció breu:** [UNA FRASE]
**Usuari final:** [QUI ÉS, QUÈ FA, QUÈ NECESSITA]

## Estil visual

**To:** [Professional / Creatiu / Tècnic / Minimalista / Càlid]
**Colors principals:** [PALETA — no blau genèric]
**Tipografia:** [RECOMANACIÓ]
**Referències d'estil:** Linear, Stripe, Vercel, Notion (no copiar, usar com a guia de qualitat)

## Pantalles necessàries

1. **Dashboard principal** — Visió general amb mètriques clau, gràfics i accions ràpides
2. **Llista** — Taula o llista amb filtres, cerca i accions per lot
3. **Detall** — Vista detallada d'un element amb accions contextuals
4. **Configuració** — Preferències d'usuari o configuració del compte
5. **Onboarding** — Flux de benvinguda per a usuaris nous

## Components necessaris

- Sidebar de navegació (col·lapsable en mòbil)
- Header amb cerca global, notificacions i perfil
- Targetes de mètriques amb tendències
- Taula de dades amb ordenació, filtres i paginació
- Gràfics (barres, línies, circulars)
- Botons d'acció primaris i secundaris
- Modals de confirmació
- Estats buits (quan no hi ha dades)
- Estats de càrrega (esquelets, spinners)
- Missatges d'error i confirmació
- Breadcrumbs si la navegació és profunda

## Estats a dissenyar

- **Normal** — Amb dades reals
- **Buit** — Sense dades, primera visita
- **Carregant** — Esquelets i placeholders
- **Error** — Missatge d'error amb acció correctiva
- **Mòbil** — Com s'adapta a pantalles petites

## Restriccions tècniques

- React + Tailwind CSS + shadcn/ui
- Accessible (teclat, lectors de pantalla)
- Responsive (mòbil, tauleta, escriptori)
- Mode fosc/clar (opcional però recomanat)
- Spacing generós, jerarquia visual clara
- Microcopy cuidat: res de "Welcome to our platform"

## Instrucció explícita

No generar una UI genèrica. Cada pantalla ha de tenir personalitat pròpia.
Cuidar: responsive, spacing, jerarquia visual, microcopy, estats buits.
Fer servir shadcn/ui com a base però no limitar-s'hi.
