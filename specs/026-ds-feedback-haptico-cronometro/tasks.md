# ✅ Lista de Tarefas (`tasks.md`): ds-feedback-haptico-cronometro

- **Input:** `specs/026-ds-feedback-haptico-cronometro/spec.md` e `specs/026-ds-feedback-haptico-cronometro/plan.md`
- **Issue:** `#77`
- **Ordem de Execução Obrigatória:** De dentro para fora (`model` → `infra` → `usecase` → `di` → `tests` → `viewmodel` → `view` → `docs`)

---

## Fase 1: Domínio Puro (`src/model/`)

- [x] **T001** Adicionar `triggerTimerPulse()` e `triggerTimerExpired()` em `src/model/services/iHapticService.ts`

## Fase 2: Infraestrutura (`src/infra/`)

- [x] **T002** `ExpoHapticService`: pulso com `impactAsync(Light)` e esgotado com `notificationAsync(Error)`, ambos com degradação silenciosa
- [x] **T003** `MemoryHapticService`: contar pulsos e esgotados em `getTimerCounts()` (o `getCounts()` do Quem Sou Eu fica igual)

## Fase 3: Caso de Uso e DI (`src/usecase/` e `src/di/`)

- [x] **T004** Criar `src/usecase/iTimerFeedbackUseCases.ts` e `src/usecase/timerFeedbackUseCases.ts` com a regra da tabela do plano
- [x] **T005** Registrar `timerFeedbackUseCases` em `src/di/container.ts`, reaproveitando o `hapticService` existente

## Fase 4: Testes da regra e do serviço (`tests/unit/`)

- [x] **T006** `tests/unit/timerFeedbackUseCases.test.ts` (sequência 15→0, `reduceMotion`, subida, repetição e salto)
- [x] **T007** Teste do `ExpoHapticService` para os métodos novos (chamada certa e sem exceção quando o `expo-haptics` falha)

## Fase 5: Apresentação (`src/viewmodel/` e `src/view/`)

- [x] **T008** `useMimicaViewModel` e `useQuizViewModel`: 2º parâmetro `ITimerFeedbackUseCases`, `reduceMotion` no estado, `handleSetReduceMotion` e efeito do tick
- [x] **T009** `useQuemSouEuViewModel` e `useVersiculoViewModel`: idem
- [x] **T010** Criar `src/view/components/useReduceMotion.ts`
- [x] **T011** Telas `mimica.tsx`, `quiz.tsx`, `quem-sou-eu.tsx` e `versiculo.tsx`: usar o hook, repassar à ViewModel e ao `ExpressiveTimer`
- [x] **T012** Testes das ViewModels em `tests/hooks/timerFeedback.viewmodels.test.ts` (1 caso por jogo, com `TimerFeedbackUseCases` real e `MemoryHapticService`) e mocks das telas de Mímica, Quiz e Versículo

## Fase 6: Documentação

- [x] **T013** Seção de feedback tátil em `design-system/04-componentes/cronometro-expressivo.md`

## Fase 6b: Adendo — vibração de acerto e erro

- [x] **T017** Renomear `TimerFeedbackUseCases` para `GameFeedbackUseCases` (interface, classe, container, ViewModels e testes)
- [x] **T018** `IHapticService`: `triggerAnswerWrong()` e `triggerLetterWrong()` no Expo e no Memory (contagem em `getTimerCounts()` → `getFeedbackCounts()`)
- [x] **T019** `GameFeedbackUseCases`: `notifyAnswer(outcome)` e `notifyLetterGuess(isInWord)`, com testes
- [x] **T020** ViewModels: Quiz (`handleSelectOption`), Forca (`handleGuessLetter`: letra errada, palavra completa, palavra perdida) e Versículo (`submitAnswers`), recebendo `IGameFeedbackUseCases` como 2º parâmetro
- [x] **T021** Testes das 3 ViewModels: acerto, erro e tempo esgotado sem vibração dupla
- [x] **T022** Doc: `alternativa-quiz.md` e `teclado-forca.md`

## Fase 7: Verificação e PR

- [x] **T014** `npm run check` com **0 violações** (385 testes). No navegador (sem motor háptico), um turno do Quiz chegou a `00:00` sem erros no console
- [ ] **T015** Teste manual no celular (Expo Go): 10 pulsos e 1 vibração forte; com "Reduzir movimento", só a forte; Quiz/Forca/Versículo vibram diferente no acerto e no erro
- [ ] **T016** Commits convencionais e PR para a `develop` com `Closes #77` (`/commit-e-pr`)
