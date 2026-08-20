# M6 — Registro de Exposição

**Objetivo:** registrar o que a mãe consumiu, em poucos toques.
**Estimativa:** 0,5 dia · **Depende de:** M5

## Escopo

- `schemas/exposure.schema.ts` — `occurredAt` (obrigatória, não futura além de 5 min),
  `description` (1–200), `amount` (opcional, ≤60), `note` (opcional, ≤500)
- `services/exposure.service.ts` — `create`, `listByProtocol`, `update`, `remove`
- `molecules/ExposureSelector` — chips de sugestões da etapa atual + campo livre
- `organisms/ExposureForm` — data/hora (default = agora), descrição, quantidade, observação
- Integração na seção "Exposição" de `pages/Protocol`
- `hooks/useExposures.ts` — lista + ações com `ActionState`

## Regras

- `stage` gravado automaticamente = etapa atual do protocolo (não é escolha do usuário)
- Data/hora vem preenchida com agora; editável para registro retroativo
- Formulário só limpa após `success`; em erro, mantém tudo
- Após salvar: feedback "Registro salvo" e a lista/resumo atualiza sem reload

## Critério de aceite

- [ ] Registro aparece no Supabase com `user_id`, `protocol_id` e `stage` corretos
- [ ] Data futura é bloqueada com mensagem no campo
- [ ] Erro de rede mostra mensagem amigável e preserva o formulário
- [ ] Botão fica `loading` e desabilitado durante o salvamento
- [ ] Usável com uma mão em 375px
