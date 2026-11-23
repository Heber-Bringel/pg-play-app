# Componentes Visuais do Cidade Dorme (`CidadeDormePhaseTimeline` e `CidadeDormeCityPanel`)

Origem no sistema base: Adaptados dos subsistemas de *Shape Morphing*, *Motion Physics* e indicadores de progresso do Material 3 Expressive (2025), alinhados à **Issue `#56`** e ao **PG Play Expressive (`design-system/02-tokens.md`)**.
Observação de alinhamento (`Issue #55`): Estes componentes reutilizam **exclusivamente** os tokens semânticos e de componente já existentes em `src/view/theme.ts` (`tokens` e `darkTokens`), sem introduzir novos tokens de borda/tag ou cores literais.

---

## 1. Quando usar

- **`CidadeDormePhaseTimeline`**: No topo das fases ativas de partida do Cidade Dorme (`night_*`, `day_debate`, `day_voting`, `vote_result`) para situar todos os jogadores no ciclo `Noite → Amanhecer → Debate → Votação` e na rodada atual (`Noite N` / `Dia N`).
- **`CidadeDormeCityPanel`**: Logo abaixo da linha do tempo (ou durante `role_reveal` e `day_voting`) para exibir o resumo público `"Vivos X · Eliminados Y"`, a grade de avatares dos participantes e a barra visual de progresso de `"Prontos X/Y"` ou `"Votos X/Y"`.

## 2. Quando não usar

- Em telas pré-jogo (`lobby`) ou fora do fluxo de sala multiplayer do Cidade Dorme.
- Nunca exibir papéis secretos (`Assassino`, `Anjo`, `Detetive`, `Cidadão`) nos avatares do `CidadeDormeCityPanel` antes da fase `finished` (`RNF11`).

---

## 3. Anatomia e Tokens

### `CidadeDormePhaseTimeline`
- **Container:** `card.bg`, borda `border.thin` (`2 dp`) em `color.outline`, raio `radius.lg` (`20 dp`), padding `space.md` (`16 dp`). Suporta `themeMode: 'light' | 'dark'` (`tokens` / `darkTokens`).
- **Cabeçalho da trilha:** Rótulo do ciclo (`"Ciclo N · Noite"` ou `"Ciclo N · Dia"`) em `font.caption` + `color.onSurfaceMuted`.
- **Passos (`Noite`, `Amanhecer`, `Debate`, `Votação`):**
  - Passo ativo: fundo `color.actionContainer`, borda `color.action`, raio `radius.md` (`16 dp`), ícone (`weather-night`, `weather-sunny`, `forum-outline`, `vote-outline`) e texto em `color.onActionContainer`.
  - Passo concluído: fundo `color.surfaceVariant`, ícone `check-circle` em `color.success`, raio `radius.full`.
  - Passo pendente: fundo `color.surface`, borda `color.outline`, texto em `color.onSurfaceMuted`, raio `radius.full`.
- **Regra de Sigilo (`RNF11`):** Durante qualquer fase noturna (`night_assassin`, `night_angel`, `night_detective`), o passo ativo é sempre `Noite`, idêntico em todos os celulares.

### `CidadeDormeCityPanel`
- **Contador de Status:** Texto `"Vivos X · Eliminados Y"` em `font.subtitle`, acompanhado de pílulas visuais (`color.actionContainer` / `color.disabledBg`).
- **Barra de Progresso (`Prontos X/Y` em `role_reveal` e `Votos X/Y` em `day_voting`):**
  - Trilho: altura `space.sm` (`8 dp`), fundo `color.surfaceVariant`, raio `radius.full`.
  - Preenchimento: `color.action`, animado suavemente (`motion.duration.medium`) quando `reduceMotion === false` e instantâneo (`0 ms`) quando `reduceMotion === true`.
- **Grade de Avatares (`flexWrap: 'wrap'` para 390 px):**
  - **Jogador Vivo:** fundo `color.surface`, borda `color.outline`, avatar circular `space.xl` (`32 dp`) em `color.actionContainer` com inicial/número, nome em `color.onSurface`.
  - **Jogador Eliminado:** fundo `color.disabledBg`, borda `color.outline`, ícone `ghost-outline` em `color.disabledText` e rótulo `"Eliminado"` (sem revelar o papel secreto).

---

## 4. Movimento e Acessibilidade (`RNF06`, `RNF08`, `RNF09`, `RNF11`)

- **Redução de movimento (`RNF09`):** Todos os componentes aceitam `reduceMotion?: boolean` (sincronizado com `AccessibilityInfo.isReduceMotionEnabled()`). Quando `true`, todas as animações (`motion.spring.spatial`, `motion.spring.effects`, `motion.duration.*`, pulso crítico e flip) executam sem movimento (`0 ms`).
- **Independência de cor (`RNF06`):** Estados combinam cor semântica + forma (`radius.md` vs `radius.full`) + ícone (`check-circle`, `ghost-outline`, `shield-check`, `alert-circle`) + rótulo textual.
- **Texto ampliado:** Todos os `<Text>` usam `allowFontScaling` e containers utilizam `minHeight` / `flexWrap: 'wrap'`.
