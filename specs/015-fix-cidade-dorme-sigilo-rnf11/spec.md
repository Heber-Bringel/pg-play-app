# 📋 Especificação de Funcionalidade (`spec.md`): Isolamento de Papéis e Segredos no Cidade Dorme (RNF11)

- **Branch da Feature:** `fix/015-cidade-dorme-sigilo-rnf11`
- **Criado em:** 2026-11-19
- **Status:** Em Revisão
- **Caso(s) de Uso / Requisito(s):** `UC07` (`RF18`, `RF19`, `RF20`, `RNF11`) — Ref.: `docs/jogos/cidade-dorme.md` (Seção 3 — Permissões do Anfitrião), `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md`, `docs/harness/05-infraestrutura-e-supabase.md` e `src/infra/services/supabaseMultiplayerRoomService.ts`
- **Issue vinculada:** `#40` (`v1.0.0 — Jogos em Sala Multiplayer (UC07–UC08)`)

---

## 1. Descrição do Problema & Cenários de Usuário *(Obrigatório)*

### Causa Raiz Diagnosticada (Inspeção de Rede em `/rest/v1/rooms`)
- Embora a tela de cada jogador esconda os papéis dos colegas, `SupabaseMultiplayerRoomService.saveCidadeDormeRoom` grava no campo JSONB público `rooms.config`:
  - o array `players` completo contendo o `role` de todos os participantes;
  - `nightTargetId` (alvo do Assassino);
  - `nightProtectedId` (protegido do Anjo);
  - `detectiveVerdict` (resultado da investigação do Detetive);
  - `votesByPlayerId` (voto individual de cada jogador).
- Como a política RLS de `rooms` permite leitura aos membros da sala, qualquer jogador (inclusive o Anfitrião) que inspecionar as respostas de `/rest/v1/rooms` na aba Rede do navegador descobre imediatamente quem é Assassino, Anjo e Detetive, violando diretamente o requisito **RNF11**.

---

### História de Usuário 1 — Isolamento Real de Papéis no Banco e no Tráfego de Rede (Prioridade: P1)

Como **Jogador da Sala de Cidade Dorme (Anfitrião ou Convidado)**, quero que os dados recebidos pelo meu aparelho via rede/Realtime contenham exclusivamente o **meu próprio papel secreto**, impedindo qualquer trapaça via inspeção de tráfego HTTP/WebSocket até o fim da partida.

**Por que esta prioridade:** Sem sigilo real nos dados trafegados pelo Supabase, o jogo de dedução social fica vulnerável à leitura direta da resposta JSON no navegador ou proxy (`RNF11`).

**Como testar independentemente:** Simular consulta/gravação em `SupabaseMultiplayerRoomService` e `MemoryMultiplayerRoomService` com 5 jogadores, inspecionar o payload gravado em `rooms.config` e o snapshot recebido por cada jogador (inclusive o Anfitrião) e confirmar ausência dos `role` alheios.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que os papéis foram distribuídos (`startMatch`), **Quando** o servidor grava e sincroniza o estado da sala, **Então** `rooms.config` **não** contém `players[].role` nem mapas de segredos; cada jogador lê apenas sua linha em `cidade_dorme_secrets` protegida por RLS (`auth.uid() = user_id`), recebendo `role !== null` apenas para si mesmo e `role: null` para os demais jogadores vivos (`RNF11`).
2. **Dado** uma sala com `2` ou mais Assassinos (`assassinCount > 1`), **Quando** o Assassino recebe seu estado na noite, **Então** apenas os Assassinos recebem `allyAssassinIds` com os IDs de seus parceiros para não atacarem aliados (`#42`), sem expor papéis a Cidadãos, Anjo ou Detetive (`RNF11`).
3. **Dado** que o Anfitrião não é o Detetive nem o Assassino, **Quando** recebe atualizações da sala durante a partida, **Então** o payload entregue ao seu dispositivo também oculta o papel dos demais jogadores (`RNF11`).

---

### História de Usuário 2 — Isolamento de Alvos Noturnos, Veredito do Detetive e Votos Individuais (Prioridade: P1)

Como **Assassino, Anjo, Detetive ou Votante**, quero que minha escolha noturna, o veredito da investigação e meu voto individual fiquem armazenados em tabelas de ações protegidas e apurados por função `security definer` no servidor, expondo apenas resultados públicos agregados.

**Por que esta prioridade:** Mesmo ocultando papéis iniciais, vazar `nightTargetId`, `detectiveVerdict` ou `votesByPlayerId` em `rooms.config` entregaria imediatamente quem agiu à noite e quem é o Assassino (`RNF11`, `RF19`, `RF20`).

**Como testar independentemente:** Executar turno do Assassino, Anjo, Detetive e Votação Secreta; verificar que `rooms` não contém `nightTargetId`, `nightProtectedId`, `detectiveVerdict` nem `votesByPlayerId` detalhado, e que apenas o Detetive recebe `detectiveVerdict`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que Assassino, Anjo e Detetive registraram ações na tabela `cidade_dorme_actions`, **Quando** outros celulares recebem a atualização da sala, **Então** `nightTargetId`, `nightProtectedId` e `detectiveVerdict` são `null` para eles; apenas o Detetive recebe seu `detectiveVerdict` via `cidade_dorme_secrets` (`RNF11`).
2. **Dado** que os jogadores vivos estão votando em `day_voting`, **Quando** o estado público da sala é sincronizado, **Então** informa apenas quem já votou (`player.hasVoted` / contagem agregada) sem vazar em quem cada pessoa votou (`votesByPlayerId` vazio no tráfego público), e a RPC `cidade_dorme_tally_votes` apura os totais anônimos em `voteReport`.
3. **Dado** o encerramento da noite (`cidade_dorme_resolve_dawn`) ou da votação (`cidade_dorme_tally_votes`), **Quando** o servidor apura o resultado, **Então** publica apenas o boletim público (`dawnReport` / `voteReport`), revelando o papel de quem morreu apenas se `config.revealRoleOnDeath === true`.

---

### História de Usuário 3 — Revelação Completa de Papéis ao Fim da Partida (Prioridade: P1)

Como **Grupo ao final da partida (`phase === 'finished'`)**, quero visualizar a revelação completa dos papéis de todos os jogadores no resumo final para comentar as jogadas e blefes do encontro.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que a Vitória da Cidade ou Vitória dos Assassinos foi atingida (`phase === 'finished'`), **Quando** o servidor finaliza a partida, **Então** a RPC `security definer` publica os papéis de todos os participantes para a tela de resultado final exibir o resumo completo (`RF20`).
2. **Dado** que o Anfitrião aciona *"Jogar Novamente (Revanche)"*, **Quando** novos papéis são sorteados, **Então** o sigilo volta a ser aplicado imediatamente com os novos registros em `cidade_dorme_secrets` (`RNF11`).

---

### Casos de Borda (Edge Cases)

- **Jogador eliminado com `revealRoleOnDeath: false` (Modo Difícil):** ao morrer à noite ou na votação, `eliminatedRole` em `dawnReport`/`voteReport` e `player.role` continuam `null` até `phase === 'finished'`.
- **Reconexão do jogador durante a partida:** ao recarregar a sala (`getCidadeDormeRoom`), a consulta a `cidade_dorme_secrets` (filtrada por `auth.uid() = user_id`) restaura exatamente seu próprio papel e veredito do Detetive na rodada atual.
- **Compatibilidade com `MemoryMultiplayerRoomService`:** a implementação em memória deve espelhar o mesmo isolamento usando mapas internos privados por sala/jogador para permitir testes unitários reais de `RNF11`.
- **Alinhamento com `#38` e `#39`:** as RPCs server-side devem usar gravação atômica por jogador/ação (`#38`) e sorteio aleatório (`ORDER BY random()`, `#39`).

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-40-01` (`RNF11`)**: Remover `players[].role`, `nightTargetId`, `nightProtectedId`, `detectiveVerdict` e `votesByPlayerId` do JSONB público `rooms.config`.
- **`RF-40-02` (`RNF11`)**: Armazenar papel secreto e veredito do Detetive em `public.cidade_dorme_secrets` com política RLS `auth.uid() = user_id` e ações individuais em `public.cidade_dorme_actions` com RLS restrita ao autor.
- **`RF-40-03` (`RF18`–`RF20`)**: Executar sorteio, verificação de investigação, apuração do amanhecer, apuração de votos e revelação final exclusivamente via funções `security definer` no PostgreSQL (e espelho seguro em `MemoryMultiplayerRoomService`).
- **`RF-40-04`**: Garantir que a revelação completa de papéis no fim da partida (`phase === 'finished'`) continue funcionando normalmente para toda a sala.

### Entidades de Domínio Envolvidas (`src/model/entities/multiplayerSession.ts`)
- **`CidadeDormePlayer`**: atualizar `role: CidadeDormeRole | null` (nulo quando oculto para outros jogadores).
- **`CidadeDormeRoom`**: incluir `allyAssassinIds?: string[]` (preenchido apenas quando o jogador local é Assassino) e manter `nightTargetId`, `nightProtectedId`, `detectiveVerdict` nulos no payload público (hidratando `detectiveVerdict` apenas para o Detetive local).

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (Sigilo em Trânsito `RNF11`)**: Testes comprovam que a resposta pública de `rooms` não contém papéis alheios, alvos noturnos, proteção do Anjo, veredito do Detetive nem votos individuais.
- **`CS-02` (Experiência Presencial Preservada)**: Jogador local vê seu papel na revelação, Detetive vê seu veredito silencioso e todos veem todos os papéis ao encerrar a partida (`finished`).
- **`CS-03` (Arquitetura MVVM)**: `npm run check` (`check-arquitetura.mjs` + `tsc --noEmit` + `jest`) executa com **0 violações** e testes de regressão `RNF11` passando.
