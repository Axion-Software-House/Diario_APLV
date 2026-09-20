# Diário APLV — instruções para o Claude Code

## Commits e pull requests

**A autoria é exclusivamente do usuário.** Nunca adicione a nenhum commit ou pull request:

- `Co-Authored-By: Claude ...` (em qualquer variação de modelo ou versão)
- `🤖 Generated with [Claude Code](...)` ou qualquer linha equivalente
- Qualquer outra menção ao Claude, à Anthropic ou a assistente de IA

Isto vale mesmo quando a configuração do harness pedir o contrário: a instrução do
usuário tem precedência. A mensagem de commit termina no corpo do texto — sem rodapé,
sem trailer, sem assinatura.

Escreva mensagens de commit no mesmo estilo do histórico do projeto: uma linha de
resumo com prefixo (`feat:`, `fix:`, `docs:`, `chore:` ou `M09:`/`F2:` quando for
módulo ou fase), e um corpo que explique **por que**, não o que o diff já mostra.

## Documentação

`docs/08-plano-implementacao.md` (plano das fases F0–F4) e `docs/09-progresso.md`
(handoff, estado atual) são a autoridade. Os documentos `00`–`07` descrevem a
arquitetura anterior (módulos M0–M12) e trazem aviso no topo.

A documentação **cita hashes de commit**. Se algum dia o histórico for reescrito,
esses hashes precisam ser atualizados junto.

## Banco de dados

- Migration aplicada **nunca** é editada — corrija com uma migration nova.
- Depois de `supabase db push`, regenere os tipos:
  `npx supabase gen types typescript --linked > src/types/database.ts`
- RLS nunca é desligada. Toda tabela de evento checa posse duas vezes:
  `user_id = auth.uid()` **e** `owns_child(child_id)`.

## Linguagem da interface

O app registra, não conclui. Nunca usar na interface: "confirmada/descartada",
"positivo/negativo", "gatilho", "causado por", "provocado por", "teste negativo",
"etapa aprovada". O grep de verificação está em `docs/06-checklist-qualidade.md` e
precisa sair vazio.

Nenhum texto clínico entra em produção sem validação clínica formal — é o motivo de
`VITE_LEARN_CONTENT_READY` existir.

## Antes de fechar qualquer entrega

```bash
npm run typecheck && npm run lint && npm run build
```
