# 📋 Especificação de Funcionalidade (`spec.md`): 004-uc03-arena-mimica

- **Branch da Feature:** `feat/004-uc03-arena-mimica`
- **Criado em:** 2026-11-09
- **Status:** Aprovado
- **Milestone:** `v0.2.0 — Núcleo & Jogos em 1 Celular (UC01–UC06)`
- **Caso(s) de Uso / Requisito(s):** `UC03` (`RF09`, `RF10`, `RF11`, `RF12`, `RF13`, `RF24`, `RF25`, `RF28`, `RF29`, `RF30`, `RF31`) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md` e `docs/jogos/mimica-expressiva.md`
- **Issue vinculada:** `#11` (`[UC03] Implementar Arena de Mímica Expressiva (RF07–RF09)`)

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Passagem de Turno Protegida e Revelação de Palavra Secreta (Prioridade: P1)

Como representante da Equipe da Vez em um encontro de Pequeno Grupo, desejo visualizar primeiro uma tela de passagem de turno com o botão *"Estou Pronto!"* antes da palavra secreta aparecer, e poder ocultar/revelar a palavra durante a mímica, para que os demais integrantes não vejam a resposta acidentalmente enquanto o celular é entregue.

**Por que esta prioridade:** No modo *Passa-Celular* (1 aparelho compartilhado), exibir a palavra imediatamente ao abrir a tela ou trocar de turno inviabiliza a dinâmica.

**Como testar independentemente:** Iniciar a Arena de Mímica, verificar que a fase inicial é `pass-turn` com a equipe ativa identificada e sem exibir a palavra secreta; acionar `handleStartTurn` e confirmar que a fase muda para `playing` com a palavra visível e o cronômetro ativo.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que a Arena de Mímica foi aberta com ao menos 2 equipes, **Quando** a tela carrega, **Então** o sistema exibe a fase de Passagem de Turno (`pass-turn`) identificando a equipe da vez (**RF09**, **RF24**) e o botão Jumbo *"Estou Pronto!"*, mantendo a palavra secreta oculta.
2. **Dado** que a equipe da vez está na tela de passagem, **Quando** o representante toca em *"Estou Pronto!"*, **Então** o cronômetro regressivo inicia (`60s` por padrão) e o card exibe a palavra secreta em destaque (**RF10**, **RF13**).
3. **Dado** que a palavra secreta está visível na arena, **Quando** o representante toca em *"Esconder do Grupo"*, **Então** a palavra é substituída pelo selo *"🤫 Palavra escondida"* e o botão passa a exibir *"Revelar Palavra"*.

---

### História de Usuário 2 — Pontuação por Acerto (+20 pts), Pulo com Penalidade (-5 pts) e Alternância de Turno (Prioridade: P1)

Como representante da Equipe da Vez sob contagem regressiva, desejo registrar acertos com 1 toque em botão Jumbo (`+20 pts`) ou pular palavras difíceis (`-5 pts`, sem deixar o placar negativo), para acumular o máximo de pontos antes do tempo zerar.

**Como testar independentemente:** Executar testes unitários em `PgPlayUseCases` e de hook em `useMimicaViewModel`, verificando o incremento de `+20 pts`, o desconto de `-5 pts` limitado ao piso `0`, o não-sorteio repetido de palavras e a transição de turno ao zerar o tempo.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** uma palavra ativa no turno, **Quando** o jogador toca em *"Acertaram! (+20 pts)"*, **Então** o `UseCase` soma `20` pontos à equipe da vez e a `ViewModel` sorteia imediatamente a próxima palavra não utilizada (**RF13**, **RF30**).
2. **Dado** uma palavra ativa no turno e uma equipe com `0` ou `3` pontos, **Quando** o jogador toca em *"Pular (-5 pts)"*, **Então** o `UseCase` aplica a penalidade garantindo que a pontuação nunca fique menor que `0` (**RF25**) e sorteia a próxima palavra.
3. **Dado** que restam `10` segundos ou menos no turno, **Quando** o cronômetro avança, **Então** o `ExpressiveTimer` entra automaticamente em *Modo Crítico* (fundo vermelho, raio `16 dp` e ícone `alert`) (**RF10**).
4. **Dado** que o cronômetro chegou a `00:00`, **Quando** o tempo se esgota, **Então** as ações de pontuação são bloqueadas, o resumo do turno é exibido e a vez passa para a próxima equipe.
5. **Dado** que todas as rodadas configuradas terminaram ou o banco de palavras se esgotou, **Quando** o turno encerra, **Então** a arena exibe o card de conclusão com o botão *"Ir para o Placar Final"* (**RF12**, **RF31**).

---

### Casos de Borda (Edge Cases)

- **Pontuação próxima de zero ao pular palavra**: Se a equipe possui `0` pontos e pula uma palavra (`-5 pts`), sua pontuação deve permanecer em `0` (nunca `-5`).
- **Esgotamento do banco de palavras**: Palavras puladas só retornam após todas as inéditas do pacote ativo serem sorteadas; caso todas tenham sido acertadas antes do fim das rodadas, a partida encerra graciosamente indo para o estado `finished` (**RF12**, **RF30**).
- **Saída segura com confirmação**: O botão *"Sair"* fica no topo esquerdo (longe dos botões Jumbo de pontuação) e solicita confirmação antes de abandonar a partida (**RF11**).

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF09` & `RF24`**: Exibir identificação clara da equipe da vez e tela intermediária *"Estou Pronto!"* antes de revelar a palavra secreta.
- **`RF10`**: Controlar o turno com `ExpressiveTimer` (`45s`, `60s` padrão ou `90s`), ativando o Modo Crítico nos últimos `10s`.
- **`RF11`**: Disponibilizar botão *"Sair"* delineado no cabeçalho superior com confirmação de saída.
- **`RF12` & `RF31`**: Exibir tela de encerramento ao concluir as rodadas ou esgotar o banco de palavras, navegando para o Placar Geral (`/scoreboard`).
- **`RF13` & `RF25`**: Permitir ocultar/revelar a palavra secreta, pontuar `+20 pts` no acerto e descontar `-5 pts` (piso `0`) ao pular palavra.
- **`RF28`, `RF29` & `RF30`**: Suportar filtro por pacotes de categorias (mantendo ao menos 1 ativo), configuração de tempo/rodadas e não repetição de palavras acertadas na mesma partida.

### Entidades de Domínio Envolvidas (`src/model/entities/`)
- **`MimicaCard` (`src/model/entities/arenaChallenge.ts`)**: `id`, `word`, `category`, `points`.
- **`Team` (`src/model/entities/team.ts`)**: `id`, `name`, `score`.

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (IHC / Acessibilidade)**: Botão de acerto com variante `successJumbo` (`64 dp`), `ExpressiveTimer` com `accessibilityRole="timer"` e `accessibilityLiveRegion="assertive"` nos últimos 10s, e palavra secreta anunciada ou protegida quando oculta (`design-system/06-acessibilidade.md`).
- **`CS-02` (Arquitetura MVVM)**: `npm run check` (`check-arquitetura.mjs` + `tsc --noEmit` + `jest`) executando com **0 violações** e cobertura `>= 80%`.
