# 🏗️ Plano de Implementação Técnica (`plan.md`): Correção de Sincronização de Turnos Noturnos no Cidade Dorme

- **Branch:** `fix/021-cidade-dorme-sincronia-turno-noite`
- **Data:** 2026-11-22
- **Especificação de Origem:** `specs/021-fix-cidade-dorme-sincronia-turno-noite/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

Corrigir o atraso intermitente de turnos noturnos para convidados no **Cidade Dorme (`UC07`, Issue `#65`)** atuando exclusivamente nas camadas de **Infraestrutura (`src/infra/`)**, **ViewModel (`src/viewmodel/`)** e **Testes (`tests/`)**, sem alterar o domínio nem a interface visual:
1. Em `src/infra/services/supabaseMultiplayerRoomService.ts`: selecionar explicitamente a coluna `version` em `getCidadeDormeRoom`, e evoluir `subscribeToCidadeDormeRoom` para reagir a quedas/reconexões do canal (`CHANNEL_ERROR`, `TIMED_OUT`, `CLOSED`, `SUBSCRIBED`) disparando ressincronização segura da sala.
2. Em `src/viewmodel/useCidadeDormeViewModel.ts`: implementar um *watchdog* de releitura automática (`useCase.getRoom(room.id)`) acionado quando uma fase temporizada expira (`secondsRemaining === 0` / `phaseEndsAt` ultrapassado) e a fase não transita em até `1,5 s`, repetindo em intervalo curto até a atualização (garantindo convergência em `<= 3 s`), além de centralizar a guarda monotônica de `version` (`lastVersionRef`) em todos os pontos de entrada de snapshot.

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo devem estar marcados antes de gerar o `tasks.md` ou iniciar código.*

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada com os requisitos `RF-65-01` a `RF-65-05` e vínculo com `UC07` / Issue `#65`.
- [x] **Artigo II (MVVM 7 Pastas)**: Todas as alterações planejadas residem exclusivamente em `src/infra/services/` e `src/viewmodel/`, sem criar pastas novas em `src/`.
- [x] **Artigo II (Rotas Finas e View Burra)**: `src/view/cidade-dorme.tsx` e `src/app/cidade-dorme.tsx` não sofrem alterações; toda lógica de sincronização, temporização e releitura permanece isolada na `ViewModel` e no `Service`.
- [x] **Artigo II (Vocabulário)**: Nenhum arquivo, interface ou classe utiliza `Repository` ou `Connector` (mantém `SupabaseMultiplayerRoomService` e `MemoryMultiplayerRoomService`).
- [x] **Artigo III (Design System)**: Nenhuma alteração visual necessária; tokens e componentes em `src/view/` permanecem intactos.
- [x] **Artigo IV (Testabilidade Offline)**: O *watchdog* na `ViewModel` depende apenas do contrato `ICidadeDormeUseCases` (`getRoom` / `subscribeToRoom`) e pode ser testado 100% offline com `MemoryMultiplayerRoomService` ou dublês determinísticos.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

> **Sem alterações previstas em:** `src/model/`, `src/usecase/`, `src/di/`, `src/view/` e `src/app/`.

```text
src/
├─ infra/
│  └─ services/
│     └─ supabaseMultiplayerRoomService.ts    # Seleciona `version` em getCidadeDormeRoom; ressincroniza sala em reconexões/erros do canal Realtime
└─ viewmodel/
   └─ useCidadeDormeViewModel.ts              # Watchdog pós-phaseEndsAt via useCase.getRoom, controle unificado de lastVersionRef e limpeza de timers

tests/
├─ unit/
│  └─ supabaseMultiplayerRoomService.test.ts  # Verifica leitura de `version` e disparo de refresh em SUBSCRIBED / CHANNEL_ERROR / TIMED_OUT / CLOSED
└─ hooks/
   └─ useCidadeDormeViewModel.test.ts         # Regressão: assinatura perde evento de fase -> watchdog via getRoom recupera <= 3s; descarte de snapshot com version menor
```

---

## 4. Detalhamento do Fluxo de Sincronização e Concorrência

1. **Seleção e Mapeamento de `version` (`supabaseMultiplayerRoomService.ts`):**
   - Na query de `rooms` dentro de `getCidadeDormeRoom`, incluir `version` no `.select(...)` e no tipo de retorno da linha (`version?: number | null`).
   - `mapRowToCidadeDormeRoom` mantém `version: row.version ?? 0` para retrocompatibilidade em mocks parciais.
2. **Reconexão e Deduplicação no Canal (`supabaseMultiplayerRoomService.ts`):**
   - No `.subscribe((status?: string) => ...)`:
     - Em `SUBSCRIBED`: chama `refresh()`.
     - Em `CHANNEL_ERROR`, `TIMED_OUT` ou `CLOSED`: agenda uma releitura de recuperação (e limpa timers pendentes no `unsubscribe`) para que a UI recupere eventos perdidos mesmo antes de o socket estabilizar novamente, garantindo no cleanup (`removeChannel`) que não haja vazamento de timers.
3. **Watchdog de Turno Expirado (`useCidadeDormeViewModel.ts`):**
   - Aplicável a fases temporizadas (`night_assassin`, `night_angel`, `night_detective`, `day_debate`) enquanto houver `room?.id` e `room.phaseEndsAt`.
   - Quando `secondsRemaining <= 0` (tempo local esgotado segundo `phaseEndsAt`), inicia um intervalo curto de segurança (ex.: primeiro disparo em `1_500 ms` e repetição a cada `1_500 ms`, limitado a uma janela segura de tentativas consecutivas para evitar loop infinito se a sala ficar órfã) chamando `useCase.getRoom(room.id)`.
   - Para o anfitrião à noite, mantém a prioridade do `handleAutoAdvanceNightTurn`; o *watchdog* entra apenas se o estado da sala ainda permanecer na mesma `phaseKey` após o tempo limite.
   - Assim que o snapshot retornado por `getRoom` tiver `phase`/`currentRound` atualizado (ou `version >= lastVersionRef.current`), aplica via helper único `acceptRoomSnapshot(nextRoom)` que atualiza `lastVersionRef.current`, chama `syncPhaseTimerAndSelection(nextRoom)` e `setRoom(nextRoom)`, cancelando o *watchdog* da fase anterior.
   - Limpa todos os timers/intervalos ao trocar de `phaseKey`, sair da sala (`handleExitArena`) ou desmontar o hook.
4. **Reset e Guarda de `lastVersionRef` (`useCidadeDormeViewModel.ts`):**
   - Ao criar/entrar em uma sala (`handleCreateRoom` / `handleJoinRoom`) ou sair (`handleExitArena`), resetar `lastVersionRef.current = -1` antes de aplicar a nova sala.
   - Tanto `subscribeToRoom`, `handleRetry` quanto o *watchdog* passam por verificação monotônica: se o snapshot pertencer à mesma `room.id` e `nextRoom.version < lastVersionRef.current`, é ignorado silenciosamente.

---

## 5. Inventário do Design System (`PG Play Expressive`)

> Não há novos elementos visuais nesta correção. Toda a renderização de `CidadeDormeScreen` mantém os tokens e componentes já especificados em `specs/020-uc07-cidade-dorme-ui-ux-animacoes/`.

---

## 6. Estratégia de Testes (`tests/`)

- **Testes Unitários (`tests/unit/supabaseMultiplayerRoomService.test.ts`):**
  - Validar que `getCidadeDormeRoom` lê `version` da tabela `rooms` e repassa para `CidadeDormeRoom.version`.
  - Validar que `subscribeToCidadeDormeRoom` aciona `refresh` em `SUBSCRIBED` e realiza releitura de recuperação após `CHANNEL_ERROR` / `TIMED_OUT` / `CLOSED`, cancelando timers ao chamar `unsubscribe()`.
- **Testes de Hook (`tests/hooks/useCidadeDormeViewModel.test.ts`):**
  - **Teste de regressão obrigatório da Issue `#65`:** Configurar uma sala na fase `night_assassin` como jogador convidado (`isCurrentPlayerHost === false`) com `phaseEndsAt` expirado; simular uma assinatura `subscribeToRoom` que **não** emite a mudança de fase e `getRoom` retornando a sala já avançada para `night_angel` com `version` maior. Avançar timers (`<= 3000 ms`) com `jest.useFakeTimers()` e verificar que `state.room?.phase` transita para `'night_angel'` automaticamente.
  - Validar que, após `night_angel` avançar normalmente, um snapshot atrasado com `version` inferior é ignorado por `useCidadeDormeViewModel`.
  - Validar que nenhum timer do *watchdog* permanece ativo após `unmount()` ou `handleExitArena()`.
