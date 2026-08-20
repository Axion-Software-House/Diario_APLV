# M5 — Shell do App e Dashboard

**Objetivo:** a casa do usuário: onde ele está na escada e o que fazer agora.
**Estimativa:** 1 dia · **Depende de:** M4

## Escopo

- `templates/AppTemplate` — header fixo + `main` com `max-width: var(--container-max)`
- `organisms/Header` — "Diário APLV", nome da criança, menu com Relatório e Sair
- `molecules/StageProgress` — barra/steps 1..6 com a etapa atual destacada
- `molecules/StatCard` — número + rótulo (ex.: "Dias na etapa", "Registros na etapa")
- `molecules/EmptyState` — ícone + título + texto + ação
- `molecules/SafetyAlert` — aviso não diagnóstico, tom `warning`/`danger`
- `organisms/StageOverview` — etapa atual, descrição, desde quando, contagens
- `organisms/MilkLadder` — as 6 etapas, marcando concluídas/atual/futuras (somente leitura aqui)
- `pages/Dashboard` (`/app`) — StageOverview + MilkLadder + 3 atalhos grandes:
  **Registrar exposição**, **Registrar sintomas**, **Registrar fralda** → `/app/protocol/:id`
- `templates/ProtocolTemplate` — 1 coluna no mobile, 2 colunas ≥1024px (registro | resumo)
- `pages/Protocol` (`/app/protocol/:id`) — casca com as abas/seções de registro (vazias por ora)
- `hooks/useProtocol.ts` — protocolo ativo, etapa atual, contadores
- Rodapé com aviso fixo: _"Diário APLV registra e organiza informações. Não substitui avaliação profissional."_

## Critério de aceite

- [ ] `/app` mostra nome da criança, etapa atual e escada
- [ ] Os 3 atalhos navegam para a seção correta do protocolo
- [ ] Layout de 2 colunas aparece a partir de 1024px e colapsa abaixo disso
- [ ] Sem estado vazio quebrado quando não há nenhum registro
- [ ] Header não cobre conteúdo em 375px
