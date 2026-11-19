# 📋 Especificação de Funcionalidade (`spec.md`): Correção de Perda de Ações Simultâneas no Cidade Dorme

- **Branch da Feature:** `fix/013-cidade-dorme-acoes-simultaneas`
- **Criado em:** 2026-11-19
- **Status:** Em Revisão
- **Caso(s) de Uso / Requisito(s):** `UC07` (`RF18`, `RF19`, `RF20`, `RNF02`, `RNF11`) — Ref.: `docs/jogos/cidade-dorme.md`, `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md` e `docs/harness/05-infraestrutura-e-supabase.md`
- **Issue vinculada:** `#38` (`v1.0.0 — Jogos em Sala Multiplayer (UC07–UC08)`)

---

## 1. Descrição do Problema & Cenários de Usuário *(Obrigatório)*

### Causa Raiz Diagnosticada (Simulação em Produção — 19/11/2026)
- Hoje, `confirmPlayerReady`, `castVote` e as ações noturnas em `src/usecase/cidadeDormeUseCases.ts` leem a sala inteira (`getCidadeDormeRoom`), modificam o estado apenas em memória e chamam `saveCidadeDormeRoom`, que sobrescreve integralmente o JSONB `rooms.config` no Supabase (*last-write-wins*).
- Quando 5 jogadores tocam quase juntos (`< 1 s` de diferença):
  - **Cenário 1 (Revelação de Papéis):** contador final para em `Prontos: 3/5` no anfitrião e `4/5` nos demais, **travando a partida** em `role_reveal` sem iniciar a 1ª noite;
  - **Cenário 2 (Votação Secreta):** 5 votos simultâneos resultam em `Votos registrados: 1/5` (perdendo 4 votos).

---

### História de Usuário 1 — Confirmação Simultânea de "Esconder e Estou Pronto" Sem Travar a Partida (Prioridade: P1)

Como **Grupo de 5 a 16 jogadores na fase `role_reveal`**, queremos confirmar *"Esconder e Estou Pronto"* ao mesmo tempo em nossos celulares sem que uma gravação sobrescreva a outra, garantindo contagem exata (`Prontos: N/N`) e transição única para a 1ª Noite.

**Por que esta prioridade:** É um bug bloqueante (*showstopper*): em partidas reais presenciais os jogadores tocam quase simultaneamente e o jogo trava antes mesmo da primeira noite começar (`RF18`).

**Como testar independentemente:** Disparar `Promise.all` com 5 chamadas paralelas a `confirmPlayerReady` (para 5 jogadores distintos na mesma sala) e verificar que todos ficam `isReady: true` (`Prontos: 5/5`) e a fase transiciona exatamente uma vez para `night_assassin`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** uma sala em `role_reveal` com 5 jogadores não prontos, **Quando** os 5 jogadores executam `confirmPlayerReady` simultaneamente (`< 1 s` / `Promise.all`), **Então** cada confirmação é persistida de forma atômica por jogador, resultando em `5/5` prontos sem sobrescrita mútua (`RF18`).
2. **Dado** que o 5º jogador conclui a confirmação atômica no servidor, **Quando** a contagem de prontos atinge `totalPlayers`, **Então** a sala transiciona atomicamente para `night_assassin` exatamente uma vez, emitindo evento Realtime sincronizado para todos os aparelhos.

---

### História de Usuário 2 — Registro Atômico de Votos Simultâneos e Ações Noturnas (Prioridade: P1)

Como **Jogador Vivo na fase `day_voting` ou titular de papel noturno**, quero confirmar meu voto secreto (ou ação da noite) no mesmo segundo que outros participantes sem perder registros na apuração.

**Por que esta prioridade:** Votos perdidos distorcem o resultado democrático da votação e quebram a confiabilidade da partida (`RF20`, `RNF11`).

**Como testar independentemente:** Disparar `Promise.all` com 5 chamadas paralelas a `castVote` na mesma rodada e validar `Object.keys` / `totalVotesCast === 5` e apuração fiel dos 5 votos em `tallyVotes`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** uma sala em `day_voting` com 5 jogadores vivos, **Quando** todos os 5 confirmam seu voto simultaneamente (`Promise.all`), **Então** todos os 5 votos individuais permanecem registrados para a rodada atual (`Votos registrados: 5/5`) (`RF20`).
2. **Dado** que um jogador altera seu voto antes da apuração (`Atualizar Meu Voto Secreto`), **Quando** envia o novo voto na mesma rodada, **Então** a linha única `(room_id, round_number, user_id, 'vote')` é atualizada via *upsert* atômico sem duplicar nem afetar votos de outros jogadores.
3. **Dado** uma ação noturna registrada por Assassino, Anjo ou Detetive, **Quando** persistida via linha própria em `cidade_dorme_actions` / RPC atômica, **Então** não sobrescreve outros campos de `rooms.config` nem colide com atualizações simultâneas da sala.

---

### Casos de Borda (Edge Cases)

- **Cliques duplos do mesmo jogador em `confirmPlayerReady` ou `castVote`:** operação idempotente por chave única `(room_id, round_number, user_id, kind)` sem incrementar contagem duplicada nem falhar.
- **Dois ou mais Assassinos agindo simultaneamente (`assassinCount > 1`):** se houver ação concorrente no mesmo turno `night_assassin`, o registro usa chave por `(room_id, round_number, kind)` ou consolidação determinística em `cidade_dorme_actions` sem corromper o JSONB de `rooms.config`.
- **Corrida na transição `role_reveal` → `night_assassin`:** a função atômica (`rpc` no Supabase e atualização em memória) deve usar verificação condicional (`phase = 'role_reveal'`) ou lock transacional para não reiniciar `night_assassin` duas vezes caso os dois últimos jogadores confirmem no mesmo milissegundo.
- **Coordenação com `#40` (`RNF11`) e `#42` (Validação de Atores):** a tabela `cidade_dorme_actions` e as RPCs já nascem alinhadas para nunca expor votos/alvos individuais no payload público (`#40`) e validar `actorPlayerId` (`#42`).

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-38-01` (`RF18`)**: Persistir `confirmPlayerReady` de forma isolada e atômica por jogador (`room_players.is_ready` / `cidade_dorme_actions`), garantindo `N/N` prontos sob concorrência e transição única para `night_assassin`.
- **`RF-38-02` (`RF20`)**: Persistir cada voto secreto em linha própria/atômica por `(room_id, round_number, user_id, 'vote')` via `INSERT ... ON CONFLICT DO UPDATE` ou RPC dedicada, garantindo `5/5` votos sob concorrência.
- **`RF-38-03` (`RF19` / `RNF11`)**: Persistir ações noturnas (`night_assassin`, `night_angel`, `night_detective`) em `cidade_dorme_actions` / RPC sem reescrever `rooms.config` inteiro.
- **`RF-38-04` (Realtime)**: Assinar `postgres_changes` também na tabela `cidade_dorme_actions` em `SupabaseMultiplayerRoomService.subscribeToCidadeDormeRoom` para atualizar contadores em tempo real em todos os dispositivos.

### Entidades e Contratos Envolvidos (`src/model/`)
- **`CidadeDormeActionKind`**: `'ready' | 'night_assassin' | 'night_angel' | 'night_detective' | 'vote'` em `src/model/entities/multiplayerSession.ts`.
- **`CidadeDormeActionRecord`**: `{ id: string; roomId: string; roundNumber: number; playerId: string; kind: CidadeDormeActionKind; targetId: string | null; createdAt: string }` em `src/model/entities/multiplayerSession.ts`.
- **`IMultiplayerRoomService`**: novos métodos atômicos `markCidadeDormePlayerReady`, `submitCidadeDormeVote` e `submitCidadeDormeNightAction`.

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (Concorrência `Promise.all`)**: 5 confirmações simultâneas de pronto resultam em `5/5` e início da noite; 5 votos simultâneos resultam em `5/5` votos contabilizados.
- **`CS-02` (Conformidade Arquitetural)**: Problema resolvido nas camadas `model`, `infra` e `usecase` sem alterar `scripts/check-arquitetura.mjs` e mantendo `MemoryMultiplayerRoomService` 100% compatível.
- **`CS-03` (Arquitetura MVVM)**: `npm run check` (`check-arquitetura.mjs` + `tsc --noEmit` + `jest`) executa com **0 violações** e todos os testes de regressão passando.
