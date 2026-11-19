# 📋 Especificação de Funcionalidade (`spec.md`): Sorteio Aleatório de Papéis (Fisher-Yates) no Cidade Dorme

- **Branch da Feature:** `fix/014-cidade-dorme-sorteio-papeis`
- **Criado em:** 2026-11-19
- **Status:** Em Revisão
- **Caso(s) de Uso / Requisito(s):** `UC07` (`RF18`, `RNF02`, `RNF11`) — Ref.: `docs/jogos/cidade-dorme.md`, `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md` e `src/usecase/cidadeDormeUseCases.ts`
- **Issue vinculada:** `#39` (`v1.0.0 — Jogos em Sala Multiplayer (UC07–UC08)`)

---

## 1. Descrição do Problema & Cenários de Usuário *(Obrigatório)*

### Causa Raiz Diagnosticada (Simulação em 6 Partidas Seguidas)
- Em `src/usecase/cidadeDormeUseCases.ts`, a função `buildRolePool(playerCount, assassinCount, roundSeed)` monta os papéis na ordem fixa `['detetive', 'assassino', ..., 'anjo', 'cidadao', ...]` e apenas aplica deslocamento circular `(roundSeed - 1) % playerCount`.
- Como `startMatch` (e `restartMatch`) sempre define `currentRound: 1`, `offset` é sempre `0`. O resultado em 6 partidas seguidas foi determinístico pela ordem de entrada na sala:
  - 1º a entrar (Anfitrião) → sempre `Detetive`;
  - 2º a entrar → sempre `Assassino`;
  - 3º a entrar → sempre `Anjo`;
  - 4º e 5º → sempre `Cidadão`.
- Isso quebra completamente a imprevisibilidade da dedução social (`RF18`): quem joga duas vezes descobre imediatamente o Assassino pela ordem de entrada.

---

### História de Usuário 1 — Sorteio Imprevisível de Papéis com Fisher-Yates em Cada Partida (Prioridade: P1)

Como **Jogador do PG na sala de Cidade Dorme**, quero que os papéis secretos (**Detetive**, **Assassino(s)**, **Anjo** e **Cidadãos**) sejam embaralhados aleatoriamente pelo algoritmo de **Fisher-Yates** a cada início de partida, garantindo que a ordem de entrada no Lobby nunca revele o papel de ninguém.

**Por que esta prioridade:** Sem aleatoriedade real na distribuição inicial, o jogo perde o propósito de dedução social já na segunda rodada (`RF18`).

**Como testar independentemente:** Iniciar múltiplas partidas com 5 a 16 jogadores injetando funções `random` distintas em `CidadeDormeUseCases` e confirmar variação real dos papéis por posição (inclusive o Anfitrião recebendo papéis variados) mantendo as quantidades exatas configuradas.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** uma sala com 5 jogadores no Lobby, **Quando** `startMatch` é executado sem `preferredRoles`, **Então** o pool (`1 Detetive`, `N Assassinos`, `1 Anjo` e restante `Cidadãos`) é embaralhado via Fisher-Yates antes de atribuir aos jogadores, não mantendo o Anfitrião fixo como `detetive` (`RF18`).
2. **Dado** qualquer combinação válida de `5` a `16` jogadores e `1` a `3` assassinos, **Quando** o sorteio termina, **Então** a quantidade de cada papel na sala respeita exatamente a configuração (`1 Detetive`, `1 Anjo`, `config.assassinCount` `Assassino(s)` e `totalPlayers - assassinCount - 2` `Cidadão(s)`).

---

### História de Usuário 2 — Novo Embaralhamento na Revanche e Previsibilidade em Testes (Prioridade: P1)

Como **Anfitrião ou Pessoa Desenvolvedora**, quero que **"Jogar Novamente (Revanche)"** execute um novo sorteio completo dos papéis e que `CidadeDormeUseCases` aceite injeção de fonte aleatória (`random: () => number`) para manter os testes unitários 100% determinísticos.

**Por que esta prioridade:** Permite jogar várias partidas seguidas na mesma sala mantendo o sigilo e preserva determinismo nos testes automatizados (`npm test`).

**Como testar independentemente:** Chamar `startMatch` e em seguida `restartMatch` na mesma sala com gerador pseudoaleatório sequencial e verificar alteração dos papéis atribuídos aos jogadores.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** uma partida encerrada (`finished`), **Quando** o Anfitrião aciona `restartMatch`, **Então** os papéis são novamente sorteados com Fisher-Yates e os jogadores voltam para `role_reveal` com `isReady: false`, `isAlive: true` e `hasVoted: false` (`RF18`).
2. **Dado** testes unitários existentes ou novos que precisam de papéis fixos ou sequência reproduzível, **Quando** passam `preferredRoles` em `startMatch` ou injetam `random` no construtor de `CidadeDormeUseCases`, **Então** o comportamento é 100% determinístico e retrocompatível.

---

### Casos de Borda (Edge Cases)

- **Gerador `random()` retornando limites extremos (`0` ou `0.999999`):** a indexação `Math.floor(random() * (i + 1))` no algoritmo Fisher-Yates deve permanecer estritamente dentro de `[0, i]` sem acessar índices inválidos (`undefined`).
- **Imutabilidade do array base:** `shuffleRoles` deve criar uma cópia rasa antes de trocar elementos para evitar efeitos colaterais.
- **Execução no backend (`#40`):** caso a distribuição de papéis seja também executada em função SQL no Supabase para `RNF11`, o servidor deve aplicar ordenação aleatória equivalente (`ORDER BY random()`), nunca atribuição sequencial.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-39-01` (`RF18`)**: Substituir o deslocamento sequencial de `buildRolePool` pelo embaralhamento **Fisher-Yates** em `startMatch` e `restartMatch`.
- **`RF-39-02`**: Injetar parâmetro opcional `random: () => number = Math.random` no construtor de `CidadeDormeUseCases` para testabilidade determinística sem quebrar `src/di/container.ts`.
- **`RF-39-03`**: Garantir invariante exata de contagem de papéis (`1` Detetive, `1` Anjo, `N` Assassinos, demais Cidadãos) e preservar suporte ao parâmetro `preferredRoles`.

### Entidades de Domínio Envolvidas (`src/model/entities/multiplayerSession.ts`)
- **`CidadeDormeRole`**: `'cidadao' | 'assassino' | 'anjo' | 'detetive'` (inalterada).
- **`CidadeDormePlayer`**: mantém `role`, `isAlive`, `isReady`, `hasVoted` (atualizada pelo sorteio).

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (Aleatoriedade e Invariantes)**: Distribuição varia entre partidas; o anfitrião não recebe `detetive` em todas as partidas; as quantidades por papel permanecem exatas em 100% das execuções e na revanche.
- **`CS-02` (Determinismo em Testes)**: Testes de regressão validam o embaralhamento usando função `random` injetada sem flakiness.
- **`CS-03` (Arquitetura MVVM)**: `npm run check` (`check-arquitetura.mjs` + `tsc --noEmit` + `jest`) executa com **0 violações** e todos os testes passando.
