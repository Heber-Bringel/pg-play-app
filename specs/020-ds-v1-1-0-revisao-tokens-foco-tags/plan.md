# 🏗️ Plano de Implementação Técnica (`plan.md`): PG Play Expressive v1.1.0

- **Branch:** `feat/ds-v1-1-0-revisao-tokens-foco-tags`
- **Data:** 2026-11-21
- **Especificação de Origem:** `specs/020-ds-v1-1-0-revisao-tokens-foco-tags/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

Evoluir o sistema de design **PG Play Expressive** da versão `1.0.0` para `1.1.0` atuando exclusivamente na camada de documentação (`design-system/`), tema e componentes visuais (`src/view/theme.ts`, `src/view/components/`), telas espelhadas (`src/view/*.tsx`), layout raiz (`src/app/_layout.tsx`) e testes (`tests/`), sem alterar regras de negócio (`model`, `infra`, `usecase`, `di`, `viewmodel`). A solução introduz detecção de foco exclusivo de teclado (`useKeyboardFocus`), anel duplo M3, tokens de contraste WCAG 1.4.11 (`>= 3:1`), `ThemeProvider`/`useTheme()` conectados ao `useColorScheme()`, mapeamento de pesos explícitos de `Plus Jakarta Sans`, o componente `ExpressiveTag` e variantes `text`/`icon` de botão e modal de 1 botão.

---

## 2. Verificação Constitucional (*Constitution Check*)

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e alinhada à Issue `#55` e às relacionadas `#50`, `#51`, `#53`, `#54`.
- [x] **Artigo II (MVVM 7 Pastas)**: Todos os arquivos permanecem estritamente nas camadas existentes (`src/view/`, `src/app/_layout.tsx`, `design-system/`, `tests/`). Nenhuma nova pasta dentro de `src/`.
- [x] **Artigo II (Rotas Finas e View Burra)**: Nenhuma rota fina em `src/app/` é alterada; `src/app/_layout.tsx` importa apenas de `expo-router` e `@/view/theme`; `src/view/` não importa `expo-router`, `usecase`, `infra` ou `di`.
- [x] **Artigo II (Vocabulário)**: Nenhum termo proibido (`Repository` / `Connector`).
- [x] **Artigo III (Design System)**: `primitive` permanece privado em `src/view/theme.ts`; zero cores literais fora de `src/view/theme.ts`; alvos mínimos `>= 48 dp` e independência de cor preservados.
- [x] **Artigo IV (Tipagem e Verificação)**: Imports exclusivamente com `@/`, sem `any`/`React.FC`/`function Componente()`, validação final via `npm run check`.

---

## 3. Mapeamento de Arquivos por Camada

```text
design-system/
├─ README.md                             # Atualizar versão 1.1.0 e inventário de 10 componentes
├─ CHANGELOG.md                          # Registrar release 1.1.0
├─ 02-tokens.md                          # Atualizar outline, focus, disabledText, highlightBorder, font.tag, Plus Jakarta Sans por peso, tokens de chip/option/tag/banner/card e remover duplicatas
├─ 03-fundamentos.md                     # Atualizar regras de tipografia (Plus Jakarta Sans única + font.tag) e bordas por estado
├─ 06-acessibilidade.md                  # Adicionar tabela WCAG 1.4.11 de componentes (>= 3:1) e atualizar seção de Foco Visível (:focus-visible + anel duplo)
└─ 04-componentes/
   ├─ botao.md                           # Documentar variantes text e icon + foco :focus-visible
   ├─ card-de-jogo.md                    # Documentar ExpressiveTag e card.border.leader
   ├─ chip.md                            # Novo: documentação oficial do ExpressiveChip
   ├─ tag.md                             # Novo: documentação oficial do ExpressiveTag
   ├─ modal-confirmacao.md               # Novo: documentação oficial do ConfirmModal (1 e 2 botões)
   └─ item-selecionavel.md               # Novo: documentação oficial do SelectableOptionItem

src/
├─ app/
│  └─ _layout.tsx                        # Envolver app com ThemeProvider, StatusBar e background reativos, remover Roboto do CSS web
└─ view/
   ├─ theme.ts                           # Tokens v1.1.0 sem duplicatas, Plus Jakarta Sans por peso, ThemeProvider + useTheme() (useColorScheme + override), novos tokens component.chip/option/tag/banner/card
   ├─ components/
   │  ├─ useKeyboardFocus.ts             # Hook reutilizável de foco exclusivo para teclado/switch (:focus-visible)
   │  ├─ expressiveTag.tsx               # Novo componente de tag/badge (6 tons, font.tag 14dp, borda >= 3:1)
   │  ├─ expressiveButton.tsx            # Foco só teclado + anel duplo + variantes text e icon + useTheme()
   │  ├─ expressiveChip.tsx              # Foco só teclado + anel duplo + tokens component.chip + useTheme()
   │  ├─ selectableOptionItem.tsx        # Foco só teclado + anel duplo + tokens component.option + useTheme()
   │  ├─ confirmModal.tsx                # Suporte a 1 botão (onCancel opcional) + accessibilityLiveRegion + useTheme()
   │  ├─ gameCard.tsx                    # Usar ExpressiveTag, card.border.leader, foco só teclado + useTheme()
   │  ├─ expressiveTextField.tsx         # Atualizar tokens sem duplicatas + useTheme()
   │  ├─ expressiveTimer.tsx             # Migrar para timer.bg.*/text.*/radius.* + useTheme()
   │  ├─ quizOption.tsx                  # Migrar para quiz.option.* + foco só teclado + useTheme()
   │  ├─ letterKey.tsx                   # Migrar para key.hit.bg/key.miss.bg + foco só teclado + useTheme()
   │  ├─ adedonhaEntrySection.tsx        # ExpressiveTag + component.banner/card borders + useTheme()
   │  ├─ adedonhaFillingSection.tsx      # component.banner/card borders + space['3xl'] + useTheme()
   │  ├─ adedonhaLobbySection.tsx        # ExpressiveButton variant="icon" + component.option/card borders + useTheme()
   │  ├─ adedonhaSummarySection.tsx      # useTheme() + tokens limpos
   │  ├─ adedonhaTallySection.tsx        # ExpressiveTag + component.banner/card borders + useTheme()
   │  ├─ cidadeDormeEntrySection.tsx     # ExpressiveTag + component.banner/card borders + useTheme()
   │  ├─ cidadeDormeLobbySection.tsx     # ExpressiveButton variant="icon" + useTheme()
   │  ├─ cidadeDormeRoleSection.tsx      # ExpressiveTag + component.banner/card borders + useTheme()
   │  ├─ cidadeDormeDaySection.tsx       # ExpressiveTag + component.banner/card borders + useTheme()
   │  └─ cidadeDormeNightSection.tsx     # ExpressiveTag + component.banner/card borders + useTheme() (sem darkTokens manual)
   ├─ index.tsx                          # ExpressiveChip nos filtros + ExpressiveTag em countPill + useTheme()
   ├─ teams.tsx                          # ExpressiveButton variant="icon" no remover + ExpressiveTag no contador + useTheme()
   ├─ mimica.tsx                         # ExpressiveTag em roundBadge/categoryTag + useTheme()
   ├─ quiz.tsx                           # ExpressiveTag em badgePill/teamBadgePill + useTheme()
   ├─ forca.tsx                          # ExpressiveTag em teamBadge/attemptsBadge + space['2xl'] + useTheme()
   ├─ scoreboard.tsx                     # useTheme() + tokens limpos
   ├─ adedonha.tsx                       # ExpressiveTag em roomBadge + component.banner.border.error + useTheme()
   ├─ cidade-dorme.tsx                   # ThemeProvider mode="dark" na fase Noite + ExpressiveTag + component.banner + useTheme()
   └─ versiculo.tsx                      # ExpressiveTag + component.option/banner borders + foco só teclado + useTheme()

tests/
├─ tokens.test.ts                        # Atualizar para tokens v1.1.0, ausência de duplicatas e validação de contraste WCAG 1.4.11 (>= 3:1)
├─ components.test.tsx                   # Atualizar para tokens sem duplicatas, foco teclado vs toque, variantes text/icon, ConfirmModal 1 botão
├─ components/
│  ├─ selectableOptionItem.test.tsx      # Atualizar para component.option + foco teclado vs toque + tema escuro
│  ├─ expressiveTag.test.tsx             # Novo: todos os 6 tons, ícone opcional, tipografia 14dp e acessibilidade
│  └─ themeProvider.test.tsx             # Novo: resolução automática via useColorScheme e override local (modo Noite)
└─ mocks/                                # Ajustar asserções impactadas pela migração de tags/chips/icon buttons se necessário
```

---

## 4. Inventário de Tokens Novos e Revisados (`PG Play Expressive v1.1.0`)

| Token (`@/view/theme`) | Claro | Escuro | Contraste WCAG 2.1 |
| :--- | :--- | :--- | :--- |
| `color.outline` | `#79747E` (`neutral-500`) | `#938F99` (`neutral-400`) | **4,35:1** / **5,87:1** sobre `surface` |
| `color.highlightBorder` | `#A16207` (`gold-700`) | `#FACC15` (`gold-400`) | **4,70:1** / **12,14:1** sobre `surface` |
| `color.disabledText` | `#49454F` (`neutral-600`) | `#938F99` (`neutral-400`) | **5,20:1** / **4,53:1** sobre `disabledBg` |
| `color.focus` | `#1D1B20` (`neutral-900`) | `#E6E0E9` (`neutral-200`) | **16,30:1** / **14,35:1** sobre `surface` (anel duplo) |
| `color.focusOffset` | `#FDF8FF` (`neutral-50`) | `#141218` (`neutral-950`) | Separa o anel de foco de qualquer botão colorido |
| `font.tag` | `PlusJakartaSans_700Bold`, `14 dp`, `lh 18` | Igual | Legível à distância (`RNF04`) |
| `component.chip.border.*` | `default`, `selected`, `focus`, `disabled`, `error`, `success`, `secondary` | Automático | `>= 3:1` em todos os estados |
| `component.option.border.*` | `default`, `selected`, `focus`, `disabled`, `error`, `success` | Automático | `>= 3:1` em todos os estados |
| `component.tag.*` | 6 tons (`neutral`, `action`, `secondary`, `success`, `error`, `highlight`) com `bg`, `border`, `text` | Automático | Texto `>= 4,5:1` e borda `>= 3:1` |
| `component.banner.*` | `info`, `success`, `warning`, `error` com `bg`, `border`, `text` | Automático | Texto `>= 4,5:1` e borda `>= 3:1` |
| `component.card.border` / `borderLeader` / `borderPressed` | `outline` / `highlightBorder` / `action` | Automático | `>= 4,35:1` |

---

## 5. Estratégia de Testes (`tests/`)

- **Tokens & Contraste (`tests/tokens.test.ts`)**: validar que todos os tokens v1.1.0 existem, que nenhum alias duplicado permanece, e testar matematicamente via fórmula WCAG 2.1 que `outline`, `highlightBorder`, `disabledText` (escuro), `focus` e pares de `tag` atingem os mínimos (`>= 3:1` componentes / `>= 4,5:1` textos).
- **Foco teclado vs toque (`tests/components.test.tsx`, `tests/components/selectableOptionItem.test.tsx`)**: simular `onPressIn` → `onFocus` (não ativa anel) vs `onFocus` sem ponteiro (ativa anel duplo com `color.focus`).
- **Novos componentes e variantes (`tests/components/expressiveTag.test.tsx`, `tests/components.test.tsx`)**: cobrir 6 tons de `ExpressiveTag`, `ExpressiveButton` `text` e `icon`, e `ConfirmModal` com 1 e 2 botões.
- **Tema dinâmico (`tests/components/themeProvider.test.tsx`)**: testar `useTheme()` com `useColorScheme` (`light`/`dark`) e override explícito `<ThemeProvider mode="dark">`.
