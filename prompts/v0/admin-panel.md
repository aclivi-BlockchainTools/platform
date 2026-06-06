# Prompt v0.dev: Admin Panel

Copia aquest prompt a v0.dev per generar un panell d'administració de qualitat premium.

---

## Producte

**Nom del sistema:** [NOM]
**Descripció breu:** [UNA FRASE]
**Tipus d'administrador:** [QUI GESTIONA EL SISTEMA]
**Tasques principals:** [LLISTA DE TASQUES FREQÜENTS]

## Estil visual

**To:** Professional i funcional (prioritzar claredat i eficiència)
**Colors principals:** [PALETA — tons neutres amb accents funcionals]
**Tipografia:** [RECOMANACIÓ]
**Referències d'estil:** Linear (gestió de projectes), Vercel (configuració tècnica)

## Pantalles necessàries

1. **Dashboard d'administració** — Mètriques del sistema, alertes, activitat recent
2. **Gestió d'usuaris** — Llista, cerca, filtres, edició, rols i permisos
3. **Gestió de contingut** — CRUD per al tipus de contingut principal
4. **Configuració del sistema** — Paràmetres globals, integracions
5. **Registre d'activitat** — Logs, auditoria, històric de canvis
6. **Informes** — Dades agregades, exportació

## Components necessaris

- Sidebar amb agrupació lògica d'opcions
- Taules de dades amb ordenació, filtres avançats i accions per fila
- Formularis complexos amb validació
- Editor de text enriquit (si cal)
- Gestor de fitxers o imatges (si cal)
- Confirmacions per a accions destructives
- Breadcrumbs per a navegació profunda
- Indicadors d'estat (actiu, pendent, bloquejat)
- Sistema de notificacions

## Patrons específics d'admin

- **Bulk actions** — Selecció múltiple amb accions per lot
- **Filtres avançats** — Combinació de filtres amb desar/netejar
- **Exportació** — CSV, Excel, PDF
- **Formularis en varios passos** — Wizards per a configuracions complexes
- **Vista prèvia** — Previsualització abans de publicar
- **Historial de canvis** — Qui, què, quan
- **Confirmació per a accions destructives** — Modal amb explicació clara

## Estats a dissenyar

- **Normal** — Dades poblades
- **Buit** — Sense dades, invitació a crear
- **Carregant** — Esquelets de taules i formularis
- **Error** — Missatges d'error amb accions
- **Confirmació** — Feedback d'èxit després d'accions

## Restriccions tècniques

- React + Tailwind CSS + shadcn/ui
- Accessible (navegació per teclat, lectors de pantalla)
- Responsive (tauleta i escriptori; mòbil per a accions urgents)
- Mode fosc/clar (recomanat per a ús prolongat)
- Dades realistes als exemples

## Instrucció explícita

No generar un panell d'administració genèric sense context de domini.
Prioritzar l'eficiència de les tasques freqüents per sobre de l'estètica.
Cuidar: jerarquia de la informació, densitat adequada, microcopy clar.
Fer servir shadcn/ui com a base però adaptar al context del sistema.
