# ✅ Lista de Tarefas (`tasks.md`): Isolamento de Papéis e Segredos no Cidade Dorme (RNF11)

- **Input:** `specs/015-fix-cidade-dorme-sigilo-rnf11/spec.md` e `specs/015-fix-cidade-dorme-sigilo-rnf11/plan.md`
- **Ordem de Execução Obrigatória:** De dentro para fora (`model` → `SQL/infra` → `usecase` → `tests` → `viewmodel` → `view` → `npm run check`)
- **Receitas do Harness:** `/nova-funcionalidade`, `/revisar-arquitetura`, `/commit-e-pr`

---

## Fase 1: Domínio Puro (`src/model/`)
*Objetivo: Ajustar entidades e contratos para representar ausência legítima de papéis alheios em trânsito.*

- [x] **T001** Alterar `CidadeDormePlayer.role` para `CidadeDormeRole | null` e adicionar `allyAssassinIds?: string[]` em `CidadeDormeRoom` em `src/model/entities/multiplayerSession.ts`
- [x] **T002** Estender `IMultiplayerRoomService` em `src/model/services/iMultiplayerRoomService.ts` com operações seguras de ciclo (`startCidadeDormeMatch`, `resolveCidadeDormeDawn`, `tallyCidadeDormeVotes`) que executam apuração sem trafegar segredos no cliente

---

## Fase 2: SQL Supabase (RLS + `security definer`) e Infraestrutura (`docs/`, `supabase/`, `src/infra/`)
*Objetivo: Garantir no PostgreSQL e nos serviços de sala que nenhum jogador leia segredos alheios.*

- [x] **T003** Atualizar `docs/harness/05-infraestrutura-e-supabase.md` e criar migração SQL com `public.cidade_dorme_secrets` (RLS `auth.uid() = user_id`), políticas RLS em `cidade_dorme_actions` e RPCs `security definer` (`cidade_dorme_start_match`, `cidade_dorme_submit_night_action`, `cidade_dorme_resolve_dawn`, `cidade_dorme_tally_votes`)
- [x] **T004** Atualizar `SupabaseMultiplayerRoomService` (`src/infra/services/supabaseMultiplayerRoomService.ts`) removendo `players[].role`, `nightTargetId`, `nightProtectedId`, `detectiveVerdict` e `votesByPlayerId` de `rooms.config` e consultando `cidade_dorme_secrets` apenas para o usuário local (e revelando todos quando `phase === 'finished'`)
- [x] **T005** Atualizar `MemoryMultiplayerRoomService` (`src/infra/services/memoryMultiplayerRoomService.ts`) para armazenar segredos e ações em mapas privados por sala e devolver snapshots filtrados pelo `localPlayerId` ativo

---

## Fase 3: Caso de Uso (`src/usecase/`)
*Objetivo: Delegar apurações críticas e tratar `role: CidadeDormeRole | null` com segurança.*

- [x] **T006** Atualizar `CidadeDormeUseCases` (`src/usecase/cidadeDormeUseCases.ts`) para utilizar as operações seguras do `IMultiplayerRoomService` e validar condições de vitória/papel sem depender de leitura dos papéis alheios no cliente

---

## Fase 4: Testes de Regressão RNF11 (`tests/unit/`)
*Objetivo: Comprovar que o estado público não vaza papéis, ações noturnas nem votos individuais.*

- [x] **T007** Adicionar testes em `tests/unit/supabaseMultiplayerRoomService.test.ts` inspecionando chamadas a `rooms` para garantir ausência de `role` alheio, `nightTargetId`, `nightProtectedId`, `detectiveVerdict` e `votesByPlayerId`
- [x] **T008** Adicionar testes em `tests/unit/cidadeDormeUseCases.test.ts` validando isolamento de papel e veredito do Detetive por jogador (inclusive Anfitrião) e revelação completa em `phase === 'finished'`

---

## Fase 5: Apresentação (`src/viewmodel/`, `src/view/`) e Verificação Final
*Objetivo: Adaptar ViewModel e seções de View para `role | null` e garantir 0 violações.*

- [x] **T009** Atualizar `src/viewmodel/useCidadeDormeViewModel.ts` para tratar `currentPlayer?.role ?? null` ao calcular `currentRoleMeta`
- [x] **T010** Revisar `cidadeDormeRoleSection.tsx`, `cidadeDormeNightSection.tsx` e `cidadeDormeDaySection.tsx` garantindo fallback seguro caso `role` seja `null` antes da revelação final e exibir todos os papéis em `finished`
- [x] **T011** Atualizar `tests/hooks/useCidadeDormeViewModel.test.ts` e `tests/mocks/cidadeDormeScreen.mock.test.tsx` e executar `npm run check` confirmando **0 violações**
- [ ] **T012** Realizar commits convencionais e abrir Pull Request seguindo a receita `/commit-e-pr` vinculando `Closes #40`
