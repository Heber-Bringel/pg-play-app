# Tokens

Os tokens do **PG Play Expressive** organizam todas as decisões visuais em três níveis: **Primitivo** (o valor bruto), **Semântico** (o propósito no tema claro e escuro) e **Componente** (onde o token é aplicado). Os componentes de código em React Native nunca referenciam valores literais ou tokens primitivos diretamente — apenas tokens semânticos e de componente.

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
| `gold-100` | `#FEF9C3` | Novo (Destaque de Placar e Cronômetro em Jogos) |
| `gold-400` | `#FACC15` | Novo (Amarelo Ouro para Pódio e Cronômetro Normal) |
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
| `neutral-300` | `#CAC4D0` | Herdado (M3 Outline Light 80) |
| `neutral-600` | `#49454F` | Herdado (M3 On-Surface Variant 30) |
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
| `color.action` | `purple-600` (`#5B21B6`) | `purple-300` (`#D8B4FE`) | Ação principal da tela | Adaptado (M3 `md.sys.color.primary`) |
| `color.action-hover` | `purple-700` (`#4C1D95`) | `purple-200` (`#DDD6FE`) | Estado hover de ação principal | Adaptado (M3 Primary Hover State) |
| `color.action-pressed` | `purple-800` (`#3B0764`) | `purple-100` (`#EDE9FE`) | Estado pressionado de ação principal | Adaptado (M3 Primary Pressed State) |
| `color.on-action` | `neutral-0` (`#FFFFFF`) | `purple-950` (`#2E1065`) | Texto e ícone sobre `color.action` | Herdado (M3 `md.sys.color.on-primary`) |
| `color.action-container` | `purple-100` (`#EDE9FE`) | `purple-800` (`#3B0764`) | Fundo de botões tonais e pílulas ativas | Herdado (M3 `md.sys.color.primary-container`) |
| `color.on-action-container` | `purple-950` (`#2E1065`) | `purple-100` (`#EDE9FE`) | Texto e ícone sobre `color.action-container` | Herdado (M3 `md.sys.color.on-primary-container`) |
| `color.secondary` | `coral-700` (`#C2410C`) | `coral-300` (`#FDBA74`) | Ações secundárias (ex.: Pular palavra) e filtros ativos | Adaptado (M3 `md.sys.color.secondary`) |
| `color.on-secondary` | `neutral-0` (`#FFFFFF`) | `coral-950` (`#431407`) | Texto e ícone sobre `color.secondary` | Herdado (M3 `md.sys.color.on-secondary`) |
| `color.secondary-container` | `coral-100` (`#FFEDD5`) | `coral-800` (`#9A3412`) | Emblemas e tags de destaque secundário | Herdado (M3 `md.sys.color.secondary-container`) |
| `color.on-secondary-container` | `coral-950` (`#431407`) | `coral-100` (`#FFEDD5`) | Texto sobre `color.secondary-container` | Herdado (M3 `md.sys.color.on-secondary-container`) |
| `color.highlight` | `gold-400` (`#FACC15`) | `gold-400` (`#FACC15`) | Placar líder, pódio e cronômetro em estado normal | Novo (Destaque lúdico de pontuação do PG PLAY) |
| `color.on-highlight` | `neutral-900` (`#1D1B20`) | `neutral-900` (`#1D1B20`) | Texto e ícone sobre `color.highlight` | Novo (Garante contraste 11,30:1 sobre Amarelo Ouro) |
| `color.surface` | `neutral-50` (`#FDF8FF`) | `neutral-950` (`#141218`) | Fundo geral das telas | Herdado (M3 `md.sys.color.surface`) |
| `color.surface-container` | `neutral-0` (`#FFFFFF`) | `neutral-900` (`#1D1B20`) | Fundo de cards, barras e campos de texto | Herdado (M3 `md.sys.color.surface-container`) |
| `color.surface-variant` | `neutral-100` (`#F3EDF7`) | `neutral-800` (`#2B2930`) | Fundo de chips, slots de letras e áreas secundárias | Herdado (M3 `md.sys.color.surface-variant`) |
| `color.on-surface` | `neutral-900` (`#1D1B20`) | `neutral-200` (`#E6E0E9`) | Texto principal sobre `color.surface` e cards | Herdado (M3 `md.sys.color.on-surface`) |
| `color.on-surface-muted` | `neutral-600` (`#49454F`) | `neutral-300` (`#CAC4D0`) | Subtítulos, textos de apoio e ícones secundários | Herdado (M3 `md.sys.color.on-surface-variant`) |
| `color.outline` | `neutral-300` (`#CAC4D0`) | `neutral-600` (`#49454F`) | Bordas de cards, campos e divisores | Herdado (M3 `md.sys.color.outline`) |
| `color.success` | `green-700` (`#15803D`) | `green-300` (`#86EFAC`) | Confirmação de acerto em Mímica, Quiz e Forca | Novo (Feedback semântico positivo de jogo) |
| `color.on-success` | `neutral-0` (`#FFFFFF`) | `green-950` (`#052E16`) | Texto e ícone sobre `color.success` | Novo (Contraste sobre feedback de acerto) |
| `color.error` | `red-700` (`#B91C1C`) | `red-300` (`#FCA5A5`) | Erros de formulário, resposta errada e timer crítico | Herdado (M3 `md.sys.color.error`) |
| `color.on-error` | `neutral-0` (`#FFFFFF`) | `red-950` (`#450A0A`) | Texto e ícone sobre `color.error` | Herdado (M3 `md.sys.color.on-error`) |
| `color.error-container` | `red-100` (`#FEE2E2`) | `red-950` (`#450A0A`) | Fundo de campos com erro e letras erradas na Forca | Herdado (M3 `md.sys.color.error-container`) |
| `color.on-error-container` | `red-950` (`#450A0A`) | `red-300` (`#FCA5A5`) | Texto sobre `color.error-container` | Herdado (M3 `md.sys.color.on-error-container`) |
| `color.focus` | `coral-700` (`#C2410C`) | `gold-400` (`#FACC15`) | Anel de foco visível para navegação por teclado/switch | Adaptado (Alto contraste sobre o roxo primário) |
| `color.disabled-bg` | `neutral-200` (`#E6E0E9`) | `neutral-800` (`#2B2930`) | Fundo de elementos desabilitados | Herdado (M3 Disabled Container) |
| `color.disabled-text` | `neutral-600` (`#49454F`) | `neutral-600` (`#49454F`) | Texto e ícone de elementos desabilitados | Herdado (M3 Disabled Content) |

### Tipografia

| Token | Família | Tamanho | Peso | Altura de linha | Uso | Origem |
| --- | --- | --- | --- | --- | --- | --- |
| `font.display` | `Plus Jakarta Sans` (ou `Roboto Flex`) | `30 dp` | `800` (ExtraBold) | `36 dp` | Palavra secreta da Mímica e placar destaque | Adaptado (M3 Expressive Emphasized Display Small) |
| `font.title` | `Plus Jakarta Sans` (ou `Roboto Flex`) | `24 dp` | `800` (ExtraBold) | `32 dp` | Títulos principais de tela e cronômetro | Adaptado (M3 Expressive Emphasized Headline Small) |
| `font.subtitle` | `Plus Jakarta Sans` (ou `Roboto Flex`) | `18 dp` | `700` (Bold) | `24 dp` | Títulos de cards de minigame e perguntas de Quiz | Adaptado (M3 Expressive Emphasized Title Medium) |
| `font.body` | `Roboto` | `16 dp` | `400` (Regular) | `24 dp` | Texto corrido, descrições de regras e inputs | Herdado (M3 `md.sys.typescale.body-large`) |
| `font.label` | `Plus Jakarta Sans` (ou `Roboto`) | `16 dp` | `700` (Bold) | `20 dp` | Rótulos de botões, alternativas e teclas da Forca | Adaptado (M3 Expressive Emphasized Label Large) |
| `font.caption` | `Roboto` | `12 dp` | `700` (Bold) | `16 dp` | Tags de quantidade de jogadores e textos auxiliares | Herdado (M3 `md.sys.typescale.label-medium`) |

### Espaço, forma e elevação

| Token | Valor | Uso | Origem |
| --- | --- | --- | --- |
| `space.xs` | `space-4` (`4 dp`) | Distância entre ícone e texto auxiliar | Herdado (Grade de 8 pontos - ajuste fino) |
| `space.sm` | `space-8` (`8 dp`) | Espaço entre elementos relacionados (ex.: teclas e opções) | Herdado (Grade de 8 pontos - 1x) |
| `space.md` | `space-16` (`16 dp`) | Margem lateral padrão das telas e padding de campos | Herdado (Grade de 8 pontos - 2x) |
| `space.lg` | `space-24` (`24 dp`) | Padding interno dos cards de minigame e separação de blocos | Herdado (Grade de 8 pontos - 3x) |
| `space.xl` | `space-32` (`32 dp`) | Separação entre grandes seções de tela | Herdado (Grade de 8 pontos - 4x) |
| `space.2xl` | `space-48` (`48 dp`) | Alvo de toque mínimo padrão de botões e teclas | Herdado (M3 Minimum Touch Target `48 dp`) |
| `space.3xl` | `space-64` (`64 dp`) | Altura de botões Jumbo em dinâmicas rápidas | Adaptado (M3 Expressive Large Touch Target) |
| `radius.sm` | `8 dp` | Lacunas de letras e opções pressionadas | Herdado (M3 `md.sys.shape.corner.small`) |
| `radius.md` | `16 dp` | Campos de texto, teclas da forca e botões pressionados | Herdado (M3 `md.sys.shape.corner.medium`) |
| `radius.lg` | `20 dp` | Alternativas de Quiz e banners de pontuação | Herdado (M3 Expressive `corner.large` = `20 dp`) |
| `radius.xl` | `28 dp` | Cards de minigame e containers principais | Herdado (M3 `md.sys.shape.corner.extra-large` = `28 dp`) |
| `radius.full` | `9999 dp` | Botões em repouso (pílula), chips e cronômetro normal | Herdado (M3 Expressive `corner.full`) |
| `border.thin` | `2 dp` | Espessura padrão de borda de cards, inputs e teclas | Adaptado (Reforço de contorno para alto contraste) |
| `border.focus` | `3 dp` | Espessura do anel de foco visível | Herdado (M3 Focus Ring Thickness) |
| `icon.sm` | `16 dp` | Ícones em mensagens auxiliares e alertas de campo | Herdado (M3 Small Icon) |
| `icon.md` | `24 dp` | Ícones padrão dentro de botões, inputs e cronômetro | Herdado (M3 Standard Icon `24 dp`) |
| `icon.lg` | `28 dp` | Ícones destacados dentro de emblemas de cards de jogo | Adaptado (M3 Expressive Feature Icon) |
| `typography.maxScale` | `1.5` | Multiplicador máximo de fonte em botões e cronômetro | Adaptado (Prevenção de truncamento com Dynamic Type) |
| `elevation.none` | `0 dp` | Elementos planos e estados desabilitados | Herdado (M3 Elevation Level 0) |
| `elevation.card` | `4 dp` (sombra `0 4px 16px rgba(91,33,182,0.08)`) | Cards de minigame e cronômetro | Adaptado (M3 Elevation Level 2 com sombra tingida) |
| `elevation.floating` | `12 dp` (sombra `0 12px 32px rgba(91,33,182,0.18)`) | Modais e destaques flutuantes | Adaptado (M3 Elevation Level 4) |

### Movimento

| Token | Valor | Uso | Origem |
| --- | --- | --- | --- |
| `motion.duration.short` | `150 ms` | Feedback imediato de toque e *shape morphing* de botão | Herdado (M3 `short3` duration) |
| `motion.duration.medium` | `300 ms` | Transições entre estados de card, cronômetro e telas | Herdado (M3 `medium2` duration) |
| `motion.duration.long` | `600 ms` | Ciclo de pulsação do cronômetro nos 10s finais | Novo (Ritmo de alerta de fim de tempo) |
| `motion.spring.spatial` | `cubic-bezier(0.34, 1.56, 0.64, 1)` (no RN: `damping: 14, stiffness: 280`) | Transformação de forma, escala de toque e pódio | Herdado (M3 Expressive Spatial Spring com leve *overshoot*) |
| `motion.spring.effects` | `cubic-bezier(0.22, 1, 0.36, 1)` (no RN: `damping: 22, stiffness: 300`) | Transições suaves de cor, borda e opacidade sem *overshoot* | Herdado (M3 Expressive Effects Spring) |

---

## 3. Tokens de componente (onde é usado)

| Token | Aponta para | Origem |
| --- | --- | --- |
| `button.bg` | `color.action` | Herdado (M3 Filled Button Container) |
| `button.label` | `color.on-action` | Herdado (M3 Filled Button Label) |
| `button.bg-hover` | `color.action-hover` | Herdado (M3 Filled Button Hover) |
| `button.bg-pressed` | `color.action-pressed` | Herdado (M3 Filled Button Pressed) |
| `button.bg-disabled` | `color.disabled-bg` | Herdado (M3 Filled Button Disabled) |
| `button.label-disabled` | `color.disabled-text` | Herdado (M3 Filled Button Disabled Label) |
| `button.radius` | `radius.full` | Herdado (M3 Pill Button Shape) |
| `button.radius.pressed` | `radius.md` | Adaptado (M3 Expressive Shape Morphing no toque) |
| `button.min-height` | `space.2xl` (`48 dp`) | Herdado (M3 Touch Target) |
| `button.jumbo.height` | `space.3xl` (`64 dp`) | Adaptado (M3 Expressive Jumbo Button para jogos) |
| `input.bg` | `color.surface-container` | Herdado (M3 Text Field Container) |
| `input.text` | `color.on-surface` | Herdado (M3 Text Field Input Text) |
| `input.border` | `color.outline` | Herdado (M3 Outlined Text Field Outline) |
| `input.border-focus` | `color.action` | Herdado (M3 Focused Outline) |
| `input.border-error` | `color.error` | Herdado (M3 Error Outline) |
| `input.bg-error` | `color.error-container` | Adaptado (Reforço visual de erro em formulários rápidos) |
| `input.radius` | `radius.md` | Adaptado (Cantos suavizados `16 dp` para combinar com botões) |
| `input.min-height` | `space-56` (`56 dp`) | Herdado (M3 Text Field Height `56 dp`) |
| `card.bg` | `color.surface-container` | Herdado (M3 Card Container) |
| `card.border` | `color.outline` | Herdado (M3 Outlined Card Border) |
| `card.radius` | `radius.xl` (`28 dp`) | Adaptado (M3 Expressive Extra Large Shape para cards de jogo) |
| `card.padding` | `space.lg` (`24 dp`) | Herdado (M3 Card Internal Padding) |
| `timer.bg.normal` | `color.highlight` | Novo (Cronômetro Expressivo em estado normal) |
| `timer.text.normal` | `color.on-highlight` | Novo (Texto do Cronômetro Expressivo em estado normal) |
| `timer.bg.critical` | `color.error` | Novo (Cronômetro Expressivo nos últimos 10 segundos) |
| `timer.text.critical` | `color.on-error` | Novo (Texto do Cronômetro Expressivo nos últimos 10 segundos) |
| `timer.radius.normal` | `radius.full` | Novo (Forma de pílula em contagem normal) |
| `timer.radius.critical` | `radius.md` | Novo (Transformação de forma em contagem crítica) |
| `quiz.option.bg` | `color.surface-container` | Adaptado (Alternativa de Quiz em repouso) |
| `quiz.option.border` | `color.outline` | Adaptado (Borda de Alternativa de Quiz) |
| `quiz.option.radius` | `radius.lg` (`20 dp`) | Adaptado (Raio expressivo para alternativas) |
| `quiz.option.correct.bg` | `color.success` | Novo (Alternativa correta revelada) |
| `quiz.option.wrong.bg` | `color.error` | Novo (Alternativa incorreta selecionada) |
| `key.size` | `space.2xl` (`48 dp`) | Novo (Largura e altura mínimas da tecla da Forca) |
| `key.radius` | `radius.md` (`16 dp`) | Novo (Raio padrão da tecla da Forca) |
| `key.hit.bg` | `color.success` | Novo (Fundo de letra certa na Forca) |
| `key.miss.bg` | `color.error-container` | Novo (Fundo de letra errada na Forca) |

---

## 4. Modo escuro

No modo escuro, **nenhum componente ou token de componente é alterado**. Apenas os tokens semânticos de cor trocam o ponteiro primitivo:

- Tons escuros vibrantes no modo claro (como `color.action` = `purple-600` `#5B21B6` e `color.secondary` = `coral-700` `#C2410C`) passam para tons pastéis luminosos no modo escuro (`purple-300` `#D8B4FE` e `coral-300` `#FDBA74`), garantindo alto contraste sobre o fundo escuro `neutral-950` (`#141218`).
- Os pares `color.on-*` invertem concomitantemente (de `#FFFFFF` no claro para tons profundos como `purple-950` `#2E1065` e `coral-950` `#431407` no escuro), preservando razão de contraste superior a `8,6:1`.
- O token `color.highlight` (`#FACC15`) mantém seu valor nos dois temas porque já é uma cor luminosa usada sobre superfícies ou com texto escuro `neutral-900` (`#1D1B20`, contraste `11,30:1`).

---

## 5. (Bônus) Versão legível por máquina (W3C Design Tokens JSON)

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
      "gold-400": { "$value": "#FACC15", "$type": "color" },
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
      "neutral-600": { "$value": "#49454F", "$type": "color" },
      "neutral-800": { "$value": "#2B2930", "$type": "color" },
      "neutral-900": { "$value": "#1D1B20", "$type": "color" },
      "neutral-950": { "$value": "#141218", "$type": "color" }
    },
    "space": {
      "space-4": { "$value": "4dp", "$type": "dimension" },
      "space-8": { "$value": "8dp", "$type": "dimension" },
      "space-12": { "$value": "12dp", "$type": "dimension" },
      "space-16": { "$value": "16dp", "$type": "dimension" },
      "space-24": { "$value": "24dp", "$type": "dimension" },
      "space-32": { "$value": "32dp", "$type": "dimension" },
      "space-48": { "$value": "48dp", "$type": "dimension" },
      "space-56": { "$value": "56dp", "$type": "dimension" },
      "space-64": { "$value": "64dp", "$type": "dimension" }
    }
  },
  "semantic": {
    "color": {
      "action": {
        "$type": "color",
        "$value": "{primitive.color.purple-600}",
        "$extensions": { "mode": { "dark": "{primitive.color.purple-300}" } }
      },
      "on-action": {
        "$type": "color",
        "$value": "{primitive.color.neutral-0}",
        "$extensions": { "mode": { "dark": "{primitive.color.purple-950}" } }
      },
      "secondary": {
        "$type": "color",
        "$value": "{primitive.color.coral-700}",
        "$extensions": { "mode": { "dark": "{primitive.color.coral-300}" } }
      },
      "on-secondary": {
        "$type": "color",
        "$value": "{primitive.color.neutral-0}",
        "$extensions": { "mode": { "dark": "{primitive.color.coral-950}" } }
      },
      "highlight": {
        "$type": "color",
        "$value": "{primitive.color.gold-400}"
      },
      "on-highlight": {
        "$type": "color",
        "$value": "{primitive.color.neutral-900}"
      },
      "surface": {
        "$type": "color",
        "$value": "{primitive.color.neutral-50}",
        "$extensions": { "mode": { "dark": "{primitive.color.neutral-950}" } }
      },
      "on-surface": {
        "$type": "color",
        "$value": "{primitive.color.neutral-900}",
        "$extensions": { "mode": { "dark": "{primitive.color.neutral-200}" } }
      },
      "success": {
        "$type": "color",
        "$value": "{primitive.color.green-700}",
        "$extensions": { "mode": { "dark": "{primitive.color.green-300}" } }
      },
      "error": {
        "$type": "color",
        "$value": "{primitive.color.red-700}",
        "$extensions": { "mode": { "dark": "{primitive.color.red-300}" } }
      }
    },
    "radius": {
      "sm": { "$value": "8dp", "$type": "dimension" },
      "md": { "$value": "16dp", "$type": "dimension" },
      "lg": { "$value": "20dp", "$type": "dimension" },
      "xl": { "$value": "28dp", "$type": "dimension" },
      "full": { "$value": "9999dp", "$type": "dimension" }
    }
  },
  "component": {
    "button": {
      "bg": { "$value": "{semantic.color.action}", "$type": "color" },
      "label": { "$value": "{semantic.color.on-action}", "$type": "color" },
      "radius": { "$value": "{semantic.radius.full}", "$type": "dimension" },
      "radius-pressed": { "$value": "{semantic.radius.md}", "$type": "dimension" },
      "min-height": { "$value": "{primitive.space.space-48}", "$type": "dimension" },
      "jumbo-height": { "$value": "{primitive.space.space-64}", "$type": "dimension" }
    }
  }
}
```
