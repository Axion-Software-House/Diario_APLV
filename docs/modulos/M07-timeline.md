# M7 — Timeline essencial

**Objetivo:** transformar registros soltos em leitura cronológica confiável.
**Estimativa:** 0,5 dia · **Depende de:** M6

> 🏁 **Marco de Uso Real.** Validado este módulo, o app entra em uso controlado.
> Não esperar Design System, animações ou PWA.

## Escopo

Unificar **no frontend** — não criar tabela nem view de timeline:

- exposições
- sintomas
- sem sintomas

`useTimeline` busca as origens em paralelo, `utils/timeline.ts` normaliza para
`TimelineEvent` e ordena por `occurred_at DESC`. Agrupamento por dia na renderização.

Fralda, observações e etapas entram na timeline nos módulos M8 e M9.

## Critério de aceite

- [ ] Salvar → refresh → logout → login → **tudo permanece na ordem correta**
- [x] Ordenação por `occurred_at DESC`
- [x] Registro "sem sintomas" aparece e é distinguível de "sintomas"
- [x] Intervalo desde a exposição exibido quando há vínculo
- [x] Estado vazio explica o que fazer, sem culpar a usuária

## Roteiro do Marco de Uso Real

- [ ] Entrar
- [ ] Abrir o acompanhamento
- [ ] Registrar exposição
- [ ] Registrar sintomas em poucos toques
- [ ] Registrar ausência de sintomas
- [ ] Fechar
- [ ] Entrar novamente
- [ ] Encontrar tudo salvo
