# ✅ Lista de Tarefas (`tasks.md`): ds-sincronizar-tema

- **Input:** `specs/001-ds-sincronizar-tema/spec.md` e `specs/001-ds-sincronizar-tema/plan.md`
- **Ordem de Execução Obrigatória:** De dentro para fora (`theme.ts` → `container.ts` → `components/` → `tests/` → `check`)
- **Receita do Harness:** `/sincronizar-tema`
- **Issue Vinculada:** `#8` (`[DS] Sincronizar src/view/theme.ts e os 6 componentes do PG Play Expressive`)

---

## Fase 1: Tema e Tokens Semânticos (`src/view/theme.ts`)

- [x] **T001** Criar `src/view/theme.ts` contendo o objeto `primitive` privado (não exportado) e todos os tokens semânticos e de componente para temas claro e escuro, exportando `tokens`, `darkTokens`, `createTokens` e os submódulos semânticos e de componente.

---

## Fase 2: Container DI Inicial (`src/di/container.ts`)

- [x] **T002** Criar `src/di/container.ts` para conformidade com a validação estrutural do Harness MVVM Sofisticado.

---

## Fase 3: Componentes do Design System (`src/view/components/`)

- [x] **T003** Implementar `ExpressiveButton` em `src/view/components/expressiveButton.tsx` com `type ExpressiveButtonProps`, *shape morphing* e variante Jumbo.
- [x] **T004** Implementar `ExpressiveTextField` em `src/view/components/expressiveTextField.tsx` com `type ExpressiveTextFieldProps`, suporte a foco, contador e erro semântico.
- [x] **T005** Implementar `GameCard` em `src/view/components/gameCard.tsx` com `type GameCardProps`, emblema de jogo e suporte a pódio líder.
- [x] **T006** Implementar `ExpressiveTimer` em `src/view/components/expressiveTimer.tsx` com `type ExpressiveTimerProps` e modo crítico nos últimos 10s.
- [x] **T007** Implementar `QuizOption` em `src/view/components/quizOption.tsx` com `type QuizOptionProps` e dupla confirmação visual (cor + ícone + forma).
- [x] **T008** Implementar `LetterKey` em `src/view/components/letterKey.tsx` com `type LetterKeyProps`, alvo 48x48dp e estados available, hit e miss.

---

## Fase 4: Mocks e Testes Unitários com Jest (`tests/`)

- [x] **T009** Configurar mocks em `tests/__mocks__/react-native.tsx` e `tests/__mocks__/expo-vector-icons.tsx`, atualizando `jest.config.js`.
- [x] **T010** Implementar testes de tokens em `tests/tokens.test.ts`.
- [x] **T011** Implementar testes dos 6 componentes em `tests/components.test.tsx`.

---

## Fase 5: Verificação e Governança Git

- [x] **T012** Executar `npm run check` (`check-arquitetura.mjs` + `tsc --noEmit` + `jest`) e garantir **0 violações**.
- [x] **T013** Realizar commit convencional no padrão `<tipo>(<escopo>): <descrição>` referenciando `Closes #8`.
