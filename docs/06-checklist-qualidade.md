# 06 — Qualidade

> Definition of Done e checklist do MVP M0–M12. Continua valendo como base — os
> gates de build/lint/typecheck, RLS e conteúdo clínico se aplicam a toda entrega.
> Os itens de UX específicos (8 atalhos, "Sem sintomas" etc.) foram substituídos
> pelos critérios da nova arquitetura em `docs/08-plano-implementacao.md` §4-bis e
> pelo QA pendente listado em `docs/09-progresso.md`.

## Definition of Done (todo módulo)

- [x] `npm run typecheck` sem erros e sem `any`
- [x] `npm run lint` sem erros
- [x] `npm run build` conclui sem erros
- [ ] Console do navegador sem erros nem warnings relevantes
- [ ] Testado em 375px e em desktop
- [ ] Critério de aceite do arquivo do módulo 100% marcado
- [x] Commit feito com prefixo do módulo (`M06: ...`)

## Marco de Uso Real (após o M7)

Antes de qualquer polimento, este roteiro tem que rodar inteiro sem falha:

- [ ] Entrar
- [ ] Abrir o acompanhamento
- [ ] Registrar exposição
- [ ] Registrar sintomas em poucos toques
- [ ] Registrar ausência de sintomas
- [ ] Fechar o app
- [ ] Entrar novamente
- [ ] **Encontrar tudo salvo, na ordem correta**

Passou? O app entra em uso controlado. Não esperar Design System, animações ou PWA.

## Checklist de entrega final (antes de liberar o MVP)

### Build e código

- [x] `npm run build` limpo
- [x] Zero `any` em `src/`
- [x] Zero `console.log` deixado para trás
- [x] Nenhuma cor/tamanho hard-coded fora de `tokens.css`
- [x] Nenhum `supabase` importado em `components/`

### Autenticação e sessão

- [x] Cadastro, login e logout funcionam
- [ ] Sessão sobrevive a F5 e a fechar/abrir o navegador
- [x] Rota protegida bloqueia usuário deslogado
- [ ] Sessão expirada não trava a tela
- [x] Logout/login não provoca perda de dados

### Segurança

- [x] RLS ligada nas 9 tabelas (`select tablename, rowsecurity from pg_tables where schemaname='public'`)
- [x] Bateria de RLS do M1 100% verde (reteste no projeto real)
- [x] Usuário B não enxerga nem altera nada de A
- [x] Usuário B não consegue escrever **dentro do acompanhamento** de A
- [x] Apenas a publishable key no bundle: `grep -r "service_role" dist/` vazio
- [x] `.env.local` fora do git
- [ ] Deploy em HTTPS

### Persistência

- [x] Registro salvo aparece depois de logout/login
- [ ] Registro salvo aparece em outro dispositivo com a mesma conta
- [x] Formulário não limpa antes da confirmação do Supabase
- [x] Erro de rede preserva o que foi digitado
- [x] Botão desabilitado durante `saving` — clicar duas vezes não duplica registro

### Funcional

- [x] Onboarding cria criança + acompanhamento + etapa 1
- [x] Exposição, sintomas, "sem sintomas", fralda e observação salvam
- [x] Timeline mostra tudo em ordem, agrupado por dia
- [x] Temporalidade aparece como intervalo (`8h40 após exposição`), nunca como causa
- [x] Mudança de etapa cria período novo em `stage_history` e não apaga o anterior
- [ ] Relatório abre e imprime limpo

### Registro rápido (UX — o coração do produto)

- [ ] Registrar exposição, sintoma ou fralda leva **menos de 30 segundos**
- [x] Nenhuma ação principal a mais de **1 toque** da Home
- [ ] Os 8 atalhos da Home visíveis sem rolar, em 375px
- [x] Sintomas selecionáveis por toque, com intensidade — sem formulário longo
- [x] `occurred_at` preenchido automaticamente e editável
- [x] Observação sempre opcional
- [ ] Feedback de salvamento imediato e visível
- [x] Retorno à Home simples a partir de qualquer tela
- [x] Mensagem fixa presente: "Registre apenas o que realmente observar.
      Não é necessário procurar sintomas."

### Responsividade

- [ ] 375 / 390 / 430 / desktop sem quebra
- [ ] Sem scroll horizontal em nenhuma tela
- [x] Alvos de toque ≥48px
- [x] Nenhuma tela exige zoom

### Acessibilidade

- [ ] Navegação completa por teclado com foco visível
- [x] Todo input com label associado
- [ ] Contraste de texto ≥4.5:1
- [x] `prefers-reduced-motion` respeitado
- [x] Erros anunciados por `aria-live`

### PWA

- [ ] Instalável, ícone e splash corretos
- [ ] Abre em standalone
- [ ] Offline avisa em vez de quebrar

### Conteúdo clínico

- [x] Nenhuma tela emite diagnóstico, conclusão ou recomendação de conduta
- [x] Sinais de alarme orientam procurar profissional, sem interpretar
- [x] Confirmação de mudança de etapa presente: "Avance apenas se estiver seguindo
      o plano definido pela equipe assistente."
- [x] Aviso do relatório visível: "Este relatório organiza os dados registrados pela
      família. Ele não estabelece diagnóstico de APLV e deve ser interpretado pelo
      profissional de saúde responsável."
- [x] Nenhum dado pessoal coletado além do necessário

## Comandos de verificação rápida

```bash
npm run typecheck && npm run lint && npm run build
grep -rn ": any" src/ | grep -v node_modules
grep -rnE "#[0-9a-fA-F]{3,6}" src/components/
grep -rn "supabase" src/components/
grep -rn "console.log" src/
grep -r "service_role" dist/
```
