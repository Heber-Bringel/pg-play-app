# ✅ Lista de Tarefas (`tasks.md`): UC08 — Adedonha Bíblica em Sala Multiplayer

- **Input:** `specs/009-uc08-adedonha-biblica/spec.md` e `specs/009-uc08-adedonha-biblica/plan.md`
- **Ordem de Execução Obrigatória:** De dentro para fora (`model` → `infra` → `usecase` → `di` → `tests` → `viewmodel` → `view` → `app`)
- **Receitas do Harness:** `/nova-funcionalidade`, `/nova-tela`, `/revisar-arquitetura`, `/commit-e-pr`

---

## Fase 1: Domínio Puro (`src/model/`)
*Objetivo: Definir entidades (`type`) e contrato de serviço (`interface`) sem dependências externas.*

- [x] **T001** Criar entidades `AdedonhaRoom`, `AdedonhaPlayer`, `AdedonhaSubmission`, `AdedonhaConfig`, `AdedonhaPhase` e `AdedonhaTallyVerdict` como `export type` em `src/model/entities/multiplayerSession.ts`
- [x] **T002** Criar contrato `export interface IMultiplayerRoomService` em `src/model/services/iMultiplayerRoomService.ts`

---

## Fase 2: Infraestrutura Offline/Memória e Supabase (`src/infra/`)
*Objetivo: Implementar o contrato `IMultiplayerRoomService` com versão `Memory*` funcional e classe `Supabase*`.*

- [x] **T003** Implementar `MemoryMultiplayerRoomService` com `implements IMultiplayerRoomService` em `src/infra/services/memoryMultiplayerRoomService.ts` e `SupabaseMultiplayerRoomService` em `src/infra/services/supabaseMultiplayerRoomService.ts`

---

## Fase 3: Caso de Uso e Injeção de Dependências (`src/usecase/` e `src/di/`)
*Objetivo: Concentrar validações (`RF21–RF23`) no UseCase e conectá-lo no container DI.*

- [x] **T004** Criar contrato `export interface IAdedonhaUseCases` em `src/usecase/iAdedonhaUseCases.ts` e implementar `export class AdedonhaUseCases implements IAdedonhaUseCases` em `src/usecase/adedonhaUseCases.ts`
- [x] **T005** Instanciar `MemoryMultiplayerRoomService` e exportar `adedonhaUseCases` em `src/di/container.ts`

---

## Fase 4: Testes Unitários da Regra de Negócio (`tests/unit/`)
*Objetivo: Validar `AdedonhaUseCases` e `MemoryMultiplayerRoomService` isoladamente.*

- [x] **T006** Criar testes unitários em `tests/unit/adedonhaUseCases.test.ts` cobrindo `RF21`, `RF22`, `RF23` e lançamentos de `ValidationError`

---

## Fase 5: Apresentação — ViewModel, View e Rota Fina (`src/viewmodel/`, `src/view/`, `src/app/`)
*Objetivo: Expor `[state, actions]` na ViewModel, renderizar com tokens/componentes do Design System na View e criar rota fina de 2 linhas.*

- [x] **T007** Implementar `useAdedonhaViewModel` em `src/viewmodel/useAdedonhaViewModel.ts`
- [x] **T008** Implementar a tela `src/view/adedonha.tsx` e a rota fina de 2 linhas em `src/app/adedonha.tsx`

---

## Fase 6: Testes de Hook, Mocks de Tela e Verificação Arquitetural
*Objetivo: Cobrir ViewModel e View com testes automatizados e validar `npm run check` com 0 violações.*

- [ ] **T009** Criar `tests/hooks/useAdedonhaViewModel.test.ts` e `tests/mocks/adedonhaScreen.mock.test.tsx`
- [ ] **T010** Executar `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest`) e confirmar **0 violações**
