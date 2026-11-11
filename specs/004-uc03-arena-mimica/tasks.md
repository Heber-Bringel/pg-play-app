# ✅ Lista de Tarefas (`tasks.md`): 004-uc03-arena-mimica

- **Input:** `specs/004-uc03-arena-mimica/spec.md` e `specs/004-uc03-arena-mimica/plan.md`
- **Ordem de Execução Obrigatória:** De dentro para fora (`model` → `infra` → `usecase` → `di` → `tests` → `viewmodel` → `view` → `app`)
- **Receitas do Harness:** `/nova-funcionalidade`, `/nova-tela`, `/revisar-arquitetura`, `/commit-e-pr`
- **Issue Vinculada:** `#11` (`[UC03] Implementar Arena de Mímica Expressiva (RF07–RF09)`)

---

## Fase 1: Domínio Puro (`src/model/`)
*Objetivo: Definir entidades (`type`), erros (`DomainError`) e contratos (`interface`) sem nenhuma dependência externa.*

- [x] **T001** Criar classes de erro de domínio em `src/model/errors.ts` (`DomainError`, `ValidationError`, `AuthError`, `DataSourceError`).
- [x] **T002** Criar entidade `Team` em `src/model/entities/team.ts` e entidades `MimicaCategory` e `MimicaCard` em `src/model/entities/arenaChallenge.ts`.
- [x] **T003** Criar contratos `ITeamDataSource` em `src/model/datasources/iTeamDataSource.ts` e `IGameCatalogDataSource` em `src/model/datasources/iGameCatalogDataSource.ts`.

---

## Fase 2: Infraestrutura Offline/Memória (`src/infra/`)
*Objetivo: Implementar os contratos do domínio com classes concretas `Memory*`.*

- [x] **T004** Implementar `MemoryTeamDataSource` com `implements ITeamDataSource` em `src/infra/datasources/memoryTeamDataSource.ts` (com 2 equipes padrão sugeridas e proteção contra placar negativo).
- [x] **T005** Implementar `MemoryGameCatalogDataSource` com `implements IGameCatalogDataSource` em `src/infra/datasources/memoryGameCatalogDataSource.ts` (banco local misto de mímica por pacotes de categorias).

---

## Fase 3: Caso de Uso e Injeção de Dependências (`src/usecase/` e `src/di/`)
*Objetivo: Concentrar todas as validações e regras de negócio no UseCase e conectá-lo no container.*

- [x] **T006** Definir contrato `export interface IPgPlayUseCases` em `src/usecase/iPgPlayUseCases.ts`.
- [x] **T007** Implementar `export class PgPlayUseCases implements IPgPlayUseCases` em `src/usecase/pgPlayUseCases.ts` (regras de `+20 pts` no acerto, `-5 pts` com piso `0` no pulo e validações com `ValidationError`).
- [x] **T008** Registrar e exportar a instância `pgPlayUseCases` em `src/di/container.ts`.

---

## Fase 4: Testes Unitários da Regra de Negócio (`tests/unit/`)
*Objetivo: Validar o UseCase isoladamente antes de construir a interface.*

- [x] **T009** Criar testes unitários do UseCase (caminho feliz + casos de borda de piso zero + `ValidationError`) em `tests/unit/pgPlayUseCases.mimica.test.ts`.

---

## Fase 5: Apresentação — ViewModel, View e Rota Fina (`src/viewmodel/`, `src/view/`, `src/app/`)
*Objetivo: Expor estado/ações na ViewModel, renderizar com tokens do Design System na View e criar rota fina de 2 linhas.*

- [x] **T010** Implementar `useMimicaViewModel` retornando `[MimicaState, MimicaActions]` (incluindo navegação `expo-router`) em `src/viewmodel/useMimicaViewModel.ts`.
- [x] **T011** Implementar a tela `src/view/mimica.tsx` contemplando os 4 estados (`loading`, `error`, `empty`, `content`) e usando exclusivamente tokens de `@/view/theme` e componentes de `@/view/components/`.
- [x] **T012** Criar a rota fina de 2 linhas em `src/app/mimica.tsx`.
- [x] **T013** Criar testes do hook `useMimicaViewModel` (`tests/hooks/useMimicaViewModel.test.ts`) e da tela `MimicaScreen` com mocks (`tests/mocks/mimicaScreen.mock.test.tsx`).

---

## Fase 6: Verificação Arquitetural e Pull Request
*Objetivo: Garantir 0 violações no Harness MVVM Sofisticado antes do commit/PR.*

- [x] **T014** Executar `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest`) e confirmar **0 violações** e cobertura `>= 80%`.
- [x] **T015** Realizar commits convencionais (incluindo commit separado `test(...)` conforme governança de ES3) e abrir Pull Request referenciando `Closes #11`.
