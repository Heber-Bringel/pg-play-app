# ✅ Lista de Tarefas (`tasks.md`): Tela Inicial do Encontro, Abertura Animada e Short Navigation Bar

- **Input:** `specs/026-tela-inicial-boas-vindas/spec.md` e `specs/026-tela-inicial-boas-vindas/plan.md`
- **Ordem de Execução Obrigatória:** De dentro para fora (`design-system` → `theme` → `components` → `viewmodel` → `view` → `app` → `tests` → `check` → `PR`)
- **Receitas do Harness:** `/sincronizar-tema`, `/nova-tela`, `/revisar-arquitetura`, `/commit-e-pr`

---

## Fase 1: Design System e Tokens (`design-system/` e `src/view/theme.ts`)
*Objetivo: Oficializar o componente `ShortNavigationBar` e os tokens de pódio/splash sem números mágicos nem cores literais fora de `theme.ts`.*

- [x] **T001** Criar `design-system/04-componentes/barra-de-navegacao.md` especificando anatomia, estados, acessibilidade e tokens da `ShortNavigationBar` (Material 3 Expressive 2025)
- [x] **T002** Atualizar `design-system/02-tokens.md`, `design-system/README.md` e `design-system/CHANGELOG.md` para a versão `1.2.0`
- [x] **T003** Sincronizar `src/view/theme.ts` adicionando tokens de componente (`navBar`, `podium`, `splash`) preservando `primitive` privado e atualizando `tests/tokens.test.ts` se necessário

---

## Fase 2: Componentes Visuais Reutilizáveis (`src/view/components/`)
*Objetivo: Construir os 3 componentes puros (100% via props, `useTheme()`, `useKeyboardFocus` onde aplicável, e `npm run check:ds` limpo).*

- [x] **T004** Implementar `ShortNavigationBar` (export nomeado) em `src/view/components/shortNavigationBar.tsx` com 4 destinos, pílula ativa em `color.actionContainer`, alvo `≥ 48 dp` e `accessibilityRole="tab"`
- [x] **T005** Implementar `EncounterPodium` (export nomeado) em `src/view/components/encounterPodium.tsx` exibindo `2º | 1º | 3º` (ou 1/2 colunas quando houver menos equipes), sem bordas amarelas e sem texto redundante
- [x] **T006** Implementar `WelcomeSplashOverlay` (export nomeado) em `src/view/components/welcomeSplashOverlay.tsx` com animação M3 Spring (`motion.spring.spatial`), modos Claro/Escuro e respeito a `AccessibilityInfo.isReduceMotionEnabled()`

---

## Fase 3: ViewModel e Integração de Navegação (`src/viewmodel/`)
*Objetivo: Concentrar estado, chamadas ao `IPgPlayUseCases`, tratamento de `DomainError` e navegação `expo-router` na ViewModel.*

- [x] **T007** Criar `src/viewmodel/useWelcomeViewModel.ts` exportando `WelcomeState`, `WelcomeActions` e `useWelcomeViewModel(useCase: IPgPlayUseCases = pgPlayUseCases)`
- [x] **T008** Atualizar `src/viewmodel/useHubViewModel.ts` para aceitar parâmetro opcional `modality` via `useLocalSearchParams` (pré-selecionando `'Multi-Celular'` quando vindo de `"Sala Multiplayer (PIN)"`)

---

## Fase 4: Apresentação — Tela Espelhada, Rota Fina e Layout (`src/view/` e `src/app/`)
*Objetivo: Renderizar os 4 estados da `WelcomeScreen` na View burra, criar a rota fina de 2 linhas e definir `welcome` como rota inicial.*

- [x] **T009** Implementar `WelcomeScreen` em `src/view/welcome.tsx` contemplando `loading`, `error`, `empty` (0 equipes Claro/Escuro) e `content` (`EncounterPodium` + CTAs + `ConfirmModal` + `ThemeModePanel` + `ShortNavigationBar` + `WelcomeSplashOverlay`)
- [x] **T010** Criar rota fina de 2 linhas em `src/app/welcome.tsx` reexportando `@/view/welcome`
- [x] **T011** Configurar `initialRouteName="welcome"` no `<Stack>` em `src/app/_layout.tsx`

---

## Fase 5: Suíte de Testes Automatizados (`tests/`)
*Objetivo: Garantir cobertura por categoria (Componentes, Hooks e Mocks de Tela) com commits separados conforme Engenharia de Software III.*

- [x] **T012** Criar testes RNTL de componentes em `tests/components/shortNavigationBar.test.tsx` e `tests/components/encounterPodium.test.tsx`
- [x] **T013** Criar testes unitários de hook (`renderHook`) em `tests/hooks/useWelcomeViewModel.test.ts`
- [x] **T014** Criar testes de tela com mocks (4 estados + modal + tema) em `tests/mocks/welcomeScreen.mock.test.tsx`

---

## Fase 6: Verificação Determinística e Pull Request
*Objetivo: Garantir 0 violações no Harness MVVM e no Design System antes de abrir o PR.*

- [x] **T015** Executar `npm run check` (`check-arquitetura.mjs && check-design-system.mjs && tsc --noEmit && jest`) e corrigir qualquer eventual apontamento
- [x] **T016** Realizar commits convencionais incrementais e abrir Pull Request vinculado à Issue `#80` (`/commit-e-pr`)
