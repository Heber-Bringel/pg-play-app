# ✅ Lista de Tarefas (`tasks.md`): fix-sincronizacao-salas

- **Input:** `specs/019-fix-sincronizacao-salas/spec.md` e `specs/019-fix-sincronizacao-salas/plan.md`
- **Ordem:** `T000` (reprodução) → `model` → `supabase` → `infra` → `usecase` → `di` → `tests` → `viewmodel` → verificação
- **Status:** ⏸️ **Aguardando aprovação humana** antes de qualquer alteração em `src/`

---

## Fase 0: Reprodução no Navegador (sem alterar código)
- [ ] **T000** Subir `npx expo start --web`; com 3 abas e Chrome DevTools (Network + Console) reproduzir e registrar evidências em `specs/019-fix-sincronizacao-salas/evidencias.md`:
  - A1: C entra com PIN após o início da partida.
  - A2/A6: dois STOPs simultâneos (aba A e B) em `filling`.
  - A3: `Network → Slow 3G` em uma aba e verificar fase atrasada/regressão.
  - A4: reconectar aba no meio de `filling` e comparar contadores.
  - A5/A7: envio duplicado de respostas e dúvidas simultâneas.
  - Atualizar `spec.md` §1 marcando cada achado como **Confirmado / Não reproduzido**.

## Fase 1: Domínio Puro (`src/model/`)
- [ ] **T001** `ConflictError` em `src/model/errors.ts`
- [ ] **T002** `version`/`phaseEndsAt` em `AdedonhaRoom` e `version` em `CidadeDormeRoom` (`entities/multiplayerSession.ts`)
- [ ] **T003** Atualizar `IMultiplayerRoomService` (`expectedPhase`, `submitPlayerAnswers`, operações atômicas)

## Fase 2: Banco (`supabase/migrations/`)
- [ ] **T004** `003_rooms_version_phase_ends_at.sql` (coluna `version` + trigger, `phase_ends_at`)
- [ ] **T005** `004_adedonha_atomic_rpcs.sql` (`set_phase`, `trigger_stop`, `submit_answers` *upsert*, `raise_doubt`)
- [ ] **T006** `005_room_players_integrity.sql` (índice único de apelido, `join_room` lobby-only)

## Fase 3: Infraestrutura (`src/infra/`)
- [ ] **T007** `memoryMultiplayerRoomService.ts`: versão, *compare-and-set*, lobby-only, apelido único, upsert de respostas
- [ ] **T008** `supabaseMultiplayerRoomService.ts`: RPCs, mapeamento `version`/`phaseEndsAt`, conversão de erros, descarte de `refresh` obsoleto

## Fase 4: Casos de Uso e DI (`src/usecase/`, `src/di/`)
- [ ] **T009** `adedonhaUseCases.ts` + interface: `joinRoom` lobby-only/reentrada, `expectedPhase`, timeout só se expirado, tratamento de `ConflictError`
- [ ] **T010** `cidadeDormeUseCases.ts` + interface: `joinRoom` lobby-only
- [ ] **T011** `container.ts`: confirmar sem alterações (apenas conferência)

## Fase 5: Testes (`tests/`)
- [ ] **T012** Testes de UseCase: join (lobby/andamento/reentrada/apelido), concorrência com `Promise.all`
- [ ] **T013** Testes do serviço Supabase (RPCs, erros) e do `Memory*`
- [ ] **T014** Testes de ViewModel: snapshots fora de ordem, relógio por `phaseEndsAt`, só host dispara timeout, seleção preservada

## Fase 6: ViewModels (`src/viewmodel/`)
- [ ] **T015** `useAdedonhaViewModel.ts`: guarda de `version`, contador por `phaseEndsAt`, timeout só no host, `ConflictError` silencioso
- [ ] **T016** `useCidadeDormeViewModel.ts`: guarda de `version`; não resetar seleção por snapshot atrasado

## Fase 7: Verificação e PR
- [ ] **T017** `npm run check` com **0 violações**
- [ ] **T018** Repetir o roteiro do `T000` e anexar resultado ao `evidencias.md`
- [ ] **T019** (P3, opcional/outra spec) host-migration e expiração de sala
- [ ] **T020** Commits convencionais e PR via `/commit-e-pr` (`fix(infra)`, `fix(usecase)`, `fix(viewmodel)`, `test(tests)`)
