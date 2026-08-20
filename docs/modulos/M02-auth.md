# M2 — Autenticação e Rotas Protegidas

**Objetivo:** entrar, sair e manter sessão entre recarregamentos.
**Estimativa:** 0,5 dia · **Depende de:** M1 · **Status: ✅ concluído**

## Escopo

- `AuthContext` — `session`, `user`, `loading`, `signUp`, `signIn`, `signOut`
- `services/auth.ts` — única camada que fala com `supabase.auth`
- Páginas `/login` e `/register` (React Hook Form + Zod)
- `<ProtectedRoute>`: spinner enquanto `loading`, redireciona para `/login` sem sessão
- `/` redireciona conforme sessão
- Erros pelo mapeador de `lib/errors.ts` — nada de mensagem técnica na tela

## Critério de aceite

- [x] Cadastrar cria usuário e linha em `profiles`
- [x] Entrar leva para `/app`
- [x] Sair volta para `/login` e limpa a sessão
- [x] F5 mantém a sessão
- [x] Fechar e abrir o navegador mantém a sessão
- [x] `/app` deslogado redireciona para `/login`
- [x] **Fechar/abrir ou logout/login não provoca perda de dados**
- [x] Credencial errada mostra mensagem amigável
