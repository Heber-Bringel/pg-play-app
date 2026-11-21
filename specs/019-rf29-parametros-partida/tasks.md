# ✅ Lista de Tarefas (`tasks.md`): rf29-parametros-partida

- **Input:** `specs/019-rf29-parametros-partida/spec.md` e `specs/019-rf29-parametros-partida/plan.md`
- **Ordem de Execução Obrigatória:** De dentro para fora (`model` → `infra` → `usecase` → `di` → `tests` → `viewmodel` → `view`)

---

## Fase 1: Domínio Puro (`src/model/`)

- [x] **T001** Criar `src/model/entities/matchSettings.ts` com `MimicaSettings`, `QuizSettings`, `ForcaSettings`, `MatchSettings` e `DEFAULT_MATCH_SETTINGS`
- [x] **T002** Criar `src/model/datasources/iMatchSettingsDataSource.ts` com `export interface IMatchSettingsDataSource`

---

## Fase 2: Infraestrutura (`src/infra/`)

- [x] **T003** Implementar `MemoryMatchSettingsDataSource` (`implements IMatchSettingsDataSource`) em `src/infra/datasources/memoryMatchSettingsDataSource.ts`
- [x] **T004** Implementar `AsyncStorageMatchSettingsDataSource` (`implements IMatchSettingsDataSource`) em `src/infra/datasources/asyncStorageMatchSettingsDataSource.ts`

---

## Fase 3: Caso de Uso e DI (`src/usecase/` e `src/di/`)

- [x] **T005** Adicionar `getMatchSettings`, `updateMimicaSettings`, `updateQuizSettings` e `updateForcaSettings` em `src/usecase/iPgPlayUseCases.ts` e `src/usecase/pgPlayUseCases.ts` (validando faixas e lançando `ValidationError`)
- [x] **T006** Injetar `AsyncStorageMatchSettingsDataSource` em `PgPlayUseCases` no `src/di/container.ts` (dependência obrigatória; os testes usam `MemoryMatchSettingsDataSource`)

---

## Fase 4: Testes Unitários da Regra de Negócio (`tests/unit/`)

- [x] **T007** Criar `tests/unit/pgPlayUseCases.matchSettings.test.ts` cobrindo padrões, persistência e `ValidationError`

---

## Fase 5: Apresentação (`src/viewmodel/`, `src/view/` e `tests/`)

- [x] **T008** Integrar carregamento/salvamento de parâmetros em `useMimicaViewModel.ts`, `useQuizViewModel.ts` (incluindo `questionCount`: `5` / `10` / `15`) e `useForcaViewModel.ts`
- [x] **T009** Exibir a seção *"Parâmetros da Partida"* com `ExpressiveChip` no turno 1 de `src/view/mimica.tsx`, `src/view/quiz.tsx` e `src/view/forca.tsx`
- [x] **T010** Atualizar/adicionar testes de hooks e mocks (`useQuizViewModel.test.ts`, `useMimicaViewModel.test.ts`, `useForcaViewModel.test.ts` e `*Screen.mock.test.tsx`)

---

## Fase 5b: Ajustes da revisão

- [x] **T013** Gravação parcial e serializada dos parâmetros no `UseCase` (sem sobrescrita entre toques seguidos)
- [x] **T014** Sanear valores inválidos do armazenamento ao carregar
- [x] **T015** `planQuizMatch`: total de perguntas múltiplo do número de equipes e aviso na tela do Quiz
- [x] **T016** Remover regras duplicadas e tipos repetidos das ViewModels (tipos vêm de `@/model/entities/matchSettings`)
- [x] **T017** Rótulos acessíveis nos chips, "Ver Resultado" no último turno da Mímica e testes de tela e de `AsyncStorage`
- [x] **T018** Alinhar padrões às docs dos jogos (Quiz `10` perguntas, Forca `6` tentativas) e documentar a alternância justa em `docs/jogos/quiz-relampago.md`
- [x] **T019** Atualizar a branch com a `develop` (`08f31e1`) e resolver o conflito em `src/di/container.ts`

## Fase 6: Verificação e PR

- [x] **T011** Executar `npm run check` e confirmar **0 violações**
- [ ] **T012** Realizar commits convencionais e abrir Pull Request vinculado à Issue `#31`
