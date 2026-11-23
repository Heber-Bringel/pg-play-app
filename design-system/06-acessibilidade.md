# Acessibilidade

A acessibilidade no **PG Play Expressive (v1.1.0)** é um requisito estrutural embutido nos tokens e nos componentes, garantindo que jovens e adultos — incluindo pessoas com baixa visão, daltonismo ou restrições motoras — participem das dinâmicas do Pequeno Grupo em igualdade de condições.

---

## 1. Contraste de Texto sobre Fundo (WCAG 2.1 — Critério 1.4.3, ≥ 4,5:1)

A razão de contraste foi calculada pela fórmula oficial da WCAG 2.1:

$$\text{Razão} = \frac{L_1 + 0{,}05}{L_2 + 0{,}05}$$

| Par (texto sobre fundo) | Modo | Cores (Hex) | Razão calculada | Mínimo WCAG | Resultado |
| --- | --- | --- | --- | --- | --- |
| `color.on-action` sobre `color.action` | Claro | `#FFFFFF` sobre `#5B21B6` | **8,98:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-action` sobre `color.action` | Escuro | `#2E1065` sobre `#D8B4FE` | **8,62:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-action-container` sobre `color.action-container` | Claro | `#2E1065` sobre `#EDE9FE` | **12,83:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-action-container` sobre `color.action-container` | Escuro | `#EDE9FE` sobre `#3B0764` | **11,80:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-secondary` sobre `color.secondary` | Claro | `#FFFFFF` sobre `#C2410C` | **5,18:1** | 4,5:1 | ✅ Aprovado (AA) |
| `color.on-secondary` sobre `color.secondary` | Escuro | `#431407` sobre `#FDBA74` | **9,41:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-secondary-container` sobre `color.secondary-container` | Claro | `#431407` sobre `#FFEDD5` | **13,66:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-secondary-container` sobre `color.secondary-container` | Escuro | `#FFEDD5` sobre `#9A3412` | **6,38:1** | 4,5:1 | ✅ Aprovado (AA) |
| `color.on-highlight` sobre `color.highlight` | Claro/Escuro | `#1D1B20` sobre `#FACC15` | **11,30:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-highlight-container` sobre `color.highlight-container` | Claro | `#1D1B20` sobre `#FEF9C3` | **15,90:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-highlight-container` sobre `color.highlight-container` | Escuro | `#FEF9C3` sobre `#422006` | **13,57:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-surface` sobre `color.surface` | Claro | `#1D1B20` sobre `#FDF8FF` | **16,30:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-surface` sobre `color.surface` | Escuro | `#E6E0E9` sobre `#141218` | **14,35:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-surface` sobre `color.surface-container` | Claro | `#1D1B20` sobre `#FFFFFF` | **17,10:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-surface` sobre `color.surface-container` | Escuro | `#E6E0E9` sobre `#1D1B20` | **12,85:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-surface` sobre `color.surface-variant` (`ExpressiveTag` neutral) | Claro | `#1D1B20` sobre `#F3EDF7` | **14,85:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-surface` sobre `color.surface-variant` (`ExpressiveTag` neutral) | Escuro | `#E6E0E9` sobre `#2B2930` | **11,08:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-surface-muted` sobre `color.surface-container` | Claro | `#49454F` sobre `#FFFFFF` | **8,89:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-surface-muted` sobre `color.surface-container` | Escuro | `#CAC4D0` sobre `#1D1B20` | **9,72:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-success` sobre `color.success` | Claro | `#FFFFFF` sobre `#15803D` | **5,02:1** | 4,5:1 | ✅ Aprovado (AA) |
| `color.on-success` sobre `color.success` | Escuro | `#052E16` sobre `#86EFAC` | **11,15:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-success-container` sobre `color.success-container` | Claro/Escuro | `#052E16` / `#DCFCE7` | **13,57:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-error` sobre `color.error` | Claro | `#FFFFFF` sobre `#B91C1C` | **6,47:1** | 4,5:1 | ✅ Aprovado (AA) |
| `color.on-error` sobre `color.error` | Escuro | `#450A0A` sobre `#FCA5A5` | **8,90:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-error-container` sobre `color.error-container` | Claro | `#450A0A` sobre `#FEE2E2` | **13,22:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-error-container` sobre `color.error-container` | Escuro | `#FCA5A5` sobre `#450A0A` | **8,51:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.disabled-text` sobre `color.disabled-bg` | Claro | `#49454F` sobre `#E6E0E9` | **7,21:1** | 4,5:1* | ✅ Aprovado (AAA) |
| `color.disabled-text` sobre `color.disabled-bg` | Escuro | `#938F99` sobre `#2B2930` | **4,53:1** | 4,5:1* | ✅ Aprovado (AA) |

*\* Controles desabilitados são isentos pela WCAG 1.4.3, mas o PG Play Expressive v1.1.0 adota `>= 4,5:1` em ambos os temas para garantir leitura clara em ambientes com pouca luz.*

---

## 2. Contraste de Componentes Não Textuais (WCAG 2.1 — Critério 1.4.11, ≥ 3,0:1)

Adicionada na **v1.1.0** para auditar contornos, bordas de estado, anéis de foco e preenchimentos de componentes:

| Componente / Borda / Preenchimento | Modo | Cores (Hex) | Razão calculada | Mínimo WCAG | Resultado |
| --- | --- | --- | --- | --- | --- |
| `color.outline` sobre `color.surface` (cards, inputs, chips) | Claro | `#79747E` sobre `#FDF8FF` | **4,35:1** | 3,0:1 | ✅ Aprovado |
| `color.outline` sobre `color.surface-container` | Claro | `#79747E` sobre `#FFFFFF` | **4,55:1** | 3,0:1 | ✅ Aprovado |
| `color.outline` sobre `color.surface-variant` | Claro | `#79747E` sobre `#F3EDF7` | **3,96:1** | 3,0:1 | ✅ Aprovado |
| `color.outline` sobre `color.surface` | Escuro | `#938F99` sobre `#141218` | **5,87:1** | 3,0:1 | ✅ Aprovado |
| `color.outline` sobre `color.surface-container` | Escuro | `#938F99` sobre `#1D1B20` | **5,39:1** | 3,0:1 | ✅ Aprovado |
| `color.outline` sobre `color.surface-variant` | Escuro | `#938F99` sobre `#2B2930` | **4,53:1** | 3,0:1 | ✅ Aprovado |
| `card.borderLeader` (`highlight-border`) sobre `surface` / `surface-container` | Claro | `#A16207` sobre `#FDF8FF` / `#FFFFFF` | **4,70:1** / **4,92:1** | 3,0:1 | ✅ Aprovado |
| `card.borderLeader` (`highlight-border`) sobre `surface` / `surface-container` | Escuro | `#FACC15` sobre `#141218` / `#1D1B20` | **12,14:1** / **11,15:1** | 3,0:1 | ✅ Aprovado |
| `color.focus` (anel duplo externo) sobre `color.focus-offset` (`surface`) | Claro | `#1D1B20` sobre `#FDF8FF` | **16,30:1** | 3,0:1 | ✅ Aprovado |
| `color.focus` (anel duplo externo) sobre `color.focus-offset` (`surface`) | Escuro | `#E6E0E9` sobre `#141218` | **14,35:1** | 3,0:1 | ✅ Aprovado |
| `tag.neutral.border` sobre `surface-container` | Claro / Escuro | `#79747E` / `#938F99` | **4,55:1** / **5,39:1** | 3,0:1 | ✅ Aprovado |
| `tag.action.border` sobre `surface-container` | Claro / Escuro | `#5B21B6` / `#D8B4FE` | **8,98:1** / **9,66:1** | 3,0:1 | ✅ Aprovado |
| `tag.secondary.border` sobre `surface-container` | Claro / Escuro | `#C2410C` / `#FDBA74` | **5,18:1** / **10,12:1** | 3,0:1 | ✅ Aprovado |
| `tag.success.border` sobre `surface-container` | Claro / Escuro | `#15803D` / `#86EFAC` | **5,02:1** / **12,16:1** | 3,0:1 | ✅ Aprovado |
| `tag.error.border` sobre `surface-container` | Claro / Escuro | `#B91C1C` / `#FCA5A5` | **6,47:1** / **9,00:1** | 3,0:1 | ✅ Aprovado |
| `tag.highlight.border` sobre `surface-container` | Claro / Escuro | `#A16207` / `#FACC15` | **4,92:1** / **11,15:1** | 3,0:1 | ✅ Aprovado |
| `timer.bg.calm` (`color.action`) sobre `surface-variant` (termômetro) | Claro / Escuro | `#5B21B6` / `#D8B4FE` | **7,81:1** / **8,12:1** | 3,0:1 | ✅ Aprovado |

---

## 3. Alvos de toque

Todo elemento interativo possui no mínimo **`48 dp × 48 dp`**, com espaçamento mínimo de `8 dp` (`space.sm`) entre alvos vizinhos:

| Componente | Dimensão mínima garantida | Token responsável |
| --- | --- | --- |
| [Botão](04-componentes/botao.md) (`primary`, `tonal`, `secondary`, `outlined`, `text`) | `48 dp` de altura × largura mínima `96 dp` | `button.minHeight` (`space.2xl`) |
| [Botão](04-componentes/botao.md) (`icon`) | `48 dp × 48 dp` | `button.iconSize` (`space.2xl`) |
| [Botão](04-componentes/botao.md) (`primaryJumbo`, `successJumbo`) | `64 dp` de altura × `100%` da largura útil | `button.jumbo.height` (`space.3xl`) |
| [Chip](04-componentes/chip.md) (`ExpressiveChip`) | `48 dp` de altura × largura mínima `64 dp` | `space.2xl`, `space.3xl` |
| [Campo de Texto](04-componentes/campo-de-texto.md) | `56 dp` de altura × `100%` da largura útil | `input.minHeight` (`space.container`) |
| [Card de Minigame](04-componentes/card-de-jogo.md) | `120 dp` de altura mínima × `100%` da largura útil | `card.padding` (`space.lg`) |
| [Cronômetro Expressivo](04-componentes/cronometro-expressivo.md) | `48 dp` de altura | `space.2xl` |
| [Alternativa de Quiz](04-componentes/alternativa-quiz.md) / [Item Selecionável](04-componentes/item-selecionavel.md) | `56 dp` de altura × `100%` da largura útil | `option.minHeight` (`space.container`) |
| [Teclado da Forca](04-componentes/teclado-forca.md) | `48 dp × 48 dp` para cada tecla de letra | `key.size` (`space.2xl`) |

---

## 4. Foco visível exclusivo para teclado e *Switch Access* (`:focus-visible`)

- **Nunca no clique ou toque:** o anel de foco **não** aparece ao tocar na tela ou clicar com mouse. O hook `useKeyboardFocus` distingue interação por ponteiro/toque de navegação por teclado (`Tab`, setas) ou *Switch Access*.
- **Anel duplo M3 de alto contraste:** quando o foco de teclado está ativo, o componente exibe um contorno externo de `3 dp` (`border.focus`) em `color.focus` (`#1D1B20` no claro e `#E6E0E9` no escuro) com deslocamento externo (`outlineOffset`) sobre `color.focus-offset` (`surface`). Isso garante contraste `>= 14,35:1` sobre qualquer botão colorido (inclusive `action`, `success` e `secondary`) e elimina qualquer confusão visual com `color.error`.
- **Ordem de foco lógica:** segue estritamente de cima para baixo e da esquerda para a direita.

---

## 5. Leitor de tela (TalkBack e VoiceOver)

- **Independência de cor (WCAG 1.4.1):** nenhum estado é transmitido apenas por cor — combina sempre cor, forma e ícone/estilo tipográfico.
- **Rótulos semânticos:**
  - `ExpressiveButton` na variante `icon` exige obrigatoriamente `accessibilityLabel` descritivo e `accessibilityRole="button"`.
  - `ConfirmModal` anuncia sua abertura/conteúdo com `accessibilityViewIsModal` e `accessibilityLiveRegion="polite"` (especialmente no modal informativo de 1 botão).
  - `ExpressiveTag` é puramente informativa (não clicável, sem `accessibilityRole="button"`).
  - `ExpressiveTimer` ativa `accessibilityLiveRegion="assertive"` nos últimos `10 segundos`.

---

## 6. Texto ampliado e redução de movimento

- **Texto ampliado (Dynamic Type):** todos os `<Text>` mantêm `allowFontScaling={true}`; controles compactos (`ExpressiveButton`, `ExpressiveChip`, `ExpressiveTag`, `ExpressiveTimer`) aplicam `maxFontSizeMultiplier={1.5}` (`typography.maxScale`).
- **Redução de movimento (`prefers-reduced-motion`):** desativa pulsações e aplica transições instantâneas (`0 ms`) quando o sistema ativa redução de movimento.
