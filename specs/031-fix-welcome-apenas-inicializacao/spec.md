# 📋 Especificação de Funcionalidade (`spec.md`): Tela de Abertura (Welcome) apenas na inicialização do app

- **Branch da Feature:** `fix/031-welcome-apenas-inicializacao`
- **Criado em:** 2026-11-26
- **Status:** Aprovado
- **Caso(s) de Uso / Requisito(s):** `UC00` (Abertura do Encontro) / `UC01` (`RF01–RF03`) / `UC02` (`RF04–RF06`) / `UC06` (`RF16–RF17`) + `RNF04`, `RNF06`, `RNF07` — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md`
- **Issue vinculada:** `#93`

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Abertura apenas no Cold Start (Prioridade: P1)

Como líder do Pequeno Grupo, ao abrir o aplicativo pela primeira vez na sessão (**Cold Start**), quero ver a tela de boas-vindas (`welcome`) com a animação de entrada (`WelcomeSplashOverlay`), o pódio do encontro e os botões para iniciar os jogos, sem que essa tela volte a aparecer depois que o encontro já começou.

**Por que esta prioridade:** A tela de abertura cumpre papel de porta de entrada do encontro. Reexibi-la durante a sessão quebra o ritmo das dinâmicas e força o líder a passar novamente pela animação de entrada e pelo CTA *"Iniciar Jogos"*.

**Como testar independentemente:** Montar `useWelcomeViewModel` com sessão ainda não iniciada (verificando `splashVisible === true` e ausência de redirecionamento), acionar `handleStartGames()` e validar que a sessão passa a ser marcada como iniciada e navega via `router.replace('/')`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o aplicativo acabou de ser aberto na sessão (Cold Start), **Quando** a rota `welcome` é carregada, **Então** o app exibe `WelcomeSplashOverlay`, o pódio do encontro (ou convite para cadastrar equipes) e os botões `Iniciar Jogos` e `Sala Multiplayer (PIN)`, sem exibir a barra de abas inferior (`ShortNavigationBar`).
2. **Dado** que o líder está na `WelcomeScreen`, **Quando** toca em `Iniciar Jogos`, `Sala Multiplayer (PIN)`, `Cadastrar Equipes` ou `Ver placar completo →`, **Então** a ViewModel marca o encontro como iniciado na sessão e substitui a rota (`router.replace`), impedindo retorno acidental para `/welcome`.

---

### História de Usuário 2 — Ícone de Início levando diretamente ao Hub de Jogos (Prioridade: P1)

Como líder ou participante navegando entre as telas principais do encontro (**Hub**, **Equipes** e **Placar**), ao tocar no ícone de **Início** na barra inferior (`ShortNavigationBar`), quero ir diretamente para o catálogo de jogos (**Hub de Jogos** `/`), sem reabrir a tela de abertura (`welcome`).

**Por que esta prioridade:** Resolve diretamente o problema central relatado na **Issue #93**, tornando o atalho **Início** previsível e alinhado ao modelo mental de uso durante o encontro.

**Como testar independentemente:** Acionar `handleSelectNav('games')` em `useTeamsViewModel` e `useScoreboardViewModel`, bem como testar `ShortNavigationBar` e mocks das telas `HubScreen`, `TeamsScreen` e `ScoreboardScreen`, confirmando que `Ir para Início` dispara `'games'` e navega para `'/'`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o usuário está em **Equipes** (`/teams`) ou **Placar** (`/scoreboard`), **Quando** toca na aba **Início** (`home`) da `ShortNavigationBar`, **Então** a ViewModel executa `router.replace('/')` e abre o **Hub de Jogos**, nunca `/welcome`.
2. **Dado** que o usuário já está no **Hub de Jogos** (`/`), **Quando** a `ShortNavigationBar` é exibida, **Então** a aba **Início** está marcada como ativa (`selected: true`) e tocar novamente nela não redireciona para `/welcome`.

---

### História de Usuário 3 — Proteção contra retorno indesejado para `/welcome` na sessão (Prioridade: P1)

Como líder com o encontro já em andamento, se o histórico de navegação ou um deep link tentar abrir `/welcome` novamente durante a mesma sessão, quero ser redirecionado imediatamente para o **Hub de Jogos** (`/`) sem reexibir a animação de splash.

**Por que esta prioridade:** Garante consistência mesmo em navegações pelo botão voltar do sistema ou acesso direto à rota.

**Como testar independentemente:** Em `useWelcomeViewModel.test.ts`, iniciar o encontro (`handleStartGames()`), desmontar e montar novamente o hook e validar que `splashVisible === false` e `router.replace('/')` é chamado imediatamente.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o encontro já foi iniciado nesta sessão ao avançar da `WelcomeScreen`, **Quando** `/welcome` recebe foco novamente, **Então** `useWelcomeViewModel` mantém `splashVisible === false` e redireciona imediatamente com `router.replace('/')`.

---

### História de Usuário 4 — Barra de navegação global com os 3 destinos da sessão (Prioridade: P2)

Como usuário navegando durante o encontro, quero alternar rapidamente entre **Início** (`/`), **Equipes** (`/teams`) e **Placar** (`/scoreboard`) pela `ShortNavigationBar`, sem perder o acesso ao placar após a remoção da aba `welcome`.

**Por que esta prioridade:** Mantém exatamente os 3 destinos globais do Material 3 Expressive (`ShortNavigationBar`) sem duplicar `Início` e `Jogos` apontando para a mesma tela, enquanto expõe o **Placar** em 1 toque.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o usuário está em qualquer tela principal da sessão (`HubScreen`, `TeamsScreen` ou `ScoreboardScreen`), **Quando** visualiza a `ShortNavigationBar`, **Então** encontra os 3 destinos `Início`, `Equipes` e `Placar` com ícones preenchidos/contornados, rótulos legíveis e alvo mínimo de `48 dp`.
2. **Dado** que o usuário toca em **Placar** a partir do Hub ou de Equipes, **Quando** a ação é disparada, **Então** navega via `router.replace('/scoreboard')`.

---

### Casos de Borda (Edge Cases)

- **Abertura direta em `/` (Web ou deep link):** A navegação principal pela `ShortNavigationBar` (`Início` → `/`, `Equipes` → `/teams`, `Placar` → `/scoreboard`) não possui destino para `/welcome`, mantendo o usuário no fluxo da sessão.
- **Estado vazio no Placar (`0 equipes`):** `ScoreboardScreen` mantém a `ShortNavigationBar` acessível no estado vazio para permitir alternar diretamente para **Equipes** ou **Início**.
- **Isolamento entre testes automatizados:** `useWelcomeViewModel.ts` exporta `resetWelcomeSessionForTests()` para limpar o estado de sessão em memória antes de cada cenário de teste.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-93.01`**: A tela `welcome` deve aparecer apenas na inicialização do app (Cold Start), mantendo o fluxo de `Iniciar Jogos`, `Sala Multiplayer (PIN)` e `Cadastrar Equipes`.
- **`RF-93.02`**: A `ShortNavigationBar` deve apresentar os 3 destinos principais da sessão (`Início` → `/`, `Equipes` → `/teams`, `Placar` → `/scoreboard`), deixando de apontar para `/welcome`.
- **`RF-93.03`**: A `WelcomeScreen` não deve renderizar `ShortNavigationBar`, e a `ScoreboardScreen` deve incorporar `ShortNavigationBar` com `activeKey="scoreboard"`.
- **`RF-93.04`**: `useWelcomeViewModel` deve controlar o estado de encontro iniciado na sessão em memória, redirecionando imediatamente para `'/'` sem exibir `WelcomeSplashOverlay` caso `/welcome` seja reaberta após o início da sessão.
- **`RF-93.05`**: `useHubViewModel` não deve mais expor ação para reabrir `/welcome` (`handleOpenWelcome`), e nenhuma ViewModel das abas principais (`useHubViewModel`, `useTeamsViewModel`, `useScoreboardViewModel`) deve navegar para `/welcome`.

### Entidades de Domínio Envolvidas (`src/model/entities/`)
- Nenhuma entidade nova ou alterada (`Team` e `Minigame` reutilizadas intactas).

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (IHC / Acessibilidade)**: Todos os 3 itens da `ShortNavigationBar` mantêm `accessibilityRole="tab"`, `accessibilityLabel` claro (`Ir para Início`, `Ir para Equipes`, `Ir para Placar`), `accessibilityState={{ selected }}`, alvos mínimos de `48 dp` e 100% de tokens de `@/view/theme`.
- **`CS-02` (Arquitetura MVVM & Qualidade)**: `npm run check` (`check-arquitetura.mjs` + `check-design-system.mjs` + `tsc --noEmit` + `jest`) executa com **0 violações** e **0 falhas**.
