# 06 — Qualidade

## Definition of Done (todo módulo)

- [ ] `npm run typecheck` sem erros e sem `any`
- [ ] `npm run lint` sem erros
- [ ] `npm run build` conclui sem erros
- [ ] Console do navegador sem erros nem warnings relevantes
- [ ] Testado em 375px e em 1440px
- [ ] Critério de aceite do arquivo do módulo 100% marcado
- [ ] Commit feito com prefixo do módulo (`M07: ...`)

## Checklist de entrega final (antes de liberar o MVP)

### Build e código

- [ ] `npm run build` limpo
- [ ] Zero `any` em `src/`
- [ ] Zero `console.log` deixado para trás
- [ ] Nenhuma cor/tamanho hard-coded fora de `tokens.css`
- [ ] Nenhum `supabase` importado em `components/`

### Autenticação e sessão

- [ ] Cadastro, login e logout funcionam
- [ ] Sessão sobrevive a F5 e a fechar/abrir o navegador
- [ ] Rota protegida bloqueia usuário deslogado
- [ ] Sessão expirada não trava a tela

### Segurança

- [ ] RLS ligada em todas as tabelas e na view
- [ ] Usuário B não enxerga nem altera nada de A (reteste do M2)
- [ ] Apenas a anon key no bundle: `grep -r "service_role" dist/` vazio
- [ ] `.env.local` fora do git
- [ ] Deploy em HTTPS

### Persistência

- [ ] Registro salvo aparece depois de logout/login
- [ ] Registro salvo aparece em outro dispositivo com a mesma conta
- [ ] Formulário não limpa antes da confirmação do Supabase
- [ ] Erro de rede preserva o que foi digitado

### Funcional

- [ ] Onboarding cria criança + protocolo + etapa 1
- [ ] Exposição, sintomas, "sem sintomas", fralda e nota salvam
- [ ] Timeline mostra tudo em ordem, agrupado por dia
- [ ] Editar e excluir funcionam em todos os tipos
- [ ] Mudança de etapa registra histórico e aparece na timeline
- [ ] Relatório abre e imprime limpo

### Responsividade

- [ ] 375 / 390 / 430 / 768 / 1024 / 1440 sem quebra
- [ ] Sem scroll horizontal em nenhuma tela
- [ ] Alvos de toque ≥48px

### Acessibilidade

- [ ] Navegação completa por teclado com foco visível
- [ ] Todo input com label associado
- [ ] Contraste de texto ≥4.5:1
- [ ] `prefers-reduced-motion` respeitado
- [ ] Erros anunciados por `aria-live`

### PWA

- [ ] Instalável, ícone e splash corretos
- [ ] Abre em standalone
- [ ] Offline avisa em vez de quebrar

### Conteúdo clínico

- [ ] Nenhuma tela emite diagnóstico, conclusão ou recomendação de conduta
- [ ] Alertas de sinais de alarme orientam procurar profissional, sem interpretar
- [ ] Aviso "não substitui avaliação profissional" visível no app e no relatório
- [ ] Nenhum dado pessoal coletado além do necessário

## Comandos de verificação rápida

```bash
npm run typecheck && npm run lint && npm run build
grep -rn ": any" src/ | grep -v node_modules
grep -rnE "#[0-9a-fA-F]{3,6}" src/components/
grep -rn "supabase" src/components/
```
