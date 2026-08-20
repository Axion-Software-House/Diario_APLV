# M4 — Shell do App e Dashboard visual

**Objetivo:** a Home — onde a família está na escada e o que dá para fazer agora.
**Estimativa:** 0,5 dia · **Depende de:** M3

## Escopo

Mostrar:
- nome da criança
- etapa atual (rótulo de `constants/stages.ts`)
- dia da etapa (a partir de `stage_history.started_at`)
- progresso `n/5`
- os 8 atalhos

Layout dos atalhos (`ActionTile`: ícone + nome, alvo ≥48px):

```
[ Exposição ]     [ Sintomas ]
[ Sem sintomas ]  [ Fralda ]
[ Observação ]    [ Timeline ]
[ Etapas ]        [ Relatório ]
```

Cada tile navega direto para a rota do módulo. **Nenhuma ação principal a mais de
1 toque da Home.**

## Critério de aceite

- [x] `/app` mostra criança, etapa atual, dia da etapa e progresso n/5
- [ ] Os 8 atalhos aparecem **sem rolar** em 375px
- [x] Todo atalho leva à tela certa em 1 toque
- [x] Toda tela de registro tem retorno simples para `/app`
- [x] Alvos de toque ≥48px
