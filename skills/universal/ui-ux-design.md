# UI/UX Design

Skill universal per al disseny d'interfícies d'usuari, dashboards, landing pages i aplicacions web.

## Principi fonamental

No començar mai generant React directament.
Primer pensar com un Product Designer. Després actuar com a Software Engineer.

## Quan s'activa

Sempre. Aquesta skill forma part del nucli universal.

S'aplica abans de generar qualsevol interfície, dashboard, landing page o aplicació web.

## El procés de 9 passos

Abans d'escriure codi d'UI:

1. **Entendre l'usuari final** — Qui és? Què vol? Què sap?
2. **Entendre el problema** — Què resol aquesta interfície?
3. **Definir l'experiència d'usuari** — Què veu primer? Què fa després?
4. **Definir l'estil visual** — Colors, tipografia, espaiat, to.
5. **Definir la navegació** — Com es mou l'usuari entre pantalles?
6. **Definir la jerarquia visual** — Què és el més important a cada pantalla?
7. **Definir els components principals** — Quins patrons d'UI calen?
8. **Definir les pantalles** — Quantes? Què conté cadascuna?
9. **Generar codi** — Només ara.

## Regles estrictes

- No acceptar dashboards genèrics sense personalitat.
- No acceptar landing pages tipus "hero + 3 caixes + footer" sense storytelling.
- Si la UI és important, generar abans un brief específic per v0.dev.
- Cuidar responsive, spacing, jerarquia visual i microcopy a cada pantalla.

## Checklist per a SaaS

Abans de generar la UI d'un SaaS, analitzar:

- Tipus d'usuari (rol, necessitat, moment)
- Flux principal (camí feliç complet)
- Dashboard (què veu l'usuari en entrar)
- Onboarding (com descobreix el producte)
- Estats buits (què veu quan no hi ha dades)
- Feedback visual (loading, errors, confirmació)
- CTA (quina acció volem que faci)
- Mobile/responsive (com s'adapta)
- Jerarquia visual (què és prioritari)
- Microcopy (textos, botons, missatges)

## Checklist per a landing pages

Abans de generar una landing page, definir:

- Hero (titular, subtítol, imatge)
- Problema (què resol)
- Solució (com ho resol)
- Beneficis (per què és millor)
- Funcionalitats (què fa)
- Prova social (testimonis, logos, números)
- CTA principal (quina acció principal)
- CTA secundari (alternativa)
- FAQ (preguntes freqüents)
- Objeccions de compra (què frena l'usuari)
- Storytelling (arc narratiu complet)

## Stack recomanat per UI

- React + Tailwind CSS + shadcn/ui
- Si l'stack del projecte és diferent, adaptar-se
- Prioritzar components accessibles i reutilitzables

## Referències de qualitat (no copiar)

Utilitzar com a referència de qualitat visual i experiència d'usuari:

- **Linear** — Simplicitat, velocitat, jerarquia clara
- **Stripe** — Disseny tècnic amb personalitat, microcopy brillant
- **Vercel** — Minimalisme, focus en desenvolupadors
- **Notion** — Flexibilitat, espai en blanc, calma visual

No copiar. Entendre els principis i aplicar-los amb personalitat pròpia.

## Brief per v0.dev

Quan la UI és important, generar un brief que inclogui:

1. Objectiu del producte
2. Usuari final
3. Estil visual desitjat
4. Referències d'estil
5. Pantalles o seccions necessàries
6. Components clau
7. Restriccions tècniques
8. Stack: React + Tailwind + shadcn/ui
9. Instrucció explícita: "No generar UI genèrica. Cuidar responsive, spacing, jerarquia visual i microcopy."

Els prompts reutilitzables són a `platform/prompts/v0/`.

## Què NO fer

- No generar components React com a primera acció.
- No usar paletes de colors per defecte (blau genèric, gris Tailwind pur).
- No dissenyar sense entendre l'usuari primer.
- No saltar-se el responsive amb excusa de "després ho ajustem".
- No escriure microcopy genèric ("Welcome to our platform").
