# 📋 Especificação de Funcionalidade (`spec.md`): Correção de Sincronização de Salas Multiplayer (Adedonha e Cidade Dorme)

- **Branch da Feature:** `fix/019-sincronizacao-salas`
- **Criado em:** 2026-11-21
- **Status:** Em Revisão
- **Caso(s) de Uso / Requisito(s):** `UC07` e `UC08` (`RF19`, `RF22`, `RNF03`, `RNF11`) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md`, `docs/jogos/adedonha-biblica.md`, `docs/jogos/cidade-dorme.md`
- **Issue vinculada:** `#X` (Milestone `v1.0.0 — Jogos em Sala Multiplayer (UC07–UC08)`)
- **Origem:** análise estática de `src/infra/services/supabaseMultiplayerRoomService.ts`, `src/viewmodel/useAdedonhaViewModel.ts` e `src/viewmodel/useCidadeDormeViewModel.ts` + relatos do time (entrada no meio da partida, telas travadas com erro de fase, atraso de fase na tela de usuários).

> [!NOTE]
> Os achados `A1–A9` abaixo vêm de leitura de código. A etapa **T000** do `tasks.md` os confirma no navegador (2–3 abas via `expo start --web`) **antes** de qualquer alteração em `src/`; achados não reproduzidos devem ser rebaixados ou removidos desta spec.

---

## 1. Descrição do Problema & Achados

| ID | Achado | Onde | Sintoma |
| :-- | :--- | :--- | :--- |
| **A1** | `join*Room` não valida `phase`/`status` | `joinAdedonhaRoom`, `joinCidadeDormeRoom` | Jogador entra no meio da partida; no Cidade Dorme nasce `is_alive: true` sem papel |
| **A2** | Transições do Adedonha sem *compare-and-set* (`update ... .eq('id')` sem `.eq('phase')`) | `openRoundFilling`, `triggerAdedonhaStop`, `startTallyPhase`, `advance*` | Fase pula/volta com cliques simultâneos; erro de "fase errada" em quem ficou para trás |
| **A3** | Snapshots sem versão e sem ordenação | `subscribeToRoom`, `subscribeToCidadeDormeRoom` (`refresh`) | Resposta antiga sobrescreve a nova; tela atrasada em relação aos demais |
| **A4** | Cronômetro do Adedonha só local | `useAdedonhaViewModel` (`setInterval`) | Quem entra tarde/reconecta reinicia o tempo; todos disparam `finishRoundByTimeOut` |
| **A5** | `submitPlayerAnswers` faz `delete` + `insert`, sem validar fase nem identidade | `submitPlayerAnswers` | Perda de respostas, duplicatas, envio após fechamento, envio por outro jogador |
| **A6** | STOP sem guarda de fase e `config` JSON reescrito inteiro | `triggerAdedonhaStop` | STOP duplicado sobrescreve `stopTriggeredBy`; perda de `usedLetters`/`currentTallyColumnIndex` |
| **A7** | `raiseDoubt` lê-e-escreve `doubt_count` | `raiseDoubt` | Dúvidas simultâneas contam como uma; sem limite por jogador |
| **A8** | Corrida de apelido no Cidade Dorme e `syncPhaseTimerAndSelection` zerando votos locais por snapshot atrasado | `joinCidadeDormeRoom`, ViewModel | Apelidos duplicados; voto/seleção local perdidos |
| **A9** | Sem host-migration, presença/heartbeat nem expiração de sala | serviço Supabase | Sala trava se o Anfitrião sai; jogadores fantasmas |

---

## 2. Cenários de Usuário & Testes de Aceitação

### História 1 — Entrada só no Lobby (Prioridade: P1) · A1
Jogadores só podem **entrar como novos** antes da partida começar; quem já faz parte da sala pode **reconectar** a qualquer momento.

**Como testar:** abrir 3 abas; A cria sala, B entra, A inicia a partida; C tenta entrar com o PIN.

1. **Dado** sala em `phase !== 'lobby'`, **Quando** um usuário que não está na sala chama `joinRoom`, **Então** o UseCase lança `ValidationError('A partida já começou…')` e nenhum `room_players` é criado.
2. **Dado** sala em andamento e usuário já listado em `room_players`, **Quando** entra com o PIN (reconexão), **Então** recebe o snapshot atual **sem** duplicar linha nem alterar papel/pontos.
3. **Dado** Cidade Dorme com jogador removido (`removedPlayerIds`), **Quando** tenta reentrar fora do Lobby, **Então** é recusado.

### História 2 — Transições de fase atômicas e idempotentes (Prioridade: P1) · A2, A6, A7
**Cenários:**
1. **Dado** `phase = 'filling'`, **Quando** dois jogadores acionam STOP quase juntos, **Então** só o primeiro muda a sala para `stop_countdown`; o segundo recebe o snapshot atual sem erro e sem sobrescrever `stopTriggeredBy`.
2. **Dado** uma transição esperando `phase = X`, **Quando** a sala já saiu de `X`, **Então** o serviço lança `ConflictError` (ou retorna o snapshot atual de forma idempotente, conforme a operação) e a ViewModel apenas ressincroniza — **sem** exibir "fase errada" ao usuário.
3. **Dado** fase `tally`, **Quando** dois jogadores levantam dúvida na mesma resposta, **Então** `doubt_count` incrementa 2 (incremento atômico) e cada jogador conta no máximo 1 dúvida por resposta.

### História 3 — Estado sempre convergente (Prioridade: P1) · A3, A8
1. **Dado** dois snapshots em voo com `version` 7 e 8, **Quando** o de `version` 7 chega por último, **Então** a ViewModel o descarta e permanece em 8.
2. **Dado** o jogador escolheu alvo de voto, **Quando** chega snapshot atrasado da mesma fase, **Então** a seleção local é preservada.
3. **Dado** dois jogadores entrando com o mesmo apelido, **Quando** os inserts ocorrem simultaneamente, **Então** o banco rejeita o segundo (índice único) e o UseCase devolve `ValidationError` de apelido duplicado.

### História 4 — Cronômetro único do servidor no Adedonha (Prioridade: P2) · A4, A5
1. **Dado** `phase = 'filling'` com `phaseEndsAt` persistido, **Quando** um jogador entra/reconecta, **Então** seu relógio mostra `phaseEndsAt − agora`, igual aos demais.
2. **Dado** o tempo esgotou, **Quando** os aparelhos chegam a `00:00`, **Então** apenas o Anfitrião executa `finishRoundByTimeOut`; os demais só enviam suas respostas.
3. **Dado** respostas enviadas duas vezes (STOP + timeout), **Então** existe exatamente 1 linha por `(sala, rodada, jogador, coluna)` (*upsert*), e envio fora de `filling`/`stop_countdown` é recusado.

### História 5 — Resiliência de sala (Prioridade: P3) · A9
1. **Dado** o Anfitrião ficou sem presença por mais de `N` s, **Então** a sala passa o papel de Anfitrião ao jogador mais antigo (ou é encerrada no Lobby).
2. **Dado** sala sem atividade por 24 h, **Então** é marcada `finished` e o PIN deixa de ser aceito.

### Casos de Borda
- Reentrada simultânea do mesmo usuário em duas abas: uma única linha em `room_players`.
- Relógio do aparelho adiantado/atrasado: `phaseEndsAt` é calculado e comparado usando o horário do servidor (offset obtido no snapshot).
- Modo offline (`Memory*`): as mesmas regras (versão, fase esperada, lobby-only) devem valer, para testes determinísticos.
- Anfitrião sai durante `stop_countdown`: a transição de `tally` passa a poder ser feita por qualquer cliente via *compare-and-set* (nunca por dois).

---

## 3. Requisitos da Funcionalidade

### Requisitos Funcionais (`RF`)
- **`RF-19-01`**: `joinRoom` (Adedonha e Cidade Dorme) só cria jogador novo com `phase = 'lobby'`; reentrada de membro existente é permitida em qualquer fase sem alterar seus dados de jogo.
- **`RF-19-02`**: Toda transição de fase recebe a fase esperada e só aplica se `phase = esperada` (compare-and-set); caso contrário é idempotente ou lança `ConflictError`.
- **`RF-19-03`**: `AdedonhaRoom` e `CidadeDormeRoom` ganham `version: number`, incrementado a cada mudança de sala; ViewModels descartam snapshots com `version` menor que o atual.
- **`RF-19-04`**: `AdedonhaRoom` ganha `phaseEndsAt: string | null` (como no Cidade Dorme); o contador é derivado dele e o fim de tempo é executado só pelo Anfitrião.
- **`RF-19-05`**: `submitAnswers` é *upsert* idempotente, valida fase e usa o `userId` autenticado (não o informado pelo cliente).
- **`RF-19-06`**: `raiseDoubt` e `triggerStop` usam operações atômicas (RPC/SQL), sem reescrever o JSON `config` inteiro.
- **`RF-19-07`**: Unicidade de apelido por sala garantida no banco (índice único case-insensitive).
- **`RF-19-08`**: Mensagem de "fase incorreta" nunca é exibida por perda de corrida; a ViewModel ressincroniza em silêncio (um único `refresh`).
- **`RF-19-09`** *(P3)*: Migração de Anfitrião e expiração de sala.

### Entidades de Domínio Envolvidas (`src/model/entities/`)
- **`AdedonhaRoom`**: adicionar `version: number` e `phaseEndsAt: string | null`.
- **`CidadeDormeRoom`**: adicionar `version: number`.
- **Erro novo**: `ConflictError extends DomainError` em `src/model/errors.ts`.

---

## 4. Critérios de Sucesso

- **`CS-01` (Concorrência)**: teste automatizado com `Promise.all` de 2+ STOPs/dúvidas/joins no serviço `Memory*` resulta em estado único e consistente.
- **`CS-02` (Convergência)**: nenhum teste de ViewModel regride `version` ao receber snapshots fora de ordem.
- **`CS-03` (Reprodução)**: cenários A1–A4 deixam de ser reproduzíveis no roteiro de 3 abas do `T000`.
- **`CS-04` (Arquitetura MVVM)**: `npm run check` executa com **0 violações**.

---

## 5. Fora de Escopo
- Reescrever o modelo de dados de Supabase além das colunas/índices/RPCs listados.
- Mudanças visuais (nenhum token/componente novo do Design System).
