# 🏗️ Plano de Implementação Técnica (`plan.md`): Tela de Abertura (Welcome) apenas na inicialização do app

- **Branch:** `fix/031-welcome-apenas-inicializacao`
- **Data:** 2026-11-26
- **Especificação de Origem:** `specs/031-fix-welcome-apenas-inicializacao/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

A correção ajusta o fluxo de navegação e controle de sessão exclusivamente nas camadas de apresentação (`viewmodel`, `view` e `app`) e na documentação do Design System (`design-system/04-componentes/barra-de-navegacao.md`), preservando intactas as camadas de domínio (`model`, `infra`, `usecase`, `di`).

O controle de sessão em memória reside em `src/viewmodel/useWelcomeViewModel.ts` (evitando arquivos fora do padrão `use*ViewModel.ts` em `src/viewmodel/`). A `ShortNavigationBar` passa a oferecer os 3 destinos reais da sessão (`Início` → `/`, `Equipes` → `/teams` e `Placar` → `/scoreboard`), é removida da tela de abertura (`src/view/welcome.tsx`) e adicionada à tela de placar (`src/view/scoreboard.tsx`).

---

## 2. Verificação Constitucional (*Constitution Check*)

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada com os requisitos `RF-93.01` a `RF-93.05` e critérios `CS-01`/`CS-02`.
- [x] **Artigo II (MVVM 7 Pastas)**: Todas as alterações em `src/` residem estritamente em `viewmodel`, `view` e `app`, sem criar novas pastas nem arquivos fora da convenção `use*ViewModel.ts`.
- [x] **Artigo II (Rotas Finas e View Burra)**: `src/app/welcome.tsx`, `src/app/index.tsx`, `src/app/teams.tsx` e `src/app/scoreboard.tsx` permanecem rotas finas de 2 linhas; toda a lógica de sessão e navegação (`expo-router`) permanece em `src/viewmodel/`.
- [x] **Artigo II (Vocabulário)**: Nenhum arquivo, tipo, interface ou classe usa `Repository` ou `Connector`.
- [x] **Artigo III (Design System)**: `ShortNavigationBar` e `ScoreboardScreen` utilizam apenas tokens semânticos/componentes de `@/view/theme` (zero cores literais, zero números mágicos).
- [x] **Artigo IV (Testabilidade Offline)**: O estado de sessão em memória possui helper explícito `resetWelcomeSessionForTests()` e toda a navegação continua 100% testável offline com Jest e RNTL.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

*(Nenhuma alteração em `src/model/`, `src/infra/`, `src/usecase/` ou `src/di/`.)*

```text
design-system/
└─ 04-componentes/barra-de-navegacao.md    # Atualiza os 3 destinos globais (Início, Equipes, Placar)

src/
├─ viewmodel/
│  ├─ useWelcomeViewModel.ts               # Controle de sessão em memória + guard de redirecionamento + replace nos CTAs
│  ├─ useHubViewModel.ts                   # HubNavKey ('games' | 'teams' | 'scoreboard'), remove handleOpenWelcome
│  ├─ useTeamsViewModel.ts                 # TeamsNavKey ('games' | 'teams' | 'scoreboard'), Início -> '/'
│  └─ useScoreboardViewModel.ts            # ScoreboardNavKey + handleSelectNav ('/' e '/teams')
├─ view/
│  ├─ components/shortNavigationBar.tsx    # NavDestinationKey = 'games' | 'teams' | 'scoreboard' (Início, Equipes, Placar)
│  ├─ welcome.tsx                          # Remove ShortNavigationBar (tela de abertura única)
│  └─ scoreboard.tsx                       # Adiciona ShortNavigationBar (activeKey="scoreboard") nos estados vazio e conteúdo
└─ app/
   └─ _layout.tsx                          # Organiza imports no topo mantendo unstable_settings = { anchor: 'welcome' }

tests/
├─ components/shortNavigationBar.test.tsx  # Valida os 3 novos destinos (Início, Equipes, Placar)
├─ hooks/useWelcomeViewModel.test.ts       # Valida cold start, marcação de sessão e bloqueio de retorno para /welcome
├─ hooks/useHubViewModel.test.ts           # Valida handleSelectNav sem /welcome e remoção de handleOpenWelcome
├─ hooks/useTeamsViewModel.test.ts         # Valida que Início navega para '/' e Placar para '/scoreboard'
├─ hooks/useScoreboardViewModel.test.ts    # Valida handleSelectNav no placar
├─ mocks/welcomeScreen.mock.test.tsx       # Valida ausência de ShortNavigationBar na WelcomeScreen
├─ mocks/hubScreen.mock.test.tsx           # Atualiza mock e asserções das 3 abas da ShortNavigationBar
├─ mocks/teamsScreen.mock.test.tsx         # Atualiza asserções das abas Início ('games') e Placar ('scoreboard')
└─ mocks/scoreboardScreen.mock.test.tsx    # Adiciona handleSelectNav ao mock e valida interação com ShortNavigationBar
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento da Tela | Componente (`@/view/components/`) | Tokens Semânticos / Componente (`@/view/theme`) |
| :--- | :--- | :--- |
| Barra inferior da sessão | `ShortNavigationBar` (`Início`, `Equipes`, `Placar`) | `component.navBar.*`, `semantic.icon.md`, `semantic.font.caption`, `semantic.font.body`, `semantic.space.*` |
| Container raiz do Placar | Nativo (`View`) | `semantic.color.surface` |

---

## 5. Estratégia de Testes (`tests/`)

- **Testes de Componentes (`tests/components/shortNavigationBar.test.tsx`):**
  - Valida renderização dos 3 destinos (`Início`, `Equipes`, `Placar`), estados `selected`, `accessibilityRole="tab"` e disparo de `onSelect` com `'games'`, `'teams'` e `'scoreboard'`.
- **Testes de Hooks (`tests/hooks/`):**
  - `useWelcomeViewModel.test.ts`: testa Cold Start (`splashVisible: true`), marcação da sessão ao iniciar jogos/multiplayer/equipes/placar com `router.replace` e redirecionamento imediato (`router.replace('/')` + `splashVisible: false`) em nova montagem após encontro iniciado.
  - `useHubViewModel.test.ts`, `useTeamsViewModel.test.ts` e `useScoreboardViewModel.test.ts`: validam a navegação entre `'/'`, `'/teams'` e `'/scoreboard'` sem nunca reabrir `'/welcome'`.
- **Testes de Telas com Mocks (`tests/mocks/`):**
  - Atualizam os mocks de `WelcomeScreen`, `HubScreen`, `TeamsScreen` e `ScoreboardScreen` para cobrir a nova `ShortNavigationBar`.
- **Portão de Qualidade:** `npm run check` (`check-arquitetura.mjs && check-design-system.mjs && tsc --noEmit && jest`) deve encerrar com **0 violações** e **100% dos testes passando**.
