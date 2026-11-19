# 📋 Especificação de Funcionalidade (`spec.md`): Correção de Travamento da Noite e Cadência Fixa no Cidade Dorme

- **Branch da Feature:** `fix/016-cidade-dorme-noite-trava`
- **Criado em:** 2026-11-19
- **Status:** Em Revisão
- **Caso(s) de Uso / Requisito(s):** `UC07` (`RF10`, `RF19`, `RNF11`) — Ref.: `docs/jogos/cidade-dorme.md` (Seção 4 — Cadência Fixa Anti-Dedução), `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md`, `src/usecase/cidadeDormeUseCases.ts`, `src/viewmodel/useCidadeDormeViewModel.ts` e `src/view/components/cidadeDormeNightSection.tsx`
- **Issue vinculada:** `#41` (`v1.0.0 — Jogos em Sala Multiplayer (UC07–UC08)`)

---

## 1. Descrição do Problema & Cenários de Usuário *(Obrigatório)*

### Causas Raiz Diagnosticadas (Simulação com 5 Jogadores)
- **Caso real observado:** na 1ª noite o Assassino eliminou o Anjo; na 2ª noite, após o turno do Assassino, a fase foi para `night_angel`. Como o Anjo estava morto, ninguém via lista de alvos, o cronômetro chegou a `00:00` em todos os celulares e **a partida travou indefinidamente** (> 25s sem avançar).
- **Três falhas técnicas combinadas:**
  1. `useCidadeDormeViewModel` faz apenas contagem regressiva local até `0` sem chamar `handleAutoAdvanceNightTurn` nem ler um horário único do servidor (`phaseEndsAt`);
  2. O botão *"Concluir Noite e Amanhecer"* existe apenas dentro do card de veredito do Detetive em `cidadeDormeNightSection.tsx` — logo, se o Detetive estiver morto ou não agir, **a noite nunca amanhece**;
  3. O método atual `autoAdvanceNightTurn` escolhe artificialmente `alivePlayers[0]` quando o papel não age, em vez de deixar a ação vazia, e os envios de Assassino/Anjo encerram o turno imediatamente (o que violaria `RNF11`, pois pular ou acelerar a fase de um papel morto entregaria sua morte ao grupo).

---

### História de Usuário 1 — Avanço Automático da Noite Mesmo com Papel Morto ou Sem Ação (Prioridade: P1)

Como **Grupo Jogando Cidade Dorme**, quero que todas as fases da Noite (`night_assassin` → `night_angel` → `night_detective` → amanhecer) avancem automaticamente ao zerar o cronômetro mesmo quando **Anjo** ou **Detetive** estiverem mortos ou quando um papel vivo não agir a tempo.

**Por que esta prioridade:** É um travamento fatal de partida (*deadlock*): basta eliminar o Anjo ou o Detetive para tornar impossível continuar o jogo (`RF19`).

**Como testar independentemente:** Simular partidas em que (a) o Anjo foi morto, (b) o Detetive foi morto, e (c) o papel vivo não tocou em nenhum alvo; avançar o relógio até o término do turno (`phaseEndsAt`) e verificar transição automática até `day_debate` (ou `finished`) sem vítima/proteção/investigação fabricada.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o Anjo está morto (`isAlive: false`) e a sala entra em `night_angel`, **Quando** o cronômetro de `config.nightTurnSeconds` chega a `00:00`, **Então** o celular do Anfitrião aciona `autoAdvanceNightTurn(room.id, 'night_angel', room.currentRound)` automaticamente, a proteção permanece `null` (sem inventar alvo) e a fase avança para `night_detective` (`RF19`, `RNF11`).
2. **Dado** que o Detetive está morto (ou não investigou ninguém no turno), **Quando** o cronômetro de `night_detective` chega a `00:00`, **Então** a noite conclui automaticamente chamando `advanceToDawn` e a cidade acorda em `day_debate` (ou `finished` em caso de vitória), sem depender de botão manual do Detetive (`RF19`).
3. **Dado** que o Assassino vivo não selecionou vítima dentro de `config.nightTurnSeconds`, **Quando** o tempo zera, **Então** `nightTargetId` permanece `null` e ninguém morre durante aquela noite.

---

### História de Usuário 2 — Cadência Fixa Anti-Dedução (`RNF11`) e Horário Único do Servidor (`phaseEndsAt`) (Prioridade: P1)

Como **Jogador da Roda**, quero que cada fase da noite dure exatamente o tempo configurado (`config.nightTurnSeconds`) independentemente de o papel estar vivo, morto ou ter agido rápido, calculado sobre um horário único de fim (`phaseEndsAt`).

**Por que esta prioridade:** Impede que jogadores descubram pela velocidade ou duração do turno se o Anjo/Detetive já morreu ou quem demorou para clicar no celular (`RNF11`, `docs/jogos/cidade-dorme.md`).

**Como testar independentemente:** Comparar `phaseEndsAt` atribuído ao entrar em `night_angel` / `night_detective` quando o papel está vivo vs. quando está morto e quando o jogador confirma sua ação antes do tempo zerar.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que a sala entra em `night_assassin`, `night_angel`, `night_detective` ou `day_debate`, **Quando** a transição é salva, **Então** `room.phaseEndsAt` é definido como `agora + duracaoConfigurada * 1000` (ISO UTC), sendo idêntico quer o titular esteja vivo ou morto (`RNF11`).
2. **Dado** que o Assassino ou Anjo vivo confirmou sua escolha antes do fim do cronômetro, **Quando** a ação é gravada, **Então** o registro é salvo e a tela do jogador exibe feedback de confirmação (*"Escolha registrada — aguarde o fim do turno"*), mantendo a fase ativa até `phaseEndsAt` atingir `00:00` (`RNF11`).
3. **Dado** que o Detetive vivo investigou um suspeito dentro do turno, **Quando** recebe seu veredito silencioso, **Então** vê apenas o resultado (sem botão *"Concluir Noite e Amanhecer"*), aguardando o término natural do cronômetro para amanhecer com segurança.

---

### Casos de Borda (Edge Cases)

- **Idempotência de `autoAdvanceNightTurn`:** se dois eventos ou timers tentarem avançar a mesma fase (`expectedPhase` e `expectedRound`), o UseCase verifica se a fase/rodada ainda é a esperada (e se `phaseEndsAt` já expirou ou foi autorizada) antes de transicionar, evitando pular duas fases de uma vez.
- **Reconexão durante turno noturno ou debate:** ao reentrar na sala, `secondsRemaining = Math.max(0, Math.ceil((Date.parse(room.phaseEndsAt) - now()) / 1000))` sincroniza imediatamente o cronômetro do aparelho com os demais.
- **Compatibilidade com fluxo em testes unitários:** `autoAdvanceNightTurn` continua funcionando de forma determinística com fonte de tempo injetável `now?: () => number` nos UseCases e ViewModel.
- **Anfitrião eliminado (Modo Espectador):** mesmo que o Anfitrião morra, seu aparelho continua sendo o coordenador público dos timers/áudio (`RNF11`), garantindo que a partida nunca trave após sua eliminação.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-41-01` (`RF19` / `RNF11`)**: Persistir `phaseEndsAt: string | null` em `CidadeDormeRoom` a cada entrada em fase cronometrada (`night_assassin`, `night_angel`, `night_detective`, `day_debate`), com duração fixa independente de papel vivo ou morto.
- **`RF-41-02` (`RF19` / `RNF11`)**: Registrar ações de Assassino e Anjo sem encerrar a fase antecipadamente; remover o botão *"Concluir Noite e Amanhecer"* da tela do Detetive.
- **`RF-41-03` (`RF19`)**: Tornar `autoAdvanceNightTurn` idempotente e fiel à regra: se o papel não agiu ou está morto, avançar com ação vazia (`null`) e concluir a noite após `night_detective`.
- **`RF-41-04` (`RF10`)**: Em `useCidadeDormeViewModel`, calcular `secondsRemaining` a partir de `room.phaseEndsAt` e disparar `handleAutoAdvanceNightTurn` automaticamente no dispositivo do Anfitrião ao atingir `00:00`.

### Entidades e Contratos Envolvidas (`src/model/` e `src/usecase/`)
- **`CidadeDormeRoom`**: adicionar `phaseEndsAt: string | null` em `src/model/entities/multiplayerSession.ts`.
- **`ICidadeDormeUseCases`**: atualizar assinatura opcional `autoAdvanceNightTurn(roomId: string, expectedPhase?: CidadeDormePhase, expectedRound?: number): Promise<CidadeDormeRoom>`.

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (Continuidade Sem Travamentos)**: Partidas com Anjo morto, Detetive morto ou jogador ausente atravessam todas as fases noturnas e amanhecem no tempo exato configurado.
- **`CS-02` (Cadência Anti-Dedução `RNF11`)**: A duração observada de `night_assassin`, `night_angel` e `night_detective` não varia conforme quem morreu ou quão rápido o jogador tocou.
- **`CS-03` (Arquitetura MVVM)**: `npm run check` (`check-arquitetura.mjs` + `tsc --noEmit` + `jest`) executa com **0 violações** e todos os testes de regressão passando.
