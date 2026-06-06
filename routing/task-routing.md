# Task Routing

Routing de models per tipus de tasca.

## DeepSeek V4 Pro — Model principal

Model per defecte per al desenvolupament diari.

- Arquitectura
- Backend
- Frontend
- Refactors
- Debugging
- Implementació principal
- Agents
- Repositoris grans
- Anàlisi de codi
- Disseny tècnic

## DeepSeek V4 Flash — Model ràpid

Per minimitzar cost en tasques simples.

- CRUD
- Components
- APIs simples
- Scripts
- Tests
- Tasques repetitives
- Modificacions petites

## Claude Sonnet — Model auditor

Consultor especialitzat. No és el model principal.

- Revisió final
- Seguretat
- Auditoria
- UX/Product Design
- Segona opinió
- Problemes persistents

## Claude Haiku — Model lleuger

- Resums
- Classificació
- Consultes ràpides

## Model Strategy

```
Model principal:  deepseek-v4-pro
Model ràpid:      deepseek-v4-flash
Model auditor:    claude-sonnet
```

Escalar a Claude només quan:

- Hi hagi risc alt
- Calgui revisió independent
- Calgui validar arquitectura
- Hi hagi requisits de seguretat
- DeepSeek no resolgui el problema
