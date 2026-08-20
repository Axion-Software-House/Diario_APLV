# animations/

Envoltórios visuais adaptados do [ReactBits](https://www.reactbits.dev/).
Nenhum deles tem regra de negócio: são wrappers de apresentação e podem sair
de qualquer tela sem alterar o que é registrado.

Limites herdados de `docs/04-design-system.md`:

- nada acima de `--duration-slow` (320ms);
- `prefers-reduced-motion` desliga tudo — via `useReducedMotion()`;
- nenhum efeito entra em tela de registro a ponto de atrasar o salvamento;
- fundo animado, partículas, 3D, parallax e texto animado continuam fora.

Os originais do ReactBits usam Tailwind e, em alguns casos, `gsap` +
`ScrollTrigger`. Aqui foram portados para CSS Modules com os tokens do
projeto e para `motion`, que já cobre o que precisamos com um peso menor.
