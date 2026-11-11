# Plano de Implementação: UC06 — Placar e Ranking Geral do PG

- **Branch**: `feat/005-uc06-placar-ranking` | **Data**: 2026-11-09 | **Spec**: `specs/005-uc06-placar-ranking/spec.md`

---

## 1. Resumo Técnico

Implementar o Caso de Uso **UC06 — Consultar e Gerenciar Placar do PG** (`RF16`, `RF17`), estendendo `IPgPlayUseCases` / `PgPlayUseCases` com ordenação decrescente de ranking (`getScoreboard`), concessão de pontos bônus (`awardBonusPoints`) e reinício de placar (`resetScoreboard`), criando o hook `useScoreboardViewModel` e a tela espelhada `src/view/scoreboard.tsx` ↔ `src/app/scoreboard.tsx`.

---

## 2. Verificação da Constituição (*Constitution Check*)

- [x] **Regra 1 e 2 (Espelhamento `app/` ↔ `view/` 1:1)**: `src/app/scoreboard.tsx` contém apenas 2 linhas reexportando `src/view/scoreboard.tsx`.
- [x] **Regra 3 e 4 (View burra e Navegação na ViewModel)**: `src/view/scoreboard.tsx` não importa `expo-router`; `router.push` e `router.back` ficam restritos a `src/viewmodel/useScoreboardViewModel.ts`.
- [x] **Regra 5 (Assinatura da ViewModel)**: `export function useScoreboardViewModel(useCase: IPgPlayUseCases = pgPlayUseCases): [ScoreboardState, ScoreboardActions]`.
- [x] **Regra 6, 7, 8 e 9 (Domínio Puro e Isolamento de Infra)**: regras de ordenação, bônus e reset ficam em `PgPlayUseCases`.
- [x] **Regra 10 (Design System PG Play Expressive)**: zero cores literais fora de `src/view/theme.ts`; uso de `GameCard` e `ExpressiveButton`.
- [x] **Regra 11 e 12 (Imports `@/` e TypeScript estrito)**: todos os imports usam `@/`, sem `any` ou `React.FC`.

---

## 3. Mapeamento das 7 Camadas (`src/`)

| Camada | Arquivo (caminho completo) | Responsabilidade |
| :--- | :--- | :--- |
| **`src/usecase/`** | `src/usecase/iPgPlayUseCases.ts` e `src/usecase/pgPlayUseCases.ts` | `getScoreboard()`, `awardBonusPoints(teamId, bonusPoints?)` e `resetScoreboard()` |
| **`src/viewmodel/`** | `src/viewmodel/useScoreboardViewModel.ts` | Estados (`teams`, `leaderTeam`, `loading`, `error`), ações (`handleAwardBonus`, `handleResetScoreboard`, `handleChooseAnotherGame`, `handleRetry`) |
| **`src/view/`** | `src/view/scoreboard.tsx` | Tela de Placar e Ranking do Encontro com `GameCard` e `ExpressiveButton` |
| **`src/app/`** | `src/app/scoreboard.tsx` | Rota fina de 2 linhas reexportando `ScoreboardScreen` |
| **`tests/`** | `tests/unit/pgPlayUseCases.scoreboard.test.ts`, `tests/hooks/useScoreboardViewModel.test.ts`, `tests/mocks/scoreboardScreen.mock.test.tsx` | Testes unitários, de hook e de tela com mocks |
