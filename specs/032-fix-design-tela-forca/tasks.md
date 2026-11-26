# ✅ Lista de Tarefas (`tasks.md`): fix-design-tela-forca

- **Input:** `specs/032-fix-design-tela-forca/spec.md` e `specs/032-fix-design-tela-forca/plan.md`
- **Issue:** `#97`
- **Ordem de Execução Obrigatória:** `specs` → `view` → `tests` → `check` → Teste no Expo Go → GitHub PR

---

## Fase 1: Camada de Visão (`src/view/`)

- [x] **T001** Criar o estilo `centerScreen` (`flex: 1`, `backgroundColor: color.surface`, `padding: space.lg`, `gap: space.md`, `justifyContent: 'center'`) e adicionar `flexGrow: 1` em `scrollContent` em `src/view/forca.tsx`, aplicando `styles.centerScreen` nos estados `state.loading`, `state.error` e `state.teams.length < 2`.

---

## Fase 2: Testes de Tela com Mocks (`tests/mocks/`)

- [x] **T002** Atualizar `tests/mocks/forcaScreen.mock.test.tsx` adicionando asserções de layout (`padding: space.lg`, `gap: space.md`, `justifyContent: 'center'`) para os estados `loading`, `error` e `teams.length < 2`, além de validar a renderização nos temas Claro e Escuro.

---

## Fase 3: Verificação Automatizada e Teste no Expo Go

- [x] **T003** Executar `npm run check` (`check-arquitetura.mjs`, `check-design-system.mjs`, `tsc --noEmit` e `jest`) garantindo **0 erros e 0 violações**.
- [x] **T004** Iniciar o servidor de desenvolvimento para validação manual da usuária no **Expo Go** antes de realizar qualquer push/PR para o GitHub.
