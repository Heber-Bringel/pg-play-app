# ✅ Lista de Tarefas (`tasks.md`): PG Play Expressive v1.1.0

- **Input:** `specs/020-ds-v1-1-0-revisao-tokens-foco-tags/spec.md` e `specs/020-ds-v1-1-0-revisao-tokens-foco-tags/plan.md`
- **Issue vinculada:** `#55`
- **Receitas do Harness:** `/sincronizar-tema`, `/revisar-arquitetura`, `/commit-e-pr`

---

## Fase 1: Documentação do Sistema de Design (`design-system/` v1.1.0)
*Objetivo: Atualizar a fonte de verdade antes de sincronizar o código.*

- [x] **T001** Atualizar `design-system/02-tokens.md` com os novos tokens de contraste (`outline`, `highlightBorder`, `disabledText` escuro, `focus` / `focusOffset`), `font.tag` (`14 dp`), `Plus Jakarta Sans` mapeada por peso, tokens de componente (`chip`, `option`, `tag`, `banner`, `card`) e JSON W3C atualizado.
- [x] **T002** Atualizar `design-system/03-fundamentos.md` (tipografia unificada em `Plus Jakarta Sans`, bordas por estado via tokens de componente).
- [x] **T003** Atualizar `design-system/06-acessibilidade.md` com a nova tabela de **Contraste de Componentes (WCAG 1.4.11 ≥ 3:1)** e a especificação de **Foco Visível (`:focus-visible` + anel duplo M3)**.
- [x] **T004** Atualizar `design-system/04-componentes/botao.md` (variantes `text` e `icon`, foco teclado) e `card-de-jogo.md` (`ExpressiveTag` e `card.borderLeader`); criar `chip.md`, `tag.md`, `modal-confirmacao.md` e `item-selecionavel.md`.
- [x] **T005** Atualizar `design-system/README.md` (versão `1.1.0` e mapa completo dos 10 componentes) e registrar a versão `1.1.0` em `design-system/CHANGELOG.md`.

---

## Fase 2: Núcleo de Tema, Fontes e Foco (`src/view/theme.ts`, `src/app/_layout.tsx` e hook de foco)
*Objetivo: Sincronizar todos os tokens v1.1.0 sem duplicatas, ativar tema escuro real e preparar o hook de foco por teclado.*

- [x] **T006** Refatorar `src/view/theme.ts`: aplicar novos valores de contraste, remover os 17 aliases duplicados (`xxl`/`xxxl`, `jumboHeight`, `timer.*Normal/Critical`, `quiz.optionBg*`, `key.hitBg/missBg`), mapear `font.*.family` por peso exato de `Plus Jakarta Sans`, adicionar `font.tag`, `component.chip`, `component.option`, `component.tag`, `component.banner`, `component.card.borderLeader`, e exportar `ThemeProvider` + `useTheme()` com `useColorScheme()`.
- [x] **T007** Atualizar `src/app/_layout.tsx` para envolver a aplicação com `ThemeProvider`, ajustar `StatusBar` e `contentStyle` conforme o tema ativo e remover referência à `Roboto` no `<Head>` web.
- [x] **T008** Criar `src/view/components/useKeyboardFocus.ts` para distinguir foco por teclado/switch de toque/clique (`:focus-visible` no Web e supressão de foco durante `onPressIn`/`onPressOut` no nativo).

---

## Fase 3: Componentes do Design System (`src/view/components/`)
*Objetivo: Implementar `ExpressiveTag`, novas variantes de botão/modal, foco só teclado, bordas por token e tema dinâmico em todos os componentes base.*

- [x] **T009** Criar `src/view/components/expressiveTag.tsx` com tons `neutral | action | secondary | success | error | highlight`, ícone opcional, `font.tag` (`14 dp`) e contraste `>= 3:1`.
- [x] **T010** Atualizar `src/view/components/expressiveButton.tsx`: foco só teclado + anel duplo M3, novas variantes `text` e `icon` (com alvo `>= 48 dp`), remoção de `jumboHeight` e adoção de `useTheme()`.
- [x] **T011** Atualizar `src/view/components/expressiveChip.tsx` e `src/view/components/selectableOptionItem.tsx`: foco só teclado + anel duplo M3, tokens `component.chip` e `component.option`, e `useTheme()`.
- [x] **T012** Atualizar `src/view/components/confirmModal.tsx`: suporte a 1 botão (`onCancel`/`cancelLabel` opcionais), `accessibilityLiveRegion="polite"`, e `useTheme()`.
- [x] **T013** Atualizar `src/view/components/gameCard.tsx`, `expressiveTextField.tsx`, `expressiveTimer.tsx`, `quizOption.tsx` e `letterKey.tsx`: `ExpressiveTag` no `GameCard`, `card.borderLeader`, foco só teclado, remoção de aliases duplicados e `useTheme()`.

---

## Fase 4: Migração das Telas e Seções (`src/view/`)
*Objetivo: Eliminar `borderColor` diretos com cores semânticas, substituir os 22 estilos de tags soltos por `ExpressiveTag`, migrar controles manuais e habilitar tema escuro real em todas as telas.*

- [x] **T014** Migrar telas de 1 celular: `src/view/index.tsx` (`ExpressiveChip` nos filtros + `ExpressiveTag`), `src/view/teams.tsx` (`ExpressiveButton variant="icon"` no remover + `ExpressiveTag`), `src/view/mimica.tsx`, `src/view/quiz.tsx`, `src/view/forca.tsx`, `src/view/scoreboard.tsx` e `src/view/versiculo.tsx` (`ExpressiveTag` + `component.option`/`component.banner` + `useTheme()`).
- [x] **T015** Migrar telas e seções de Adedonha (`src/view/adedonha.tsx` e `src/view/components/adedonha*Section.tsx`): `ExpressiveTag`, `ExpressiveButton variant="icon"`, `component.banner`/`component.card` e `useTheme()`.
- [x] **T016** Migrar tela e seções de Cidade Dorme (`src/view/cidade-dorme.tsx` e `src/view/components/cidadeDorme*Section.tsx`): substituir `darkTokens` manual por `<ThemeProvider mode="dark">` na fase Noite + `useTheme()`, `ExpressiveTag`, `ExpressiveButton variant="icon"` e tokens de borda por estado.

---

## Fase 5: Testes e Verificação Completa (`tests/` e `npm run check`)
*Objetivo: Cobrir todos os critérios de aceite com testes automatizados e 0 violações.*

- [x] **T017** Atualizar `tests/tokens.test.ts` (sem duplicatas + auditoria automática WCAG 2.1 `>= 3:1` de componentes e `>= 4,5:1` de textos) e criar `tests/components/themeProvider.test.tsx`.
- [x] **T018** Criar `tests/components/expressiveTag.test.tsx` e atualizar `tests/components.test.tsx`, `tests/components/selectableOptionItem.test.tsx` e eventuais `tests/mocks/*.test.tsx` (foco por teclado vs clique/toque, variantes `text`/`icon`, `ConfirmModal` de 1 botão e bordas por estado).
- [x] **T019** Executar `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest`) e confirmar **0 erros e 0 violações**; conferir que não restam `borderColor` diretos com `color.success`/`color.error`/`color.secondary`/`color.focus` nem tags soltas nas telas.
- [x] **T020** Realizar commits convencionais por camada e abrir Pull Request vinculando `Closes #55`, milestone `v0.1.0` e labels oficiais.
