# Botão (ExpressiveButton)

Origem no sistema base: Material 3 Expressive, Filled / Tonal / Outlined / Text / Icon Button com *Shape Morphing*. Situação: **Adaptado**. Motivo da adaptação: inclusão de transformação elástica de forma (`9999 dp` para `16 dp` ao pressionar), variante **Jumbo (`64 dp`)** para toques rápidos em grupo e variantes **`text`** e **`icon`** (`v1.1.0`) para ações discretas e controles compactos de `48 dp × 48 dp`.

## Quando usar

- **`primary` / `primaryJumbo`:** ação principal única da tela (ex.: *"Começar Rodada!"*, *"Próximo"*).
- **`successJumbo`:** confirmação de acerto na Arena de Mímica.
- **`secondary`:** ação alternativa de jogo (ex.: *"Pular Palavra"*).
- **`tonal`:** ação complementar na mesma tela (ex.: *"Adicionar Equipe"*, *"Revelar Palavra"*).
- **`outlined`:** ação de saída ou cancelamento secundário (ex.: *"Sair"*, *"Zerar Placar"*).
- **`text` (`v1.1.0`):** ação discreta sem preenchimento nem borda (ex.: *"Encerrar roda"* na #51), evitando competição visual com o botão principal.
- **`icon` (`v1.1.0`):** ação compacta somente com ícone (`48 dp × 48 dp` mínimo), como *"Pausar"* (#51) ou *"Remover equipe/jogador/coluna"*, sempre acompanhada de `accessibilityLabel`.

## Quando não usar

- Para filtros ou seletores de opção múltipla (use [Chip](chip.md) ou [Item Selecionável](item-selecionavel.md)).
- Para exibir metadados não interativos (use [Tag](tag.md)).
- Para alternativas do Quiz (use [Alternativa de Quiz](alternativa-quiz.md)) ou teclado da Forca (use [Teclado da Forca](teclado-forca.md)).

## Anatomia

1. **Container interativo:** altura mínima `button.minHeight` (`48 dp`), `button.jumbo.height` (`64 dp`) nas variantes Jumbo ou `button.iconSize` (`48 dp × 48 dp`) na variante `icon`. Raio `button.radius` (`9999 dp`) em repouso transformando para `button.radiusPressed` (`16 dp`) no toque.
2. **Ícone (`icon.md` = `24 dp`):** opcional à esquerda nas variantes com rótulo; obrigatório na variante `icon`.
3. **Rótulo (`font.label` = `16 dp`, `PlusJakartaSans_700Bold`):** exibido em todas as variantes exceto `icon`.

## Variantes

| Variante | Uso | Tokens |
| --- | --- | --- |
| `primary` | Ação principal em formulários e modais | `button.bg`, `button.label`, `button.minHeight`, `button.radius` |
| `primaryJumbo` | Ação principal em dinâmicas rápidas | `button.bg`, `button.label`, `button.jumbo.height`, `button.radius`, `space.xl` |
| `successJumbo` | Confirmar acerto na Mímica | `color.success`, `color.on-success`, `button.jumbo.height`, `button.radius` |
| `secondary` | Ação alternativa de jogo | `color.secondary`, `color.on-secondary`, `button.minHeight`, `button.radius` |
| `tonal` | Ação complementar | `color.action-container`, `color.on-action-container`, `button.minHeight`, `button.radius` |
| `outlined` | Ação de saída ou secundária neutra | `color.surface-container`, `button.border.outlined`, `color.on-surface` |
| `text` | Ação discreta de baixa ênfase (#51) | `color.transparent` (fundo), `color.action` (texto), `button.minHeight` |
| `icon` | Ação compacta somente com ícone (#51 / lixeira) | `button.iconSize` (`48 dp × 48 dp`), `radius.full`, `tone?: 'default' \| 'danger'` |

## Estados

| Estado | Aparência (tokens) | Comportamento | Acessibilidade |
| --- | --- | --- | --- |
| Padrão | Fundo/texto da variante, raio `button.radius` (`9999 dp`) | Aguarda interação | `accessibilityRole="button"`, `accessibilityLabel` |
| Pressionado | Fundo `button.bgPressed` (ou `surfaceVariant` / `errorContainer`), raio `button.radiusPressed` (`16 dp`) | *Shape Morphing* imediato | Feedback tátil |
| Foco (`:focus-visible`) | **Anel duplo externo** de `3 dp` (`border.focus`) em `button.border.focus` (`color.focus` = `onSurface`) com `outlineOffset` sobre `surface` | Visível **apenas** por teclado/switch (`useKeyboardFocus`); nunca no clique/toque | Contraste `16,30:1` (claro) e `14,35:1` (escuro) |
| Desabilitado | Fundo `button.bgDisabled`, texto `button.labelDisabled` (≥ 4,53:1 no escuro), `elevation.none` | Ignora eventos (`disabled={true}`) | `accessibilityState={{ disabled: true }}` |

## Acessibilidade

- **Alvo mínimo:** `48 dp × 48 dp` em todas as variantes (inclusive `text` e `icon`), e `64 dp` de altura nas Jumbo.
- **Foco sem erro falso:** clicar ou tocar não aciona borda nem altera a cor do contorno.
- **Variante `icon`:** `accessibilityLabel` obrigatório (ou derivado de `label`) descrevendo exatamente a ação (ex.: `"Remover equipe Tribo de Judá"`).

## Faça e evite

- **Faça:** mantenha apenas 1 botão `primary`/`primaryJumbo` por tela e use `text` ou `icon` para ações auxiliares discretas.
- **Evite:** empilhar 3 ou 4 botões preenchidos de largura total na mesma tela ou criar `<Pressable>` manuais para ícones de remoção/pausa.
