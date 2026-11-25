# ✅ Lista de Tarefas (`tasks.md`): UC12 — Desenho Relâmpago

- **Input:** `specs/028-uc12-desenho-relampago/spec.md` e `specs/028-uc12-desenho-relampago/plan.md`
- **Issue vinculada:** `#83`
- **Ordem de Execução Obrigatória:** De dentro para fora (`model` → `infra` → `usecase` → `di` → `tests` → `theme/deps` → `viewmodel` → `view` → `app`)
- **Receitas do Harness:** `/nova-funcionalidade`, `/sincronizar-tema`, `/nova-tela`, `/revisar-arquitetura`, `/commit-e-pr`

---

## Fase 1: Domínio Puro (`src/model/`)
*Objetivo: Definir entidades (`type`) e contratos (`interface`) sem nenhuma dependência externa.*

- [x] **T001** Criar `src/model/entities/drawingChallenge.ts` com os tipos puros `DrawingPenColorId`, `DrawingStrokeWidthId`, `DrawingPoint`, `DrawingStroke`, `DesenhoCategory` e `DesenhoCard`
- [x] **T002** Atualizar `src/model/entities/minigame.ts` (`MinigameRoute` com `'/desenho'` e `MinigameIconName` com `'palette'`) e `src/model/entities/contentPack.ts` (`ContentPackGameId` com `'desenho'` e `ContentPackCategory` com `DesenhoCategory`)
- [x] **T003** Atualizar `src/model/entities/matchSettings.ts` adicionando `DesenhoDurationOption` (`60 | 90 | 120`), `DesenhoSettings` e `desenho` em `MatchSettings` e `DEFAULT_MATCH_SETTINGS` (`durationSeconds: 90, totalRounds: 3`)
- [x] **T004** Atualizar contrato `IGameCatalogDataSource` em `src/model/datasources/iGameCatalogDataSource.ts` adicionando `listDesenhoCards(categories?: DesenhoCategory[]): Promise<DesenhoCard[]>`

---

## Fase 2: Infraestrutura Offline/Memória e Persistência (`src/infra/`)
*Objetivo: Implementar o catálogo de pacotes desenháveis e a persistência retrocompatível de parâmetros.*

- [x] **T005** Atualizar `src/infra/datasources/memoryGameCatalogDataSource.ts` registrando o minigame `'desenho'` no Hub, os 5 `ContentPack` de `'desenho'`, o banco próprio de palavras concretas desenháveis em `listDesenhoCards` e o 6º parâmetro opcional `initialDesenhoCards` no construtor
- [x] **T006** Atualizar `src/infra/datasources/memoryMatchSettingsDataSource.ts` e `src/infra/datasources/asyncStorageMatchSettingsDataSource.ts` incluindo a seção `desenho` com fallback automático para `DEFAULT_MATCH_SETTINGS.desenho`

---

## Fase 3: Caso de Uso e Injeção de Dependências (`src/usecase/` e `src/di/`)
*Objetivo: Concentrar validações (`ValidationError`), pontuação (`+20` / `-5` com piso `0`) e parâmetros em `PgPlayUseCases`.*

- [x] **T007** Atualizar contrato `IPgPlayUseCases` em `src/usecase/iPgPlayUseCases.ts` com `listDesenhoCards`, `scoreDesenhoHit`, `scoreDesenhoSkip` e `updateDesenhoSettings`
- [x] **T008** Implementar `listDesenhoCards`, `scoreDesenhoHit`, `scoreDesenhoSkip`, `updateDesenhoSettings`, constantes `DEFAULT_DESENHO_HIT_POINTS` / `DEFAULT_DESENHO_SKIP_PENALTY` e saneamento de `desenho` em `src/usecase/pgPlayUseCases.ts` (incluindo `'desenho'` em `VALID_CONTENT_PACK_GAMES`)
- [x] **T009** Verificar wiring de `pgPlayUseCases` e `gameFeedbackUseCases` em `src/di/container.ts`

---

## Fase 4: Testes Unitários de Domínio/UseCase e Atualização de Testes Existentes (`tests/`)
*Objetivo: Validar isoladamente o UseCase, o armazenamento e atualizar os testes/mocks existentes impactados pelos novos contratos.*

- [x] **T010** Criar `tests/unit/pgPlayUseCases.desenho.test.ts` cobrindo card no Hub, pacotes e cartas por categoria, acerto (`+20 pts`), pulo (`-5 pts` e piso `0`) e casos de `ValidationError`
- [x] **T011** Atualizar `tests/unit/pgPlayUseCases.matchSettings.test.ts`, `tests/unit/asyncStorageMatchSettingsDataSource.test.ts`, `tests/unit/pgPlayUseCases.hub.test.ts` e os mocks de `IPgPlayUseCases`/`MatchSettings` em `tests/hooks/{useHub,useForca,useMimica,useScoreboard}ViewModel.test.ts`

---

## Fase 5: Dependência Expo, Mocks Jest e Sincronização de Tokens (`/sincronizar-tema`)
*Objetivo: Instalar `react-native-svg`, preparar os mocks de teste e sincronizar os tokens `canvas.*` aprovados no Design System.*

- [x] **T012** Instalar `react-native-svg` via `npx expo install react-native-svg`, adicionar mock em `tests/__mocks__/react-native-svg.tsx` + `jest.config.js` e exportar `PanResponder` em `tests/__mocks__/react-native.tsx`
- [x] **T013** Sincronizar os tokens semânticos (`color.canvasPaper`, `color.canvasInk`, `color.canvasPurple`, `color.canvasCoral`, `color.canvasGreen`) e de componente (`component.canvas`, incluindo `pen.onPen` e export nomeado `canvas`) em `src/view/theme.ts` conforme `design-system/02-tokens.md`
- [x] **T014** Atualizar `tests/tokens.test.ts` validando estrutura e razão de contraste WCAG (`>= 4,5:1`) das 4 canetas sobre `canvas.paperBg` e de `canvas.pen.onPen` sobre as 4 canetas nos modos claro e escuro

---

## Fase 6: Apresentação — ViewModel, Componente, View e Rota Fina (`src/viewmodel/`, `src/view/`, `src/app/`)
*Objetivo: Construir a `useDesenhoViewModel`, o `DrawingCanvas`, a tela `desenho.tsx` e a rota fina de 2 linhas na ordem canônica.*

- [x] **T015** Implementar `src/viewmodel/useDesenhoViewModel.ts` retornando `[DesenhoState, DesenhoActions]` (fases `pass-turn`, `drawing`, `turn-summary`, `finished`; estado de traços; ocultar/mostrar palavra; última palavra em andamento no `turn-summary`; sorteio sem repetição; `IGameFeedbackUseCases.notifyTimerTick` com `reduceMotion`; saída segura e navegação `expo-router`)
- [x] **T016** Implementar `src/view/components/drawingCanvas.tsx` com `Svg`/`Path` + `PanResponder` (ponto único, cancelamento seguro ao bloquear, `onDrawingStart`/`onDrawingEnd`), 4 cores com ícone `check` em `canvas.pen.onPen`, 2 espessuras, *"Desfazer"*, *"Limpar"*, alvos `>= 48 dp`, `useKeyboardFocus` e exclusivamente tokens de `useTheme()`
- [x] **T017** Implementar `src/view/desenho.tsx` consumindo `useDesenhoViewModel()`, `useReduceMotion` e `useTheme()`, contemplando os estados `loading`, `error`, equipes insuficientes, as 4 fases da partida e bloqueio do `ScrollView` durante o desenho
- [x] **T018** Criar a rota fina de 2 linhas em `src/app/desenho.tsx` reexportando `@/view/desenho`

---

## Fase 7: Testes de Interface, Verificação Determinística e Governança Git
*Objetivo: Atingir cobertura completa por categoria (ES III), 0 violações em `npm run check` e commits convencionais incrementais (sem criar PR para `develop`).*

- [x] **T019** Criar teste de componente RNTL em `tests/components/drawingCanvas.test.tsx` validando folha, gestos (`PanResponder`, ponto único, `onDrawingStart`/`onDrawingEnd`), acessibilidade da barra de ferramentas, seleção de cor/espessura e ações de desfazer/limpar
- [x] **T020** Criar teste de hook em `tests/hooks/useDesenhoViewModel.test.ts` e atualizar `tests/hooks/gameFeedback.viewmodels.test.ts` cobrindo fases, traços, pontuação, reciclagem de pulos, última palavra no resumo, fim do tempo, feedback háptico e saída segura
- [x] **T021** Criar teste de tela com mock em `tests/mocks/desenhoScreen.mock.test.tsx` (`loading`, `error`, equipes insuficientes, fases e rota fina) e teste de integração real em `tests/integration/desenho.integration.test.tsx`
- [x] **T022** Executar `npm run check` (`check-arquitetura.mjs`, `check-design-system.mjs`, `tsc --noEmit` e `jest`) garantindo **0 violações e 0 erros**
- [x] **T023** Realizar commits convencionais incrementais na branch `feat/028-uc12-desenho-relampago` (separando camadas e commits `test(...)` por categoria, referenciando `#83` e `UC12`), **sem abrir Pull Request para `develop`**
