# 🏗️ Plano de Implementação Técnica (`plan.md`): UC12 — Desenho Relâmpago

- **Branch:** `feat/028-uc12-desenho-relampago`
- **Data:** 2026-11-25
- **Especificação de Origem:** `specs/028-uc12-desenho-relampago/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

Implementação do minigame **Desenho Relâmpago** (`UC12`, Issue `#83`) em modo **1 Celular (Passa-Celular)** estruturada rigorosamente nas 7 camadas do **MVVM Sofisticado**. O domínio (`src/model/`) modela os tipos puros de traço (`DrawingPoint`, `DrawingStroke`, `DrawingPenColorId`, `DrawingStrokeWidthId`), as cartas desenháveis (`DesenhoCard`, `DesenhoCategory`) e a seção `desenho` em `MatchSettings`. Na infraestrutura (`src/infra/`), `MemoryGameCatalogDataSource` registra o 9º minigame no Hub (`/desenho`), recebe `initialDesenhoCards` como 6º parâmetro opcional retrocompatível e fornece os 5 pacotes próprios de palavras desenháveis, enquanto `MemoryMatchSettingsDataSource` e `AsyncStorageMatchSettingsDataSource` persistem `MatchSettings.desenho` com fallback seguro. O `PgPlayUseCases` concentra as validações (`ValidationError`), a pontuação (`+20 pts` no acerto, `-5 pts` com piso `0` no pulo) e a atualização de parâmetros. Na camada visual, sincronizamos os tokens `canvas.*` (incluindo `canvas.pen.onPen` e export nomeado `canvas`) em `src/view/theme.ts`, criamos `useDesenhoViewModel` (integrada a `IGameFeedbackUseCases`), o componente reutilizável `DrawingCanvas` (`react-native-svg` + `PanResponder` com trava de scroll), a tela espelhada `src/view/desenho.tsx` e a rota fina `src/app/desenho.tsx`.

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo devem estar marcados antes de gerar o `tasks.md` ou iniciar código.*

- [x] **Artigo I (SDD)**: A especificação `spec.md` foi revisada, aprovada e alinhada com `UC12`, `RF41`–`RF44`, `docs/jogos/desenho-relampago.md` e `design-system/04-componentes/tela-de-desenho.md`.
- [x] **Artigo II (MVVM 7 Pastas)**: Todos os arquivos planejados em `src/` residem exclusivamente em `app`, `view`, `viewmodel`, `usecase`, `model`, `infra` ou `di`.
- [x] **Artigo II (Rotas Finas e View Burra)**: `src/app/desenho.tsx` terá apenas 2 linhas (`import` + `export default`) e toda a navegação (`expo-router`) ficará restrita a `useDesenhoViewModel.ts`.
- [x] **Artigo II (Vocabulário)**: Nenhum arquivo, contrato ou classe utiliza `Repository` ou `Connector` (apenas `DataSource` e `Service`).
- [x] **Artigo III (Design System)**: As cores de caneta, ícone `check` (`canvas.pen.onPen`), superfície de papel, espessuras e tamanhos de ferramentas foram formalizados como tokens `canvas.*` em `design-system/02-tokens.md` e `src/view/theme.ts`; zero `#hex` ou números mágicos fora de `theme.ts`.
- [x] **Artigo IV (Testabilidade Offline)**: O jogo funciona 100% offline com `MemoryGameCatalogDataSource`, `MemoryTeamDataSource` e `MemoryMatchSettingsDataSource`, validado por testes unitários, componentes, hooks, mocks e integração, além da atualização de todos os testes existentes impactados.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

Ordem estrita de criação/alteração de dentro para fora:

```text
src/
├─ model/
│  ├─ entities/drawingChallenge.ts                    # [CRIAR] DrawingPenColorId, DrawingStrokeWidthId, DrawingPoint, DrawingStroke, DesenhoCategory, DesenhoCard
│  ├─ entities/minigame.ts                            # [ALTERAR] Adicionar rota '/desenho' e ícone 'palette'
│  ├─ entities/contentPack.ts                         # [ALTERAR] Adicionar 'desenho' em ContentPackGameId e DesenhoCategory em ContentPackCategory
│  ├─ entities/matchSettings.ts                       # [ALTERAR] Adicionar DesenhoDurationOption (60|90|120), DesenhoSettings e chave desenho em MatchSettings/DEFAULT_MATCH_SETTINGS
│  └─ datasources/iGameCatalogDataSource.ts           # [ALTERAR] Adicionar listDesenhoCards(categories?: DesenhoCategory[]): Promise<DesenhoCard[]>
├─ infra/
│  ├─ datasources/memoryGameCatalogDataSource.ts      # [ALTERAR] Adicionar minigame 'desenho', 5 ContentPacks, banco desenhável e 6º parâmetro opcional initialDesenhoCards
│  ├─ datasources/memoryMatchSettingsDataSource.ts    # [ALTERAR] Clonar seção settings.desenho em cloneSettings()
│  └─ datasources/asyncStorageMatchSettingsDataSource.ts # [ALTERAR] Mesclar DEFAULT_MATCH_SETTINGS.desenho em mergeWithDefaults()
├─ usecase/
│  ├─ iPgPlayUseCases.ts                              # [ALTERAR] Adicionar listDesenhoCards, scoreDesenhoHit(teamId, points?), scoreDesenhoSkip(teamId, penalty?), updateDesenhoSettings(changes)
│  └─ pgPlayUseCases.ts                               # [ALTERAR] Implementar regras, DEFAULT_DESENHO_HIT_POINTS (20), DEFAULT_DESENHO_SKIP_PENALTY (5), validações e sanitizeMatchSettings
├─ di/
│  └─ container.ts                                    # [VERIFICAR] pgPlayUseCases e gameFeedbackUseCases já expostos com os DataSources injetados
├─ viewmodel/
│  └─ useDesenhoViewModel.ts                          # [CRIAR] useDesenhoViewModel(useCases = pgPlayUseCases, gameFeedback = gameFeedbackUseCases): [DesenhoState, DesenhoActions]
├─ view/
│  ├─ theme.ts                                        # [ALTERAR] Sincronizar color.canvas*, component.canvas (incl. pen.onPen) e exportar canvas no nível superior
│  ├─ components/drawingCanvas.tsx                    # [CRIAR] Folha Svg + PanResponder (com onDrawingStart/onDrawingEnd e ponto único) + barra acessível de 4 cores, 2 espessuras, Desfazer e Limpar
│  └─ desenho.tsx                                     # [CRIAR] Tela espelhada consumindo useDesenhoViewModel, useReduceMotion e useTheme, com bloqueio de scroll ao desenhar
└─ app/
   └─ desenho.tsx                                     # [CRIAR] Rota fina de 2 linhas reexportando @/view/desenho
```

### Dependência Expo e Mocks de Teste
- `npx expo install react-native-svg` (compatível com SDK 58 no Expo Go Android/iOS e `react-native-web`).
- `jest.config.js`: adicionar mapeamento `'^react-native-svg$': '<rootDir>/tests/__mocks__/react-native-svg.tsx'`.
- `tests/__mocks__/react-native-svg.tsx`: criar mock leve para `Svg` (default) e `Path`.
- `tests/__mocks__/react-native.tsx`: exportar mock de `PanResponder` (`PanResponder.create`).

---

## 4. Inventário do Design System (`PG Play Expressive v1.2.0`)

| Elemento da Tela | Componente (`@/view/components/`) | Tokens Semânticos / de Componente (`@/view/theme`) |
| :--- | :--- | :--- |
| Barra superior (Saída + Rodada) | `ExpressiveButton` (`variant="outlined"`) + `ExpressiveTag` (`tone="neutral"`) | `space.md`, `space.sm`, `tag.neutral.*` |
| Cabeçalho da equipe da vez | `View` acessível + pontuação em destaque | `color.actionContainer`, `color.onActionContainer`, `radius.lg`, `font.title`, `font.subtitle`, `font.caption` |
| Passagem de turno (`pass-turn`) | `GameCard` + `ExpressiveChip` + `ExpressiveButton` (`variant="primaryJumbo"`) | `card.bg`, `card.border`, `card.radius`, `chip.border.*`, `button.jumbo.height` (`64 dp`) |
| Cronômetro regressivo (`drawing`) | `ExpressiveTimer` (`reduceMotion`) | `timer.bg.normal`, `timer.bg.critical`, `timer.radius.normal`, `timer.radius.critical` |
| Card da palavra secreta + Regra de honra | Container estilizado (`card.*`) + `ExpressiveTag` (`tone="secondary"`) + banner de regra (`banner.warning.*`) + `ExpressiveButton` (`variant="tonal"`) | `card.bg`, `card.border`, `card.radius`, `font.display` (`30 dp`), `banner.warning.*`, `tag.secondary.*` |
| Folha de desenho e ferramentas (`RF41`) | `DrawingCanvas` (`Svg` + `PanResponder`) | `canvas.paperBg`, `canvas.border`, `canvas.radius`, `canvas.minHeight`, `canvas.pen.{ink,purple,coral,green,onPen}`, `canvas.stroke.{thin,thick}`, `canvas.tool.*` |
| Ações de pontuação do turno (`RF43`) | `ExpressiveButton` (`variant="successJumbo"`) + `ExpressiveButton` (`variant="secondary"`) | `button.jumbo.height` (`64 dp`), `color.success`, `color.secondary`, `space.sm` |
| Resumo do turno e Fim de partida | `GameCard` (`highlightLeader` no `finished`) + `ExpressiveTag` + `ExpressiveButton` (`variant="primaryJumbo"`) | `tag.success.*`, `tag.secondary.*`, `card.borderLeader` |
| Confirmação de saída segura (`RF11`) | `ConfirmModal` | `elevation.floating`, `color.scrim`, `card.radius` |

---

## 5. Estratégia de Testes (`tests/`)

Seguindo a governança de commits incrementais de testes (`CONTRIBUTING.md` seção 4):

- **Atualização de Testes Existentes Impactados pelo Catálogo, `IPgPlayUseCases` e `MatchSettings`:**
  - `tests/unit/pgPlayUseCases.hub.test.ts` (9 jogos no Hub, 7 em `'1 Celular'`, `'desenho'` incluído no filtro `'biblico'`).
  - `tests/hooks/useHubViewModel.test.ts` (contagens `9` / `7` e novos métodos em `flakyUseCases`).
  - `tests/hooks/useForcaViewModel.test.ts`, `tests/hooks/useMimicaViewModel.test.ts` e `tests/hooks/useScoreboardViewModel.test.ts` (novos métodos de `IPgPlayUseCases` e chave `desenho` em `getMatchSettings` nos mocks manuais).
  - `tests/unit/asyncStorageMatchSettingsDataSource.test.ts` (incluir `desenho` no objeto literal salvo + teste de fallback sem chave `desenho`).
  - `tests/hooks/gameFeedback.viewmodels.test.ts` (cenário de pulsos táteis e vibração ao zerar no `useDesenhoViewModel`).
- **Testes de Tokens (`tests/tokens.test.ts`)**:
  - Resolução de `semantic.color.canvas*`, `component.canvas.*` e export `canvas` nos modos claro e escuro, e verificação matemática de contraste `>= 4,5:1` (e `>= 3:1` WCAG 1.4.11) das 4 canetas sobre `canvas.paperBg` e de `canvas.pen.onPen` sobre cada uma das 4 canetas.
- **Testes Unitários de Caso de Uso e Infra (`tests/unit/pgPlayUseCases.desenho.test.ts`, `tests/unit/pgPlayUseCases.matchSettings.test.ts`)**:
  - Listagem de pacotes `'desenho'` e cartas por categoria, lançamento de `ValidationError` para lista vazia de pacotes, `scoreDesenhoHit` (`+20 pts`), `scoreDesenhoSkip` (`-5 pts` e piso `0`) e `updateDesenhoSettings` (`60|90|120` e rodadas `1..5`).
- **Testes de Componente RNTL (`tests/components/drawingCanvas.test.tsx`)**:
  - Renderização da folha, desenho via `PanResponder` (incluindo ponto único e callbacks `onDrawingStart`/`onDrawingEnd`), seleção das 4 cores e 2 espessuras com `accessibilityRole`, `accessibilityLabel` e `accessibilityState={{ selected }}`, estados habilitado/desabilitado de *"Desfazer"* e *"Limpar"* e bloqueio quando `disabled={true}`.
- **Testes de Hook (`tests/hooks/useDesenhoViewModel.test.ts`)**:
  - Transição completa de fases (`pass-turn` → `drawing` → `turn-summary` → `finished`), adição/desfazer/limpar traços, revelação da última palavra em andamento no `turn-summary`, limpeza automática no acerto/pulo, reciclagem de palavras puladas sem repetir acertos, pausa na saída segura e disparo de `gameFeedback.notifyTimerTick`.
- **Testes de Tela com Mock e Integração Real (`tests/mocks/desenhoScreen.mock.test.tsx` e `tests/integration/desenho.integration.test.tsx`)**:
  - Cobertura dos 4 estados visuais (`loading`, `error`, equipes insuficientes e `content`) + rota fina `src/app/desenho.tsx`, e fluxo ponta a ponta `View + ViewModel + PgPlayUseCases + Memory*DataSource` atualizando o placar das equipes.
