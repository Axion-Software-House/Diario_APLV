# M3 — Autenticação e Rotas Protegidas

**Objetivo:** entrar, sair e manter sessão entre recarregamentos.
**Estimativa:** 1 dia · **Depende de:** M1, M2

## Escopo

- `services/auth.service.ts` — `signUp`, `signIn`, `signOut`, `getSession`, `onAuthStateChange`
- `contexts/AuthContext.tsx` — `{ user, session, loading, signIn, signUp, signOut }`,
  inicializa com `getSession()` e assina `onAuthStateChange`
- `hooks/useAuth.ts` — consome o contexto, erro claro se usado fora do provider
- `routes/index.tsx` — rotas de `../02-arquitetura.md` + `<ProtectedRoute>` + `<PublicOnlyRoute>`
- `templates/AuthTemplate` — card centrado, logo Diário APLV, assinatura, `max-width: var(--form-max)`
- `organisms/AuthForm` — RHF + Zod (`email`, `senha ≥ 8`, `nome` no registro)
- `pages/Login`, `pages/Register`
- Sessão expirada → `signOut()` + redirect para `/login` com aviso

## Regras

- Enquanto `auth.loading`, `ProtectedRoute` renderiza `Spinner` — **nunca** pisca `/login`
- Erros de credencial viram "E-mail ou senha inválidos." (não vazar se o e-mail existe)
- Botão de submit em `loading` durante a chamada

## Critério de aceite

- [ ] Cadastro cria usuário + linha em `profiles`
- [ ] Login redireciona para `/app` (ou `/onboarding`)
- [ ] F5 em `/app` mantém a sessão, sem flash de login
- [ ] `/app` sem sessão redireciona para `/login`
- [ ] `/login` com sessão redireciona para `/app`
- [ ] Logout limpa a sessão e volta para `/login`
- [ ] Senha curta bloqueia no cliente com mensagem no campo
