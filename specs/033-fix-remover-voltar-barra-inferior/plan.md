# 🏗️ Plano de Implementação Técnica (`plan.md`): Remover botão Voltar redundante e corrigir erro de retorno nas telas da barra inferior

- **Branch:** `fix/033-remover-voltar-barra-inferior`
- **Data:** 2026-11-27
- **Especificação de Origem:** `specs/033-fix-remover-voltar-barra-inferior/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

A correção atua estritamente nas camadas de apresentação (`src/viewmodel/` e `src/view/`) e na suíte de testes (`tests/`), sem alterar domínio (`model`), infraestrutura (`infra`), casos de uso (`usecase`), injeção de dependências (`di`) ou rotas finas (`app`). Removemos a ação legada `handleBack` (única origem de `router.back()` em todo o app) de `useScoreboardViewModel.ts` e `useTeamsViewModel.ts`, e atualizamos `src/view/scoreboard.tsx` para remover o botão `Voltar` nos estados vazio e com equipes, adotando `<AppHeader />` no topo em paridade visual com `src/view/index.tsx` e `src/view/teams.tsx`.

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo devem estar marcados antes de gerar o `tasks.md` ou iniciar código.*

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada com os requisitos `RF-101.01–RF-101.05` e a Issue `#101`.
- [x] **Artigo II (MVVM 7 Pastas)**: Todos os arquivos alterados residem exclusivamente em `src/viewmodel/`, `src/view/` e `tests/`.
- [x] **Artigo II (Rotas Finas e View Burra)**: As rotas em `src/app/scoreboard.tsx` e `src/app/teams.tsx` permanecem finas (2 linhas) e toda a navegação (`router.replace`) permanece nas ViewModels.
- [x] **Artigo II (Vocabulário)**: Nenhum arquivo, interface ou classe usa `Repository` ou `Connector`.
- [x] **Artigo III (Design System)**: `src/view/scoreboard.tsx` usa exclusivamente tokens de `@/view/theme` e componentes oficiais (`AppHeader`, `ShortNavigationBar`, `GameCard`, `ExpressiveButton`, `ConfirmModal`).
- [x] **Artigo IV (Testabilidade Offline)**: Os hooks e telas são testados offline com `Memory*DataSource` e mocks de ViewModel em Jest.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

Arquivos impactados (ordem de dentro para fora):

```text
src/
├─ model/        # Sem alterações (Team e DomainError reutilizados intactos)
├─ infra/        # Sem alterações (Memory* reutilizados intactos)
├─ usecase/      # Sem alterações (IPgPlayUseCases reutilizado intacto)
├─ di/           # Sem alterações (container.ts reutilizado intacto)
├─ viewmodel/
│  ├─ useScoreboardViewModel.ts   # Remover handleBack de ScoreboardActions e do hook (elimina router.back())
│  └─ useTeamsViewModel.ts        # Remover handleBack de TeamsActions e do hook (elimina router.back())
├─ view/
│  └─ scoreboard.tsx              # Remover botão Voltar + topBar (vazio e com equipes), adotar <AppHeader />, limpar imports/estilos não usados
└─ app/          # Sem alterações (rotas finas scoreboard.tsx e teams.tsx intactas)
```

Arquivos de teste impactados:

```text
tests/
├─ hooks/
│  ├─ useScoreboardViewModel.test.ts   # Remover chamadas a handleBack/mockBack e manter cobertura de handleSelectNav
│  └─ useTeamsViewModel.test.ts        # Remover teste legado de handleBack/mockBack e manter cobertura de handleSelectNav
└─ mocks/
   ├─ scoreboardScreen.mock.test.tsx   # Remover handleBack do mock, validar ausência de Voltar (vazio e com equipes), presença de AppHeader e ShortNavigationBar
   └─ teamsScreen.mock.test.tsx        # Remover handleBack do mock e validar ausência de Voltar
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento da Tela (`scoreboard.tsx`) | Componente (`@/view/components/`) | Tokens Semânticos (`@/view/theme`) |
| :--- | :--- | :--- |
| Cabeçalho global (marca + som + tema) | `AppHeader` | `color.surface`, `color.actionContainer`, `color.onSurface`, `space.sm`, `space['2xl']` |
| Navegação inferior global (3 destinos) | `ShortNavigationBar` (`activeKey="scoreboard"`) | `navBar.bg`, `navBar.indicatorBg`, `navBar.activeIcon`, `navBar.itemMinHeight` |
| Cartão vazio / itens do ranking / erro | `GameCard` | `component.card.bg`, `component.card.border`, `radius.lg`, `space.md` |
| Ações principais (Escolher Jogo / Zerar) | `ExpressiveButton` (`primaryJumbo` / `outlined`) | `color.primary`, `color.outline`, `space.md` |
| Confirmação de zerar placar | `ConfirmModal` | `color.surface`, `color.onSurface`, `radius.xl` |
| Container e espaçamento da tela | `ScrollView` / `View` (`scrollContent`) | `color.surface`, `space.md`, `space.lg`, `space.xl`, `space['3xl']` |

---

## 5. Estratégia de Testes (`tests/`)

- **Testes de ViewModel (`tests/hooks/`):**
  - `useScoreboardViewModel.test.ts`: validar carregamento do ranking, zerar placar, `handleChooseAnotherGame` (`router.replace('/')`) e `handleSelectNav` (`'/'`, `'/teams'`, sem ação redundante em `'scoreboard'`), sem invocar `router.back()`.
  - `useTeamsViewModel.test.ts`: validar carregamento, cadastro, remoção, validação de mínimo de equipes, `handleStartRound` (`router.replace('/')`) e `handleSelectNav` (`'/'`, `'/scoreboard'`), removendo o teste obsoleto de `handleBack`.
- **Testes de Tela com Mocks (`tests/mocks/`):**
  - `scoreboardScreen.mock.test.tsx`: validar nos estados **vazio** e **com equipes** que **não existe** botão `Voltar`, que o cabeçalho `PG PLAY` (`AppHeader`) é exibido e que os itens `Ir para Início` e `Ir para Equipes` da `ShortNavigationBar` acionam `handleSelectNav`.
  - `teamsScreen.mock.test.tsx`: remover `handleBack` do objeto de ações mockadas e validar que não existe botão `Voltar` renderizado na tela de Equipes.
- **Portão de Qualidade:** executar `npm run check` (`check-arquitetura.mjs`, `check-design-system.mjs`, `tsc --noEmit` e `jest`) garantindo **0 violações** e **0 erros**.
