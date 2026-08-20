# Diário APLV — Documentação de Desenvolvimento

> Diário APLV — acompanhamento simples, registro seguro.

Esta pasta contém o plano de construção do Diário APLV. A ordem dos módulos é
**linear**: cada módulo entrega algo funcional e é pré-requisito do próximo.
Não pule módulos e não comece animações antes da interface funcional.

## Índice

| Documento                                              | Conteúdo                                                  |
| ------------------------------------------------------ | --------------------------------------------------------- |
| [01-decisoes.md](01-decisoes.md)                       | Stack final, dependências aprovadas e o que ficou de fora |
| [02-arquitetura.md](02-arquitetura.md)                 | Camadas, Atomic Design, fluxo de dados, erros             |
| [03-modelo-de-dados.md](03-modelo-de-dados.md)         | Schema SQL, RLS, tipos, view de timeline                  |
| [04-design-system.md](04-design-system.md)             | Tokens, tipografia, espaçamento, movimento                |
| [05-roadmap.md](05-roadmap.md)                         | Sequência dos 13 módulos e estimativas                    |
| [06-checklist-qualidade.md](06-checklist-qualidade.md) | Definition of Done global e checklist de entrega          |
| [modulos/](modulos/)                                   | Um arquivo por módulo: escopo, entregáveis, aceite        |

## Pendências a validar com o responsável pelo produto

1. **Etapas da escada do leite** — proposta em `03-modelo-de-dados.md`, precisa de
   validação clínica antes do módulo M10.
2. **Lista de códigos de sintomas** — proposta inicial em `03-modelo-de-dados.md`.
3. **Fotos** — o README cita Supabase Storage "se houver fotos". Assumido **fora do MVP**.
4. A especificação está em `../README_APLV_TPO_DESENVOLVEDOR (Cópia).md` — vale renomear para
   `docs/00-especificacao.md` para eliminar o espaço e o "(Cópia)" do caminho. Ela ainda traz o
   nome antigo "Lactra" em alguns trechos; o nome vigente é **Diário APLV**.

## Como usar

1. Leia `02-arquitetura.md` e `03-modelo-de-dados.md` antes de escrever código.
2. Trabalhe um módulo por vez, do M0 ao M12.
3. Ao fim de cada módulo, rode o bloco de aceite do próprio módulo + `npm run build`.
