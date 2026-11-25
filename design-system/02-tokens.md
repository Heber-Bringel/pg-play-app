# Tokens

Os tokens do **PG Play Expressive (v1.3.0)** organizam todas as decisões visuais em três níveis: **Primitivo** (o valor bruto), **Semântico** (o propósito no tema claro e escuro) e **Componente** (onde o token é aplicado). Os componentes de código em React Native nunca referenciam valores literais ou tokens primitivos diretamente — apenas tokens semânticos e de componente, consumidos via `useTheme()` de `@/view/theme`.

---

## 1. Primitivos (o valor bruto)

### Cor

| Token | Valor | Origem |
| --- | --- | --- |
| `purple-50` | `#F5F3FF` | Adaptado (Paleta Tonal Primary M3 Expressive para marca PG PLAY) |
| `purple-100` | `#EDE9FE` | Adaptado (Paleta Tonal Primary M3 Expressive) |
| `purple-200` | `#DDD6FE` | Adaptado (Paleta Tonal Primary M3 Expressive) |
| `purple-300` | `#D8B4FE` | Adaptado (Paleta Tonal Primary M3 Expressive - Ação no Escuro) |
| `purple-600` | `#5B21B6` | Adaptado (Paleta Tonal Primary M3 Expressive - Ação no Claro) |
| `purple-700` | `#4C1D95` | Adaptado (Paleta Tonal Primary M3 Expressive - Hover) |
| `purple-800` | `#3B0764` | Adaptado (Paleta Tonal Primary M3 Expressive - Pressionado) |
| `purple-950` | `#2E1065` | Adaptado (Paleta Tonal Primary M3 Expressive - Contraste Escuro) |
| `coral-100` | `#FFEDD5` | Adaptado (Paleta Tonal Secondary M3 Expressive) |
| `coral-300` | `#FDBA74` | Adaptado (Paleta Tonal Secondary M3 Expressive - Escuro) |
| `coral-700` | `#C2410C` | Adaptado (Paleta Tonal Secondary M3 Expressive - Claro) |
| `coral-800` | `#9A3412` | Adaptado (Paleta Tonal Secondary M3 Expressive - Container Escuro) |
| `coral-950` | `#431407` | Adaptado (Paleta Tonal Secondary M3 Expressive - Contraste Escuro) |
| `gold-100` | `#FEF9C3` | Novo (Container Claro de Destaque e Tags de Pódio) |
| `gold-400` | `#FACC15` | Novo (Amarelo Ouro para Pódio, Cronômetro Normal e Borda Líder no Escuro) |
| `gold-700` | `#A16207` | Novo (Borda de Destaque/Líder no Claro com contraste ≥ 4,70:1 — WCAG 1.4.11) |
| `gold-950` | `#422006` | Novo (Container Escuro de Destaque) |
| `green-100` | `#DCFCE7` | Adaptado (Feedback de Acerto em Minigames - Container Claro) |
| `green-300` | `#86EFAC` | Adaptado (Feedback de Acerto em Minigames - Escuro) |
| `green-700` | `#15803D` | Adaptado (Feedback de Acerto em Minigames - Claro) |
| `green-950` | `#052E16` | Adaptado (Feedback de Acerto em Minigames - Contraste Escuro) |
| `red-100` | `#FEE2E2` | Herdado (M3 Error Tonal Palette - Container Claro) |
| `red-300` | `#FCA5A5` | Herdado (M3 Error Tonal Palette - Erro no Escuro) |
| `red-700` | `#B91C1C` | Herdado (M3 Error Tonal Palette - Erro no Claro) |
| `red-950` | `#450A0A` | Herdado (M3 Error Tonal Palette - Contraste Escuro) |
| `neutral-0` | `#FFFFFF` | Herdado (M3 Neutral Palette 100) |
| `neutral-50` | `#FDF8FF` | Herdado (M3 Surface Bright / Neutral Tinted 98) |
| `neutral-100` | `#F3EDF7` | Herdado (M3 Surface Container Low 96) |
| `neutral-200` | `#E6E0E9` | Herdado (M3 Surface Variant / On-Surface Dark 90) |
| `neutral-300` | `#CAC4D0` | Herdado (M3 Outline Variant Light 80 / On-Surface Muted Dark) |
| `neutral-400` | `#938F99` | Herdado (M3 Outline Dark 60 / Disabled Content Dark — ≥ 4,53:1) |
| `neutral-500` | `#79747E` | Herdado (M3 Outline Light 50 — ≥ 4,35:1 sobre superfícies claras) |
| `neutral-600` | `#49454F` | Herdado (M3 On-Surface Variant Light 30) |
| `neutral-800` | `#2B2930` | Herdado (M3 Surface Variant Dark 17) |
| `neutral-900` | `#1D1B20` | Herdado (M3 On-Surface Light / Surface Container Dark 10) |
| `neutral-950` | `#141218` | Herdado (M3 Surface Dark 6) |

### Espaço (grade de 8 pontos: múltiplos de 8, ou de 4 para ajustes finos)

| Token | Valor | Origem |
| --- | --- | --- |
| `space-4` | `4 dp` | Herdado (Material 3 Spatial Grid - ajuste fino) |
| `space-8` | `8 dp` | Herdado (Material 3 Spatial Grid - unidade base 1x) |
| `space-12` | `12 dp` | Herdado (Material 3 Spatial Grid - ajuste intermediário 1.5x) |
| `space-16` | `16 dp` | Herdado (Material 3 Spatial Grid - unidade 2x) |
| `space-24` | `24 dp` | Herdado (Material 3 Spatial Grid - unidade 3x) |
| `space-32` | `32 dp` | Herdado (Material 3 Spatial Grid - unidade 4x) |
| `space-48` | `48 dp` | Herdado (Material 3 Minimum Touch Target - unidade 6x) |
| `space-56` | `56 dp` | Herdado (Material 3 Container Height - unidade 7x) |
| `space-64` | `64 dp` | Adaptado (Altura Jumbo para botões de jogo rápido - unidade 8x) |

---

## 2. Semânticos (o significado)

### Cor

| Token | Claro | Escuro | Uso | Origem |
| --- | --- | --- | --- | --- |
| `color.action` | `purple-600` (`#5B21B6`) | `purple-300` (`#D8B4FE`) | Ação principal da tela e preenchimento tranquilo do termômetro | Adaptado (M3 `md.sys.color.primary`) |
| `color.action-hover` | `purple-700` (`#4C1D95`) | `purple-200` (`#DDD6FE`) | Estado hover de ação principal | Adaptado (M3 Primary Hover State) |
| `color.action-pressed` | `purple-800` (`#3B0764`) | `purple-100` (`#EDE9FE`) | Estado pressionado de ação principal | Adaptado (M3 Primary Pressed State) |
| `color.on-action` | `neutral-0` (`#FFFFFF`) | `purple-950` (`#2E1065`) | Texto e ícone sobre `color.action` | Herdado (M3 `md.sys.color.on-primary`) |
| `color.action-container` | `purple-100` (`#EDE9FE`) | `purple-800` (`#3B0764`) | Fundo de botões tonais, chips selecionados e tags de ação | Herdado (M3 `md.sys.color.primary-container`) |
| `color.on-action-container` | `purple-950` (`#2E1065`) | `purple-100` (`#EDE9FE`) | Texto e ícone sobre `color.action-container` | Herdado (M3 `md.sys.color.on-primary-container`) |
| `color.secondary` | `coral-700` (`#C2410C`) | `coral-300` (`#FDBA74`) | Ações secundárias (ex.: Pular palavra) | Adaptado (M3 `md.sys.color.secondary`) |
| `color.on-secondary` | `neutral-0` (`#FFFFFF`) | `coral-950` (`#431407`) | Texto e ícone sobre `color.secondary` | Herdado (M3 `md.sys.color.on-secondary`) |
| `color.secondary-container` | `coral-100` (`#FFEDD5`) | `coral-800` (`#9A3412`) | Emblemas e tags de destaque secundário | Herdado (M3 `md.sys.color.secondary-container`) |
| `color.on-secondary-container` | `coral-950` (`#431407`) | `coral-100` (`#FFEDD5`) | Texto sobre `color.secondary-container` | Herdado (M3 `md.sys.color.on-secondary-container`) |
| `color.highlight` | `gold-400` (`#FACC15`) | `gold-400` (`#FACC15`) | Preenchimento de medalha de pódio e cronômetro normal | Novo (Destaque lúdico de pontuação do PG PLAY) |
| `color.on-highlight` | `neutral-900` (`#1D1B20`) | `neutral-900` (`#1D1B20`) | Texto e ícone sobre `color.highlight` | Novo (Garante contraste 11,30:1 sobre Amarelo Ouro) |
| `color.highlight-container` | `gold-100` (`#FEF9C3`) | `gold-950` (`#422006`) | Fundo de tags e avisos em destaque dourado | Novo (v1.1.0 — suporte a `ExpressiveTag` highlight) |
| `color.on-highlight-container` | `neutral-900` (`#1D1B20`) | `gold-100` (`#FEF9C3`) | Texto sobre `color.highlight-container` | Novo (v1.1.0 — 15,90:1 claro / 13,57:1 escuro) |
| `color.highlight-border` | `gold-700` (`#A16207`) | `gold-400` (`#FACC15`) | Contorno do card líder e tags `highlight` | Novo (v1.1.0 — corrige contraste 1,46:1 → 4,70:1 no claro) |
| `color.surface` | `neutral-50` (`#FDF8FF`) | `neutral-950` (`#141218`) | Fundo geral das telas | Herdado (M3 `md.sys.color.surface`) |
| `color.surface-container` | `neutral-0` (`#FFFFFF`) | `neutral-900` (`#1D1B20`) | Fundo de cards, barras e campos de texto | Herdado (M3 `md.sys.color.surface-container`) |
| `color.surface-variant` | `neutral-100` (`#F3EDF7`) | `neutral-800` (`#2B2930`) | Fundo de tags neutras, trilhos e áreas secundárias | Herdado (M3 `md.sys.color.surface-variant`) |
| `color.on-surface` | `neutral-900` (`#1D1B20`) | `neutral-200` (`#E6E0E9`) | Texto principal sobre `color.surface` e cards | Herdado (M3 `md.sys.color.on-surface`) |
| `color.on-surface-muted` | `neutral-600` (`#49454F`) | `neutral-300` (`#CAC4D0`) | Subtítulos, textos de apoio e ícones secundários | Herdado (M3 `md.sys.color.on-surface-variant`) |
| `color.outline` | `neutral-500` (`#79747E`) | `neutral-400` (`#938F99`) | Contornos de cards, campos, chips e divisores (WCAG 1.4.11 ≥ 4,35:1) | Herdado (M3 `md.sys.color.outline` — revisado na v1.1.0) |
| `color.success` | `green-700` (`#15803D`) | `green-300` (`#86EFAC`) | Confirmação de acerto em Mímica, Quiz e Forca | Novo (Feedback semântico positivo de jogo) |
| `color.on-success` | `neutral-0` (`#FFFFFF`) | `green-950` (`#052E16`) | Texto e ícone sobre `color.success` | Novo (Contraste sobre feedback de acerto) |
| `color.success-container` | `green-100` (`#DCFCE7`) | `green-950` (`#052E16`) | Fundo de tags e banners de sucesso | Novo (v1.1.0 — suporte a `ExpressiveTag` e banners) |
| `color.on-success-container` | `green-950` (`#052E16`) | `green-100` (`#DCFCE7`) | Texto sobre `color.success-container` | Novo (v1.1.0 — 13,57:1 em ambos os temas) |
| `color.error` | `red-700` (`#B91C1C`) | `red-300` (`#FCA5A5`) | Erros de formulário, resposta errada e timer crítico | Herdado (M3 `md.sys.color.error`) |
| `color.on-error` | `neutral-0` (`#FFFFFF`) | `red-950` (`#450A0A`) | Texto e ícone sobre `color.error` | Herdado (M3 `md.sys.color.on-error`) |
| `color.error-container` | `red-100` (`#FEE2E2`) | `red-950` (`#450A0A`) | Fundo de campos com erro, alertas e letras erradas | Herdado (M3 `md.sys.color.error-container`) |
| `color.on-error-container` | `red-950` (`#450A0A`) | `red-300` (`#FCA5A5`) | Texto sobre `color.error-container` | Herdado (M3 `md.sys.color.on-error-container`) |
| `color.focus` | `neutral-900` (`#1D1B20`) | `neutral-200` (`#E6E0E9`) | Anel externo de foco exclusivo para teclado/switch (`:focus-visible`) | Adaptado (v1.1.0 — anel duplo M3, ≥ 14,35:1, sem confusão com erro) |
| `color.focus-offset` | `neutral-50` (`#FDF8FF`) | `neutral-950` (`#141218`) | Intervalo entre o componente e o anel de foco externo | Adaptado (v1.1.0 — anel duplo M3) |
| `color.disabled-bg` | `neutral-200` (`#E6E0E9`) | `neutral-800` (`#2B2930`) | Fundo de elementos desabilitados | Herdado (M3 Disabled Container) |
| `color.disabled-text` | `neutral-600` (`#49454F`) | `neutral-400` (`#938F99`) | Texto e ícone de elementos desabilitados (≥ 4,53:1 no escuro) | Adaptado (v1.1.0 — corrige legibilidade no escuro) |
| `color.canvas-paper` | `neutral-50` (`#FDF8FF`) | `neutral-50` (`#FDF8FF`) | Superfície de papel clara fixa na Tela de Desenho (`UC12`) | Novo (v1.2.0 — mantém contraste constante nos dois temas) |
| `color.canvas-ink` | `neutral-900` (`#1D1B20`) | `neutral-900` (`#1D1B20`) | Caneta Grafite sobre `color.canvas-paper` (16,42:1) | Novo (v1.2.0 — traço principal `DrawingCanvas`) |
| `color.canvas-purple` | `purple-600` (`#5B21B6`) | `purple-600` (`#5B21B6`) | Caneta Roxo sobre `color.canvas-paper` (8,84:1) | Novo (v1.2.0 — traço expressivo `DrawingCanvas`) |
| `color.canvas-coral` | `coral-700` (`#C2410C`) | `coral-700` (`#C2410C`) | Caneta Coral sobre `color.canvas-paper` (4,90:1) | Novo (v1.2.0 — traço expressivo `DrawingCanvas`) |
| `color.canvas-green` | `green-700` (`#15803D`) | `green-700` (`#15803D`) | Caneta Verde sobre `color.canvas-paper` (4,88:1) | Novo (v1.2.0 — traço expressivo `DrawingCanvas`) |

### Tipografia

Todas as escalas utilizam a família **Plus Jakarta Sans** mapeada por peso explícito para garantir renderização fiel no Android, iOS e Web (eliminando dependência da `Roboto` não empacotada no nativo).

| Token | Família (peso explícito) | Tamanho | Peso | Altura de linha | Uso | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| `font.display` | `PlusJakartaSans_800ExtraBold` | `30 dp` | `800` (ExtraBold) | `36 dp` | Palavra secreta da Mímica e placar destaque | Adaptado (M3 Expressive Emphasized Display Small) |
| `font.title` | `PlusJakartaSans_800ExtraBold` | `24 dp` | `800` (ExtraBold) | `32 dp` | Títulos principais de tela e cronômetro | Adaptado (M3 Expressive Emphasized Headline Small) |
| `font.subtitle` | `PlusJakartaSans_700Bold` | `18 dp` | `700` (Bold) | `24 dp` | Títulos de cards de minigame e perguntas de Quiz | Adaptado (M3 Expressive Emphasized Title Medium) |
| `font.body` | `PlusJakartaSans_400Regular` | `16 dp` | `400` (Regular) | `24 dp` | Texto corrido, descrições de regras e inputs | Adaptado (v1.1.0 — unificação tipográfica em Plus Jakarta Sans) |
| `font.label` | `PlusJakartaSans_700Bold` | `16 dp` | `700` (Bold) | `20 dp` | Rótulos de botões, alternativas e teclas da Forca | Adaptado (M3 Expressive Emphasized Label Large) |
| `font.tag` | `PlusJakartaSans_700Bold` | `14 dp` | `700` (Bold) | `18 dp` | Tags, badges (`ExpressiveTag`) e rótulos de chips (`ExpressiveChip`) | Novo (v1.1.0 — garante leitura à distância conforme RNF04) |
| `font.caption` | `PlusJakartaSans_700Bold` | `12 dp` | `700` (Bold) | `16 dp` | Contadores de caracteres e mensagens auxiliares de formulário | Adaptado (M3 `md.sys.typescale.label-medium`) |

### Espaço, forma e elevação

| Token | Valor | Uso | Origem |
| --- | --- | --- | --- |
| `space.xs` | `space-4` (`4 dp`) | Distância entre ícone e texto auxiliar / offset de foco | Herdado (Grade de 8 pontos - ajuste fino) |
| `space.sm` | `space-8` (`8 dp`) | Espaço entre elementos relacionados (ex.: teclas e opções) | Herdado (Grade de 8 pontos - 1x) |
| `space.md` | `space-16` (`16 dp`) | Margem lateral padrão das telas e padding de campos | Herdado (Grade de 8 pontos - 2x) |
| `space.lg` | `space-24` (`24 dp`) | Padding interno dos cards de minigame e separação de blocos | Herdado (Grade de 8 pontos - 3x) |
| `space.xl` | `space-32` (`32 dp`) | Separação entre grandes seções de tela | Herdado (Grade de 8 pontos - 4x) |
| `space.2xl` | `space-48` (`48 dp`) | Alvo de toque mínimo padrão de botões e teclas | Herdado (M3 Minimum Touch Target `48 dp`) |
| `space.container` | `space-56` (`56 dp`) | Altura mínima de campos de texto, opções e emblemas | Herdado (M3 Container Height `56 dp`) |
| `space.3xl` | `space-64` (`64 dp`) | Altura de botões Jumbo em dinâmicas rápidas | Adaptado (M3 Expressive Large Touch Target) |
| `radius.sm` | `8 dp` | Lacunas de letras e opções pressionadas | Herdado (M3 `md.sys.shape.corner.small`) |
| `radius.md` | `16 dp` | Campos de texto, teclas da forca e botões pressionados | Herdado (M3 `md.sys.shape.corner.medium`) |
| `radius.lg` | `20 dp` | Alternativas de Quiz e banners de pontuação | Herdado (M3 Expressive `corner.large` = `20 dp`) |
| `radius.xl` | `28 dp` | Cards de minigame e containers principais | Herdado (M3 `md.sys.shape.corner.extra-large` = `28 dp`) |
| `radius.full` | `9999 dp` | Botões em repouso (pílula), chips, tags e cronômetro normal | Herdado (M3 Expressive `corner.full`) |
| `border.thin` | `2 dp` | Espessura padrão de borda de cards, inputs, chips, tags e teclas | Adaptado (Reforço de contorno para alto contraste) |
| `border.focus` | `3 dp` | Espessura do anel externo de foco visível | Herdado (M3 Focus Ring Thickness) |
| `icon.sm` | `16 dp` | Ícones em tags, chips, mensagens auxiliares e alertas de campo | Herdado (M3 Small Icon) |
| `icon.md` | `24 dp` | Ícones padrão dentro de botões, inputs e cronômetro | Herdado (M3 Standard Icon `24 dp`) |
| `icon.lg` | `28 dp` | Ícones destacados dentro de emblemas de cards de jogo | Adaptado (M3 Expressive Feature Icon) |
| `typography.maxScale` | `1.5` | Multiplicador máximo de fonte em botões, tags e cronômetro | Adaptado (Prevenção de truncamento com Dynamic Type) |
| `elevation.none` | `0 dp` | Elementos planos e estados desabilitados | Herdado (M3 Elevation Level 0) |
| `elevation.card` | `4 dp` | Cards de minigame e cronômetro | Adaptado (M3 Elevation Level 2) |
| `elevation.floating` | `12 dp` | Modais e destaques flutuantes | Adaptado (M3 Elevation Level 4) |

### Movimento

| Token | Valor | Uso | Origem |
| --- | --- | --- | --- |
| `motion.duration.short` | `150 ms` | Feedback imediato de toque e *shape morphing* de botão | Herdado (M3 `short3` duration) |
| `motion.duration.medium` | `300 ms` | Transições entre estados de card, cronômetro e telas | Herdado (M3 `medium2` duration) |
| `motion.duration.long` | `600 ms` | Ciclo de pulsação do cronômetro nos 10s finais | Novo (Ritmo de alerta de fim de tempo) |
| `motion.spring.spatial` | `damping: 14, stiffness: 280` | Transformação de forma, escala de toque e pódio | Herdado (M3 Expressive Spatial Spring) |
| `motion.spring.effects` | `damping: 22, stiffness: 300` | Transições suaves de cor, borda e opacidade | Herdado (M3 Expressive Effects Spring) |

---

## 3. Tokens de componente (onde é usado — sem duplicatas)

| Token | Aponta para | Origem |
| --- | --- | --- |
| `button.bg` | `color.action` | Herdado (M3 Filled Button Container) |
| `button.label` | `color.on-action` | Herdado (M3 Filled Button Label) |
| `button.bgHover` | `color.action-hover` | Herdado (M3 Filled Button Hover) |
| `button.bgPressed` | `color.action-pressed` | Herdado (M3 Filled Button Pressed) |
| `button.bgDisabled` | `color.disabled-bg` | Herdado (M3 Filled Button Disabled) |
| `button.labelDisabled` | `color.disabled-text` | Herdado (M3 Filled Button Disabled Label) |
| `button.border.outlined` | `color.outline` | Herdado (M3 Outlined Button Border) |
| `button.border.focus` | `color.focus` | Adaptado (v1.1.0 — anel duplo só teclado) |
| `button.radius` | `radius.full` | Herdado (M3 Pill Button Shape) |
| `button.radiusPressed` | `radius.md` | Adaptado (M3 Expressive Shape Morphing) |
| `button.minHeight` | `space.2xl` (`48 dp`) | Herdado (M3 Touch Target) |
| `button.iconSize` | `space.2xl` (`48 dp`) | Novo (v1.1.0 — variante `icon` #51) |
| `button.jumbo.height` | `space.3xl` (`64 dp`) | Adaptado (M3 Expressive Jumbo Button) |
| `input.bg` | `color.surface-container` | Herdado (M3 Text Field Container) |
| `input.text` | `color.on-surface` | Herdado (M3 Text Field Input Text) |
| `input.border` | `color.outline` | Herdado (M3 Outlined Text Field Outline) |
| `input.borderFocus` | `color.action` | Herdado (M3 Focused Outline) |
| `input.borderError` | `color.error` | Herdado (M3 Error Outline) |
| `input.bgError` | `color.error-container` | Adaptado (Reforço visual de erro) |
| `input.radius` | `radius.md` | Adaptado (Cantos suavizados `16 dp`) |
| `input.minHeight` | `space.container` (`56 dp`) | Herdado (M3 Text Field Height `56 dp`) |
| `card.bg` | `color.surface-container` | Herdado (M3 Card Container) |
| `card.border` | `color.outline` | Herdado (M3 Outlined Card Border) |
| `card.borderLeader` | `color.highlight-border` | Novo (v1.1.0 — contraste ≥ 4,70:1 para líder) |
| `card.borderPressed` | `color.action` | Adaptado (Feedback de toque em card) |
| `card.borderFocus` | `color.focus` | Novo (v1.1.0 — foco teclado) |
| `card.radius` | `radius.xl` (`28 dp`) | Adaptado (M3 Expressive Extra Large Shape) |
| `card.padding` | `space.lg` (`24 dp`) | Herdado (M3 Card Internal Padding) |
| `card.badgeSize` | `space.container` (`56 dp`) | Adaptado (Emblema geométrico) |
| `chip.border.default` | `color.outline` | Novo (v1.1.0 — borda padrão do chip) |
| `chip.border.selected` | `color.action` | Novo (v1.1.0 — borda do chip selecionado) |
| `chip.border.focus` | `color.focus` | Novo (v1.1.0 — anel externo de foco teclado) |
| `chip.border.disabled` | `color.outline` | Novo (v1.1.0 — borda desabilitada) |
| `chip.border.error` | `color.error` | Novo (v1.1.0 — borda tom erro) |
| `chip.border.success` | `color.success` | Novo (v1.1.0 — borda tom sucesso) |
| `chip.border.secondary` | `color.secondary` | Novo (v1.1.0 — borda tom secundário) |
| `option.bg.default` | `color.surface-container` | Novo (v1.1.0 — fundo padrão de `SelectableOptionItem`) |
| `option.bg.selected` | `color.action-container` | Novo (v1.1.0 — fundo selecionado) |
| `option.bg.disabled` | `color.disabled-bg` | Novo (v1.1.0 — fundo desabilitado) |
| `option.border.default` | `color.outline` | Novo (v1.1.0 — borda padrão) |
| `option.border.selected` | `color.action` | Novo (v1.1.0 — borda selecionada) |
| `option.border.focus` | `color.focus` | Novo (v1.1.0 — foco teclado) |
| `option.border.disabled` | `color.outline` | Novo (v1.1.0 — borda desabilitada) |
| `option.border.error` | `color.error` | Novo (v1.1.0 — borda erro) |
| `option.border.success` | `color.success` | Novo (v1.1.0 — borda acerto) |
| `option.radius` | `radius.lg` (`20 dp`) | Novo (v1.1.0) |
| `option.minHeight` | `space.container` (`56 dp`) | Novo (v1.1.0) |
| `tag.{neutral,action,secondary,success,error,highlight}.{bg,border,text}` | Containers semânticos correspondentes + borda ≥ 3:1 | Novo (v1.1.0 — `ExpressiveTag`) |
| `banner.{info,success,warning,error}.{bg,border,text}` | Containers semânticos correspondentes + borda ≥ 3:1 | Novo (v1.1.0 — banners e alertas de tela) |
| `timer.bg.normal` | `color.highlight` | Novo (Cronômetro em estado normal) |
| `timer.text.normal` | `color.on-highlight` | Novo (Texto do Cronômetro normal) |
| `timer.bg.critical` | `color.error` | Novo (Cronômetro nos últimos 10 segundos) |
| `timer.text.critical` | `color.on-error` | Novo (Texto do Cronômetro crítico) |
| `timer.bg.calm` | `color.action` | Novo (v1.1.0 — preenchimento tranquilo do termômetro #50, ≥ 7,81:1) |
| `timer.radius.normal` | `radius.full` | Novo (Forma de pílula em contagem normal) |
| `timer.radius.critical` | `radius.md` | Novo (Forma em contagem crítica) |
| `quiz.option.bg` | `color.surface-container` | Adaptado (Alternativa de Quiz em repouso) |
| `quiz.option.border` | `color.outline` | Adaptado (Borda de Alternativa de Quiz) |
| `quiz.option.radius` | `radius.lg` (`20 dp`) | Adaptado (Raio expressivo para alternativas) |
| `quiz.option.correct.bg` | `color.success` | Novo (Alternativa correta revelada) |
| `quiz.option.wrong.bg` | `color.error` | Novo (Alternativa incorreta selecionada) |
| `quiz.option.minHeight` | `space.container` (`56 dp`) | Adaptado (Alvo mínimo) |
| `key.size` | `space.2xl` (`48 dp`) | Novo (Largura e altura mínimas da tecla da Forca) |
| `key.radius` | `radius.md` (`16 dp`) | Novo (Raio padrão da tecla da Forca) |
| `key.hit.bg` | `color.success` | Novo (Fundo de letra certa na Forca) |
| `key.miss.bg` | `color.error-container` | Novo (Fundo de letra errada na Forca) |
| `canvas.paperBg` | `color.canvas-paper` | Novo (v1.2.0 — fundo fixo de papel claro na Tela de Desenho) |
| `canvas.border` | `color.outline` | Novo (v1.2.0 — contorno da folha de desenho ≥ 4,35:1) |
| `canvas.radius` | `radius.lg` (`20 dp`) | Novo (v1.2.0 — cantos arredondados da folha de desenho) |
| `canvas.minHeight` | `space.3xl * 5` (`320 dp`) | Atualizado (v1.3.0 — altura mínima da folha no modo padrão / visualização de adivinhadores) |
| `canvas.expandedMinHeight` | `space.3xl * 6` (`384 dp`) | Novo (v1.3.0 — altura expandida da folha quando o tema temporário de 5s desaparece e o canvas ocupa a área do tema) |
| `canvas.pen.ink` | `color.canvas-ink` | Novo (v1.2.0 — caneta Grafite 16,42:1 sobre `canvas.paperBg`) |
| `canvas.pen.purple` | `color.canvas-purple` | Novo (v1.2.0 — caneta Roxo 8,84:1 sobre `canvas.paperBg`) |
| `canvas.pen.coral` | `color.canvas-coral` | Novo (v1.2.0 — caneta Coral 4,90:1 sobre `canvas.paperBg`) |
| `canvas.pen.green` | `color.canvas-green` | Novo (v1.2.0 — caneta Verde 4,88:1 sobre `canvas.paperBg`) |
| `canvas.pen.onPen` | `color.canvas-paper` | Novo (v1.2.0 — ícone `check` sobre as 4 canetas, ≥ 4,88:1 no claro e no escuro) |
| `canvas.stroke.thin` | `space.xs` (`4 dp`) | Novo (v1.2.0 — traço fino na Tela de Desenho) |
| `canvas.stroke.thick` | `space.sm` (`8 dp`) | Novo (v1.2.0 — traço grosso na Tela de Desenho) |
| `canvas.tool.size` | `space.2xl` (`48 dp`) | Novo (v1.2.0 — alvo mínimo dos seletores de cor/espessura) |
| `canvas.tool.radius` | `radius.full` | Novo (v1.2.0 — forma circular em repouso) |
| `canvas.tool.radiusSelected` | `radius.md` (`16 dp`) | Novo (v1.2.0 — *shape morphing* na seleção ativa) |
| `canvas.tool.border.default` | `color.outline` | Novo (v1.2.0 — borda da ferramenta em repouso) |
| `canvas.tool.border.selected` | `color.action` | Novo (v1.2.0 — borda de destaque da ferramenta ativa) |
| `canvas.tool.border.focus` | `color.focus` | Novo (v1.2.0 — anel externo de foco via teclado) |

---

## 4. Modo escuro automático (`useColorScheme` + `ThemeProvider`)

Na `v1.1.0`, o aplicativo acompanha automaticamente o tema do sistema operacional via `ThemeProvider` (em `src/app/_layout.tsx`) e o hook `useTheme()` (em `src/view/theme.ts`). Nenhum componente ou token de componente precisa mudar sua lógica — apenas os tokens semânticos trocam o ponteiro primitivo. Telas temáticas específicas (como a fase Noite do **Cidade Dorme**) podem envolver sua subárvore com `<ThemeProvider mode="dark">` sem importar `darkTokens` manualmente nos estilos.

---

## 5. Versão legível por máquina (W3C Design Tokens JSON)

```json
{
  "$schema": "https://tr.designtokens.org/format/",
  "primitive": {
    "color": {
      "purple-100": { "$value": "#EDE9FE", "$type": "color" },
      "purple-300": { "$value": "#D8B4FE", "$type": "color" },
      "purple-600": { "$value": "#5B21B6", "$type": "color" },
      "purple-700": { "$value": "#4C1D95", "$type": "color" },
      "purple-800": { "$value": "#3B0764", "$type": "color" },
      "purple-950": { "$value": "#2E1065", "$type": "color" },
      "coral-100": { "$value": "#FFEDD5", "$type": "color" },
      "coral-300": { "$value": "#FDBA74", "$type": "color" },
      "coral-700": { "$value": "#C2410C", "$type": "color" },
      "coral-800": { "$value": "#9A3412", "$type": "color" },
      "coral-950": { "$value": "#431407", "$type": "color" },
      "gold-100": { "$value": "#FEF9C3", "$type": "color" },
      "gold-400": { "$value": "#FACC15", "$type": "color" },
      "gold-700": { "$value": "#A16207", "$type": "color" },
      "gold-950": { "$value": "#422006", "$type": "color" },
      "green-100": { "$value": "#DCFCE7", "$type": "color" },
      "green-300": { "$value": "#86EFAC", "$type": "color" },
      "green-700": { "$value": "#15803D", "$type": "color" },
      "green-950": { "$value": "#052E16", "$type": "color" },
      "red-100": { "$value": "#FEE2E2", "$type": "color" },
      "red-300": { "$value": "#FCA5A5", "$type": "color" },
      "red-700": { "$value": "#B91C1C", "$type": "color" },
      "red-950": { "$value": "#450A0A", "$type": "color" },
      "neutral-0": { "$value": "#FFFFFF", "$type": "color" },
      "neutral-50": { "$value": "#FDF8FF", "$type": "color" },
      "neutral-100": { "$value": "#F3EDF7", "$type": "color" },
      "neutral-200": { "$value": "#E6E0E9", "$type": "color" },
      "neutral-300": { "$value": "#CAC4D0", "$type": "color" },
      "neutral-400": { "$value": "#938F99", "$type": "color" },
      "neutral-500": { "$value": "#79747E", "$type": "color" },
      "neutral-600": { "$value": "#49454F", "$type": "color" },
      "neutral-800": { "$value": "#2B2930", "$type": "color" },
      "neutral-900": { "$value": "#1D1B20", "$type": "color" },
      "neutral-950": { "$value": "#141218", "$type": "color" }
    }
  },
  "semantic": {
    "color": {
      "outline": {
        "$type": "color",
        "$value": "{primitive.color.neutral-500}",
        "$extensions": { "mode": { "dark": "{primitive.color.neutral-400}" } }
      },
      "highlight-border": {
        "$type": "color",
        "$value": "{primitive.color.gold-700}",
        "$extensions": { "mode": { "dark": "{primitive.color.gold-400}" } }
      },
      "focus": {
        "$type": "color",
        "$value": "{primitive.color.neutral-900}",
        "$extensions": { "mode": { "dark": "{primitive.color.neutral-200}" } }
      },
      "focus-offset": {
        "$type": "color",
        "$value": "{primitive.color.neutral-50}",
        "$extensions": { "mode": { "dark": "{primitive.color.neutral-950}" } }
      },
      "disabled-text": {
        "$type": "color",
        "$value": "{primitive.color.neutral-600}",
        "$extensions": { "mode": { "dark": "{primitive.color.neutral-400}" } }
      },
      "canvas-paper": {
        "$type": "color",
        "$value": "{primitive.color.neutral-50}",
        "$extensions": { "mode": { "dark": "{primitive.color.neutral-50}" } }
      },
      "canvas-ink": {
        "$type": "color",
        "$value": "{primitive.color.neutral-900}",
        "$extensions": { "mode": { "dark": "{primitive.color.neutral-900}" } }
      },
      "canvas-purple": {
        "$type": "color",
        "$value": "{primitive.color.purple-600}",
        "$extensions": { "mode": { "dark": "{primitive.color.purple-600}" } }
      },
      "canvas-coral": {
        "$type": "color",
        "$value": "{primitive.color.coral-700}",
        "$extensions": { "mode": { "dark": "{primitive.color.coral-700}" } }
      },
      "canvas-green": {
        "$type": "color",
        "$value": "{primitive.color.green-700}",
        "$extensions": { "mode": { "dark": "{primitive.color.green-700}" } }
      }
    }
  }
}
```
