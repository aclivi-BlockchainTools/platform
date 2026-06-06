# Prompt v0.dev: App Shell

Copia aquest prompt a v0.dev per generar l'estructura base d'una aplicació web de qualitat premium.

---

## Producte

**Nom de l'app:** [NOM]
**Descripció breu:** [UNA FRASE]
**Usuari final:** [QUI ÉS, QUÈ FA]
**Flux principal:** [EL CAMÍ FELIÇ EN 3-5 PASSOS]

## Estil visual

**To:** [Professional / Creatiu / Tècnic / Minimalista / Càlid]
**Colors principals:** [PALETA]
**Tipografia:** [RECOMANACIÓ]
**Referències d'estil:** Linear, Stripe, Vercel, Notion

## Components de l'app shell

1. **Layout principal** — Sidebar + header + àrea de contingut + footer opcional
2. **Sidebar** — Navegació principal amb icones, col·lapsable en mòbil
3. **Header** — Títol de pàgina, breadcrumbs, accions, perfil d'usuari
4. **Àrea de contingut** — Container amb màxima amplada i padding responsius
5. **Navegació mòbil** — Menú hamburguesa o barra inferior

## Patrons de navegació

- **Sidebar expandida** (escriptori) / col·lapsada (mòbil)
- **Tabs** per a subnavegació dins d'una secció
- **Breadcrumbs** si la jerarquia és profunda
- **Comandes de teclat** per a accions freqüents
- **Back button** amb comportament correcte

## Estats globals

- **Autenticació** — Login, registre, recuperació de contrasenya
- **Onboarding** — Flux de benvinguda per a usuaris nous
- **Perfil d'usuari** — Edició de dades personals
- **Notificacions** — Campana amb llista de notificacions
- **Cerca global** — Command palette (cmd+k) o barra de cerca
- **Configuració** — Preferències de l'app
- **Error 404** — Pàgina no trobada amb navegació alternativa
- **Error 500** — Error del servidor amb informació útil
- **Manteniment** — Pàgina de manteniment programat

## Restriccions tècniques

- React + Tailwind CSS + shadcn/ui
- Rutes amb React Router o Next.js App Router
- Accessible (WCAG 2.1 AA com a mínim)
- Responsive (mòbil, tauleta, escriptori)
- Mode fosc/clar amb sistema de preferències
- Layouts niuats per a seccions amb subnavegació
- Transicions suaus entre pàgines (opcional)

## Detalls que marquen la diferència

- Estats de càrrega amb esquelets (skeleton screens)
- Transicions entre estats (loading → data → empty → error)
- Feedback visual per a totes les accions (hover, focus, active, disabled)
- Microcopy contextual i útil
- Atalls de teclat visibles i accessibles
- Breadcrumbs automàtics segons la ruta
- Títol de pàgina dinàmic al header

## Instrucció explícita

No generar una app shell genèrica. Cada element ha de tenir context i propòsit.
L'estructura ha de ser prou flexible per créixer amb el producte.
Cuidar: responsive, accessibilitat, jerarquia visual, microcopy.
Fer servir shadcn/ui com a base però donar personalitat a cada component.
