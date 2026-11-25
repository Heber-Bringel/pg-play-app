# 🏗️ Plano de Implementação Técnica (`plan.md`): UC12 — Desenho Relâmpago

- **Branch:** `feat/028-uc12-desenho-relampago`
- **Data:** 2026-11-25
- **Especificação de Origem:** `specs/028-uc12-desenho-relampago/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

Implementação do minigame **Desenho Relâmpago** (`UC12`, Issue `#83`) em modo **1 Celular (Passa-Celular)** estruturada rigorosamente nas 7 camadas do **MVVM Sofisticado**. O domínio (`src/model/`) modela os tipos puros de traço (`DrawingPoint`, `DrawingStroke`, `DrawingPenColorId`, `DrawingStrokeWidthId`), as cartas desenháveis (`DesenhoCard`, `DesenhoCategory`) e a seção `desenho` em `MatchSettings`. Na infraestrutura (`src/infra/`), `MemoryGameCatalogDataSource` registra o jogo no Hub (`/desenho`) e fornece os 5 pacotes próprios de palavras concretas desenháveis, enquanto `MemoryMatchSettingsDataSource` e `AsyncStorageMatchSettingsDataSource` persistem `MatchSettings.desenho` com fallback seguro. O `PgPlayUseCases` concentra as validações (`ValidationError`), a pontuação (`+20 pts` no acerto, `-5 pts` com piso `0` no pulo) e a atualização de parâmetros. Na camada visual, sincronizamos os novos tokens `canvas.*` em `src/view/theme.ts`, criamos o componente reutilizável `DrawingCanvas` (`react-native-svg` + `PanResponder`), a `useDesenhoViewModel` (integrada a `IGameFeedbackUseCases`), a tela espelhada `src/view/desenho.tsx` e a rota fina `src/app/desenho.tsx`.

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo devem estar marcados antes de gerar o `tasks.md` ou iniciar código.*

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e alinhada com `UC12`, `RF41`–`RF44`, `docs/jogos/desenho-relampago.md` e `design-system/04-componentes/tela-de-desenho.md`.
- [x] **Artigo II (MVVM 7 Pastas)**: Todos os arquivos planejados em `src/` residem exclusivamente em `app`, `view`, `viewmodel`, `usecase`, `model`, `infra` ou `di`.
- [x] **Artigo II (Rotas Finas e View Burra)**: `src/app/desenho.tsx` terá apenas 2 linhas (`import` + `export default`) e toda a navegação (`expo-router`) ficará restrita a `useDesenhoViewModel.ts`.
- [x] **Artigo II (Vocabulário)**: Nenhum arquivo, contrato ou classe utiliza `Repository` ou `Connector` (apenas `DataSource` e `Service`).
- [x] **Artigo III (Design System)**: As cores de caneta, superfície de papel, espessuras e tamanhos de ferramentas foram formalizados como tokens `canvas.*` em `design-system/02-tokens.md` e `src/view/theme.ts`; zero `#hex` ou números mágicos fora de `theme.ts`.
- [x] **Artigo IV (Testabilidade Offline)**: O jogo funciona 100% offline com `MemoryGameCatalogDataSource`, `MemoryTeamDataSource` e `MemoryMatchSettingsDataSource`, validado por testes unitários, componentes, hooks, mocks e integração.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

Ordem estrita de criação/alteração de dentro para fora:

```text
src/
├─ model/
│  ├─ entities/drawingChallenge.ts                    # [CRIAR] DrawingPenColorId, DrawingStrokeWidthId, DrawingPoint, DrawingStroke, DesenhoCategory, DesenhoCard
│  ├─ entities/minigame.ts                            # [ALTERAR] Adicionar rota '/desenho' e ícone 'palette'
│  ├─ entities/contentPack.ts                         # [ALTERAR] Adicionar 'desenho' em ContentPackGameId e DesenhoCategory em ContentPackCategory
│  ├─ entities/matchSettings.ts                       # [ALTERAR] Adicionar DesenhoDurationOption (60|90|120), DesenhoSettings e chave desenho em MatchSettings
│  └─ datasources/iGameCatalogDataSource.ts           # [ALTERAR] Adicionar listDesenhoCards(categories?: DesenhoCategory[]): Promise<DesenhoCard[]>
├─ infra/
│  ├─ datasources/memoryGameCatalogDataSource.ts      # [ALTERAR] Adicionar minigame 'desenho', 5 ContentPacks e banco de DesenhoCard desenháveis
│  ├─ datasources/memoryMatchSettingsDataSource.ts    # [ALTERAR] Clonar seção settings.desenho em cloneSettings()
│  └─ datasources/asyncStorageMatchSettingsDataSource.ts # [ALTERAR] Mesclar DEFAULT_MATCH_SETTINGS.desenho em mergeWithDefaults()
├─ usecase/
│  ├─ iPgPlayUseCases.ts                              # [ALTERAR] Adicionar listDesenhoCards, scoreDesenhoHit, scoreDesenhoSkip e updateDesenhoSettings
│  └─ pgPlayUseCases.ts                               # [ALTERAR] Implementar regras, validações (ValidationError) e sanitizeMatchSettings para desenho
├─ di/
│  └─ container.ts                                    # [VERIFICAR] pgPlayUseCases e gameFeedbackUseCases já expostos com os DataSources injetados
├─ viewmodel/
│  └─ useDesenhoViewModel.ts                          # [CRIAR] Fases ('pass-turn' | 'drawing' | 'turn-summary' | 'finished'), traços, timer + haptics e navegação
├─ view/
│  ├─ theme.ts                                        # [ALTERAR] Sincronizar color.canvas* e component.canvas (receita /sincronizar-tema)
│  ├─ components/drawingCanvas.tsx                    # [CRIAR] Folha Svg + PanResponder + barra acessível de 4 cores, 2 espessuras, Desfazer e Limpar
│  └─ desenho.tsx                                     # [CRIAR] Tela espelhada consumindo useDesenhoViewModel, useReduceMotion e useTheme
└─ app/
   └─ desenho.tsx                                     # [CRIAR] Rota fina de 2 linhas reexportando @/view/desenho
```

### Dependência Expo a instalar
- `npx expo install react-native-svg` (compatível com SDK 58 no Expo Go Android/iOS e `react-native-web`, sem necessidade de `react-native-gesture-handler`).

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento da Tela | Componente (`@/view/components/`) | Tokens Semânticos / de Componente (`@/view/theme`) |
| :--- | :--- | :--- |
| Barra superior (Saída + Rodada) | `ExpressiveButton` (`variant="outlined"`) + `ExpressiveTag` | `space.md`, `space.sm`, `tag.neutral.*` |
| Cabeçalho da equipe da vez | `View` acessível + `ExpressiveTag` (`tone="action"`) | `color.surfaceContainer`, `card.border`, `radius.lg`, `font.title`, `font.caption` |
| Passagem de turno (`pass-turn`) | `GameCard` + `ExpressiveChip` + `ExpressiveButton` (`size="jumbo"`) | `card.bg`, `card.radius`, `chip.border.*`, `button.jumbo.height` (`64 dp`) |
| Cronômetro regressivo (`drawing`) | `ExpressiveTimer` (`reduceMotion`) | `timer.bg.normal`, `timer.bg.critical`, `timer.radius.normal`, `timer.radius.critical` |
| Card da palavra secreta + Regra de honra | `GameCard` + `ExpressiveButton` (`variant="tonal"`) + `ExpressiveTag` (`tone="secondary"`) | `font.display` (`30 dp`), `banner.warning.*`, `tag.secondary.*` |
| Folha de desenho e ferramentas (`RF41`) | `DrawingCanvas` (`Svg` + `PanResponder`) | `canvas.paperBg`, `canvas.border`, `canvas.radius`, `canvas.minHeight`, `canvas.pen.{ink,purple,coral,green}`, `canvas.stroke.{thin,thick}`, `canvas.tool.*` |
| Ações de pontuação do turno (`RF43`) | `ExpressiveButton` (`variant="primary"`, `size="jumbo"`) + `ExpressiveButton` (`variant="tonal"`) | `button.jumbo.height`, `color.action`, `space.sm` |
| Resumo do turno e Fim de partida | `GameCard` + `ExpressiveTag` + `ExpressiveButton` | `tag.success.*`, `tag.secondary.*`, `card.borderLeader` |
| Confirmação de saída segura (`RF11`) | `ConfirmModal` | `elevation.floating`, `color.scrim`, `card.radius` |

---

## 5. Estratégia de Testes (`tests/`)

Seguindo a governança de commits incrementais de testes (`CONTRIBUTING.md` seção 4):

- **Testes de Tokens (`tests/tokens.test.ts`)**:
  - Resolução de `semantic.color.canvas*` e `component.canvas.*` nos modos claro e escuro e verificação matemática de contraste `>= 4,5:1` (e `>= 3:1` WCAG 1.4.11) das 4 canetas sobre `canvas.paperBg`.
- **Testes Unitários de Caso de Uso e Infra (`tests/unit/pgPlayUseCases.desenho.test.ts`, `tests/unit/pgPlayUseCases.matchSettings.test.ts`, `tests/unit/asyncStorageMatchSettingsDataSource.test.ts`)**:
  - Listagem de pacotes `'desenho'` e cartas por categoria, lançamento de `ValidationError` para lista vazia de pacotes, `scoreDesenhoHit` (`+20 pts`), `scoreDesenhoSkip` (`-5 pts` e piso `0`), `updateDesenhoSettings` (`60|90|120` e rodadas `1..5`) e fallback de JSON legado sem chave `desenho`.
- **Testes de Componente RNTL (`tests/components/drawingCanvas.test.tsx`)**:
  - Renderização da folha, seleção das 4 cores e 2 espessuras com `accessibilityRole`, `accessibilityLabel` e `accessibilityState={{ selected }}`, estados habilitado/desabilitado de *"Desfazer"* e *"Limpar"* e bloqueio quando `disabled={true}`.
- **Testes de Hook (`tests/hooks/useDesenhoViewModel.test.ts`)**:
  - Transição completa de fases (`pass-turn` → `drawing` → `turn-summary` → `finished`), adição/desfazer/limpar traços, limpeza automática no acerto/pulo, reciclagem de palavras puladas sem repetir acertos, pausa na saída segura e disparo de `gameFeedback.notifyTimerTick`.
- **Testes de Tela com Mock e Integração Real (`tests/mocks/desenhoScreen.mock.test.tsx` e `tests/integration/desenho.integration.test.tsx`)**:
  - Cobertura dos 4 estados visuais (`loading`, `error`, `empty`/equipes insuficientes e `content`) e fluxo ponta a ponta `View + ViewModel + PgPlayUseCases + Memory*DataSource` atualizando o placar das equipes.
