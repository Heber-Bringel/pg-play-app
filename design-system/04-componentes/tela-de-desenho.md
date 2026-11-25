# Tela de Desenho (`DrawingCanvas`)

Origem no sistema base: Adaptado dos subsistemas de *Shape Morphing*, barras de ferramentas contextuais e controles de toque amplos do Material 3 Expressive (2025), alinhado à **Issue `#83`** (`UC12` — **Desenho Relâmpago**) e aos tokens em [`02-tokens.md`](../02-tokens.md). Situação: **Novo** (`v1.2.0`).

---

## 1. Quando usar

- Na fase ativa de desenho do minigame **Desenho Relâmpago** (`UC12`, `RF41`), permitindo ao representante da equipe traçar livremente com o dedo enquanto o grupo acompanha o desenho em tempo real no mesmo celular.

## 2. Quando não usar

- Nunca utilizar para coleta de assinatura formal, escrita de texto/números (proibido pela regra de honra `RF42`) ou edição de imagens externas.
- Não usar como área decorativa estática fora de uma arena de desenho interativa.

---

## 3. Anatomia e Arquitetura Visual

O componente `DrawingCanvas` (`src/view/components/drawingCanvas.tsx`) é puramente apresentacional (recebe `strokes`, `selectedColor`, `selectedWidth`, `disabled`, `reduceMotion` e callbacks via `props`) e divide-se em duas regiões:

1. **Folha de Papel (`Svg` + `PanResponder`):**
   - Renderiza os traços concluídos e o traço em andamento usando `<Svg>` e `<Path>` de `react-native-svg` combinados ao `PanResponder` nativo do `react-native` (compatível com Expo Go no Android, iOS e Web, sem dependência de `react-native-gesture-handler`).
   - Mantém fundo de papel claro fixo (`canvas.paperBg` → `color.canvas-paper` / `#FDF8FF`) tanto no tema Claro quanto no Escuro para que as 4 cores de caneta preservem contraste WCAG AA (`>= 4,88:1` a `16,42:1`) sem inversão cromática inesperada no meio do desenho.
   - Contorno de `border.thin` (`2 dp`) em `canvas.border` (`color.outline`), cantos arredondados `canvas.radius` (`radius.lg` = `20 dp`) e altura mínima `canvas.minHeight` (`256 dp` = `space['3xl'] * 4`).
   - Quando não há nenhum traço (`strokes.length === 0` e sem gesto ativo), exibe marca-d'água centralizada em `color.on-highlight` / `font.body` com ícone `gesture-swipe` orientando: *"Arraste o dedo para desenhar · Sem letras nem números"*.

2. **Barra de Ferramentas Expressiva (abaixo da folha):**
   - **Seletor de 4 Cores de Caneta (`ink`, `purple`, `coral`, `green`):** botões de amostra com alvo mínimo `canvas.tool.size` (`48 dp × 48 dp`) e espaçamento `space.sm` (`8 dp`).
   - **Seletor de 2 Espessuras (`thin` = `4 dp`, `thick` = `8 dp`):** controles com alvo mínimo `48 dp × 48 dp` exibindo indicador visual proporcional à espessura (`canvas.stroke.thin` vs `canvas.stroke.thick`) e rótulo acessível.
   - **Ações Rápidas de Traço (`Desfazer` e `Limpar`):** botões `ExpressiveButton` (variantes `tonal` / `outlined` ou `icon` com `48 dp`) com ícones `undo-variant` e `trash-can-outline`, desabilitados automaticamente quando `strokes.length === 0` ou `disabled === true`.

---

## 4. Tokens Aplicados (`component.canvas`)

| Token | Aponta para | Valor Resolvido | Uso |
| :--- | :--- | :--- | :--- |
| `canvas.paperBg` | `color.canvas-paper` | `#FDF8FF` (Claro/Escuro) | Fundo fixo de papel da folha de desenho |
| `canvas.border` | `color.outline` | `#79747E` / `#938F99` | Contorno da folha (`border.thin` = `2 dp`, ≥ 4,35:1) |
| `canvas.radius` | `radius.lg` | `20 dp` | Cantos arredondados da área de desenho |
| `canvas.minHeight` | `space.3xl * 4` | `256 dp` | Altura mínima ergonômica para desenhar com o dedo |
| `canvas.pen.ink` | `color.canvas-ink` | `#1D1B20` (16,42:1) | Caneta Grafite (padrão inicial) |
| `canvas.pen.purple` | `color.canvas-purple` | `#5B21B6` (8,84:1) | Caneta Roxo Expressivo |
| `canvas.pen.coral` | `color.canvas-coral` | `#C2410C` (4,90:1) | Caneta Coral Vibrante |
| `canvas.pen.green` | `color.canvas-green` | `#15803D` (4,88:1) | Caneta Verde Folha |
| `canvas.stroke.thin` | `space.xs` | `4 dp` | Traço fino para detalhes |
| `canvas.stroke.thick` | `space.sm` | `8 dp` | Traço grosso para contornos rápidos |
| `canvas.tool.size` | `space.2xl` | `48 dp` | Largura e altura mínimas dos seletores da barra |
| `canvas.tool.radius` | `radius.full` | `9999 dp` | Forma circular em repouso |
| `canvas.tool.radiusSelected` | `radius.md` | `16 dp` | *Shape Morphing* quando a cor/espessura está ativa |
| `canvas.tool.border.default` | `color.outline` | `#79747E` / `#938F99` | Borda da ferramenta em repouso |
| `canvas.tool.border.selected` | `color.action` | `#5B21B6` / `#D8B4FE` | Borda de destaque da ferramenta selecionada |
| `canvas.tool.border.focus` | `color.focus` | `#1D1B20` / `#E6E0E9` | Anel externo de foco via teclado (`:focus-visible`) |

---

## 5. Estados

| Estado | Aparência (tokens) | Comportamento | Acessibilidade |
| :--- | :--- | :--- | :--- |
| **Vazio (Inicial)** | `canvas.paperBg`, `canvas.border`, instrução central sutil | Aguarda primeiro toque na folha; `Desfazer` e `Limpar` desabilitados | Folha com `accessibilityLabel="Área de desenho em branco. Sem letras nem números"` |
| **Desenhando** | Traço contínuo renderizado em tempo real com `strokeLinecap="round"` e `strokeLinejoin="round"` | Captura pontos `(x, y)` no `PanResponder` e emite `onStrokeComplete` ao soltar o dedo | `Desfazer` e `Limpar` habilitam após o 1º traço |
| **Ferramenta Selecionada** | *Shape Morphing* (`radius.full` → `radius.md`), borda `canvas.tool.border.selected` + ícone `check` sobre a cor ativa | Troca a cor ou espessura apenas dos próximos traços (preserva os anteriores) | `accessibilityRole="button"`, `accessibilityState={{ selected: true }}` |
| **Foco (`:focus-visible`)** | Anel duplo externo (`border.focus` em `canvas.tool.border.focus` com offset `color.focus-offset`) | Visível apenas na navegação por teclado/switch (`useKeyboardFocus`) | Mantém a cor da amostra visível |
| **Bloqueado (`disabled`)** | Folha ignora novos gestos; ferramentas em `color.disabled-bg` e `color.disabled-text` | Ativado quando o cronômetro chega a `00:00` ou durante modal de saída | `accessibilityState={{ disabled: true }}` |

---

## 6. Acessibilidade (`WCAG 2.1 AA` / `RNF05`–`RNF09`)

- **Alvos de toque (`RNF07`):** Todos os seletores de cor, seletores de espessura e botões (`Desfazer`, `Limpar`) possuem no mínimo `48 dp × 48 dp` (`canvas.tool.size`) e espaçamento mínimo de `8 dp` (`space.sm`).
- **Independência de cor (`RNF06` / WCAG 1.4.1):** A caneta ativa nunca é indicada apenas pela cor: combina **mudança de forma** (`9999 dp` → `16 dp`), **borda ativa** (`canvas.tool.border.selected`), **ícone `check` contrastante** no centro da amostra e **rótulo textual no leitor de tela** (`"Cor Grafite"`, `"Cor Roxo"`, `"Cor Coral"`, `"Cor Verde"`).
- **Contraste não textual (`RNF05` / WCAG 1.4.11):** Todas as 4 cores de caneta atingem contraste `>= 4,88:1` sobre `canvas.paperBg` (`#FDF8FF`), superando com folga o mínimo de `3,0:1` para elementos gráficos.
- **Redução de movimento (`RNF09`):** Quando `reduceMotion === true`, a transição de forma dos seletores ocorre de forma instantânea (`0 ms`), sem mola elástica.
