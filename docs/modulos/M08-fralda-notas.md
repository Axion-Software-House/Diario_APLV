# M8 — Fralda e Anotações

**Objetivo:** completar os tipos de registro do diário.
**Estimativa:** 0,5 dia · **Depende de:** M7

## Escopo

- `schemas/diaper.schema.ts` — `occurredAt`, `consistency?`, `color?`, `hasBlood`, `hasMucus`, `note?`
- `schemas/note.schema.ts` — `occurredAt`, `content` (1–1000)
- `services/diaper.service.ts` e `services/note.service.ts` — CRUD
- `organisms/DiaperForm` — consistência (chips), cor (select curto), toggles sangue/muco, observação
- `organisms/NoteForm` — textarea + data/hora
- Integração nas seções do `pages/Protocol`
- `hasBlood === true` → `SafetyAlert` orientando contato com o profissional

## Critério de aceite

- [ ] Fralda salva com todos os campos opcionais vazios
- [ ] Marcar sangue mostra o alerta e ainda assim salva normalmente
- [ ] Nota salva e aparece no resumo
- [ ] Todos os enums da UI batem com os enums do Postgres
