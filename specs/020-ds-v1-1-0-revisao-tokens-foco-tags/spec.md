# 📋 Especificação de Funcionalidade (`spec.md`): PG Play Expressive v1.1.0 — Foco, Bordas por Estado, Tags e Contraste

- **Branch da Feature:** `feat/ds-v1-1-0-revisao-tokens-foco-tags`
- **Criado em:** 2026-11-21
- **Status:** Aprovado
- **Caso(s) de Uso / Requisito(s):** Design System (`RNF04`, `RNF06`, `RNF07`, `RNF08`) — Ref.: `design-system/02-tokens.md`, `design-system/04-componentes/*.md` e `design-system/06-acessibilidade.md`
- **Issue vinculada:** `#55` (Relacionadas: `#50`, `#51`, `#53`, `#54`)

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Foco exclusivamente para teclado/switch sem borda vermelha ao tocar (Prioridade: P1)

Como participante ou líder do PG usando toque no celular ou clique do mouse na Web, quero tocar em botões, chips e opções sem que uma borda vermelha/coral fique presa no elemento; e, como usuário de teclado externo ou *Switch Access*, quero ver um anel de foco de altíssimo contraste sobre qualquer fundo.

**Por que esta prioridade:** Atualmente o toque/clique dispara `onFocus`, exibindo uma borda coral (`#C2410C`) que se confunde visualmente com erro (`#B91C1C`, distância 1,25:1) e possui apenas 1,73:1 de contraste sobre o roxo primário (`#5B21B6`).

**Como testar independentemente:** Renderizar `ExpressiveButton`, `ExpressiveChip`, `SelectableOptionItem`, `GameCard`, `QuizOption`, `LetterKey` e `ConfirmModal` em testes automatizados, simulando toque/clique (`onPressIn` → `onFocus`) versus navegação por teclado (`onFocus` sem ponteiro / `:focus-visible`).

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** qualquer botão, chip ou opção interativa, **Quando** o usuário toca ou clica com mouse/dedo, **Então** o anel de foco **não** aparece e nenhuma borda vermelha/coral é exibida.
2. **Dado** qualquer componente interativo do sistema, **Quando** o usuário navega até ele via teclado (`Tab`/setas) ou *Switch Access*, **Então** é exibido o **anel duplo M3** (`color.focus` = `onSurface` com espaçamento `surface`, contraste `16,30:1` no claro e `14,35:1` no escuro).

---

### História de Usuário 2 — Bordas por estado via tokens de componente e Contraste WCAG 1.4.11 ≥ 3:1 (Prioridade: P1)

Como desenvolvedor e usuário com baixa visão, quero que todas as bordas de cards, campos, chips, opções e banners venham de tokens de componente com contraste mínimo de `3:1` no claro e no escuro, e que elementos desabilitados no tema escuro permaneçam legíveis.

**Por que esta prioridade:** Os contornos atuais (`outline` `#CAC4D0` = 1,63:1 claro; `#49454F` = 1,99:1 escuro; `highlight` `#FACC15` = 1,46:1 claro) e `disabledText` no escuro (`1,54:1`) violam a legibilidade mínima (WCAG 1.4.11) e há mais de 35 `borderColor` semânticos escritos manualmente nas telas.

**Como testar independentemente:** Validar os valores e razões de contraste WCAG 2.1 em `tests/tokens.test.ts` e inspecionar que nenhuma tela usa `color.success`, `color.error`, `color.secondary` ou `color.focus` diretamente em `borderColor`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** o tema claro ou escuro ativo, **Quando** qualquer controle com borda (`ExpressiveChip`, `SelectableOptionItem`, `ExpressiveTextField`, `GameCard`, `QuizOption`, `LetterKey`, banners de estado) é renderizado, **Então** a cor da borda vem exclusivamente de tokens de componente (`component.chip.border.*`, `component.option.border.*`, `component.card.border*`, `component.banner.border.*`) com contraste `>= 3:1` contra a superfície.
2. **Dado** o tema escuro ativo, **Quando** um botão ou opção está desabilitado, **Então** o texto usa `disabledText` escuro (`#938F99`) com contraste `4,53:1` sobre `disabledBg` (`#2B2930`).

---

### História de Usuário 3 — Componente `ExpressiveTag`, novas variantes de `ExpressiveButton` e `ConfirmModal` de 1 botão (Prioridade: P1)

Como líder do PG lendo o celular à distância (`RNF04`), quero que todas as tags e badges (no `GameCard` e nas telas de jogos) tenham visual unificado, contraste nítido e tipografia legível (`14 dp`), e que existam variantes `text`/`icon` de botão (`#51`) e modal de 1 botão (`#54`).

**Por que esta prioridade:** Existem 22 estilos locais de badges/tags inconsistentes no app e o `GameCard` usa tag de `12 dp` com fundo `1,15:1` sobre o card branco; além disso, controles de filtro no Hub (`index.tsx`) e botões de remover em Equipes/Lobbies ainda usam `<Pressable>` manuais.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** qualquer tag/badge nas telas ou no `GameCard`, **Quando** renderizada com `ExpressiveTag`, **Então** ela aceita os tons `neutral`, `action`, `secondary`, `success`, `error` e `highlight`, usa `font.tag` (`14 dp`, peso `700`) e apresenta borda/contraste `>= 3:1`.
2. **Dado** um `ExpressiveButton` com `variant="text"` ou `variant="icon"`, **Quando** renderizado, **Então** mantém alvo mínimo de `48 dp × 48 dp` (`RNF07`), foco exclusivo de teclado e rótulo acessível (`accessibilityLabel`).
3. **Dado** um `ConfirmModal` sem `onCancel`/`cancelLabel`, **Quando** visível, **Então** renderiza apenas o botão de confirmação com anúncio acessível (`accessibilityLiveRegion="polite"`).

---

### História de Usuário 4 — Tema escuro real (`useColorScheme`), fontes consistentes e zero duplicatas em `theme.ts` (Prioridade: P2)

Como usuário com tema escuro ativado no sistema operacional (ou jogando em Android/iOS/Web), quero que todas as telas acompanhem automaticamente o tema do aparelho (preservando o modo noturno forçado na fase Noite do Cidade Dorme), com pesos de fonte reais de `Plus Jakarta Sans` em todo o app e sem tokens duplicados.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** o sistema operacional em modo escuro (`useColorScheme() === 'dark'`), **Quando** o app abre em qualquer tela, **Então** `useTheme()` fornece os tokens escuros automaticamente, sem importação manual de `darkTokens`.
2. **Dado** a fase Noite do Cidade Dorme em um aparelho no modo claro, **Quando** a fase noturna inicia, **Então** o `ThemeProvider` local força `mode="dark"` preservando a imersão do jogo.
3. **Dado** `src/view/theme.ts`, **Quando** inspecionado, **Então** não existem aliases duplicados (`xxl`/`xxxl`, `jumboHeight`, `bgNormal`, `optionBg`, `hitBg`, etc.) e cada token de tipografia aponta diretamente para a família/peso exato de `Plus Jakarta Sans` carregada em `_layout.tsx`.

---

### Casos de Borda (Edge Cases)

- **Navegação híbrida (mouse + teclado na Web):** alternar entre clique do mouse e `Tab` do teclado deve esconder o anel no clique e exibi-lo imediatamente no `Tab`.
- **Dynamic Type / Font Scale (`RNF08`):** `ExpressiveTag` com textos longos (ex.: `"1 Celular · 2+ equipes"`) deve manter `allowFontScaling` sem estourar o card.
- **Override local de tema:** `ThemeProvider` aninhado (ex.: fase Noite do Cidade Dorme) deve sobrepor apenas a subárvore sem alterar o tema global do app.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos de Design System e Acessibilidade
- **`DS-01` (Foco `:focus-visible`)**: Anel duplo M3 (`color.focus` = `onSurface` + `color.focusOffset` = `surface`) exibido exclusivamente em foco de teclado/switch via `useKeyboardFocus`.
- **`DS-02` (Contraste WCAG 1.4.11 ≥ 3:1)**: `outline` claro `#79747E` (`neutral-500`), `outline` escuro `#938F99` (`neutral-400`), `highlightBorder` claro `#A16207` (`gold-700`) / escuro `#FACC15` (`gold-400`), `disabledText` escuro `#938F99` (`neutral-400`), preenchimento do termômetro com `color.action`.
- **`DS-03` (Bordas por Estado)**: Tokens `component.chip`, `component.option`, `component.tag`, `component.card` e `component.banner` substituindo `borderColor` diretos com cores semânticas nas telas.
- **`DS-04` (`ExpressiveTag`)**: Novo componente com 6 tons (`neutral`, `action`, `secondary`, `success`, `error`, `highlight`), ícone opcional e tipografia `font.tag` (`14 dp`, peso `700`).
- **`DS-05` (Variantes e Migração)**: `ExpressiveButton` com variantes `text` e `icon`; `ConfirmModal` com suporte a 1 botão; migração dos filtros de `index.tsx` para `ExpressiveChip`, botões de remover em `teams.tsx`/Lobbies para `ExpressiveButton variant="icon"`, e opções de `versiculo.tsx` para `component.option`.
- **`DS-06` (Limpeza de Tokens, Tema Dinâmico e Fontes)**: Remoção de todos os 17 aliases duplicados em `theme.ts`; `ThemeProvider` + `useTheme()` conectados ao `useColorScheme()`; `Plus Jakarta Sans` mapeada por peso exato em todas as escalas tipográficas (`display`, `title`, `subtitle`, `body`, `label`, `tag`, `caption`).
- **`DS-07` (Documentação v1.1.0)**: Atualização de `design-system/02-tokens.md`, `03-fundamentos.md`, `06-acessibilidade.md`, `README.md`, `CHANGELOG.md` (`1.1.0`), `04-componentes/botao.md`, `card-de-jogo.md` e criação de `chip.md`, `tag.md`, `modal-confirmacao.md` e `item-selecionavel.md`.

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01`**: Clicar ou tocar em qualquer botão, chip ou opção **não** exibe anel de foco nem borda vermelha/coral; o anel aparece somente por teclado/switch.
- **`CS-02`**: Nenhuma tela ou seção define `borderColor` diretamente com `color.success`, `color.error`, `color.secondary` ou `color.focus`; todos usam tokens de componente.
- **`CS-03`**: Todas as tags e badges textuais (incluindo `GameCard`) usam `ExpressiveTag`.
- **`CS-04`**: Todos os pares de bordas e preenchimentos de componentes atingem contraste `>= 3:1`, documentados na nova tabela de `design-system/06-acessibilidade.md`.
- **`CS-05`**: Zero tokens duplicados em `src/view/theme.ts` e zero cores literais fora de `src/view/theme.ts`.
- **`CS-06`**: `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest`) passa com **0 erros e 0 violações**.
