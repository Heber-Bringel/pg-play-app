# ✅ Lista de Tarefas (`tasks.md`): Correção de Sincronização de Turnos Noturnos no Cidade Dorme

- **Input:** `specs/021-fix-cidade-dorme-sincronia-turno-noite/spec.md` e `specs/021-fix-cidade-dorme-sincronia-turno-noite/plan.md`
- **Ordem de Execução Obrigatória:** De dentro para fora (`infra` → `viewmodel` → `tests` → `npm run check`)
- **Receitas do Harness:** `/revisar-arquitetura`, `/commit-e-pr`
- **Issue vinculada:** `#65`

---

## Fase 1: Infraestrutura Realtime e Versionamento (`src/infra/`)
*Objetivo: Garantir que os snapshots vindos do Supabase carreguem `version` e que o canal Realtime se recupere de desconexões.*

- [x] **T001** Atualizar `getCidadeDormeRoom` em `src/infra/services/supabaseMultiplayerRoomService.ts` para incluir `version` no `.select(...)` da tabela `rooms` e tipar o retorno garantindo mapeamento correto em `mapRowToCidadeDormeRoom`
- [x] **T002** Atualizar `subscribeToCidadeDormeRoom` em `src/infra/services/supabaseMultiplayerRoomService.ts` para disparar releitura de recuperação da sala quando o status do canal retornar `CHANNEL_ERROR`, `TIMED_OUT` ou `CLOSED`, limpando eventuais timers na função de `unsubscribe`

---

## Fase 2: ViewModel — Watchdog de Turno e Guarda Monotônica (`src/viewmodel/`)
*Objetivo: Recuperar turnos noturnos/diurnos perdidos em até 3s após `phaseEndsAt` e proteger o estado contra snapshots fora de ordem.*

- [x] **T003** Centralizar o helper `acceptRoomSnapshot` e o reset de `lastVersionRef.current = -1` em `src/viewmodel/useCidadeDormeViewModel.ts` (aplicado a `applyRoomState`, `subscribeToRoom`, `handleRetry`, `handleCreateRoom`, `handleJoinRoom` e `handleExitArena`)
- [x] **T004** Implementar o efeito de *watchdog* pós-`phaseEndsAt` em `src/viewmodel/useCidadeDormeViewModel.ts` para fases temporizadas (`night_assassin`, `night_angel`, `night_detective`, `day_debate`), acionando `useCase.getRoom(room.id)` em intervalo curto (`1,5 s`) após o vencimento quando a fase ainda não mudou, com tratamento silencioso de erro transitório, limite seguro de tentativas e cleanup completo ao mudar de fase ou desmontar

---

## Fase 3: Testes Automatizados (`tests/`)
*Objetivo: Cobrir regressão de perda de evento Realtime, reconexão do canal e ordenação por `version`.*

- [x] **T005** Adicionar testes em `tests/unit/supabaseMultiplayerRoomService.test.ts` validando leitura da coluna `version` em `getCidadeDormeRoom` e releitura do canal em `CHANNEL_ERROR` / `TIMED_OUT` / `CLOSED`
- [x] **T006** Adicionar teste de regressão em `tests/hooks/useCidadeDormeViewModel.test.ts` simulando convidado cujo `subscribeToRoom` deixa de emitir a troca de fase após `phaseEndsAt`, verificando recuperação automática via `getRoom` em `<= 3 s`, descarte de snapshot com `version` menor e limpeza de timers no unmount

---

## Fase 4: Verificação Arquitetural, Simulação e Pull Request
*Objetivo: Confirmar 0 violações no Harness MVVM Sofisticado e validar simulação com 5 jogadores antes do PR.*

- [x] **T007** Executar `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest --passWithNoTests`) e confirmar **0 violações**
- [x] **T008** Validar simulação com 5 jogadores (mínimo 5 rodadas/partidas conforme critério da Issue `#65`), realizar commits convencionais e abrir Pull Request vinculando `Closes #65`
