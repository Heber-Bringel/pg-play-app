# 🏗️ Plano de Implementação Técnica (`plan.md`): Tela Inicial do Encontro, Abertura Animada e Short Navigation Bar

- **Branch:** `feat/026-tela-inicial-welcome`
- **Data:** 2026-11-25
- **Especificação de Origem:** `specs/026-tela-inicial-boas-vindas/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

A solução implementa a nova tela de abertura do **PG PLAY** (`WelcomeScreen` + `WelcomeSplashOverlay` + `EncounterPodium` + `ShortNavigationBar`) seguindo fielmente os protótipos aprovados no Figma (`pg-play-app`, página `01 · Tela Inicial (Welcome)`) e a arquitetura **MVVM Sofisticado**.

Para preservar 100% das rotas e testes existentes do Hub e das arenas (que retornam para `'/'`), o Hub permanece em `src/app/index.tsx` ↔ `src/view/index.tsx` e a nova tela inicial é adicionada em `src/app/welcome.tsx` ↔ `src/view/welcome.tsx` ↔ `src/viewmodel/useWelcomeViewModel.ts`, sendo configurada como tela inicial do app via `initialRouteName="welcome"` em `src/app/_layout.tsx`. O botão `"Sala Multiplayer (PIN)"` passa `?modality=Multi-Celular` ao Hub, lido por `useHubViewModel` via `useLocalSearchParams`.

---

## 2. Verificação Constitucional (*Constitution Check*)

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada com os requisitos `RF-80.01` a `RF-80.06` e critérios `CS-01`/`CS-02`.
- [x] **Artigo II (MVVM 7 Pastas)**: Todos os arquivos planejados residem exclusivamente em `app`, `view`, `viewmodel` (além de `design-system/` e `tests/`), reutilizando `usecase`, `model`, `infra` e `di` existentes.
- [x] **Artigo II (Rotas Finas e View Burra)**: `src/app/welcome.tsx` terá apenas 2 linhas reexportando `@/view/welcome`, e toda a navegação (`expo-router`) ficará em `src/viewmodel/useWelcomeViewModel.ts`.
- [x] **Artigo II (Vocabulário)**: Nenhum arquivo, interface ou classe usa `Repository` ou `Connector`.
- [x] **Artigo III (Design System)**: `ShortNavigationBar` será documentada em `design-system/04-componentes/barra-de-navegacao.md` (`v1.2.0`), e todos os estilos usarão exclusivamente tokens de `@/view/theme` (zero cores literais e zero números mágicos).
- [x] **Artigo IV (Testabilidade Offline)**: `useWelcomeViewModel` recebe `useCase: IPgPlayUseCases = pgPlayUseCases` por injeção de dependência, permitindo testes unitários com `Memory*DataSource` e mocks isolados.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

*(Ordem de dentro para fora: `model`/`infra`/`usecase`/`di` já possuem `Team`, `getScoreboard`, `resetScoreboard` e `listMinigames` prontos e testados — nenhuma alteração necessária nessas 4 camadas).*

```text
design-system/
├─ 04-componentes/barra-de-navegacao.md   # Novo (11º componente: ShortNavigationBar M3 Expressive)
├─ 02-tokens.md                            # Atualização v1.2.0 (tokens navBar, podium e splash)
├─ README.md                               # Atualização v1.2.0 no inventário de componentes
└─ CHANGELOG.md                            # Registro da versão 1.2.0

src/
├─ view/
│  ├─ theme.ts                             # Tokens component.navBar, component.podium e component.splash
│  ├─ components/
│  │  ├─ shortNavigationBar.tsx            # ShortNavigationBar (export nomeado, 100% props)
│  │  ├─ encounterPodium.tsx               # EncounterPodium 2º|1º|3º (export nomeado, 100% props)
│  │  └─ welcomeSplashOverlay.tsx          # WelcomeSplashOverlay M3 Spring (export nomeado, 100% props)
│  └─ welcome.tsx                          # WelcomeScreen espelhada (4 estados + ThemeModePanel + ConfirmModal)
├─ viewmodel/
│  ├─ useWelcomeViewModel.ts               # [WelcomeState, WelcomeActions] + navegação expo-router
│  └─ useHubViewModel.ts                   # Leitura opcional de ?modality=Multi-Celular via useLocalSearchParams
└─ app/
   ├─ welcome.tsx                          # Rota fina de 2 linhas reexportando @/view/welcome
   └─ _layout.tsx                          # initialRouteName="welcome" no <Stack>

tests/
├─ components/shortNavigationBar.test.tsx  # Testes RNTL da barra de navegação M3 Expressive
├─ components/encounterPodium.test.tsx     # Testes RNTL do pódio (1, 2 e 3 equipes)
├─ hooks/useWelcomeViewModel.test.ts       # Testes renderHook da ViewModel (estado, reset, rotas)
└─ mocks/welcomeScreen.mock.test.tsx       # Testes de tela (loading, error, empty, content, modal, tema)
```

---

## 4. Inventário do Design System (`PG Play Expressive v1.2.0`)

| Elemento da Tela | Componente (`@/view/components/`) | Tokens Semânticos / Componente (`@/view/theme`) |
| :--- | :--- | :--- |
| Emblema e título `PG PLAY` | Nativo (`View` + `Text` + `MaterialCommunityIcons`) | `color.actionContainer`, `color.onActionContainer`, `color.onSurface`, `radius.md`, `space['2xl']` |
| Pílula de resumo da sessão | `ExpressiveTag` (`tone="neutral"`) | `component.tag.neutral.*`, `radius.full` |
| Pódio Olímpico (`2º \| 1º \| 3º`) | `EncounterPodium` | `color.highlightContainer`, `color.highlight`, `color.onHighlight`, `color.actionContainer`, `color.secondaryContainer`, `component.podium.*` |
| Barra rápida (`Ver placar → \| Zerar`) | Nativo (`Pressable` com `useKeyboardFocus` + `space['2xl']`) | `color.surfaceVariant`, `color.action`, `color.onSurfaceMuted`, `radius.md` |
| Estado Inicial (`0 equipes`) | Card acolhedor + `ExpressiveButton` (`tonal`) | `color.surfaceContainer`, `color.surfaceVariant`, `component.card.border`, `radius.xl` |
| CTA Principal (`Iniciar Jogos`) | `ExpressiveButton` (`variant="primaryJumbo"`) | `component.button.bg`, `component.button.jumbo.height` (`64 dp`), `radius.full` |
| CTA Secundário (`Sala Multiplayer (PIN)`) | `ExpressiveButton` (`variant="tonalJumbo"`) | `color.actionContainer`, `color.onActionContainer`, `radius.full` |
| Barra Inferior M3 Expressive | `ShortNavigationBar` | `component.navBar.*`, `color.surfaceContainer`, `color.actionContainer`, `color.onActionContainer`, `space['2xl']` |
| Abertura Animada (`Splash`) | `WelcomeSplashOverlay` | `component.splash.*`, `color.action`, `color.surface`, `color.highlight`, `color.secondary`, `motion.spring.spatial` |
| Confirmação de Zerar Placar | `ConfirmModal` | `color.surfaceContainer`, `elevation.floating`, `radius.xl` |
| Seletor de Tema (`Config.`) | `ThemeModePanel` | `component.card.*`, `ExpressiveChip`, `ExpressiveTag` |

---

## 5. Estratégia de Testes (`tests/`)

- **Testes de Componentes (`tests/components/`):**
  - `shortNavigationBar.test.tsx`: valida `accessibilityRole="tab"`, `accessibilityState.selected`, `accessibilityLabel` e callbacks dos 4 destinos.
  - `encounterPodium.test.tsx`: valida renderização proporcional com 1, 2 e 3 equipes, ordenação `2º | 1º | 3º` e ausência de texto redundante.
- **Testes de Hook (`tests/hooks/`):**
  - `useWelcomeViewModel.test.ts`: valida carregamento via `getScoreboard()`, cálculo de `totalPoints` e `podiumTeams`, `resetScoreboard()` com sucesso e erro `DomainError`, além das navegações (`'/'`, `'/?modality=Multi-Celular'`, `'/teams'`, `'/scoreboard'`).
- **Testes de Tela com Mocks (`tests/mocks/`):**
  - `welcomeScreen.mock.test.tsx`: valida os 4 estados (`loading`, `error`, `empty` 0 equipes e `content` com pódio), abertura do painel de tema ao tocar em `Config.` e fluxo do `ConfirmModal` ao zerar placar.
- **Portão de Qualidade:** `npm run check` (`check-arquitetura.mjs && check-design-system.mjs && tsc --noEmit && jest`) deve passar com **0 violações** e todos os testes existentes verdes.
