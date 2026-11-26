# 🏗️ Plano de Implementação Técnica (`plan.md`): fix-design-tela-forca

- **Branch:** `fix/032-fix-design-tela-forca`
- **Data:** 2026-11-26
- **Especificação de Origem:** `specs/032-fix-design-tela-forca/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`
- **Issue:** `#97`

---

## 1. Resumo Técnico

Esta correção resolve o problema de layout e espaçamento na tela do **Jogo da Forca** (`src/view/forca.tsx`) reportado na **Issue #97**:

1. **Causa Raiz**:
   - Em `src/view/forca.tsx`, os 3 estados de retorno antecipado (`state.loading`, `state.error` e `state.teams.length < 2`) renderizam `<View style={styles.screen}>`.
   - No entanto, `styles.screen` possuía apenas `{ flex: 1, backgroundColor: color.surface }`, sem `padding`, sem `gap` e sem `justifyContent: 'center'`, deixando o `GameCard` e os botões `ExpressiveButton` colados nas bordas da tela e grudados uns nos outros.
2. **Solução na Camada `src/view/`**:
   - Criar `styles.centerScreen` em `createStyles(activeTokens)` dentro de `src/view/forca.tsx` com:
     - `flex: 1`
     - `backgroundColor: color.surface`
     - `padding: space.lg` (`24 dp`)
     - `gap: space.md` (`16 dp`)
     - `justifyContent: 'center'`
   - Aplicar `style={styles.centerScreen}` nos 3 estados de tela inteira (`state.loading`, `state.error` e `state.teams.length < 2`).
   - Adicionar `flexGrow: 1` em `styles.scrollContent` da `ScrollView` principal para garantir preenchimento vertical consistente em todas as fases (`pass-turn`, `playing`, `word-result`, `finished`).
3. **Testes de Regressão (`tests/mocks/forcaScreen.mock.test.tsx`)**:
   - Validar com `StyleSheet.flatten` que os containers dos estados `loading`, `error` e `teams.length < 2` possuem `padding: tokens.semantic.space.lg`, `gap: tokens.semantic.space.md`, `justifyContent: 'center'` e respondem à troca de tema Claro/Escuro (`ThemeProvider`).

---

## 2. Verificação Constitucional (*Constitution Check*)

- [x] **Artigo I (SDD)**: `spec.md`, `plan.md` e `tasks.md` criados em `specs/032-fix-design-tela-forca/` antes de qualquer edição em `src/`.
- [x] **Artigo II (MVVM 7 Pastas)**: alteração restrita à camada `src/view/forca.tsx` e ao teste `tests/mocks/forcaScreen.mock.test.tsx`.
- [x] **Artigo II (View Burra)**: `src/view/forca.tsx` apenas renderiza `state` e aciona `actions` de `useForcaViewModel()`.
- [x] **Artigo III (Design System PG Play Expressive)**: uso exclusivo de tokens semânticos (`color.surface`, `space.lg`, `space.md`, `space['2xl']`) via `useTheme()`; zero cores ou medidas literais.
- [x] **Artigo IV (Portão de Qualidade)**: verificação completa via `npm run check`.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

```text
specs/
└─ 032-fix-design-tela-forca/
   ├─ spec.md                                          # NOVO — Especificação do problema e critérios de aceite (#97)
   ├─ plan.md                                          # NOVO — Plano técnico MVVM + Design System
   └─ tasks.md                                         # NOVO — Checklist de tarefas
src/
└─ view/
   └─ forca.tsx                                        # ATUALIZADO — + styles.centerScreen nos estados loading, error e teams < 2
tests/
└─ mocks/
   └─ forcaScreen.mock.test.tsx                        # ATUALIZADO — + verificação de espaçamento, alinhamento e tema Claro/Escuro
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Token / Componente (`@/view/theme`) | Uso em `src/view/forca.tsx` |
| :--- | :--- |
| `color.surface` | Fundo de `styles.screen` e `styles.centerScreen` (Claro e Escuro) |
| `space.lg` (`24 dp`) | `padding` do container `styles.centerScreen` nos estados `loading`, `error` e `teams.length < 2` |
| `space.md` (`16 dp`) | `gap` vertical entre o `GameCard` e os botões `ExpressiveButton` em `styles.centerScreen` e `padding`/`gap` de `styles.scrollContent` |
| `GameCard`, `ExpressiveButton` | Componentes visuais de estado vazio/erro e ações de navegação |
