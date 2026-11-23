# Item Selecionável (SelectableOptionItem)

Origem no sistema base: Material 3 Expressive, Interactive List Option Card. Situação: **Adaptado** (`v1.1.0`). Motivo da adaptação: alvo mínimo de `56 dp`, emblema numérico ou icônico à esquerda, tokens dedicados `component.option.*` (`border.{default, selected, focus, disabled, error}`), tema escuro automático via `useTheme()` e anel de foco exclusivo para teclado (`:focus-visible`).

## Quando usar

- Para selecionar um jogador alvo na fase Noite ou na votação do Dia no **Cidade Dorme**.
- Para listas curtas de escolha exclusiva onde cada opção precisa de destaque visual alto para toque em grupo.

## Quando não usar

- Para alternativas de múltipla escolha com feedback imediato de certo/errado do Quiz (use [Alternativa de Quiz](alternativa-quiz.md)).
- Para filtros compactos horizontais (use [Chip](chip.md)).

## Estados

| Estado | Aparência (tokens) | Comportamento | Acessibilidade |
| --- | --- | --- | --- |
| Padrão | `option.bg.default`, `option.border.default`, `option.radius` (`20 dp`) | Aguarda seleção | `accessibilityRole="button"`, `accessibilityState={{ disabled, selected }}` |
| Pressionado | `radius.md` (`16 dp`) | *Shape Morphing* imediato | — |
| Selecionado | `option.bg.selected`, `option.border.selected`, `radius.md`, ícone `check-circle` | Indica opção escolhida por cor + forma + ícone | `accessibilityState={{ selected: true }}` |
| Erro | `color.error-container`, `option.border.error` | Estado inválido (quando `error={true}`) | Combinado com ícone/mensagem textual |
| Foco (`:focus-visible`) | **Anel duplo externo** (`border.focus` em `option.border.focus` com offset `surface`) | Visível **apenas** por teclado/switch; nunca no toque/clique | Contraste `>= 14,35:1` |
| Desabilitado | `option.bg.disabled`, `option.border.disabled`, `color.disabled-text` | Não selecionável | `accessibilityState={{ disabled: true }}` |

## Acessibilidade

- **Alvo mínimo:** `56 dp` de altura (`option.minHeight`).
- **Tema escuro automático:** herda o tema ativo via `useTheme()`, aceitando `themeMode` opcional apenas como override retrocompatível.
