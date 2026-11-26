# 📋 Especificação de Funcionalidade (`spec.md`): fix-design-tela-forca

- **Branch da Feature:** `fix/032-fix-design-tela-forca`
- **Criado em:** 2026-11-26
- **Status:** Em Revisão
- **Caso(s) de Uso / Requisito(s):** `UC05` (Arena do Jogo da Forca — `RF13`, `RF14`, `RF15`), `RNF04` (legibilidade à distância), `RNF07` (alvos de toque `48 dp` / `64 dp` Jumbo) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md`, `design-system/03-fundamentos.md` e `docs/harness/04-views-e-design-system.md`
- **Issue vinculada:** `#97`

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Visualizar o aviso de Equipes Insuficientes com espaçamento e alinhamento adequados (Prioridade: P1)

O **Líder ou Participante do PG** que abre o **Jogo da Forca** (`src/view/forca.tsx`) quando há menos de 2 equipes cadastradas (`state.teams.length < 2`) visualiza o card *"Equipes Insuficientes"* e os botões *"Cadastrar Equipes"* e *"Voltar aos Jogos"* com margens laterais/verticais, espaçamento (`gap`) entre elementos e alinhamento centralizado na tela, sem que os componentes fiquem colados nas bordas do aparelho ou grudados uns nos outros.

**Por que esta prioridade:** atualmente o estado `state.teams.length < 2` usa `styles.screen` (`{ flex: 1, backgroundColor: color.surface }`) sem `padding`, `gap` ou `justifyContent: 'center'`, quebrando a hierarquia visual e a ergonomia de toque.

**Como testar independentemente:** abrir a rota `/forca` com 0 ou 1 equipe cadastrada no Expo Go e nos testes automatizados (`tests/mocks/forcaScreen.mock.test.tsx`) e verificar que o container aplica `padding: space.lg`, `gap: space.md` e `justifyContent: 'center'`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que existem menos de 2 equipes cadastradas na sessão, **Quando** o usuário abre o Jogo da Forca, **Então** o container de estado (`styles.centerScreen`) exibe `padding: space.lg` (`24 dp`), `gap: space.md` (`16 dp`) e `justifyContent: 'center'`, mantendo o `GameCard` e os dois `ExpressiveButton` afastados das bordas da tela e espaçados entre si.
2. **Dado** o estado de Equipes Insuficientes, **Quando** o usuário toca em *"Cadastrar Equipes"* ou *"Voltar aos Jogos"*, **Então** as ações `handleGoToTeams` e `handleConfirmExit` continuam funcionando normalmente.

---

### História de Usuário 2 — Visualizar os estados de Carregamento (`loading`) e Erro (`error`) centralizados e espaçados (Prioridade: P1)

O **Participante do PG** visualiza os estados de `loading` (*"Preparando a Arena da Forca..."*) e `error` (*"Atenção na Arena"* + botão *"Tentar Novamente"*) com o mesmo padrão de alinhamento centralizado, `padding` e `gap` das demais arenas do aplicativo (`Mímica` e `Quiz`).

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que a Arena da Forca está carregando (`state.loading = true`), **Quando** a tela é renderizada, **Então** a mensagem *"Preparando a Arena da Forca..."* aparece centralizada vertical e horizontalmente com `padding: space.lg`.
2. **Dado** que ocorreu um erro ao carregar a Arena da Forca (`state.error !== null`), **Quando** a tela é renderizada, **Então** o `GameCard` de erro e o botão *"Tentar Novamente"* aparecem centralizados, com `padding: space.lg` e `gap: space.md` entre o card e o botão.

---

### História de Usuário 3 — Consistência visual em todas as fases do Jogo da Forca nos temas Claro e Escuro (Prioridade: P2)

Os **Participantes do PG** jogam todas as fases da partida (`pass-turn`, `playing`, `word-result` e `finished`) nos temas Claro e Escuro com espaçamentos, bordas e tipografia 100% baseados nos tokens de `@/view/theme`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** a partida da Forca em andamento (`pass-turn`, `playing`, `word-result`, `finished`), **Quando** o tema é alternado entre Claro e Escuro ou a largura da janela muda, **Então** todos os elementos respeitam `space.md`, `space.sm`, `space.lg` e os tokens semânticos/componentes de `@/view/theme` sem quebras de layout.

---

### Casos de Borda (Edge Cases)

- **Telas menores ou fontes ampliadas (`allowFontScaling`):** o espaçamento `padding: space.lg` e `gap: space.md` preserva área útil suficiente para o `GameCard` e botões Jumbo (`64 dp`).
- **Alternância entre tema Claro e Escuro (`useTheme()`):** `styles.centerScreen` consome `color.surface`, `space.lg` e `space.md` dinamicamente via `useMemo(() => createStyles(activeTokens), [activeTokens])`.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-01`**: Criar o estilo dedicado `centerScreen` em `src/view/forca.tsx` utilizando exclusivamente tokens semânticos de `@/view/theme` (`flex: 1`, `backgroundColor: color.surface`, `padding: space.lg`, `gap: space.md`, `justifyContent: 'center'`).
- **`RF-02`**: Aplicar `styles.centerScreen` nos 3 retornos antecipados de estado de tela inteira em `src/view/forca.tsx`: `state.loading`, `state.error` e `state.teams.length < 2`.
- **`RF-03`**: Garantir que `styles.scrollContent` na fase principal (`pass-turn`, `playing`, `word-result`, `finished`) mantenha `flexGrow: 1`, `padding: space.md`, `gap: space.md` e `paddingBottom: space['2xl']` para rolagem e preenchimento fluido em Claro e Escuro.
- **`RF-04`**: Adicionar testes de regressão em `tests/mocks/forcaScreen.mock.test.tsx` verificando explicitamente que os containers dos estados `loading`, `error` e `teams.length < 2` aplicam `padding: tokens.semantic.space.lg`, `gap: tokens.semantic.space.md`, `justifyContent: 'center'` e `backgroundColor` de acordo com o tema ativo (Claro e Escuro).

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (Design System PG Play Expressive)**: Zero valores literais de cor ou medida em `src/view/forca.tsx`; 100% aderente aos tokens semânticos e de componente de `@/view/theme`.
- **`CS-02` (Ergonomia e IHC)**: Card e botões nos estados `teams.length < 2`, `loading` e `error` devidamente afastados das bordas (`space.lg` = `24 dp`) e espaçados entre si (`space.md` = `16 dp`).
- **`CS-03` (Portão de Qualidade)**: `npm run check` (`check-arquitetura.mjs`, `check-design-system.mjs`, `tsc --noEmit` e `jest`) passando com **0 erros/violações**.
