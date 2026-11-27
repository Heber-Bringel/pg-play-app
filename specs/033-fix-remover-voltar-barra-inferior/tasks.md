# ✅ Lista de Tarefas (`tasks.md`): Remover botão Voltar redundante e corrigir erro de retorno nas telas da barra inferior

- **Input:** `specs/033-fix-remover-voltar-barra-inferior/spec.md` e `specs/033-fix-remover-voltar-barra-inferior/plan.md`
- **Issue vinculada:** `#101`
- **Ordem de Execução Obrigatória:** De dentro para fora (`model` → `infra` → `usecase` → `di` → `viewmodel` → `view` → `tests` → verificação)
- **Receitas do Harness:** `/revisar-arquitetura`, `/commit-e-pr`

---

## Fases 1 a 3: Domínio, Infraestrutura, Caso de Uso e DI (`src/model/`, `src/infra/`, `src/usecase/`, `src/di/`)
*Sem alterações necessárias — a correção atua exclusivamente na navegação das ViewModels e na interface da View.*

- [x] **T000** *(N/A)* Confirmar ausência de impacto em `src/model/`, `src/infra/`, `src/usecase/`, `src/di/` e `src/app/`

---

## Fase 4: ViewModels (`src/viewmodel/`)
*Objetivo: Remover a ação legada `handleBack` (e chamadas a `router.back()`) das telas controladas pela `ShortNavigationBar`.*

- [x] **T001** Remover `handleBack` de `ScoreboardActions` e do hook `useScoreboardViewModel` em `src/viewmodel/useScoreboardViewModel.ts`
- [x] **T002** Remover `handleBack` de `TeamsActions` e do hook `useTeamsViewModel` em `src/viewmodel/useTeamsViewModel.ts`

---

## Fase 5: Views (`src/view/`)
*Objetivo: Remover o botão `Voltar` redundante do Placar nos estados vazio e com equipes e unificar o cabeçalho global (`AppHeader`).*

- [x] **T003** Atualizar `src/view/scoreboard.tsx` para remover o botão `Voltar` e a `topBar` legada (estados vazio e com equipes), adicionar `<AppHeader />`, alinhar `scrollContent.paddingTop` a `space.md` e remover imports/estilos não utilizados (`ExpressiveTag`, `topBar`)
- [x] **T004** Auditar todas as telas com `ShortNavigationBar` (`src/view/index.tsx`, `src/view/teams.tsx`, `src/view/scoreboard.tsx`) e ViewModels em `src/viewmodel/` confirmando 0 botões `Voltar` redundantes e 0 chamadas a `router.back()`

---

## Fase 6: Testes Automatizados (`tests/`)
*Objetivo: Atualizar os testes de hooks e telas garantindo regressão contra retorno de botões redundantes ou chamadas a `router.back()`.*

- [x] **T005** Atualizar `tests/hooks/useScoreboardViewModel.test.ts` e `tests/hooks/useTeamsViewModel.test.ts` removendo referências legadas a `handleBack`/`mockBack` e reforçando a validação de `handleSelectNav` via `router.replace`
- [x] **T006** Atualizar `tests/mocks/scoreboardScreen.mock.test.tsx` e `tests/mocks/teamsScreen.mock.test.tsx` removendo `handleBack` dos mocks, validando ausência de botão `Voltar` (estados vazio e com equipes), presença de `AppHeader` no Placar e navegação pela `ShortNavigationBar`

---

## Fase 7: Verificação Arquitetural e Entrega
*Objetivo: Garantir 0 violações no Harness MVVM Sofisticado e preparar commit/PR conforme `CONTRIBUTING.md`.*

- [x] **T007** Executar `npm run check` (`check-arquitetura.mjs`, `check-design-system.mjs`, `tsc --noEmit` e `jest`) e confirmar **0 violações** e **0 erros**
- [x] **T008** Realizar commits convencionais e abrir Pull Request vinculado à Issue `#101` (`Closes #101`) e à spec `specs/033-fix-remover-voltar-barra-inferior/` seguindo `/commit-e-pr`
