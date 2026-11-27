# 📋 Especificação de Funcionalidade (`spec.md`): Remover botão Voltar redundante e corrigir erro de retorno nas telas da barra inferior

- **Branch da Feature:** `fix/033-remover-voltar-barra-inferior`
- **Criado em:** 2026-11-27
- **Status:** Aprovado
- **Caso(s) de Uso / Requisito(s):** `UC06` (`RF16–RF17`), `UC01` (`RF05–RF08`), `UC02` (`RF01–RF02`) + `RNF04`, `RNF06`, `RNF07` — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md` e `design-system/04-componentes/barra-de-navegacao.md`
- **Issue vinculada:** `#101`

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Navegar no Placar sem botão Voltar redundante e com cabeçalho consistente (Prioridade: P1)

Como **Líder ou Participante do Pequeno Grupo**, ao abrir a tela de **Placar** (`/scoreboard`) — tanto com equipes cadastradas quanto no estado vazio —, quero alternar entre **Início**, **Equipes** e **Placar** exclusivamente pela barra de navegação inferior (`ShortNavigationBar`) e visualizar o mesmo cabeçalho global (`AppHeader`) das telas de Início e Equipes, sem um botão `Voltar` redundante no topo.

**Por que esta prioridade:** Resolve diretamente a redundância visual e a divergência de navegação relatadas na **Issue #101**, unificando a experiência de topo (`AppHeader`) e base (`ShortNavigationBar`) nos 3 destinos principais da sessão.

**Como testar independentemente:** Renderizar `ScoreboardScreen` nos estados vazio (`teams: []`) e com equipes em `tests/mocks/scoreboardScreen.mock.test.tsx`, verificando ausência de botão `Voltar`, presença do `AppHeader` (logo `PG PLAY` e controles de som/tema) e funcionamento da `ShortNavigationBar` (`Ir para Início` e `Ir para Equipes`).

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o usuário acessa o **Placar** (`/scoreboard`) com equipes cadastradas, **Quando** a tela é exibida, **Então** o topo exibe `<AppHeader />`, nenhum botão com rótulo `Voltar` é renderizado, o resumo de equipes/pontos permanece visível no `summaryCard` e a `ShortNavigationBar` mantém a aba **Placar** ativa.
2. **Dado** que o usuário acessa o **Placar** (`/scoreboard`) sem nenhuma equipe cadastrada (`0 equipes`), **Quando** a tela vazia é exibida, **Então** o topo exibe `<AppHeader />`, nenhum botão `Voltar` é renderizado, o card vazio indica `"0 equipes"` e o usuário pode navegar pelo botão `"Escolher Outro Jogo"` ou pela `ShortNavigationBar`.

---

### História de Usuário 2 — Eliminar erro de retorno por ausência de histórico nas telas da barra inferior (Prioridade: P1)

Como **Líder do Pequeno Grupo** alternando entre **Início** (`/`), **Equipes** (`/teams`) e **Placar** (`/scoreboard`) via `ShortNavigationBar` (que usa `router.replace`), quero que nenhuma tela principal da barra inferior exponha ou acione `router.back()` sem histórico anterior na pilha, evitando exceções em tempo de execução.

**Por que esta prioridade:** Como a `ShortNavigationBar` substitui a rota atual com `router.replace`, a pilha de navegação pode não ter rota anterior; chamar `router.back()` diretamente gera erro de navegação.

**Como testar independentemente:** Inspecionar e executar os testes de hook em `tests/hooks/useScoreboardViewModel.test.ts` e `tests/hooks/useTeamsViewModel.test.ts`, verificando que `handleBack` foi removida dos contratos `ScoreboardActions` e `TeamsActions` e que todas as transições de aba utilizam `router.replace`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o usuário trocou de tela usando a `ShortNavigationBar` (sem histórico acumulado na pilha), **Quando** interage com **Início**, **Equipes** ou **Placar**, **Então** todas as transições entre abas ocorrem via `router.replace` (`'/'`, `'/teams'`, `'/scoreboard'`) e nenhuma ação dispara `router.back()`.
2. **Dado** as ViewModels das telas com `ShortNavigationBar` (`useHubViewModel`, `useTeamsViewModel` e `useScoreboardViewModel`), **Quando** seus contratos de ações são auditados, **Então** nenhuma delas expõe `handleBack` nem chama `router.back()`.

---

### História de Usuário 3 — Cobertura de regressão nos testes automatizados das telas da barra inferior (Prioridade: P2)

Como **desenvolvedor da equipe**, quero que os testes de telas e hooks garantam permanentemente a ausência do botão `Voltar` em `ScoreboardScreen` e `TeamsScreen`, bem como o correto funcionamento da `ShortNavigationBar` em todos os estados.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** a execução da suíte Jest (`npm run check`), **Quando** os testes de `ScoreboardScreen`, `TeamsScreen`, `useScoreboardViewModel` e `useTeamsViewModel` são executados, **Então** todos passam validando explicitamente ausência do botão `Voltar` e navegação pela `ShortNavigationBar`.

---

### Casos de Borda (Edge Cases)

- **Estado vazio do Placar (`state.teams.length === 0`):** mantém `<AppHeader />`, `GameCard` com tag `"0 equipes"`, botão `"Escolher Outro Jogo"` e `ShortNavigationBar` com `activeKey="scoreboard"`, sem botão `Voltar`.
- **Estados de `loading` e `error` no Placar:** permanecem inalterados e não disparam `router.back()`.
- **Alternância entre tema Claro e Escuro:** com `<AppHeader />` presente também no Placar, o líder pode alternar som e tema diretamente na tela de Placar, mantendo alinhamento vertical (`paddingTop: space.md`) idêntico ao Hub e a Equipes.
- **Fora de escopo explícito:** o fluxo Maestro legado `e2e/01-hub-e-cadastro-equipes.yaml` (defasado desde a migração para a barra inferior) permanece fora do escopo desta correção.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-101.01`**: Remover o botão `Voltar` (`ExpressiveButton`) e a `topBar` legada de `src/view/scoreboard.tsx` nos estados vazio (`teams.length === 0`) e com equipes, substituindo o topo pelo componente `<AppHeader />` com espaçamento superior `space.md` consistente com `src/view/index.tsx` e `src/view/teams.tsx`.
- **`RF-101.02`**: Remover `handleBack` do tipo `ScoreboardActions` e da implementação de `useScoreboardViewModel` em `src/viewmodel/useScoreboardViewModel.ts`.
- **`RF-101.03`**: Remover `handleBack` do tipo `TeamsActions` e da implementação de `useTeamsViewModel` em `src/viewmodel/useTeamsViewModel.ts`.
- **`RF-101.04`**: Garantir na auditoria de `src/` que nenhuma tela com `ShortNavigationBar` (`index.tsx`, `teams.tsx`, `scoreboard.tsx`) renderize botão `Voltar` e que nenhuma ViewModel chame `router.back()` sem histórico garantido.
- **`RF-101.05`**: Atualizar os testes em `tests/mocks/scoreboardScreen.mock.test.tsx`, `tests/mocks/teamsScreen.mock.test.tsx`, `tests/hooks/useScoreboardViewModel.test.ts` e `tests/hooks/useTeamsViewModel.test.ts` para refletir a remoção de `handleBack`, validar a ausência do botão `Voltar` e validar o `AppHeader` e a `ShortNavigationBar`.

### Entidades de Domínio Envolvidas (`src/model/entities/`)
- Nenhuma entidade nova ou alterada (`Team` reutilizada intacta).

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (IHC / Design System)**: `ScoreboardScreen` usa exclusivamente tokens de `@/view/theme` e componentes oficiais (`AppHeader`, `ShortNavigationBar`, `GameCard`, `ExpressiveButton`, `ConfirmModal`), mantendo alvos de toque mínimos (`48 dp` / `64 dp` Jumbo) e consistência visual entre as 3 abas principais.
- **`CS-02` (Arquitetura MVVM & Qualidade)**: `npm run check` (`check-arquitetura.mjs` + `check-design-system.mjs` + `tsc --noEmit` + `jest`) executa com **0 violações** e **0 falhas**.
