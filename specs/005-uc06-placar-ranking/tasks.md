# Lista de Tarefas: UC06 — Placar e Ranking Geral do PG

- **Input**: Documentos de design em `specs/005-uc06-placar-ranking/` (`spec.md` e `plan.md`)

---

## Fase 1: Camada `usecase/` (Regras de Negócio)

- [x] **T001** [US1/US2] Estender `src/usecase/iPgPlayUseCases.ts` e `src/usecase/pgPlayUseCases.ts` com `getScoreboard()`, `awardBonusPoints(teamId, bonusPoints)` e `resetScoreboard()`.

---

## Fase 2: Testes Unitários do Caso de Uso (`tests/unit/`)

- [x] **T002** [US1/US2] Criar `tests/unit/pgPlayUseCases.scoreboard.test.ts` cobrindo ordenação decrescente, bônus de pontos, reinício de placar e erros de validação (`ValidationError`).

---

## Fase 3: Camadas `viewmodel/`, `view/` e `app/` (Interface e Navegação)

- [x] **T003** [US1/US2] Criar `src/viewmodel/useScoreboardViewModel.ts` com estados, ações e navegação via `expo-router`.
- [x] **T004** [US1/US2] Criar `src/view/scoreboard.tsx` utilizando `tokens`, `GameCard` e `ExpressiveButton`.
- [x] **T005** [US1/US2] Criar rota fina `src/app/scoreboard.tsx` espelhando `src/view/scoreboard.tsx`.

---

## Fase 4: Testes de Hook e de Tela com Mocks (`tests/hooks/` e `tests/mocks/`)

- [x] **T006** [P] Criar `tests/hooks/useScoreboardViewModel.test.ts` e `tests/mocks/scoreboardScreen.mock.test.tsx`.
- [x] **T007** Executar `npm run check` e garantir 0 violações.
