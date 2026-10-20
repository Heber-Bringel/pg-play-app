# Fundamentos

Este documento define as regras obrigatórias de aplicação dos tokens de [02-tokens.md](02-tokens.md). Todas as regras são verificáveis e devem ser seguidas por desenvolvedores e assistentes de IA.

---

## Cor

- Use `color.action` exclusivamente para a ação principal da tela (no máximo um botão primário por tela). (**Herdado** · Material 3 Color Roles)
- Use `color.secondary` para ações secundárias de jogo (como *"Pular palavra"*) ou filtros ativos na tela inicial. (**Adaptado** · Material 3 Secondary Role para hierarquia de minigames)
- Use `color.highlight` apenas para o placar da equipe líder, medalhas de pódio e o estado normal do [Cronômetro Expressivo](04-componentes/cronometro-expressivo.md). (**Novo** · Identidade lúdica PG PLAY)
- Combine sempre `color.success` e `color.error` com um ícone explícito (`check_circle`, `cancel` ou `warning`) e mudança de forma ou estilo de texto; nunca use cor como única forma de comunicar acerto, erro ou fim de tempo. (**Herdado** · WCAG 1.4.1 e Material 3 Accessibility)
- Aplique `color.surface` no fundo geral da tela e `color.surface-container` dentro de cards e campos de texto para criar separação visual sem depender apenas de sombras. (**Herdado** · Material 3 Surface Tones)

---

## Tipografia

- Use `font.display` (`30 dp`, peso `800`) exclusivamente para a palavra secreta em destaque na Mímica e a pontuação campeã no Placar. (**Adaptado** · Material 3 Expressive Emphasized Display)
- Use `font.title` (`24 dp`, peso `800`) para o título principal no topo de cada tela e para os dígitos do cronômetro. (**Adaptado** · Material 3 Expressive Emphasized Headline)
- Use `font.subtitle` (`18 dp`, peso `700`) para títulos de [Card de Minigame](04-componentes/card-de-jogo.md) e enunciados de perguntas do Quiz. (**Adaptado** · Material 3 Title Scale)
- Use `font.body` (`16 dp`, peso `400`) para descrições de regras, textos corridos e conteúdo digitado em campos de texto. (**Herdado** · Material 3 Body Large)
- Use `font.label` (`16 dp`, peso `700`) para rótulos de botões, alternativas de Quiz e letras do teclado da Forca. (**Adaptado** · Material 3 Expressive Emphasized Label)
- Não desative o escalonamento de fonte do sistema operacional (`allowFontScaling={true}` é obrigatório em todos os componentes `<Text>` do React Native, com `maxFontSizeMultiplier={1.5}` em botões e barras fixas para evitar truncamento). (**Herdado** · Material 3 Accessibility Typography)

---

## Espaçamento

- Defina todas as margens, alturas, larguras de alvo e espaçamentos em múltiplos de `8 dp` (ou `4 dp` apenas para ajustes finos internos via `space.xs`). (**Herdado** · Grade de 8 pontos do Material Design)
- Aplique `space.md` (`16 dp`) como margem lateral padrão em todas as telas do aplicativo. (**Herdado** · Material 3 Compact Window Layout Margin)
- Aplique `space.lg` (`24 dp`) como espaçamento interno (`card.padding`) nos cards principais de jogo e como separação entre grupos distintos de conteúdo. (**Herdado** · Material 3 Card Layout)
- Garanta distância mínima de `space.sm` (`8 dp`) entre elementos tocáveis adjacentes (como teclas da Forca, alternativas de Quiz ou botões empilhados) para evitar toques acidentais na correria da rodada. (**Adaptado** · Prevenção de erro motor em jogos rápidos)

---

## Ícones

- Utilize exclusivamente a família **Material Symbols Rounded** (ou o pacote equivalente `@expo/vector-icons/MaterialCommunityIcons` no React Native com estilo arredondado), com preenchimento ativo (`FILL = 1`) e peso `600`. (**Herdado** · Material 3 Iconography)
- Use tamanho padrão de `24 dp` para ícones dentro de botões, campos de texto e barras de navegação, e `28 dp` para ícones dentro dos emblemas geométricos dos cards de minigame. (**Herdado** · Material 3 Icon Sizes)
- Acompanhe todo ícone funcional com um rótulo de texto visível; caso um botão secundário contenha apenas ícone (como o botão de remover equipe), defina obrigatoriamente `accessibilityLabel` descritivo e área mínima de `48 dp × 48 dp`. (**Herdado** · Material 3 Accessibility Icons)

---

## Elevação

- Combine `elevation.card` (`4 dp`) com borda de `2 dp` em `color.outline` em todos os cards de minigame para garantir limites visíveis tanto no modo claro quanto no modo escuro. (**Adaptado** · Material 3 Outlined + Elevated Card)
- Use `elevation.none` (`0 dp`) para botões desabilitados, chips de categoria e campos de texto em repouso. (**Herdado** · Material 3 Elevation)
- Use `elevation.floating` (`12 dp`) apenas para diálogos de confirmação de saída da partida ou celebração de vitória. (**Herdado** · Material 3 Modal Elevation)

---

## Movimento

- Anime mudanças de forma (*shape morphing*) e escala em elementos interativos usando a mola espacial `motion.spring.spatial` (`damping: 14, stiffness: 280`) com duração base `motion.duration.short` (`150 ms`). (**Herdado** · Material 3 Expressive Spatial Spring)
- Anime mudanças de cor de fundo, cor de borda e opacidade usando a mola de efeitos `motion.spring.effects` (`damping: 22, stiffness: 300`, sem *overshoot*) com duração `motion.duration.medium` (`300 ms`). (**Herdado** · Material 3 Expressive Effects Spring)
- Transforme o raio de borda de botões interativos de `button.radius` (`9999 dp`) para `button.radius.pressed` (`16 dp`) enquanto o usuário mantém o dedo pressionado (`onPressIn`). (**Adaptado** · Material 3 Expressive Shape Morphing aplicado aos controles de jogo)
- Consulte `AccessibilityInfo.isReduceMotionEnabled()` no React Native: quando o usuário ativar *"Reduzir movimento"* no sistema operacional, desative animações de escala/pulsação e execute trocas de estado instantaneamente (`0 ms`). (**Herdado** · WCAG 2.3.3 e Material 3 Motion Accessibility)
