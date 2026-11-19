# ✅ Lista de Tarefas (`tasks.md`): Correção de Perda de Ações Simultâneas no Cidade Dorme

- **Input:** `specs/013-fix-cidade-dorme-acoes-simultaneas/spec.md` e `specs/013-fix-cidade-dorme-acoes-simultaneas/plan.md`
- **Ordem de Execução Obrigatória:** De dentro para fora (`model` → `SQL/infra` → `usecase` → `tests` → `viewmodel/view` se aplicável → `npm run check`)
- **Receitas do Harness:** `/nova-funcionalidade`, `/revisar-arquitetura`, `/commit-e-pr`

---

## Fase 1: Domínio Puro (`src/model/`)
*Objetivo: Definir tipos de ação atômica e estender `IMultiplayerRoomService` sem dependências externas.*

- [x] **T001** Adicionar `CidadeDormeActionKind` e `CidadeDormeActionRecord` em `src/model/entities/multiplayerSession.ts`
- [x] **T002** Declarar `markCidadeDormePlayerReady`, `submitCidadeDormeVote` e `submitCidadeDormeNightAction` na interface `IMultiplayerRoomService` em `src/model/services/iMultiplayerRoomService.ts`

---

## Fase 2: Esquema SQL Supabase e Infraestrutura (`docs/`, `supabase/`, `src/infra/`)
*Objetivo: Substituir gravações destrutivas em JSONB por linhas individuais e RPCs atômicas.*

- [x] **T003** Documentar e versionar a tabela `public.cidade_dorme_actions` (com `UNIQUE (room_id, round_number, user_id, kind)`) e as RPCs atômicas (`cidade_dorme_mark_ready`, `cidade_dorme_cast_vote`, `cidade_dorme_submit_night_action`) em `docs/harness/05-infraestrutura-e-supabase.md` e script SQL de migração
- [x] **T004** Implementar `markCidadeDormePlayerReady`, `submitCidadeDormeVote` e `submitCidadeDormeNightAction` de forma atômica em `src/infra/services/memoryMultiplayerRoomService.ts` (resistente a `Promise.all`)
- [x] **T005** Implementar `markCidadeDormePlayerReady`, `submitCidadeDormeVote` e `submitCidadeDormeNightAction` em `src/infra/services/supabaseMultiplayerRoomService.ts`, reconstruindo prontos, votos e ações a partir das linhas de `room_players` / `cidade_dorme_actions` e assinando `cidade_dorme_actions` no Realtime

---

## Fase 3: Caso de Uso (`src/usecase/`)
*Objetivo: Migrar `confirmPlayerReady`, `castVote` e ações noturnas para os métodos atômicos mantendo validações `ValidationError`.*

- [x] **T006** Atualizar `confirmPlayerReady` em `src/usecase/cidadeDormeUseCases.ts` para invocar `roomService.markCidadeDormePlayerReady` e disparar `speakIfHost` quando a transição para `night_assassin` ocorrer
- [x] **T007** Atualizar `castVote` e ações noturnas em `src/usecase/cidadeDormeUseCases.ts` para usar `submitCidadeDormeVote` e `submitCidadeDormeNightAction` mantendo todas as validações de negócio

---

## Fase 4: Testes de Regressão Concorrente (`tests/unit/`)
*Objetivo: Provar determinística e automaticamente que ações simultâneas não se perdem.*

- [x] **T008** Adicionar testes de regressão com `Promise.all` (5 `confirmPlayerReady` simultâneos e 5 `castVote` simultâneos) em `tests/unit/cidadeDormeUseCases.test.ts`
- [x] **T009** Adicionar testes unitários das chamadas RPC atômicas e assinatura Realtime de `cidade_dorme_actions` em `tests/unit/supabaseMultiplayerRoomService.test.ts`

---

## Fase 5: Integração na Apresentação, Verificação e Pull Request
*Objetivo: Confirmar atualização fluida de contadores na ViewModel/View e 0 violações no Harness.*

- [x] **T010** Revisar `src/viewmodel/useCidadeDormeViewModel.ts` para garantir que snapshots recebidos via `subscribeToRoom` após RPC atômica atualizem `Prontos: 5/5` e `Votos registrados: 5/5` sem sobreescrever seleção local
- [x] **T011** Executar `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest`) e confirmar **0 violações**
- [ ] **T012** Realizar commits convencionais e abrir Pull Request seguindo a receita `/commit-e-pr` vinculando `Closes #38`
