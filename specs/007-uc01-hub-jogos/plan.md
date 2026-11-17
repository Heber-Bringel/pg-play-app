# 🏗️ Plano de Implementação Técnica (`plan.md`): 007-uc01-hub-jogos

- **Branch:** `feat/007-uc01-hub-jogos`
- **Data:** 2026-11-16
- **Especificação de Origem:** `specs/007-uc01-hub-jogos/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`
- **Issue vinculada:** `#9` (`[UC01] Implementar Catálogo e Hub de Jogos com busca e filtro (RF01–RF03)`)

---

## 1. Resumo Técnico

A entrega implementa o **Hub de Jogos (`UC01`)** na rota raiz `/` seguindo o fluxo de dentro para fora do **MVVM Sofisticado**. No domínio (`model/`) definimos a entidade pura `Minigame` e ampliamos `IGameCatalogDataSource` com `listMinigames()`; na infraestrutura (`infra/`) populamos os 5 minigames oficiais do PG PLAY em `MemoryGameCatalogDataSource`; na camada de negócio (`usecase/`) adicionamos `listMinigames(filter?)` em `IPgPlayUseCases` e `PgPlayUseCases` com normalização de busca e validação de modalidade via `ValidationError`; na apresentação (`viewmodel/`, `view/`, `app/`) criamos `useHubViewModel`, a tela espelhada `src/view/index.tsx` com os 4 estados obrigatórios (`loading`, `error`, `empty`, `content`) e a rota fina de 2 linhas `src/app/index.tsx`.

---

## 2. Verificação Constitucional (*Constitution Check*)

- [x] **Artigo I (SDD)**: A especificação `specs/007-uc01-hub-jogos/spec.md` está completa e mapeia `UC01` (`RF01–RF04`).
- [x] **Artigo II (MVVM 7 Pastas)**: Todos os arquivos planejados residem apenas em `model`, `infra`, `usecase`, `di`, `viewmodel`, `view` e `app`.
- [x] **Artigo II (Rotas Finas e View Burra)**: `src/app/index.tsx` terá apenas 2 linhas (`import HubScreen from '@/view/index'; export default HubScreen;`); `src/view/index.tsx` não importará `expo-router` nem fará `try/catch`; toda navegação ficará em `src/viewmodel/useHubViewModel.ts`.
- [x] **Artigo II (Vocabulário)**: Nenhum arquivo, interface ou classe usa `Repository` ou `Connector` (mantém `IGameCatalogDataSource` e `MemoryGameCatalogDataSource`).
- [x] **Artigo III (Design System)**: Uso exclusivo de tokens de `@/view/theme` e componentes `GameCard`, `ExpressiveTextField` e `ExpressiveButton` de `@/view/components/`.
- [x] **Artigo IV (Testabilidade Offline)**: O catálogo opera 100% offline via `MemoryGameCatalogDataSource` injetado em `src/di/container.ts`.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

```text
src/
├─ model/
│  ├─ entities/minigame.ts                  # [NOVO] GameModality, GameModalityFilter, MinigameRoute, MinigameIconName, Minigame
│  ├─ datasources/iGameCatalogDataSource.ts # [ALTERAR] Adicionar listMinigames(): Promise<Minigame[]>
│  └─ errors.ts                             # [EXISTENTE] ValidationError, DataSourceError
├─ infra/
│  └─ datasources/memoryGameCatalogDataSource.ts # [ALTERAR] Adicionar catálogo DEFAULT_MINIGAMES e listMinigames()
├─ usecase/
│  ├─ iPgPlayUseCases.ts                    # [ALTERAR] Adicionar listMinigames(query?: string, modality?: GameModalityFilter): Promise<Minigame[]>
│  └─ pgPlayUseCases.ts                     # [ALTERAR] Implementar filtragem/normalização e validação de modalidade
├─ di/
│  └─ container.ts                          # [EXISTENTE] Já injeta MemoryGameCatalogDataSource em pgPlayUseCases
├─ viewmodel/
│  └─ useHubViewModel.ts                    # [NOVO] Exporta HubState, HubActions e useHubViewModel
├─ view/
│  └─ index.tsx                             # [NOVO] Tela espelhada HubScreen com banner líder, busca, chips de modalidade e cards
└─ app/
   └─ index.tsx                             # [NOVO] Rota fina de 2 linhas para HubScreen
```

### Contratos Detalhados por Camada

- **`IPgPlayUseCases` / `PgPlayUseCases`**:
  - `listMinigames(query?: string, modality?: GameModalityFilter): Promise<Minigame[]>`
  - Valida `modality` quando informada (`'Todos' | '1 Celular' | 'Multi-Celular'`), lançando `ValidationError` para valores inválidos.
  - Normaliza acentos (`NFD`), caixa e espaços da `query` para filtrar por `title`, `description`, `playersTag` ou `themes`.
- **`useHubViewModel(useCase: IPgPlayUseCases = pgPlayUseCases): [HubState, HubActions]`**:
  - `HubState`: `{ games, allGamesCount, searchQuery, selectedModality, leaderTeam, totalTeams, loading, error }`
  - `HubActions`: `{ setSearchQuery, setSelectedModality, handleClearFilters, handleSelectGame, handleOpenTeams, handleOpenScoreboard, handleRetry }`
  - Carrega catálogo (`listMinigames()`) e equipes (`getScoreboard()`) em paralelo na montagem e atualiza filtragem em tempo real sem bloquear a UI.
  - Encapsula `router.push(...)` para `/mimica`, `/quiz`, `/forca`, `/adedonha`, `/teams` e `/scoreboard` (bloqueando navegação se `!game.available`).

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento da Tela | Componente / Origem | Tokens Semânticos / Componente (`@/view/theme`) |
| :--- | :--- | :--- |
| Fundo e layout da tela | `ScrollView` / `View` | `color.surface`, `space.md`, `space.lg` |
| Banner da equipe líder | `GameCard` (`highlightLeader`) | `color.highlight`, `card.bg`, `card.radius` |
| Campo de busca em tempo real | `ExpressiveTextField` (`icon="magnify"`) | `input.bg`, `input.borderFocus`, `input.minHeight` |
| Chips de filtro de modalidade | `Pressable` + `Text` | `color.actionContainer`, `color.onActionContainer`, `color.surfaceContainer`, `color.outline`, `radius.full`, `space.xxl` (minHeight `48 dp`) |
| Cards dos minigames | `GameCard` | `card.bg`, `card.border`, `card.radius`, `card.badgeSize` |
| Estado vazio e erro | `GameCard` + `ExpressiveButton` (`variant="tonal"` / `"primary"`) | `color.outline`, `color.onSurfaceMuted`, `radius.xl`, `button.minHeight` |
| Atalhos Equipes / Placar | `ExpressiveButton` (`variant="tonal"` / `"outlined"`) | `color.actionContainer`, `color.outline`, `button.radius` |

---

## 5. Estratégia de Testes (`tests/`)

1. **Testes Unitários de UseCase (`tests/unit/pgPlayUseCases.hub.test.ts`)**:
   - Retorno dos 5 minigames padrão;
   - Filtro por texto com busca parcial e sem acentuação (`"mimica"`, `"biblia"`);
   - Filtro por modalidade (`'1 Celular'` e `'Multi-Celular'`);
   - Combinação texto + modalidade e rejeição com `ValidationError` para modalidade inválida.
2. **Testes de Hook (`tests/hooks/useHubViewModel.test.ts`)**:
   - Carregamento inicial de jogos e equipe líder;
   - Atualização de busca e modalidade em tempo real;
   - `handleClearFilters` restaurando catálogo completo;
   - `handleSelectGame` navegando para rota disponível e ignorando jogo indisponível (`available: false`);
   - Navegação para `/teams` e `/scoreboard`, além de tratamento de `DomainError`.
3. **Testes de Tela com Mocks (`tests/mocks/hubScreen.mock.test.tsx`)**:
   - Reexportação da rota fina `src/app/index.tsx` -> `src/view/index.tsx`;
   - Os 4 estados da tela: `loading`, `error` (com retry), `empty` (com *"Limpar busca"*) e `content` (banner do líder + cards + chips de modalidade).
