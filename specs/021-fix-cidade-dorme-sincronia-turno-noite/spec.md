# 📋 Especificação de Funcionalidade (`spec.md`): Correção de Sincronização de Turnos Noturnos no Cidade Dorme

- **Branch da Feature:** `fix/021-cidade-dorme-sincronia-turno-noite`
- **Criado em:** 2026-11-22
- **Status:** Em Revisão
- **Caso(s) de Uso / Requisito(s):** `UC07` (`RF18`, `RF19`, `RF20`, `RNF02`, `RNF03`, `RNF11`) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md`, `docs/jogos/cidade-dorme.md`, `src/viewmodel/useCidadeDormeViewModel.ts`, `src/infra/services/supabaseMultiplayerRoomService.ts`
- **Issue vinculada:** `#65` (`v1.0.0 — Jogos em Sala Multiplayer (UC07–UC08)`)

---

## 1. Descrição do Problema & Cenários de Usuário *(Obrigatório)*

### Contexto Atual e Sintoma Observado
Em simulações com 5 navegadores isolados sobre Supabase Realtime (migrações `003` a `005` aplicadas, branch do PR `#62`), observou-se de forma intermitente (1 em cada 5 partidas) que os celulares dos convidados ficaram **um turno inteiro atrás do anfitrião** durante a noite:
- O anfitrião avança de `night_assassin` para `night_angel` (e depois `night_detective`) quando o cronômetro chega a `00:00` via `handleAutoAdvanceNightTurn`.
- Os convidados dependem exclusivamente dos eventos de `subscribeToCidadeDormeRoom` (`postgres_changes` / `broadcast`).
- Quando um evento de Realtime atrasa ou é perdido, o cronômetro local do convidado chega a `00:00` e permanece congelado na fase anterior: o papel ativo daquele turno não recebe a lista de alvos a tempo e perde sua ação noturna.
- Além disso, na leitura de código atual:
  1. `SupabaseMultiplayerRoomService.getCidadeDormeRoom` seleciona `id, code, host_id, phase, current_round, phase_ends_at, narrator_caption, config` **sem incluir `version`**, fazendo `version` chegar como `0` nos snapshots da sala de Cidade Dorme;
  2. `SupabaseMultiplayerRoomService.subscribeToCidadeDormeRoom` só dispara `refresh()` no status `SUBSCRIBED`, sem tratar reconexões após `CHANNEL_ERROR`, `TIMED_OUT` ou `CLOSED`;
  3. `useCidadeDormeViewModel` atualiza `lastVersionRef` apenas no callback de `subscribeToRoom`, sem atualizar/validar em `applyRoomState` / `handleRetry` e sem resetar `lastVersionRef` ao criar, entrar ou sair da sala.

---

### História de Usuário 1 — Releitura Automática de Segurança (*Watchdog*) Quando `phaseEndsAt` Expira (Prioridade: P1)

Como **Jogador convidado em uma sala de Cidade Dorme**, quero que meu aplicativo busque automaticamente o estado atualizado da sala se o tempo do turno acabar (`phaseEndsAt` expirado) e nenhum evento de troca de fase tiver chegado via Realtime, para que eu nunca fique preso em um turno anterior nem perca minha ação noturna.

**Por que esta prioridade:** Impede a perda silenciosa de turno do Anjo ou do Detetive durante a noite, que compromete diretamente a jogabilidade e a justiça da partida (`RF19`, `RNF02`, `RNF11`).

**Como testar independentemente:** Simular com `jest.useFakeTimers()` um convidado (`isCurrentPlayerHost === false`) em `night_assassin` com `phaseEndsAt` próximo ao vencimento, cuja assinatura `subscribeToRoom` deixa de emitir a mudança para `night_angel`, verificando que `useCidadeDormeViewModel` aciona `useCase.getRoom(room.id)` em até `1,5 s–3 s` após o vencimento e atualiza a sala para `night_angel`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que um convidado está em uma fase temporizada (`night_assassin`, `night_angel`, `night_detective` ou `day_debate`) com `phaseEndsAt` já expirado (`secondsRemaining === 0`), **Quando** passam cerca de `1,5 s` sem que a fase/rodada mude via `subscribeToRoom`, **Então** a ViewModel dispara releitura automática via `useCase.getRoom(room.id)` e repete em intervalo curto (`1,5 s`) até a fase mudar, sincronizando a nova fase em no máximo `3 s` após `phaseEndsAt`.
2. **Dado** que a fase mudou normalmente via Realtime ou o componente foi desmontado / o jogador saiu da sala, **Quando** o ciclo é atualizado, **Então** o *watchdog* pendente é cancelado imediatamente sem chamadas desnecessárias à rede.
3. **Dado** um turno noturno para o anfitrião (`isCurrentPlayerHost === true`), **Quando** `phaseEndsAt` expira, **Então** o anfitrião continua executando o avanço único (`handleAutoAdvanceNightTurn`) e só ativa releitura de recuperação caso o avanço falhe ou não altere a fase.

---

### História de Usuário 2 — Reconexão do Canal Realtime e Propagação de `version` no Supabase (Prioridade: P1)

Como **Sistema de sincronização multiplayer**, quero que o canal Realtime do Cidade Dorme recarregue a sala inteira ao se recuperar de erros/desconexões e sempre inclua a coluna `version` no snapshot carregado, para que reconexões recuperem o estado atual sem regressão de versão.

**Por que esta prioridade:** Elimina falhas silenciosas de assinatura em redes móveis instáveis e torna efetiva a ordenação monotônica por `version` definida na Spec `019` (`RNF03`).

**Como testar independentemente:** Testar `SupabaseMultiplayerRoomService.getCidadeDormeRoom` verificando que `version` vem da linha do banco (com fallback para `0` se ausente) e testar `subscribeToCidadeDormeRoom` simulando callbacks de status `SUBSCRIBED`, `CHANNEL_ERROR`, `TIMED_OUT` e `CLOSED`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** uma consulta em `SupabaseMultiplayerRoomService.getCidadeDormeRoom`, **Quando** a linha retornada de `rooms` contém `version: 5`, **Então** o objeto `CidadeDormeRoom` mapeado possui `version: 5` (e fallback seguro para `0` caso indefinido).
2. **Dado** uma assinatura ativa em `subscribeToCidadeDormeRoom`, **Quando** o canal reporta falha transitória (`CHANNEL_ERROR`, `TIMED_OUT` ou `CLOSED`) e retorna ao estado `SUBSCRIBED` (ou recebe evento de recuperação), **Então** agenda/dispara releitura completa da sala (`refresh`) com deduplicação por sequência (`latestSeq`), evitando múltiplos fetches concorrentes sobrepostos.

---

### História de Usuário 3 — Guarda Monotônica Consistente de `version` na ViewModel (Prioridade: P2)

Como **Jogador recebendo atualizações de múltiplos caminhos (`subscribeToRoom`, `getRoom`, `applyRoomState`)**, quero que a ViewModel nunca aceite um snapshot com `version` menor do que o último já aplicado na mesma sala e sempre reinicie o controle de versão ao trocar de sala.

**Por que esta prioridade:** Previne que uma releitura do *watchdog* ou evento atrasado sobrescreva um avanço mais recente já recebido por outro caminho (`RNF03`).

**Como testar independentemente:** No hook `useCidadeDormeViewModel`, aplicar um snapshot com `version: 4`, em seguida emitir um snapshot atrasado com `version: 3` via `subscribeToRoom` ou retorno de `getRoom`, garantindo que o estado permaneça na versão `4`; depois sair ou entrar em outra sala garantindo reset do controle de versão.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** a sala atual na `version: 4`, **Quando** chega um snapshot de `subscribeToRoom` ou do *watchdog* (`getRoom`) com `version: 3`, **Então** o snapshot antigo é descartado sem alterar `room`, `secondsRemaining` nem seleções do jogador.
2. **Dado** o retorno de `handleCreateRoom`, `handleJoinRoom` ou `handleExitArena`, **Quando** o usuário inicia ou encerra uma sessão de sala, **Então** `lastVersionRef.current` é reiniciado adequadamente (`-1` ao sair, ou atualizado para a `version` da nova sala ao aplicar estado).

---

### Casos de Borda (Edge Cases)

- **Falha transitória de rede durante o *watchdog*:** se `useCase.getRoom(room.id)` lançar `DataSourceError` durante uma releitura em segundo plano do *watchdog*, a ViewModel não deve quebrar a partida nem bloquear a tela com erro fatal; deve aguardar a próxima tentativa controlada ou o próximo evento Realtime, respeitando limite máximo de tentativas consecutivas.
- **Execução com `MemoryMultiplayerRoomService` (modo offline/testes):** `MemoryMultiplayerRoomService` já incrementa `version` monotonicamente em `saveAndNotifyCidadeDorme`; o *watchdog* não deve entrar em conflito com o funcionamento síncrono em memória e deve limpar todos os timers no unmount.
- **Relógio local levemente adiantado em relação ao servidor:** se `getRoom` ainda retornar a mesma fase logo após `phaseEndsAt` (por pequena diferença de relógio entre convidado e anfitrião), o *watchdog* continua ativo em intervalo curto (`1,5 s`) por janela segura até a transição chegar.
- **Preservação do sigilo noturno (`RNF11`):** nenhuma releitura de segurança (`getRoom`) pode expor papéis de outros jogadores ou vazar informações entre telas; `getCidadeDormeRoom` continua filtrando pelo `viewerPlayerId` autenticado.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-65-01` (`RF19` / `RNF02`)**: Adicionar releitura automática de segurança (*watchdog*) em `useCidadeDormeViewModel.ts` quando o tempo de uma fase temporizada (`night_assassin`, `night_angel`, `night_detective`, `day_debate`) expirar e a fase não mudar, recuperando o estado via `useCase.getRoom(room.id)` em até `3 s`.
- **`RF-65-02` (`RNF03`)**: Incluir a coluna `version` na consulta de `getCidadeDormeRoom` em `src/infra/services/supabaseMultiplayerRoomService.ts` e preservar fallback seguro para `0`.
- **`RF-65-03` (`RNF02` / `RNF03`)**: Aprimorar `subscribeToCidadeDormeRoom` em `src/infra/services/supabaseMultiplayerRoomService.ts` para tratar estados de desconexão/reconexão (`SUBSCRIBED`, `CHANNEL_ERROR`, `TIMED_OUT`, `CLOSED`) recarregando o snapshot completo da sala de forma controlada.
- **`RF-65-04` (`RNF03`)**: Unificar a validação e atualização monotônica de `version` (`lastVersionRef`) em `useCidadeDormeViewModel.ts` para todos os fluxos de entrada de estado (`applyRoomState`, `subscribeToRoom`, *watchdog* `getRoom` e `handleExitArena`).
- **`RF-65-05` (`RNF11`)**: Garantir que o mecanismo de recuperação mantenha integralmente o sigilo de papéis e ações noturnas por jogador.

### Entidades e Contratos Envolvidos
- **`CidadeDormeRoom` (`src/model/entities/multiplayerSession.ts`)**: já possui `version: number` e `phaseEndsAt: string | null` (nenhuma alteração estrutural necessária).
- **`ICidadeDormeUseCases` (`src/usecase/iCidadeDormeUseCases.ts`)**: já expõe `getRoom(roomId?: string): Promise<CidadeDormeRoom>` (sem alteração de contrato necessária).

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (Recuperação <= 3 s):** Convidado que perde um evento Realtime no turno noturno alcança a nova fase via releitura automática em no máximo `3 s` após `phaseEndsAt` expirar.
- **`CS-02` (Ação Noturna Garantida):** O papel ativo da vez sempre recebe a lista de alvos enquanto seu turno está aberto após a transição sincronizada.
- **`CS-03` (Regressão Automatizada):** Teste em `tests/hooks/useCidadeDormeViewModel.test.ts` comprova recuperação via `getRoom` quando `subscribeToRoom` omite uma mudança de fase, além do descarte de versões obsoletas; teste em `tests/unit/supabaseMultiplayerRoomService.test.ts` comprova seleção de `version` e tratamento de status do canal.
- **`CS-04` (Arquitetura MVVM):** `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest --passWithNoTests`) passa com **0 violações** e 0 erros.
