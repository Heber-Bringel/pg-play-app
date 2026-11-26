# Tela de Desenho (`DrawingCanvas`)

Origem no sistema base: Adaptado dos subsistemas de *Shape Morphing*, barras de ferramentas contextuais e controles de toque amplos do Material 3 Expressive (2025), alinhado à **Issue `#83`** (`UC12` — **Desenho Relâmpago Multiplayer**) e aos tokens em [`02-tokens.md`](../02-tokens.md). Situação: **Atualizado** (`v1.3.0`).

---

## 1. Quando usar

- Na fase ativa de desenho do minigame **Desenho Relâmpago (Sala Multiplayer)** (`UC12`, `RF41`):
  - **Modo Desenhista (`readOnly={false}`):** permite criar traços livres e formas geométricas (*Linha*, *Retângulo*, *Círculo*, *Triângulo* — contorno ou preenchido) em uma folha expandida que ocupa a área do tema após os `5s` iniciais.
  - **Modo Adivinhador (`readOnly={true}`):** exibe em tempo real os traços e formas sincronizados da sala sem a barra de ferramentas de edição e sem opacidade de bloqueio.

## 2. Quando não usar

- Nunca utilizar para coleta de assinatura formal, escrita de texto/números (proibido pela regra de honra `RF42`) ou edição de imagens externas.
- Não usar como área decorativa estática fora de uma arena de desenho interativa.

---

## 3. Anatomia e Arquitetura Visual

O componente `DrawingCanvas` (`src/view/components/drawingCanvas.tsx`) é puramente apresentacional (recebe `elements`, `selectedTool`, `selectedFillMode`, `selectedColor`, `selectedWidth`, `expanded`, `readOnly`, `disabled`, `reduceMotion`, `themeOverlay` opcional e callbacks via `props`) e divide-se em três regiões:

1. **Folha de Papel Expandida (`Svg` + `PanResponder`):**
   - Renderiza os elementos concluídos e o elemento em andamento usando `<Svg>`, `<Path>`, `<Line>`, `<Rect>`, `<Ellipse>` e `<Polygon>` de `react-native-svg` combinados ao `PanResponder` nativo do `react-native` (compatível com Expo Go no Android, iOS e Web).
   - Mantém fundo de papel claro fixo (`canvas.paperBg` → `color.canvas-paper` / `#FDF8FF`) tanto no tema Claro quanto no Escuro para que as 4 cores de caneta preservem contraste WCAG AA (`>= 4,88:1` a `16,42:1`).
   - Contorno de `border.thin` (`2 dp`) em `canvas.border` (`color.outline`), cantos arredondados `canvas.radius` (`radius.lg` = `20 dp`), altura mínima padrão `canvas.minHeight` (`320 dp` = `space['3xl'] * 5`) e altura expandida `canvas.expandedMinHeight` (`384 dp` = `space['3xl'] * 6`) quando `expanded={true}` (após o tema inicial de `5s` desaparecer e o canvas assumir essa área).
   - Suporta **pré-visualização em tempo real** ao arrastar qualquer forma geométrica (`line`, `rectangle`, `circle`, `triangle`), respeitando o modo `stroke` (contorno) ou `fill` (preenchido com borda).
   - Quando não há nenhum elemento (`elements.length === 0` e sem gesto ativo), exibe marca-d'água centralizada em `color.canvas-ink` / `font.body` com ícone `gesture-swipe` orientando: *"Arraste o dedo para desenhar · Sem letras nem números"* (ou *"Aguardando o desenhista começar..."* no modo `readOnly`).
   - Emite `onDrawingStart` e `onDrawingEnd` para bloquear a rolagem vertical da tela durante o gesto (`onPanResponderTerminationRequest: () => false`).

2. **Overlay Temporário do Tema (Opcional, dentro da região do Canvas — `RF42`):**
   - Durante os `5 segundos` iniciais do turno (ou por `3 segundos` ao tocar em *"Espiar palavra"*), a palavra secreta aparece em destaque sobre a parte superior da área do canvas (`card.bg`, `card.border`, `font.display`, `banner.warning.*`).
   - Ao expirar o temporizador (`5s` / `3s`), o overlay desaparece automaticamente e o canvas ocupa 100% da área disponível sem saltos de navegação nem perda dos traços já desenhados.

3. **Barra de Ferramentas Expressiva (exibida apenas quando `readOnly={false}`):**
   - **Seletor de Ferramenta / Forma (`freehand`, `line`, `rectangle`, `circle`, `triangle`):** 5 botões com ícones `draw`, `vector-line`, `rectangle-outline`, `circle-outline` e `triangle-outline`, alvo `canvas.tool.size` (`48 dp × 48 dp`), *shape morphing* (`radius.full` → `radius.md`) e `accessibilityState={{ selected }}`.
   - **Alternador de Preenchimento (`stroke` | `fill`):** 2 botões (*Contorno* `shape-outline` e *Preenchido* `shape`, `48 dp × 48 dp`), ativo para `rectangle`, `circle` e `triangle` (e automaticamente desabilitado com rótulo explicativo quando a ferramenta ativa é `freehand` ou `line`).
   - **Seletor de 4 Cores de Caneta (`ink`, `purple`, `coral`, `green`):** amostras `48 dp × 48 dp` com ícone `check` em `canvas.pen.onPen` e espaçamento `space.sm` (`8 dp`).
   - **Seletor de 2 Espessuras (`thin` = `4 dp`, `thick` = `8 dp`):** controles `48 dp × 48 dp` com indicador proporcional.
   - **Ações Rápidas (`Desfazer` e `Limpar`):** `ExpressiveButton` (`tonal` / `outlined`) com ícones `undo-variant` e `trash-can-outline`, desabilitados automaticamente quando `elements.length === 0` ou `disabled === true`.

---

## 4. Tokens Aplicados (`component.canvas`)

| Token | Aponta para | Valor Resolvido | Uso |
| :--- | :--- | :--- | :--- |
| `canvas.paperBg` | `color.canvas-paper` | `#FDF8FF` (Claro/Escuro) | Fundo fixo de papel da folha de desenho |
| `canvas.border` | `color.outline` | `#79747E` / `#938F99` | Contorno da folha (`border.thin` = `2 dp`, ≥ 4,35:1) |
| `canvas.radius` | `radius.lg` | `20 dp` | Cantos arredondados da área de desenho |
| `canvas.minHeight` | `space.3xl * 5` | `320 dp` | Altura mínima padrão da folha (ex.: adivinhadores com campo de palpite) |
| `canvas.expandedMinHeight` | `space.3xl * 6` | `384 dp` | Altura expandida da folha ao ocupar a área do tema após `5s` |
| `canvas.pen.ink` | `color.canvas-ink` | `#1D1B20` (16,42:1) | Caneta/forma Grafite (padrão inicial) |
| `canvas.pen.purple` | `color.canvas-purple` | `#5B21B6` (8,84:1) | Caneta/forma Roxo Expressivo |
| `canvas.pen.coral` | `color.canvas-coral` | `#C2410C` (4,90:1) | Caneta/forma Coral Vibrante |
| `canvas.pen.green` | `color.canvas-green` | `#15803D` (4,88:1) | Caneta/forma Verde Folha |
| `canvas.pen.onPen` | `color.canvas-paper` | `#FDF8FF` (≥ 4,88:1) | Ícone `check` contrastante sobre qualquer uma das 4 cores (Claro/Escuro) |
| `canvas.stroke.thin` | `space.xs` | `4 dp` | Traço/contorno fino para detalhes |
| `canvas.stroke.thick` | `space.sm` | `8 dp` | Traço/contorno grosso para destaques |
| `canvas.tool.size` | `space.2xl` | `48 dp` | Largura e altura mínimas dos seletores (ferramenta, forma, preenchimento, cor e espessura) |
| `canvas.tool.radius` | `radius.full` | `9999 dp` | Forma circular em repouso |
| `canvas.tool.radiusSelected` | `radius.md` | `16 dp` | *Shape Morphing* quando a ferramenta/forma/cor/espessura está ativa |
| `canvas.tool.border.default` | `color.outline` | `#79747E` / `#938F99` | Borda da ferramenta em repouso |
| `canvas.tool.border.selected` | `color.action` | `#5B21B6` / `#D8B4FE` | Borda de destaque da ferramenta selecionada |
| `canvas.tool.border.focus` | `color.focus` | `#1D1B20` / `#E6E0E9` | Anel externo de foco via teclado (`:focus-visible`) |

---

## 5. Estados

| Estado | Aparência (tokens) | Comportamento | Acessibilidade |
| :--- | :--- | :--- | :--- |
| **Vazio (Inicial)** | `canvas.paperBg`, `canvas.border`, instrução central sutil | Aguarda primeiro toque na folha; `Desfazer` e `Limpar` desabilitados | Folha com `accessibilityLabel` informando modo em branco |
| **Desenhando (Pincel ou Forma)** | Pré-visualização em tempo real (`Path`, `Line`, `Rect`, `Ellipse` ou `Polygon`) respeitando `fillMode` (`stroke`/`fill`) | Captura gesto no `PanResponder` e emite `onElementComplete` ao soltar o dedo | `Desfazer` e `Limpar` habilitam após o 1º elemento |
| **Expandido (`expanded`)** | Altura `canvas.expandedMinHeight` (`384 dp`) sem bloco fixo de tema acima | Ativado automaticamente quando o tema de `5s` desaparece | Anúncio discreto via `accessibilityLiveRegion="polite"` |
| **Somente Leitura (`readOnly`)** | Folha limpa em 100% de opacidade sem barra de ferramentas | Usado pelos adivinhadores da sala multiplayer para acompanhar o desenho ao vivo | `accessibilityLabel` descreve a quantidade de elementos desenhados |
| **Ferramenta Selecionada** | *Shape Morphing* (`radius.full` → `radius.md`), borda `canvas.tool.border.selected` + fundo `color.actionContainer` (ou `check` em `canvas.pen.onPen` nas cores) | Altera apenas novos elementos (preserva elementos anteriores) | `accessibilityRole="button"`, `accessibilityState={{ selected: true }}` |
| **Foco (`:focus-visible`)** | Anel duplo externo (`border.focus` em `canvas.tool.border.focus` com offset `color.focus-offset`) | Visível apenas na navegação por teclado/switch (`useKeyboardFocus`) | Preserva contraste e visibilidade |
| **Bloqueado (`disabled`)** | Folha ignora gestos (`opacity: 0.7`); ferramentas em `color.disabled-bg` e `color.disabled-text` | Ativado ao encerrar o turno (`00:00`) ou durante modal de saída | `accessibilityState={{ disabled: true }}` |

---

## 6. Acessibilidade (`WCAG 2.1 AA` / `RNF05`–`RNF09`)

- **Alvos de toque (`RNF07`):** Todos os seletores (pincel, 4 formas, contorno/preenchido, 4 cores, 2 espessuras, *Desfazer* e *Limpar*) possuem no mínimo `48 dp × 48 dp` (`canvas.tool.size`) e espaçamento mínimo de `8 dp` (`space.sm`).
- **Independência de cor (`RNF06` / WCAG 1.4.1):** Seleções combinam **mudança de forma** (`9999 dp` → `16 dp`), **borda ativa** (`canvas.tool.border.selected`), **ícone** (`check` nas cores; ícones distintos por forma e preenchimento) e **rótulo textual** (`"Pincel livre"`, `"Forma Linha"`, `"Forma Retângulo"`, `"Forma Círculo"`, `"Forma Triângulo"`, `"Estilo Contorno"`, `"Estilo Preenchido"`, `"Cor Grafite"`, etc.).
- **Contraste não textual (`RNF05` / WCAG 1.4.11):** Todas as 4 cores atingem contraste `>= 4,88:1` sobre `canvas.paperBg` (`#FDF8FF`), tanto em contorno quanto preenchidas.
- **Redução de movimento (`RNF09`):** Quando `reduceMotion === true`, transições de forma e desaparecimento do overlay de tema ocorrem sem animação elástica.
