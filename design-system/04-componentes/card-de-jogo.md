# Card de Minigame (GameCard)

Origem no sistema base: Material 3 Expressive, Outlined + Elevated Card com *Shape Library Badges*. Situação: **Adaptado** (revisado na `v1.1.0`). Motivo da adaptação: cantos Extra Large (`card.radius` = `28 dp`), borda de alto contraste (`>= 4,35:1`), borda exclusiva para líder (`card.borderLeader` = `color.highlight-border`, `>= 4,70:1`), tag padronizada com [`ExpressiveTag`](tag.md) em `14 dp` e foco exclusivo para teclado (`:focus-visible`).

## Quando usar

- No Hub de Jogos (Home) para apresentar cada minigame disponível ou o resumo do Placar.
- Na tela de Placar do PG para listar cada equipe no pódio com destaque para o 1º lugar (`highlightLeader`).
- Em estados informativos (erro ou vazio) com título, tag e descrição concisa.

## Quando não usar

- Para botões de ação isolados (use [Botão](botao.md)).
- Para alternativas clicáveis de lista/Quiz (use [Alternativa de Quiz](alternativa-quiz.md) ou [Item Selecionável](item-selecionavel.md)).

## Anatomia

1. **Container principal:** fundo `card.bg` (`color.surface-container`), borda de `2 dp` (`border.thin`) em `card.border` (`color.outline`), raio `card.radius` (`28 dp`), padding `card.padding` (`24 dp`) e sombra `elevation.card`.
2. **Emblema geométrico:** container de `56 dp × 56 dp` (`card.badgeSize`), raio `radius.lg`, fundo `color.action-container` e ícone `icon.lg` (`28 dp`).
3. **Tag de metadados (`ExpressiveTag`):** exibe `playersTag` usando `ExpressiveTag` com tom `highlight` quando `highlightLeader={true}` e `neutral` nos demais casos (`font.tag` = `14 dp`, borda com contraste ≥ 4,55:1).
4. **Título e descrição:** título em `font.subtitle` (`18 dp`, `PlusJakartaSans_700Bold`) e descrição em `font.body` (`16 dp`, `color.on-surface-muted`).

## Variantes e Estados

| Estado | Aparência (tokens) | Comportamento | Acessibilidade |
| --- | --- | --- | --- |
| Padrão | `card.bg`, `card.border`, `card.radius` (`28 dp`) | Resumo estático ou cartão interativo | `accessibilityRole="button"` (se `onPress`) ou `"summary"` |
| Pódio Líder | `card.borderLeader` (`#A16207` claro / `#FACC15` escuro), `ExpressiveTag tone="highlight"`, `elevation.floating` | Destaca 1º lugar sem violar WCAG 1.4.11 | Contraste de borda `4,70:1` (claro) / `12,14:1` (escuro) |
| Pressionado | `card.borderPressed` (`color.action`), `radius.md` (`16 dp`) | *Shape Morphing* ao tocar | Dispara `onPress` |
| Foco (`:focus-visible`) | Anel duplo externo de `3 dp` em `card.borderFocus` (`color.focus`) | Somente navegação por teclado/switch | Contraste `>= 14,35:1` |
| Desabilitado | `color.disabled-bg`, texto `color.disabled-text`, `elevation.none` | Jogo indisponível | `accessibilityState={{ disabled: true }}` |

## Acessibilidade

- **Alvo de toque mínimo:** altura mínima superior a `120 dp` quando interativo.
- **Legibilidade à distância (`RNF04`):** `playersTag` agora renderiza via `ExpressiveTag` (`14 dp`, borda ≥ 4,55:1), resolvendo o baixo contraste (`1,15:1`) e o tamanho `12 dp` da `v1.0.0`.
