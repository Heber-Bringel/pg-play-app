# Tag (ExpressiveTag)

Origem no sistema base: Material 3 Assist / Status Badge. Situação: **Novo** (`v1.1.0`). Motivo da criação: unificar mais de 20 estilos soltos de badges/tags espalhados pelas telas do **PG PLAY** (incluindo a tag de jogadores do `GameCard`), corrigindo o baixo contraste de fundo (`1,15:1`) e a tipografia pequena (`12 dp`) para atender ao `RNF04` (leitura à distância) e à WCAG 1.4.11 (`>= 3:1`).

## Quando usar

- Para exibir metadados não interativos: modalidade e número de jogadores no `GameCard`, código da sala, equipe da vez, contador de equipes/jogos, categoria da carta, alinhamento/status no Cidade Dorme e Adedonha.

## Quando não usar

- Para elementos clicáveis, filtros ou seletores (use [Chip](chip.md) ou [Botão](botao.md)).

## Anatomia

1. **Container pílula (`radius.full`):** preenchimento e borda (`border.thin` = `2 dp`) definidos pelos tokens `component.tag.<tone>.{bg, border}`, padding horizontal `space.sm`/`space.md` e vertical `space.xs`.
2. **Ícone opcional (`icon.sm` = `16 dp`):** à esquerda do texto, na cor `component.tag.<tone>.text`.
3. **Texto (`font.tag` = `14 dp`, `PlusJakartaSans_700Bold`, altura de linha `18 dp`):** legível à distância com `allowFontScaling` e `maxFontSizeMultiplier={typography.maxScale}`.

## Variantes (Tons)

| Tom (`tone`) | Uso | Fundo (`bg`) | Borda (`border`, ≥ 3:1) | Texto (`text`, ≥ 4,5:1) |
| --- | --- | --- | --- | --- |
| `neutral` | Metadados gerais, modalidade, contador de jogos | `surface-variant` | `outline` (**4,55:1** / **5,39:1**) | `on-surface` (**14,85:1** / **11,08:1**) |
| `action` | Código de sala, turno da equipe, destaque informativo | `action-container` | `action` (**8,98:1** / **9,66:1**) | `on-action-container` (**12,83:1** / **11,80:1**) |
| `secondary` | Categoria de jogo, modo especial, palavra repetida | `secondary-container` | `secondary` (**5,18:1** / **10,12:1**) | `on-secondary-container` (**13,66:1** / **6,38:1**) |
| `success` | Acerto, palavra única, alinhamento Cidade, sigilo confirmado | `success-container` | `success` (**5,02:1** / **12,16:1**) | `on-success-container` (**13,57:1**) |
| `error` | Tentativas críticas, erro/alerta, alinhamento Assassino | `error-container` | `error` (**6,47:1** / **9,00:1**) | `on-error-container` (**13,22:1** / **8,51:1**) |
| `highlight` | Líder do ranking, pontuação destacada | `highlight-container` | `highlight-border` (**4,92:1** / **11,15:1**) | `on-highlight-container` (**15,90:1** / **13,57:1**) |

## Acessibilidade

- **Sem papel de botão:** `ExpressiveTag` é puramente informativa (não recebe `onPress` nem `accessibilityRole="button"`), evitando que usuários ou leitores de tela tentem clicar em rótulos estáticos (#53).
- **Contraste duplo:** todos os 6 tons possuem contraste de borda `>= 4,55:1` contra superfícies e contraste de texto `>= 6,38:1` contra o fundo da tag em ambos os temas.
