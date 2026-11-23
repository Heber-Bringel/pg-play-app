# Fundamentos

Este documento define as regras obrigatórias de aplicação dos tokens de [02-tokens.md](02-tokens.md) na versão **1.1.0**. Todas as regras são verificáveis e devem ser seguidas por desenvolvedores e assistentes de IA.

---

## Cor e Bordas por Estado

- Use `color.action` exclusivamente para a ação principal da tela (no máximo um botão primário por tela) e para o preenchimento tranquilo da variante termômetro do cronômetro. (**Herdado** · Material 3 Color Roles)
- Use `color.secondary` para ações secundárias de jogo (como *"Pular palavra"*). (**Adaptado** · Material 3 Secondary Role)
- Use `color.highlight` para preenchimento de medalhas e cronômetro normal; para **bordas** de destaque/líder no modo claro, use obrigatoriamente `card.borderLeader` (`color.highlight-border` = `#A16207`, contraste `4,70:1`). (**Novo** · v1.1.0 WCAG 1.4.11)
- **Bordas por estado sempre via token de componente:** telas nunca devem definir `borderColor` diretamente com `color.success`, `color.error`, `color.secondary` ou `color.focus`; utilize `component.chip.border.*`, `component.option.border.*`, `component.card.border*`, `component.tag.*` ou `component.banner.*`. (**Adaptado** · v1.1.0 Governança de Estados)
- Combine sempre `color.success` e `color.error` com um ícone explícito (`check-circle`, `close-circle` ou `alert`) e mudança de forma ou estilo de texto; nunca use cor como única forma de comunicar acerto, erro ou fim de tempo. (**Herdado** · WCAG 1.4.1)
- Aplique `color.surface` no fundo geral da tela e `color.surface-container` dentro de cards e campos de texto. (**Herdado** · Material 3 Surface Tones)

---

## Tipografia

- Toda a hierarquia tipográfica utiliza **Plus Jakarta Sans** com famílias mapeadas por peso explícito (`PlusJakartaSans_400Regular`, `PlusJakartaSans_700Bold`, `PlusJakartaSans_800ExtraBold`), garantindo consistência entre Android, iOS e Web. (**Adaptado** · v1.1.0)
- Use `font.display` (`30 dp`, ExtraBold) exclusivamente para a palavra secreta em destaque na Mímica e elementos hero de jogo.
- Use `font.title` (`24 dp`, ExtraBold) para o título principal no topo de cada tela e para os dígitos do cronômetro.
- Use `font.subtitle` (`18 dp`, Bold) para títulos de cards e enunciados de perguntas.
- Use `font.body` (`16 dp`, Regular) para descrições de regras, textos corridos e conteúdo digitado em campos de texto.
- Use `font.label` (`16 dp`, Bold) para rótulos de botões, alternativas de Quiz e teclas da Forca.
- Use `font.tag` (`14 dp`, Bold, altura de linha `18 dp`) para todas as tags/badges (`ExpressiveTag`) e chips (`ExpressiveChip`), garantindo legibilidade à distância (`RNF04`). (**Novo** · v1.1.0)
- Use `font.caption` (`12 dp`, Bold) apenas para contadores de caracteres e mensagens auxiliares curtas de formulário.
- Não desative o escalonamento de fonte do sistema operacional (`allowFontScaling={true}` é obrigatório em todos os componentes `<Text>`, com `maxFontSizeMultiplier={1.5}` em botões, chips, tags e cronômetro).

---

## Espaçamento

- Defina todas as margens, alturas, larguras de alvo e espaçamentos em múltiplos de `8 dp` (ou `4 dp` apenas para ajustes finos internos via `space.xs`).
- Utilize exclusivamente as chaves canônicas `space.xs`, `space.sm`, `space.md`, `space.lg`, `space.xl`, `space['2xl']`, `space.container` e `space['3xl']` (sem aliases duplicados).
- Aplique `space.md` (`16 dp`) como margem lateral padrão em todas as telas do aplicativo.
- Aplique `space.lg` (`24 dp`) como espaçamento interno (`card.padding`) nos cards principais de jogo e como separação entre grupos distintos de conteúdo.
- Garanta distância mínima de `space.sm` (`8 dp`) entre elementos tocáveis adjacentes.

---

## Ícones

- Utilize exclusivamente `@expo/vector-icons/MaterialCommunityIcons` com estilo consistente: `icon.sm` (`16 dp`) em tags/chips/alertas, `icon.md` (`24 dp`) em botões/inputs/cronômetro e `icon.lg` (`28 dp`) em emblemas de cards.
- Botões somente com ícone utilizam obrigatoriamente `ExpressiveButton` na variante `icon` (`48 dp × 48 dp` mínimos) com `accessibilityLabel` descritivo.

---

## Elevação

- Combine `elevation.card` (`4 dp`) com borda de `2 dp` em `card.border` (`color.outline`, contraste ≥ 4,35:1) em todos os cards de minigame.
- Use `elevation.none` (`0 dp`) para botões desabilitados, `text`/`icon`, chips, tags e campos de texto em repouso.
- Use `elevation.floating` (`12 dp`) apenas para diálogos (`ConfirmModal`) e destaques flutuantes.

---

## Movimento

- Anime mudanças de forma (*shape morphing*) e escala usando `motion.spring.spatial` (`damping: 14, stiffness: 280`) com duração `motion.duration.short` (`150 ms`).
- Anime mudanças de cor e opacidade usando `motion.spring.effects` (`damping: 22, stiffness: 300`) com duração `motion.duration.medium` (`300 ms`).
- Consulte `AccessibilityInfo.isReduceMotionEnabled()`: quando ativado, execute trocas de estado instantaneamente (`0 ms`).
