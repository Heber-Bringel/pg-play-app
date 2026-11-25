# 📋 Especificação de Funcionalidade (`spec.md`): Tela Inicial do Encontro, Abertura Animada e Short Navigation Bar

- **Branch da Feature:** `feat/026-tela-inicial-welcome`
- **Criado em:** 2026-11-25
- **Status:** Em Revisão
- **Caso(s) de Uso / Requisito(s):** `UC00` (Abertura do Encontro) / `UC01` (`RF01`) / `UC06` (`RF16–RF17`) + `RNF04`, `RNF06`, `RNF07`, `RNF09` — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md`
- **Issue vinculada:** `#80`
- **Protótipo Oficial no Figma:** Arquivo `pg-play-app` (`https://www.figma.com/design/gTeNyC4aTTDBoSORZBLWG3/pg-play-app`, página `01 · Tela Inicial (Welcome)`)

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Abertura Animada do Aplicativo (`Splash M3 Expressive Spring`) (Prioridade: P1)

Ao abrir o **PG PLAY**, o líder e os participantes visualizam uma entrada animada curta e acolhedora com a identidade visual do app (**PG PLAY — Minigames para Pequenos Grupos**) em física de mola (*spring physics*), antes da exibição do Painel do Encontro.

**Por que esta prioridade:** Cria engajamento imediato no encontro do Pequeno Grupo (IHC), apresenta a marca em modo Claro e Escuro e garante fluidez sem atrasar o início das dinâmicas.

**Como testar independentemente:** Renderizar o componente `WelcomeSplashOverlay` (ou abrir a rota `welcome`) com `reduceMotion` desativado e ativado, verificando que a animação conclui (~600 ms) e revela a tela principal, ou encerra instantaneamente (`0 ms`) quando `reduceMotion` está ativo.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o usuário abre o aplicativo pela rota inicial com animações habilitadas, **Quando** a tela monta, **Então** o emblema central e os 3 badges orbitais executam a entrada elástica (`motion.spring.spatial`: `damping: 14, stiffness: 280`, ~600 ms) exibindo `PG PLAY` e `Minigames para Pequenos Grupos`, liberando automaticamente o Painel do Encontro ao finalizar.
2. **Dado** que o usuário está com o Modo Escuro ativo no sistema ou na preferência do app, **Quando** a abertura é exibida, **Então** a superfície utiliza `color.surface` com halo em `color.actionContainer` e emblema com borda `color.action`, mantendo contraste WCAG AA.
3. **Dado** que o sistema operacional está com *"Reduzir Movimento"* (`AccessibilityInfo.isReduceMotionEnabled()`) ativado, **Quando** a tela abre, **Então** a transição ocorre instantaneamente (`0 ms`) sem bloqueio nem animações de escala/rotação.

---

### História de Usuário 2 — Painel do Encontro com Pódio M3 Expressive (Prioridade: P1)

Como líder do Pequeno Grupo, ao entrar na Tela Inicial com equipes já cadastradas, quero ver imediatamente o **Pódio do Encontro (`2º | 1º | 3º`)** centralizado e os botões principais para iniciar os jogos presenciais ou multiplayer.

**Por que esta prioridade:** É o fluxo central da **Issue #80**: transformar a abertura do app em um painel social do encontro com leitura rápida à distância (`RNF04`) e acesso direto às dinâmicas.

**Como testar independentemente:** Renderizar `WelcomeScreen` com equipes retornadas por `pgPlayUseCases.getScoreboard()` e validar a ordem visual do pódio, os atalhos e as navegações disparadas pela `useWelcomeViewModel`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que existem equipes cadastradas na sessão (ex.: 3 equipes totalizando 140 pts), **Quando** a `WelcomeScreen` carrega, **Então** exibe o cabeçalho limpo (`PG PLAY` + pílula `3 equipes · 140 pts`), o título `Pódio do Encontro`, as 3 colunas (`2º` à esquerda em `actionContainer`, `1º` ao centro em `highlightContainer` **sem borda amarela** e sem texto redundante, `3º` à direita em `secondaryContainer`) e a barra rápida `Ver placar completo →` + `Zerar`.
2. **Dado** que o líder toca no botão Jumbo **`Iniciar Jogos`** (`primaryJumbo`, `64 dp`), **Quando** o evento `onPress` é disparado, **Então** a ViewModel navega para o catálogo completo de minigames (`'/'`).
3. **Dado** que o líder toca no botão **`Sala Multiplayer (PIN)`**, **Quando** o evento `onPress` é disparado, **Então** a ViewModel navega para o Hub pré-filtrado na modalidade `Multi-Celular` (`'/?modality=Multi-Celular'`).
4. **Dado** que o líder toca em **`Zerar`**, **Quando** confirma no `ConfirmModal`, **Então** `useCase.resetScoreboard()` zera as pontuações das equipes e atualiza o pódio na tela.

---

### História de Usuário 3 — Estado Inicial sem Equipes (Claro e Escuro) (Prioridade: P1)

Como líder abrindo o aplicativo pela primeira vez no encontro (0 equipes cadastradas), quero visualizar um convite claro para montar as equipes antes de começar os jogos.

**Por que esta prioridade:** Evita exibir um pódio vazio confuso e guia o usuário diretamente para o cadastro de equipes (`UC02`).

**Como testar independentemente:** Renderizar `WelcomeScreen` com `getScoreboard()` retornando `[]` tanto no tema Claro quanto no Escuro.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que `teams.length === 0`, **Quando** a `WelcomeScreen` é exibida, **Então** o cabeçalho mostra a pílula `Sem equipes` e o centro exibe o card `Ranking do PG` com o bloco *"Monte as equipes do encontro"* e o botão tonal **`Cadastrar Equipes`**.
2. **Dado** que o usuário toca em **`Cadastrar Equipes`**, **Quando** a ação é executada, **Então** a ViewModel navega para `/teams`.

---

### História de Usuário 4 — Navegação Global com `ShortNavigationBar` (Material 3 Expressive 2025) (Prioridade: P2)

Como participante ou líder, quero alternar rapidamente entre **Início**, **Jogos**, **Equipes** e **Config.** por meio de uma barra inferior acessível e fiel ao **Material 3 Expressive**.

**Por que esta prioridade:** Padroniza os 4 destinos principais na base da tela com alvos generosos (`≥ 48 dp`), ícone + rótulo visíveis e indicador ativo em pílula (`color.actionContainer`).

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que a `WelcomeScreen` está visível, **Quando** a barra inferior é renderizada, **Então** a `ShortNavigationBar` fica ancorada de ponta a ponta na base (`edge-to-edge`) sobre `color.surfaceContainer`, com o item **`Início`** ativo (`color.actionContainer` + ícone `color.onActionContainer`) e os itens **`Jogos`**, **`Equipes`** e **`Config.`** com rótulos legíveis.
2. **Dado** que o usuário toca em **`Config.`**, **Quando** a ação é disparada, **Então** o painel `ThemeModePanel` (`Automático`, `Claro`, `Escuro`) é exibido para alternar o tema sem sair da tela inicial.

---

### Casos de Borda (Edge Cases)

- **1 ou 2 equipes cadastradas:** O componente `EncounterPodium` deve renderizar apenas 1 coluna central (`1º`) ou 2 colunas (`2º | 1º`) sem acessar índices inexistentes nem quebrar o layout.
- **Empate ou `totalPoints === 0`:** O botão `Zerar` na barra rápida fica desabilitado quando `totalPoints === 0` (ou sem equipes), evitando chamadas desnecessárias.
- **Erro ao carregar o placar:** Se `getScoreboard()` lançar `DomainError` ou erro inesperado, exibe o card de erro com `Tentar Novamente` (`actions.handleRetry`).
- **Offline:** Funciona 100% offline usando `MemoryTeamDataSource` / `AsyncStorageTeamDataSource` via `pgPlayUseCases`.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-80.01`**: O aplicativo deve abrir na tela inicial `welcome` (`initialRouteName="welcome"` em `src/app/_layout.tsx`), exibindo a abertura animada `WelcomeSplashOverlay` respeitando `reduceMotion`.
- **`RF-80.02`**: A `useWelcomeViewModel` deve carregar as equipes via `useCase.getScoreboard()`, calcular `podiumTeams` (Top 3) e `totalPoints`, e gerenciar o reset de placar via `useCase.resetScoreboard()` com tratamento de `DomainError`.
- **`RF-80.03`**: A `WelcomeScreen` deve exibir os 4 estados obrigatórios (`loading`, `error`, `empty` com 0 equipes e `content` com `EncounterPodium`), sem bordas amarelas no card nem no 1º lugar e sem texto redundante `"1º lugar · Líder"`.
- **`RF-80.04`**: O CTA Jumbo `Iniciar Jogos` deve navegar para `'/'` (Hub) e `Sala Multiplayer (PIN)` deve navegar para `'/'` pré-selecionando o filtro `'Multi-Celular'` na `useHubViewModel`.
- **`RF-80.05`**: O Design System `PG Play Expressive` deve incorporar o componente `ShortNavigationBar` (`design-system/04-componentes/barra-de-navegacao.md`) seguindo estritamente o Material 3 Expressive (2025).
- **`RF-80.06`**: A interface deve usar 100% tokens semânticos/de componente de `@/view/theme`, sem cores literais nem números mágicos (`npm run check:ds`).

### Entidades de Domínio Envolvidas (`src/model/entities/`)
- **`Team`** (`src/model/entities/team.ts`): `{ id: string; name: string; score: number }` (reutilizada sem alterações).
- **`ThemePreference`** (`src/model/entities/themePreference.ts`): `'auto' | 'light' | 'dark'` (reutilizada sem alterações).

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (IHC / Acessibilidade)**: Todos os alvos interativos respeitam o mínimo de `48 dp × 48 dp` (`64 dp` para `Iniciar Jogos`), contêm `accessibilityRole`, `accessibilityLabel` e `accessibilityState`, combinam cor + forma + ícone (`design-system/06-acessibilidade.md`) e respeitam `reduceMotion`.
- **`CS-02` (Arquitetura MVVM & Qualidade)**: `npm run check` (`check-arquitetura.mjs` + `check-design-system.mjs` + `tsc --noEmit` + `jest`) executa com **0 violações** e **0 falhas**, preservando todos os testes existentes do Hub e das arenas.
