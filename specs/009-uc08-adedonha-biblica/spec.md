# 📋 Especificação de Funcionalidade (`spec.md`): UC08 — Adedonha Bíblica em Sala Multiplayer

- **Branch da Feature:** `feat/009-uc08-adedonha-biblica`
- **Criado em:** 2026-11-11
- **Status:** Aprovado
- **Caso(s) de Uso / Requisito(s):** `UC08` (`RF09`, `RF10`, `RF11`, `RF21`, `RF22`, `RF23`, `RNF03`, `RNF06`, `RNF07`, `RNF09`, `RNF10`) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md` e `docs/jogos/adedonha-biblica.md`
- **Milestone / Issue vinculada:** `v1.0.0 — Jogos em Sala Multiplayer (UC07–UC08)` / Issue `#16`

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Configurar Colunas Bíblicas e Sortear Letra na Roleta Expressiva (Prioridade: P1)

Como **Moderador / Anfitrião do PG**, quero configurar as colunas/categorias temáticas da partida no Lobby e girar a **Roleta Expressiva do Alfabeto** para sortear a letra da rodada sem repetir letras já sorteadas.

**Por que esta prioridade:** Permite personalizar a dinâmica ao tema do encontro e iniciar a rodada sincronizada com a letra sorteada (`RF21`).

**Como testar independentemente:** Criar/carregar uma sala no Lobby, adicionar ou remover colunas bíblicas, girar a roleta e verificar que uma letra válida e inédita é sorteada.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o Moderador está no Lobby da Adedonha Bíblica com colunas sugeridas (*Personagem Bíblico*, *Livro da Bíblia*, *Cidade, Monte ou Rio Bíblico*), **Quando** adiciona uma nova coluna válida (ex.: *Milagre ou Parábola*) com pelo menos 2 caracteres e sem duplicidade, **Então** a coluna passa a integrar a lista da rodada.
2. **Dado** que a sala possui ao menos 1 coluna configurada, **Quando** o Moderador aciona *"Sortear Letra"* na Roleta Expressiva do Alfabeto, **Então** o sistema sorteia uma letra disponível (excluindo letras já usadas em rodadas anteriores e `K`, `W`, `Y` por padrão) e avança para o preenchimento da rodada (`RF21`).

---

### História de Usuário 2 — Preencher Categorias com Validação de Inicial e Gritar "ADEDONHA!" (Prioridade: P1)

Como **Jogador da Sala**, quero preencher uma palavra bíblica para cada coluna da rodada com validação instantânea da letra inicial e acionar o botão Jumbo **"ADEDONHA!"** assim que completar todas as colunas válidas.

**Por que esta prioridade:** Representa o núcleo de jogabilidade sob pressão de tempo e feedback imediato da Adedonha Bíblica (`RF22`).

**Como testar independentemente:** Em uma rodada ativa com uma letra sorteada (ex.: `D`), digitar palavras iniciadas por outra letra (verificando erro instantâneo), corrigir para palavras iniciadas por `D` em todas as colunas e acionar o botão Jumbo *"ADEDONHA!"*.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que a letra da rodada é `D`, **Quando** o jogador digita `"Moises"` na coluna *Personagem Bíblico*, **Então** o campo exibe imediatamente estado de erro semântico (*"A resposta deve começar com a letra D"*) e mantém o botão *"ADEDONHA!"* desabilitado (`RF22`).
2. **Dado** que a letra da rodada é `D` e o jogador preencheu todas as colunas com respostas iniciadas por `D` (ignorando acentos, como `"Davi"`, `"Daniel"`, `"Damasco"`), **Quando** toca no botão Jumbo *"ADEDONHA! (Parar Rodada)"*, **Então** o sistema registra o pedido de parada, bloqueia/submete as respostas da sala e inicia a apuração assistida (`RF22`).

---

### História de Usuário 3 — Apuração Assistida com Botão "Levantar Dúvida ✋" e Veredito do Moderador (Prioridade: P1)

Como **Jogador / Moderador da Sala**, quero visualizar as respostas pré-classificadas coluna por coluna (`+10 pts` única, `+5 pts` repetida, `0 pts` vazia/inválida), permitir que jogadores toquem em **"Levantar Dúvida ✋"** e que o Moderador valide, marque como repetida ou invalide respostas antes de avançar para o placar/próxima rodada (`RF23`).

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que a fase de apuração iniciou para a coluna atual, **Quando** apenas um jogador respondeu `"Davi"` e dois responderam `"Daniel"`, **Então** o sistema pré-classifica `"Davi"` como **Única (`+10 pts`)** e `"Daniel"` como **Repetida (`+5 pts`)** (`RF23`).
2. **Dado** que os jogadores estão conferindo as respostas da coluna atual, **Quando** um jogador toca em *"Levantar Dúvida ✋"* sobre uma resposta, **Então** o contador de dúvidas daquela submissão é incrementado em destaque para o Moderador (`RF23`).
3. **Dado** que o Moderador avalia uma resposta na apuração, **Quando** seleciona **Validar Única (`+10 pts`)**, **Repetida (`+5 pts`)** ou **Invalidar (`0 pts`)**, **Então** a pontuação do jogador e o status da resposta são recalculados imediatamente (`RF23`).

---

### Casos de Borda (Edge Cases)

- **Coluna vazia, curta (`< 2` letras) ou duplicada:** Lança `ValidationError` com mensagem contextualizada.
- **Tentativa de girar roleta sem colunas configuradas:** Lança `ValidationError` exigindo ao menos 1 coluna ativa.
- **Acionar "ADEDONHA!" com colunas em branco ou letra inicial incorreta:** Lança `ValidationError` impedindo travar a rodada indevidamente.
- **Comparação insensível a acentos e caixa:** `"Áquila"` é aceita para a letra `A`; `"davi "` e `"DAVI"` são normalizadas como repetidas (`+5 pts`).
- **Modo Offline / Memória (`MemoryMultiplayerRoomService`):** Permite jogar e testar 100% do fluxo localmente sem depender de conexão de rede.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF21`**: Permitir ao Moderador criar/remover colunas bíblicas no Lobby e sortear a letra da rodada na **Roleta Expressiva do Alfabeto**, excluindo letras já sorteadas.
- **`RF22`**: Validar em tempo real se cada resposta começa com a letra sorteada e habilitar o botão Jumbo **"ADEDONHA!"** somente quando 100% das colunas estiverem preenchidas com respostas válidas.
- **`RF23`**: Pré-classificar respostas em únicas (`+10 pts`), repetidas (`+5 pts`) e vazias/inválidas (`0 pts`), disponibilizar o botão **"Levantar Dúvida ✋"** e permitir ao Moderador julgar respostas coluna por coluna e exibir o Pódio Final (🥇 Campeão Geral, ⚡ Mão Mais Rápida, 🧠 Vocabulário Raro).

### Entidades de Domínio Envolvidas (`src/model/entities/multiplayerSession.ts`)
- **`AdedonhaRoom`**: Estado completo da sala multiplayer (código PIN, fase atual, configuração de colunas/tempo/rodadas, letra atual, letras já sorteadas, jogadores e submissões).
- **`AdedonhaPlayer`**: Participante da sala com `id`, `nickname`, `isHost`, `score`, `stopCount` e `uniqueAnswersCount`.
- **`AdedonhaSubmission`**: Resposta submetida por jogador em uma coluna, contendo `status` (`pending | unique | repeated | invalid`), `doubtCount` e `points`.

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (IHC / Acessibilidade)**: Todos os alvos interativos respeitam o mínimo de `48 dp × 48 dp` (`64 dp` para ações Jumbo como *"ADEDONHA!"*) e combinam cor + forma + ícone (`design-system/06-acessibilidade.md`).
- **`CS-02` (Arquitetura MVVM)**: `npm run check` (`check-arquitetura.mjs` + `tsc` + `jest`) executa com **0 violações**.
