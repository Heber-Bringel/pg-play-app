# Acessibilidade

A acessibilidade no **PG Play Expressive** é um requisito estrutural embutido nos tokens e nos componentes, garantindo que jovens e adultos — incluindo pessoas com baixa visão, daltonismo ou restrições motoras — participem das dinâmicas do Pequeno Grupo em igualdade de condições.

---

## 1. Contraste dos pares de cor (WCAG 2.1)

A razão de contraste foi calculada pela fórmula oficial da WCAG 2.1:

$$\text{Razão} = \frac{L_1 + 0{,}05}{L_2 + 0{,}05}$$

onde $L_1$ é a luminância relativa da cor mais clara e $L_2$ a da mais escura. O requisito mínimo do sistema é **4,5:1** (Nível AA), sendo que a maioria dos pares atinge o **Nível AAA ($\ge 7,0:1$)**.

| Par (texto sobre fundo) | Modo | Cores (Hex) | Razão calculada | Mínimo WCAG | Resultado |
| --- | --- | --- | --- | --- | --- |
| `color.on-action` sobre `color.action` | Claro | `#FFFFFF` sobre `#5B21B6` | **8,98:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-action` sobre `color.action` | Escuro | `#2E1065` sobre `#D8B4FE` | **8,62:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-action-container` sobre `color.action-container` | Claro | `#2E1065` sobre `#EDE9FE` | **13,45:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-action-container` sobre `color.action-container` | Escuro | `#EDE9FE` sobre `#3B0764` | **11,80:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-secondary` sobre `color.secondary` | Claro | `#FFFFFF` sobre `#C2410C` | **5,18:1** | 4,5:1 | ✅ Aprovado (AA) |
| `color.on-secondary` sobre `color.secondary` | Escuro | `#431407` sobre `#FDBA74` | **9,41:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-highlight` sobre `color.highlight` | Claro | `#1D1B20` sobre `#FACC15` | **11,30:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-highlight` sobre `color.highlight` | Escuro | `#1D1B20` sobre `#FACC15` | **11,30:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-surface` sobre `color.surface` | Claro | `#1D1B20` sobre `#FDF8FF` | **16,20:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-surface` sobre `color.surface` | Escuro | `#E6E0E9` sobre `#141218` | **14,40:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-surface` sobre `color.surface-container` | Claro | `#1D1B20` sobre `#FFFFFF` | **17,10:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-surface` sobre `color.surface-container` | Escuro | `#E6E0E9` sobre `#1D1B20` | **12,85:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-surface-muted` sobre `color.surface-container` | Claro | `#49454F` sobre `#FFFFFF` | **8,89:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-surface-muted` sobre `color.surface-container` | Escuro | `#CAC4D0` sobre `#1D1B20` | **9,72:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-success` sobre `color.success` | Claro | `#FFFFFF` sobre `#15803D` | **5,02:1** | 4,5:1 | ✅ Aprovado (AA) |
| `color.on-success` sobre `color.success` | Escuro | `#052E16` sobre `#86EFAC` | **11,15:1** | 4,5:1 | ✅ Aprovado (AAA) |
| `color.on-error` sobre `color.error` | Claro | `#FFFFFF` sobre `#B91C1C` | **6,47:1** | 4,5:1 | ✅ Aprovado (AA) |
| `color.on-error` sobre `color.error` | Escuro | `#450A0A` sobre `#FCA5A5` | **8,90:1** | 4,5:1 | ✅ Aprovado (AAA) |

---

## 2. Alvos de toque

Seguindo a diretriz do Material 3 (e ampliando para o contexto de jogos rápidos do Material 3 Expressive), **todo elemento interativo possui no mínimo `48 dp × 48 dp`**, com espaçamento mínimo de `8 dp` (`space.sm`) entre alvos vizinhos:

| Componente | Dimensão mínima garantida | Token responsável |
| --- | --- | --- |
| [Botão](04-componentes/botao.md) (Padrão, Tonal, Secundário, Delineado) | `48 dp` de altura × largura mínima `96 dp` | `button.min-height` (`space.2xl`) |
| [Botão](04-componentes/botao.md) (Variantes `Primário Jumbo` e `Sucesso Jumbo`) | `64 dp` de altura × `100%` da largura útil | `button.jumbo.height` (`space.3xl`) |
| [Campo de Texto](04-componentes/campo-de-texto.md) | `56 dp` de altura × `100%` da largura útil | `input.min-height` (`space-56`) |
| [Card de Minigame](04-componentes/card-de-jogo.md) | `120 dp` de altura mínima × `100%` da largura útil | `card.padding` (`space.lg`) |
| [Cronômetro Expressivo](04-componentes/cronometro-expressivo.md) | `48 dp` de altura × `136 dp` de largura mínima | `space.2xl` |
| [Alternativa de Quiz](04-componentes/alternativa-quiz.md) | `56 dp` de altura × `100%` da largura útil | `space-56` |
| [Teclado da Forca](04-componentes/teclado-forca.md) | `48 dp × 48 dp` para cada tecla de letra | `key.size` (`space.2xl`) |

---

## 3. Foco visível

- Todo componente interativo focado por teclado externo ou *Switch Access* exibe uma borda/anel de foco de `3 dp` usando o token `color.focus` (`#C2410C` no modo claro e `#FACC15` no modo escuro).
- A ordem de foco nas telas segue estritamente a leitura de cima para baixo e da esquerda para a direita:
  1. Barra superior (Botão *"Sair"* e Cronômetro).
  2. Card principal (Palavra secreta, Pergunta ou Lacunas da Forca).
  3. Controles de resposta (Alternativas de `A` a `D`, Teclas de `A` a `Z` ou Botões de pontuação).
  4. Barra de navegação inferior (quando na Home, Equipes ou Placar).

---

## 4. Leitor de tela (TalkBack e VoiceOver)

- **Independência de cor (WCAG 1.4.1):** nenhum estado do sistema é transmitido apenas por cor:
  - Na [Alternativa de Quiz](04-componentes/alternativa-quiz.md), o acerto acrescenta o ícone `check-circle` e o erro acrescenta `close-circle` + redução de raio para `8 dp`.
  - No [Teclado da Forca](04-componentes/teclado-forca.md), a letra certa vira um círculo (`9999 dp`) e a letra errada recebe texto riscado (`line-through`).
  - No [Cronômetro Expressivo](04-componentes/cronometro-expressivo.md), o estado crítico troca o ícone `timer-outline` por `alert` e muda o formato de pílula para retângulo (`16 dp`).
- **Rótulos e papéis semânticos no React Native:**
  - Botões somente com ícone (ex.: remover equipe) exigem `accessibilityLabel="Remover equipe [Nome]"` e `accessibilityRole="button"`.
  - Mensagens de validação em [Campo de Texto](04-componentes/campo-de-texto.md) usam `accessibilityLiveRegion="polite"` para serem lidas imediatamente quando aparecem.
  - O [Cronômetro Expressivo](04-componentes/cronometro-expressivo.md) ativa `accessibilityLiveRegion="assertive"` ao entrar nos `10 segundos` finais para avisar jogadores com deficiência visual sem poluir o áudio nos demais segundos.

---

## 5. Texto ampliado e redução de movimento

- **Texto ampliado (Dynamic Type / Font Scale):** todos os componentes `<Text>` mantêm `allowFontScaling={true}`. Containers de cards e alternativas possuem `minHeight` (e nunca `height` fixa), permitindo que o texto cresça até `200%` com quebra de linha automática. Em botões e no cronômetro, `maxFontSizeMultiplier={1.5}` preserva a integridade do layout sem cortar palavras.
- **Redução de movimento (`prefers-reduced-motion`):** o tema consulta `AccessibilityInfo.isReduceMotionEnabled()`. Quando ativado pelo usuário:
  - A animação de pulsação elástica do [Cronômetro Expressivo](04-componentes/cronometro-expressivo.md) nos 10s finais é desativada.
  - As transições de *Shape Morphing* e escala ocorrem de forma instantânea (`duration: 0 ms`), preservando o feedback visual de forma e cor sem causar desconforto vestibular.
