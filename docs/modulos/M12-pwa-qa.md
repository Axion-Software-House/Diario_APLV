# M12 — Responsividade, React Bits, PWA e QA Final

**Objetivo:** acabamento. Só entra aqui com tudo dos módulos anteriores funcionando.
**Estimativa:** 1,5 dia · **Depende de:** M11

## 12.1 Responsividade (primeiro)

Passar tela a tela em 375, 390, 430, 768, 1024 e 1440px:

- [ ] Nenhum scroll horizontal
- [ ] Nenhum texto cortado ou botão fora da área
- [ ] Formulários com `max-width: var(--form-max)` no desktop (sem esticar)
- [ ] Container geral em `var(--container-max)`, centralizado
- [ ] Protocolo em 2 colunas ≥1024px, 1 coluna abaixo
- [ ] Timeline vertical e confortável no mobile
- [ ] Alvos de toque ≥48px

## 12.2 React Bits Pro (segundo)

Aplicar **apenas** nos pontos aprovados em `../04-design-system.md`:

- entrada suave dos cards do dashboard
- transição entre etapas da escada
- feedback visual após salvar
- progresso da escada do leite
- estados vazios
- modal
- microinteração dos botões
- timeline com entrada discreta

Proibido: fundo animado, partículas, 3D, texto animado, animação >320ms.

- [ ] Todas as animações respeitam `prefers-reduced-motion`
- [ ] Nenhuma animação atrasa o salvamento ou a leitura
- [ ] Componentes React Bits usam os tokens do projeto

## 12.3 PWA (terceiro)

- `vite-plugin-pwa` com `registerType: 'autoUpdate'`
- `manifest`: name "Diário APLV", short_name "Diário APLV", `theme_color #6F57E8`,
  `background_color #F7F5FB`, display `standalone`, ícones 192/512 + maskable
- Service worker: precache do app shell. **Não** cachear resposta de API do Supabase no MVP
  (evita mostrar dado de saúde desatualizado como se fosse atual)
- `hooks/useOnlineStatus.ts` + faixa "Sem conexão. Seus registros serão salvos quando voltar."
- Bloquear submit quando offline, com mensagem clara

- [ ] Instalável no Android/Chrome
- [ ] Ícone e splash corretos na tela inicial
- [ ] App abre em standalone
- [ ] Offline mostra aviso em vez de erro técnico

## 12.4 QA final

Rodar o `../06-checklist-qualidade.md` inteiro.

## Fora deste módulo (backlog pós-MVP)

IndexedDB + fila de sincronização offline-first, exportação PDF nativa, múltiplos
cuidadores, fotos via Storage, notificações.
