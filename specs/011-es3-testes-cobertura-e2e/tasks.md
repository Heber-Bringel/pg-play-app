# ✅ Lista de Tarefas (`tasks.md`): Suíte Completa de Testes Automatizados, Cobertura >= 80% e 3 Fluxos E2E (ES3)

- **Input:** `specs/011-es3-testes-cobertura-e2e/spec.md` e `specs/011-es3-testes-cobertura-e2e/plan.md`
- **Ordem de Execução Obrigatória:** Infra/Unitário → Componentes RNTL → Mocks → Hooks → Integração Real → Cobertura >= 80% → E2E Maestro (com commits separados por categoria)
- **Receitas do Harness:** `/revisar-arquitetura`, `/commit-e-pr`

---

## Fase 1: Preparação do Ambiente de Testes e Auditoria Inicial
*Objetivo: Habilitar `@testing-library/react-native` e mapear exatamente os ramos descobertos abaixo de 80%.*

- [ ] **T001** Instalar `@testing-library/react-native` compatível com `react@19.3.0` e validar execução com `tests/__mocks__/react-native.tsx`
- [ ] **T002** Executar `npm run test:coverage` e registrar os arquivos com `Branches < 80%` (`asyncStorageTeamDataSource.ts`, `supabaseMultiplayerRoomService.ts`, `useAdedonhaViewModel.ts`, `useCidadeDormeViewModel.ts`, `useHubViewModel.ts`, `useTeamsViewModel.ts` e seções em `src/view/components/`)

---

## Fase 2: Testes de Componentes com RNTL (`tests/components/`) — Commit Categoria 1
*Objetivo: Cobrir os 6 componentes oficiais do Design System (+ `ExpressiveChip` e `ConfirmModal`) com consultas semânticas RNTL.*

- [ ] **T003** Criar testes RNTL em `tests/components/expressiveButton.test.tsx` e `tests/components/expressiveTextField.test.tsx` (`getByRole`, `getByLabelText`, `fireEvent.press`, `fireEvent.changeText`, `accessibilityState.disabled`)
- [ ] **T004** Criar testes RNTL em `tests/components/expressiveTimer.test.tsx`, `tests/components/quizOption.test.tsx`, `tests/components/letterKey.test.tsx` e `tests/components/gameCard.test.tsx` validando estados visuais, cor + forma + ícone e bloqueio quando desabilitado
- [ ] **T005** Commit incremental: `test(view): migrar testes dos componentes do design system para rntl`

---

## Fase 3: Testes Unitários de Infra e UseCases (`tests/unit/`) — Commit Categoria 2
*Objetivo: Elevar cobertura de `infra/` e `usecase/` para superar 80% de branches.*

- [ ] **T006** Criar `tests/unit/asyncStorageTeamDataSource.test.ts` cobrindo leitura inicial padrão, persistência de equipes, remoção, soma de pontuação, reset e erro convertido em `DataSourceError`
- [ ] **T007** Ampliar `tests/unit/supabaseMultiplayerRoomService.test.ts` cobrindo fluxos de erro, reconexão, listeners Realtime e métodos de Adedonha/Cidade Dorme
- [ ] **T008** Revisar e ampliar `tests/unit/cidadeDormeUseCases.test.ts`, `tests/unit/adedonhaUseCases.test.ts` e `tests/unit/pgPlayUseCases.*.test.ts` fechando todos os ramos `ValidationError` e bordas
- [ ] **T009** Commit incremental: `test(usecase): ampliar cobertura unitaria de regras e persistencia`

---

## Fase 4: Testes de Hooks e Telas com Mocks (`tests/hooks/` e `tests/mocks/`) — Commits Categorias 3 e 4
*Objetivo: Garantir cobertura dos blocos `catch (err: unknown)` nas ViewModels e dos 4 estados (`loading`, `error`, `empty`, `content`) nas Views.*

- [ ] **T010** Ampliar `tests/hooks/useHubViewModel.test.ts`, `useTeamsViewModel.test.ts`, `useMimicaViewModel.test.ts`, `useQuizViewModel.test.ts`, `useForcaViewModel.test.ts`, `useAdedonhaViewModel.test.ts` e `useCidadeDormeViewModel.test.ts` para cobrir erros inesperados, retry e limites
- [ ] **T011** Commit incremental: `test(viewmodel): cobrir ramos de erro e transicoes nos hooks de viewmodel`
- [ ] **T012** Garantir em `tests/mocks/*.mock.test.tsx` cobertura explícita dos 4 estados (`loading`, `error`, `empty`, `content`) e callbacks das seções em `src/view/components/`
- [ ] **T013** Commit incremental: `test(view): ampliar testes de telas com mocks cobrindo quatro estados`

---

## Fase 5: Testes de Integração Real (`tests/integration/`) — Commit Categoria 5
*Objetivo: Validar integração `View + ViewModel + UseCase + MemoryDataSource` sem mockar o domínio.*

- [ ] **T014** Criar `tests/integration/hubFlow.integration.test.tsx` testando catálogo real, destaque da equipe líder, filtro por modalidade (`1 Celular` / `Multi-Celular` / `Todos`) e navegação ao selecionar jogo
- [ ] **T015** Criar `tests/integration/teamsManagement.integration.test.tsx` testando cadastro válido, erro de nome curto/duplicado (`ValidationError` real), remoção para `< 2` equipes (`disabled`) e estado vazio (`0` equipes)
- [ ] **T016** Criar `tests/integration/quizRound.integration.test.tsx` testando passagem de turno (`"Estou Pronto!"`), resposta de pergunta, atualização real no `MemoryTeamDataSource` e chegada ao resumo/placar
- [ ] **T017** Commit incremental: `test(tests): adicionar testes de integracao real entre view e dominio`

---

## Fase 6: Meta de Cobertura (>= 80%), Fluxos E2E Maestro (`e2e/`) e Verificação Final — Commit Categoria 6
*Objetivo: Impor threshold global no Jest, criar 3 fluxos E2E reproduzíveis e validar ausência de `.only`/`.skip`.*

- [ ] **T018** Configurar `coverageThreshold` global com `80%` em `branches`, `functions`, `lines` e `statements` no `jest.config.js` e confirmar aprovação em `npm run test:coverage`
- [ ] **T019** Criar `e2e/01-hub-e-cadastro-equipes.yaml`, `e2e/02-partida-quiz-ate-placar.yaml` e `e2e/03-partida-forca-e-reinicio.yaml` com `appId: br.edu.ifpi.pgplay`, `launchApp: { clearState: true }` e asserções semânticas sem `sleep` fixo
- [ ] **T020** Verificar ausência de `.only` / `.skip` em `tests/`, executar `npm run check` e `npm run test:coverage` confirmando **0 violações** e meta `>= 80%`
- [ ] **T021** Commit incremental: `test(tests): configurar cobertura minima de 80% e adicionar fluxos e2e` e abrir Pull Request vinculando `Closes #17`
