# ✅ Lista de Tarefas (`tasks.md`): 007-uc01-hub-jogos

- **Input:** `specs/007-uc01-hub-jogos/spec.md` e `specs/007-uc01-hub-jogos/plan.md`
- **Issue vinculada:** `#9` (`[UC01] Implementar Catálogo e Hub de Jogos com busca e filtro (RF01–RF03)`)
- **Ordem de Execução Obrigatória:** De dentro para fora (`model` → `infra` → `usecase` → `di` → `tests` → `viewmodel` → `view` → `app`)
- **Receitas do Harness:** `/nova-funcionalidade`, `/nova-tela`, `/revisar-arquitetura`, `/commit-e-pr`

---

## Fase 1: Domínio Puro (`src/model/`)
*Objetivo: Definir a entidade `Minigame` e o contrato do catálogo sem dependências externas.*

- [x] **T001** Criar `src/model/entities/minigame.ts` com `GameModality`, `GameModalityFilter`, `MinigameRoute`, `MinigameIconName` e `Minigame`
- [x] **T002** Atualizar `src/model/datasources/iGameCatalogDataSource.ts` adicionando `listMinigames(): Promise<Minigame[]>`

---

## Fase 2: Infraestrutura Offline/Memória (`src/infra/`)
*Objetivo: Disponibilizar o catálogo oficial dos 5 minigames offline em memória.*

- [x] **T003** Atualizar `src/infra/datasources/memoryGameCatalogDataSource.ts` com `DEFAULT_MINIGAMES` (Mímica, Quiz, Forca, Adedonha e Cidade Dorme) e `listMinigames()` tratando falhas com `DataSourceError`

---

## Fase 3: Caso de Uso e Injeção de Dependências (`src/usecase/` e `src/di/`)
*Objetivo: Centralizar filtragem, normalização de busca e validação de modalidade no UseCase.*

- [x] **T004** Atualizar `src/usecase/iPgPlayUseCases.ts` adicionando `listMinigames(query?: string, modality?: GameModalityFilter): Promise<Minigame[]>`
- [x] **T005** Implementar `listMinigames` em `src/usecase/pgPlayUseCases.ts` com validação de modalidade (`ValidationError`) e busca normalizada (sem acento/caixa)
- [x] **T006** Verificar `src/di/container.ts` garantindo que `pgPlayUseCases` recebe o `MemoryGameCatalogDataSource` atualizado

---

## Fase 4: Testes Unitários da Regra de Negócio (`tests/unit/`)
*Objetivo: Validar o catálogo e filtros do UseCase isoladamente antes de construir a UI.*

- [x] **T007** Criar `tests/unit/pgPlayUseCases.hub.test.ts` cobrindo listagem completa, filtro por texto, filtro por modalidade (`1 Celular` vs `Multi-Celular`), busca combinada e `ValidationError`

---

## Fase 5: Apresentação — ViewModel, View e Rota Fina (`src/viewmodel/`, `src/view/`, `src/app/`)
*Objetivo: Construir estado/navegação na ViewModel, tela espelhada com Design System e rota raiz `/`.*

- [x] **T008** Implementar `src/viewmodel/useHubViewModel.ts` exportando `HubState`, `HubActions` e `useHubViewModel` (carregamento do catálogo + `getScoreboard()`, busca/filtro em tempo real, limpeza de filtros e navegação `expo-router`)
- [x] **T009** Criar testes do hook em `tests/hooks/useHubViewModel.test.ts`
- [x] **T010** Implementar `src/view/index.tsx` (`HubScreen`) com os 4 estados (`loading`, `error`, `empty`, `content`), usando `GameCard`, `ExpressiveTextField`, `ExpressiveButton` e tokens de `@/view/theme`
- [x] **T011** Criar rota fina de 2 linhas em `src/app/index.tsx` (`import HubScreen from '@/view/index'; export default HubScreen;`)
- [x] **T012** Criar testes de tela com mocks em `tests/mocks/hubScreen.mock.test.tsx` cobrindo rota fina e os 4 estados da interface

---

## Fase 6: Verificação Arquitetural, Commits e Pull Request
*Objetivo: Garantir 0 violações no Harness MVVM Sofisticado antes do commit/PR.*

- [x] **T013** Sincronizar dependências (`npm install`) se necessário e executar `npm run check` (`check-arquitetura.mjs` + `tsc --noEmit` + `jest --passWithNoTests`) garantindo **0 violações**
- [x] **T014** Realizar commits convencionais incrementais (incluindo commits `test(...)` separados por categoria) e preparar PR vinculando `Closes #9` e `specs/007-uc01-hub-jogos/`
