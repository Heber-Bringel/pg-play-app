# Modal de Confirmação e Aviso (ConfirmModal)

Origem no sistema base: Material 3 Basic Dialog. Situação: **Adaptado** (`v1.1.0`). Motivo da adaptação: emblema expressivo no cabeçalho, suporte tanto para **diálogo de confirmação (2 botões)** quanto para **diálogo informativo/encerramento (1 botão só, #54)** e anúncio acessível ao leitor de tela.

## Quando usar

- **Modo 2 botões (confirmação):** antes de ações destrutivas ou irreversíveis (ex.: sair da rodada/sala, zerar placar do PG, encerrar sem o Momento de Oração).
- **Modo 1 botão (encerramento/aviso — `v1.1.0`):** quando não existe ação de cancelar (basta omitir `onCancel` ou `cancelLabel`), como o encerramento acolhedor do encontro no Termômetro (#54).

## Quando não usar

- Para feedback rápido de acerto/erro que não exige interrupção do fluxo.

## Anatomia

1. **Scrim (`color.scrim`):** fundo semitransparente que isola o diálogo. Quando `onCancel` está presente e `dismissable !== false`, tocar fora fecha o modal; no modo de 1 botão sem `onCancel`, o fechamento ocorre apenas pelo botão principal.
2. **Card do diálogo (`card.bg`, `card.border`, `card.radius`, `elevation.floating`):** largura máxima `420 dp`, padding `card.padding`.
3. **Cabeçalho:** emblema (`56 dp × 56 dp`) com ícone `icon.lg` + título `font.subtitle`.
4. **Descrição opcional (`font.body`, `color.on-surface-muted`):** explica a consequência ou mensagem de encerramento.
5. **Ações:**
   - **2 botões:** `ExpressiveButton variant="tonal"` (cancelar) + `ExpressiveButton variant="secondary"` ou `confirmVariant` (confirmar).
   - **1 botão:** apenas `ExpressiveButton` principal (`confirmVariant = 'primary'` quando não há cancelamento).

## Acessibilidade

- Usa `accessibilityViewIsModal` no container do modal e `accessibilityLiveRegion="polite"` no card de diálogo para anunciar automaticamente abertura e mensagem no TalkBack/VoiceOver (#54).
- Os botões internos herdam foco exclusivo para teclado (`:focus-visible`) do `ExpressiveButton`.
