# Chip (ExpressiveChip)

Origem no sistema base: Material 3 Expressive, Filter / Choice Chip com *Shape Morphing*. Situação: **Adaptado** (`v1.1.0`). Motivo da adaptação: alvo mínimo garantido de `48 dp × 64 dp`, tokens dedicados de borda por estado (`component.chip.border.*`), tipografia legível `font.tag` (`14 dp`, `PlusJakartaSans_700Bold`) e anel de foco exclusivo para teclado (`:focus-visible`).

## Quando usar

- Para filtros de modalidade no Hub (`Todos`, `1 Celular`, `Multi-Celular`).
- Para seleção de modo, parâmetros de rodada ou abas compactas (`role="tab"`).
- Para marcação de resposta/status clicável na apuração da Adedonha.

## Quando não usar

- Para rótulos puramente informativos sem ação (use [Tag](tag.md) — `ExpressiveTag`).
- Para ação principal da tela (use [Botão](botao.md)).

## Variantes (Tons)

| Tom (`tone`) | Uso | Tokens de borda e cor |
| --- | --- | --- |
| `neutral` | Filtro ou opção padrão | `chip.border.default` (repouso) / `chip.border.selected` (ativo), `color.action-container` |
| `action` | Destaque de ação ou aba ativa | `chip.border.selected`, `color.action-container`, `color.on-action-container` |
| `success` | Marcação positiva (ex.: palavra única na Adedonha) | `chip.border.success`, `color.success`, `color.on-success` |
| `secondary` | Marcação intermediária (ex.: palavra repetida) | `chip.border.secondary`, `color.secondary`, `color.on-secondary` |
| `error` | Marcação negativa (ex.: palavra inválida) | `chip.border.error`, `color.error`, `color.on-error` |

## Estados

| Estado | Aparência (tokens) | Comportamento | Acessibilidade |
| --- | --- | --- | --- |
| Padrão | `color.surface-container`, `chip.border.default`, `radius.full` | Aguarda toque | `accessibilityRole` (`button` ou `tab`), `accessibilityState={{ disabled, selected }}` |
| Pressionado | `color.surface-variant`, `radius.md` (`16 dp`) | *Shape Morphing* imediato | — |
| Selecionado | Fundo e borda do tom (`chip.border.selected` / `success` / `secondary` / `error`) | Mantém estado selecionado com ícone opcional | `accessibilityState={{ selected: true }}` |
| Foco (`:focus-visible`) | **Anel duplo externo** (`border.focus` em `chip.border.focus` com offset `surface`) | Visível **apenas** via teclado/switch; nunca no clique/toque | Preserva a borda de estado do chip sem substituí-la por vermelho/coral |
| Desabilitado | `color.disabled-bg`, `chip.border.disabled`, `color.disabled-text` | Ignora interação | `accessibilityState={{ disabled: true }}` |

## Acessibilidade

- **Alvo mínimo:** `48 dp` de altura (`space['2xl']`) e `64 dp` de largura mínima (`space['3xl']`).
- **Independência de cor:** combine o estado selecionado com ícone (ex.: `check-circle`) sempre que possível.
