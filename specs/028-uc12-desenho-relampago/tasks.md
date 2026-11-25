# ✅ Lista de Tarefas (`tasks.md`): UC12 — Desenho Relâmpago

- **Input:** `specs/028-uc12-desenho-relampago/spec.md` e `specs/028-uc12-desenho-relampago/plan.md`
- **Issue vinculada:** `#83`
- **Ordem de Execução Obrigatória:** De dentro para fora (`theme/deps` → `model` → `infra` → `usecase` → `di` → `tests` → `viewmodel` → `view` → `app`)
- **Receitas do Harness:** `/sincronizar-tema`, `/nova-funcionalidade`, `/nova-tela`, `/revisar-arquitetura`, `/commit-e-pr`

---

## Fase 0: Dependência Expo e Sincronização de Tokens (`/sincronizar-tema`)
*Objetivo: Instalar `react-native-svg` de forma compatível com o SDK Expo e sincronizar os tokens `canvas.*` aprovados no Design System antes de criar componentes.*

- [ ] **T001** Instalar `react-native-svg` via `npx expo install react-native-svg` (configurando mock leve em `tests/` caso necessário para o Jest)
- [ ] **T002** Sincronizar os tokens semânticos (`color.canvasPaper`, `color.canvasInk`, `color.canvasPurple`, `color.canvasCoral`, `color.canvasGreen`) e de componente (`component.canvas`) em `src/view/theme.ts` conforme `design-system/02-tokens.md`
- [ ] **T003** Atualizar `tests/tokens.test.ts` validando estrutura e razão de contraste WCAG (`>= 4,5:1`) das 4 canetas sobre `canvas.paperBg` nos modos claro e escuro

---

## Fase 1: Domínio Puro (`src/model/`)
*Objetivo: Definir entidades (`type`) e contratos (`interface`) sem nenhuma dependência externa.*

- [ ] **T004** Criar `src/model/entities/drawingChallenge.ts` com os tipos puros `DrawingPenColorId`, `DrawingStrokeWidthId`, `DrawingPoint`, `DrawingStroke`, `DesenhoCategory` e `DesenhoCard`
- [ ] **T005** Atualizar `src/model/entities/minigame.ts` (`MinigameRoute` com `'/desenho'` e `MinigameIconName` com `'palette'`) e `src/model/entities/contentPack.ts` (`ContentPackGameId` com `'desenho'` e `ContentPackCategory` com `DesenhoCategory`)
- [ ] **T006** Atualizar `src/model/entities/matchSettings.ts` adicionando `DesenhoDurationOption` (`60 | 90 | 120`), `DesenhoSettings` e `desenho` em `MatchSettings` e `DEFAULT_MATCH_SETTINGS` (`durationSeconds: 90, totalRounds: 3`)
- [ ] **T007** Atualizar contrato `IGameCatalogDataSource` em `src/model/datasources/iGameCatalogDataSource.ts` adicionando `listDesenhoCards(categories?: DesenhoCategory[]): Promise<DesenhoCard[]>`

---

## Fase 2: Infraestrutura Offline/Memória e Persistência (`src/infra/`)
*Objetivo: Implementar o catálogo de pacotes desenháveis e a persistência retrocompatível de parâmetros.*

- [ ] **T008** Atualizar `src/infra/datasources/memoryGameCatalogDataSource.ts` registrando o minigame `'desenho'` no Hub, os 5 `ContentPack` de `'desenho'` e o banco próprio de palavras concretas desenháveis em `listDesenhoCards`
- [ ] **T009** Atualizar `src/infra/datasources/memoryMatchSettingsDataSource.ts` e `src/infra/datasources/asyncStorageMatchSettingsDataSource.ts` incluindo a seção `desenho` com fallback automático para `DEFAULT_MATCH_SETTINGS.desenho`

---

## Fase 3: Caso de Uso e Injeção de Dependências (`src/usecase/` e `src/di/`)
*Objetivo: Concentrar validações (`ValidationError`), pontuação (`+20` / `-5` com piso `0`) e parâmetros em `PgPlayUseCases`.*

- [ ] **T010** Atualizar contrato `IPgPlayUseCases` em `src/usecase/iPgPlayUseCases.ts` com `listDesenhoCards`, `scoreDesenhoHit`, `scoreDesenhoSkip` e `updateDesenhoSettings`
- [ ] **T011** Implementar `listDesenhoCards`, `scoreDesenhoHit`, `scoreDesenhoSkip`, `updateDesenhoSettings` e saneamento de `desenho` em `src/usecase/pgPlayUseCases.ts` (incluindo `'desenho'` em `VALID_CONTENT_PACK_GAMES`)
- [ ] **T012** Verificar wiring de `pgPlayUseCases` e `gameFeedbackUseCases` em `src/di/container.ts`

---

## Fase 4: Testes Unitários da Regra de Negócio e Infraestrutura (`tests/unit/`)
*Objetivo: Validar isoladamente o UseCase e o armazenamento antes de construir ViewModel e View.*

- [ ] **T013** Criar `tests/unit/pgPlayUseCases.desenho.test.ts` cobrindo card no Hub, pacotes e cartas por categoria, acerto (`+20 pts`), pulo (`-5 pts` e piso `0`) e casos de `ValidationError`
- [ ] **T014** Atualizar `tests/unit/pgPlayUseCases.matchSettings.test.ts` e `tests/unit/asyncStorageMatchSettingsDataSource.test.ts` cobrindo `updateDesenhoSettings` e retrocompatibilidade de JSON sem a chave `desenho`

---

## Fase 5: Apresentação — Componente, ViewModel, View e Rota Fina (`src/viewmodel/`, `src/view/`, `src/app/`)
*Objetivo: Construir o `DrawingCanvas`, a `useDesenhoViewModel`, a tela `desenho.tsx` e a rota fina de 2 linhas.*

- [ ] **T015** Implementar `src/view/components/drawingCanvas.tsx` com `Svg`/`Path` + `PanResponder`, 4 cores, 2 espessuras, *"Desfazer"*, *"Limpar"*, alvos `>= 48 dp`, `useKeyboardFocus` e exclusivamente tokens de `useTheme()`
- [ ] **T016** Implementar `src/viewmodel/useDesenhoViewModel.ts` retornando `[DesenhoState, DesenhoActions]` (fases `pass-turn`, `drawing`, `turn-summary`, `finished`; estado de traços; ocultar palavra; sorteio sem repetição; `IGameFeedbackUseCases.notifyTimerTick`; saída segura e navegação `expo-router`)
- [ ] **T017** Implementar `src/view/desenho.tsx` consumindo `useDesenhoViewModel()`, `useReduceMotion` e `useTheme()`, contemplando os estados `loading`, `error`, equipes insuficientes e as 4 fases da partida
- [ ] **T018** Criar a rota fina de 2 linhas em `src/app/desenho.tsx` reexportando `@/view/desenho`

---

## Fase 6: Testes de Interface, Verificação Determinística e Pull Request
*Objetivo: Atingir cobertura completa por categoria (ES III) e 0 violações em `npm run check`.*

- [ ] **T019** Criar teste de componente RNTL em `tests/components/drawingCanvas.test.tsx` validando acessibilidade da barra de ferramentas, seleção de cor/espessura e ações de desfazer/limpar
- [ ] **T020** Criar teste de hook em `tests/hooks/useDesenhoViewModel.test.ts` cobrindo fases, traços, pontuação, reciclagem de pulos, fim do tempo, feedback háptico e saída segura
- [ ] **T021** Criar teste de tela com mock em `tests/mocks/desenhoScreen.mock.test.tsx` (`loading`, `error`, equipes insuficientes e `drawing`) e teste de integração real em `tests/integration/desenho.integration.test.tsx`
- [ ] **T022** Executar `npm run check` (`check-arquitetura.mjs`, `check-design-system.mjs`, `tsc --noEmit` e `jest`) garantindo **0 violações e 0 erros**
- [ ] **T023** Realizar commits convencionais incrementais (separando commits `test(...)` por categoria) e abrir Pull Request vinculado a `Closes #83` seguindo `/commit-e-pr`
