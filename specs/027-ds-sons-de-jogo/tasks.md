# ✅ Lista de Tarefas (`tasks.md`): ds-sons-de-jogo

- **Input:** `specs/027-ds-sons-de-jogo/spec.md` e `specs/027-ds-sons-de-jogo/plan.md`
- **Issue:** `#84`
- **Ordem de Execução Obrigatória:** De dentro para fora (`assets/docs` → `model` → `infra` → `usecase` → `di` → `tests` → `viewmodel` → `view` → `app`)

---

## Fase 0: Sons Livres de Direitos (CC0), Dependência e Design System

- [x] **T001** Instalar `expo-audio` compatível com o Expo SDK 58 (`npx expo install expo-audio`) e criar os 6 arquivos de áudio curtos (`< 1 s`, `< 50 KB`, licença CC0) em `assets/sons/` (`acerto.wav`, `erro.wav`, `letra-errada.wav`, `passe.wav`, `alerta-10s.wav`, `tempo-esgotado.wav`) junto com `assets/sons/CREDITOS.md`.
- [x] **T002** Documentar o comportamento sonoro em `design-system/04-componentes/cronometro-expressivo.md`, `design-system/04-componentes/alternativa-quiz.md` e `design-system/04-componentes/teclado-forca.md`.

---

## Fase 1: Domínio Puro (`src/model/`)

- [x] **T003** Criar a entidade `src/model/entities/soundPreference.ts` (`export type SoundPreference = { enabled: boolean };`).
- [x] **T004** Criar o contrato `src/model/datasources/iSoundPreferenceDataSource.ts` (`getSoundPreference`, `setSoundPreference`).
- [x] **T005** Criar o contrato `src/model/services/iSoundService.ts` (`playCorrect`, `playWrong`, `playLetterWrong`, `playPass`, `playTimerCritical`, `playTimerExpired`).

---

## Fase 2: Infraestrutura (`src/infra/`)

- [x] **T006** Implementar `src/infra/datasources/memorySoundPreferenceDataSource.ts` e `src/infra/datasources/asyncStorageSoundPreferenceDataSource.ts` (padrão `{ enabled: true }`, fallback seguro para JSON inválido e conversão de falhas em `DataSourceError`).
- [x] **T007** Implementar `src/infra/services/memorySoundService.ts` (registrando contadores de cada som) e `src/infra/services/expoAudioSoundService.ts` (pré-carregamento dos sons, respeito ao modo silencioso do iOS e degradação silenciosa com `try/catch`).

---

## Fase 3: Caso de Uso e Injeção de Dependências (`src/usecase/` e `src/di/`)

- [x] **T008** Criar `src/usecase/iSoundPreferenceUseCases.ts` e `src/usecase/soundPreferenceUseCases.ts` (`getSoundPreference`, `setSoundEnabled`, `toggleSoundEnabled`).
- [x] **T009** Estender `src/usecase/iGameFeedbackUseCases.ts` e `src/usecase/gameFeedbackUseCases.ts` com `notifyPass()` e suporte a `ISoundService` + `ISoundPreferenceDataSource` (tocando o alerta de `10s` apenas 1 vez em `11 → 10` e silenciando sons quando `enabled === false`).
- [x] **T010** Registrar `soundPreferenceDataSource`, `soundService`, `soundPreferenceUseCases` e atualizar `gameFeedbackUseCases` em `src/di/container.ts`.

---

## Fase 4: Testes Unitários (`tests/unit/`)

- [x] **T011** Criar mock `tests/__mocks__/expo-audio.ts` e testes unitários em `tests/unit/expoAudioSoundService.test.ts`, `tests/unit/asyncStorageSoundPreferenceDataSource.test.ts` e `tests/unit/soundPreferenceUseCases.test.ts`.
- [x] **T012** Atualizar e expandir `tests/unit/gameFeedbackUseCases.test.ts` cobrindo todos os sons com som ligado, som desligado e alerta único em `10s`.

---

## Fase 5: Apresentação (`src/viewmodel/`, `src/view/` e `src/app/`)

- [x] **T013** Criar `src/viewmodel/useSoundPreferenceViewModel.ts` e integrar `notifyAnswer('correct')` e `notifyPass()` em `src/viewmodel/useMimicaViewModel.ts` e `src/viewmodel/useQuemSouEuViewModel.ts`.
- [x] **T014** Expor a preferência de som no `ThemeProvider` (`useSoundPreference` em `src/view/theme.ts`), criar o `SoundToggleButton` (`volume-high` / `volume-off`, alvo de `48 dp`, `accessibilityLabel`) em `src/view/components/themeModeSwitcher.tsx` e integrá-lo ao cabeçalho em `src/app/_layout.tsx` e `src/view/index.tsx`.
- [x] **T015** Criar `tests/hooks/useSoundPreferenceViewModel.test.ts` e atualizar `tests/hooks/gameFeedback.viewmodels.test.ts` e `tests/mocks/hubScreen.mock.test.tsx`.

---

## Fase 6: Verificação Final e Pull Request

- [x] **T016** Executar `npm run check` (`check-arquitetura`, `check-design-system`, `tsc --noEmit` e `jest`) garantindo **0 violações e 100% dos testes passando**, fazer os commits convencionais na branch `feat/027-ds-sons-de-jogo` e abrir o PR para `develop` com **Héber Bringel (`@Heber-Bringel`)** e **Douglas Leone (`@DouglasLeone`)** como revisores.
