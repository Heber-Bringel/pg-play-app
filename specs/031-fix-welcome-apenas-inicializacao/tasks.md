# ✅ Lista de Tarefas (`tasks.md`): Tela de Abertura (Welcome) apenas na inicialização do app

- **Input:** `specs/031-fix-welcome-apenas-inicializacao/spec.md` e `specs/031-fix-welcome-apenas-inicializacao/plan.md`
- **Issue vinculada:** `#93`
- **Branch:** `fix/031-welcome-apenas-inicializacao`
- **Ordem de Execução:** Design System → ViewModels → Views & App Layout → Testes → Verificação (`npm run check`)

---

## Fase 1: Documentação do Design System (`design-system/`)

- [x] **T001** Atualizar `design-system/04-componentes/barra-de-navegacao.md` documentando os 3 destinos principais da sessão (`Início`, `Equipes`, `Placar`) e que `welcome` aparece apenas no Cold Start

---

## Fase 2: ViewModels e Controle de Sessão (`src/viewmodel/`)

- [x] **T002** Atualizar `src/viewmodel/useWelcomeViewModel.ts` com controle de sessão em memória (`hasStartedEncounterInSession`, `markEncounterStartedInSession`, `resetWelcomeSessionForTests`), redirecionamento automático para `'/'` quando a sessão já iniciou, uso de `router.replace` nos CTAs e remoção de `WelcomeNavKey`/`handleSelectNav`
- [x] **T003** Atualizar `src/viewmodel/useHubViewModel.ts` para `HubNavKey = 'games' | 'teams' | 'scoreboard'`, navegar para `'/teams'` e `'/scoreboard'` e remover `handleOpenWelcome`
- [x] **T004** Atualizar `src/viewmodel/useTeamsViewModel.ts` para `TeamsNavKey = 'games' | 'teams' | 'scoreboard'` e direcionar `'games'` (Início) para `'/'` e `'scoreboard'` para `'/scoreboard'`
- [x] **T005** Atualizar `src/viewmodel/useScoreboardViewModel.ts` adicionando `ScoreboardNavKey` + `handleSelectNav` (`'/'` e `'/teams'`)

---

## Fase 3: Views e Layout Raiz (`src/view/` e `src/app/`)

- [x] **T006** Atualizar `src/view/components/shortNavigationBar.tsx` para os 3 destinos da sessão (`Início` → `'games'`, `Equipes` → `'teams'`, `Placar` → `'scoreboard'`)
- [x] **T007** Atualizar `src/view/welcome.tsx` removendo `ShortNavigationBar` da tela de abertura
- [x] **T008** Atualizar `src/view/scoreboard.tsx` incorporando `ShortNavigationBar` (`activeKey="scoreboard"`) nos estados vazio e de conteúdo
- [x] **T009** Organizar os imports de `src/app/_layout.tsx` mantendo `unstable_settings = { anchor: 'welcome' }` para abertura inicial no Cold Start

---

## Fase 4: Testes e Verificação (`tests/`)

- [x] **T010** Atualizar testes de componente (`shortNavigationBar.test.tsx`), hooks (`useWelcomeViewModel`, `useHubViewModel`, `useTeamsViewModel`, `useScoreboardViewModel`) e mocks de tela (`welcomeScreen`, `hubScreen`, `teamsScreen`, `scoreboardScreen`)
- [x] **T011** Executar `npm run check` (`check-arquitetura.mjs && check-design-system.mjs && tsc --noEmit && jest`) e confirmar **0 violações** e todos os testes passando
