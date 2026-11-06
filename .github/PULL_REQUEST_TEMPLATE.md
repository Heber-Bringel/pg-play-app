## 📌 Resumo da Entrega

<!-- Descreva de forma clara e objetiva o que este Pull Request implementa ou corrige -->

- **Issue relacionada:** Closes #<!-- número da issue -->
- **Artefatos do GitHub Spec Kit:** `specs/<!-- NNN-slug -->/` (`spec.md`, `plan.md`, `tasks.md`)
- **Caso(s) de Uso / Requisito(s):** <!-- Ex.: UC02 (RF04, RF05, RF06) ou Design System -->

---

## 🏗️ Camadas do MVVM Sofisticado Alteradas

Marque as camadas de `src/` que foram criadas ou modificadas neste PR:

- [ ] `src/model/` — Entidades (`type`), Contratos (`i*DataSource`, `i*Service`) ou `errors.ts`
- [ ] `src/infra/` — Implementações concretas (`Memory*`, armazenamento, rede/áudio)
- [ ] `src/usecase/` — Regras de negócio e validações (`i*UseCases.ts` e `*UseCases.ts`)
- [ ] `src/di/container.ts` — Registro e injeção das dependências nos UseCases
- [ ] `src/viewmodel/` — Custom Hook `use*ViewModel.ts` exportando `[state, actions]`
- [ ] `src/view/` — `theme.ts`, `components/` ou telas espelhadas
- [ ] `src/app/` — Rotas finas de 2 linhas ou `_layout.tsx`
- [ ] `tests/` — Testes unitários de UseCases, ViewModels ou Componentes
- [ ] `docs/` ou `design-system/` — Documentação ou especificação visual

---

## 🎨 Tokens e Componentes do Design System Utilizados

<!-- Caso este PR altere src/view/, liste os componentes e tokens de @/view/theme utilizados -->

| Componente / Token (`@/view/theme`) | Onde foi utilizado |
| :--- | :--- |
| Ex.: `ExpressiveButton`, `color.brandPrimary`, `space.xl` | Ex.: `src/view/teams.tsx` |

---

## ✅ Checklist Obrigatório do Harness MVVM

Antes de solicitar revisão, confirme que todos os itens abaixo foram verificados:

- [ ] Executei `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest`) e obtive **0 erros/violações**.
- [ ] **Rotas Finas e Espelhamento 1:1:** Toda rota em `src/app/` (exceto `_layout.tsx`) tem apenas 2 linhas e possui sua tela correspondente no mesmo caminho em `src/view/`.
- [ ] **View Burra e Navegação na ViewModel:** Nenhum arquivo em `src/view/` importa `expo-router`, faz `try/catch` ou acessa `usecase`/`infra`/`di`.
- [ ] **Zero Cores ou Medidas Literais:** Nenhum arquivo fora de `src/view/theme.ts` contém `#hex`, `rgb()` ou `rgba()`.
- [ ] **Isolamento de Infraestrutura:** Apenas `src/di/container.ts` (e os testes em `tests/`) importa de `@/infra/`.
- [ ] **Commits Convencionais:** Os commits seguem o formato `<tipo>(<escopo>): <descrição>` definido no [`CONTRIBUTING.md`](../CONTRIBUTING.md).
