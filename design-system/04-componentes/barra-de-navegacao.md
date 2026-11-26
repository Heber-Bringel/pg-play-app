# Barra de Navegação Compacta (`ShortNavigationBar`)

> Versão: 1.2.0 · Origem: **Herdado** (Google Material 3 Expressive 2025 — *Short Navigation Bar*)

## 1. Quando usar

- Para navegação global persistente entre os **3 destinos principais da sessão** do aplicativo: **`Início`** (Hub de Jogos `/`), **`Equipes`** (`/teams`) e **`Placar`** (`/scoreboard`). A tela de abertura (`welcome`) aparece apenas na inicialização do app (Cold Start) e não compõe a barra de navegação. O tema claro/escuro e o som são alternados por botões de 1 toque no cabeçalho (`AppHeader`), sem destino próprio na barra.
- Ancorada de ponta a ponta na base (*edge-to-edge*) sobre `color.surfaceContainer`, nunca flutuando como pílula para navegação macro (no Material 3 Expressive, pílulas flutuantes são reservadas para *Floating Toolbars* de ações locais).

---

## 2. Anatomia e Tokens (`PG Play Expressive v1.2.0`)

| Parte | Token | Valor / Regra |
| :--- | :--- | :--- |
| Fundo da barra | `navBar.bg` (`color.surfaceContainer`) | `#FFFFFF` (Claro) / `#1D1B20` (Escuro) |
| Divisor superior | `navBar.borderTop` (`color.outline`) | Espessura `navBar.borderWidth` (`1 dp`) apenas no topo |
| Indicador ativo (pílula) | `navBar.indicatorBg` (`color.actionContainer`) | `56 dp × 32 dp`, raio `navBar.radius` (`radius.full`) |
| Ícone ativo | `navBar.activeIcon` (`color.onActionContainer`) | `24 dp` (`icon.md`), estilo preenchido |
| Rótulo ativo | `navBar.activeLabel` (`color.onSurface`) | `font.caption` (`12 dp`, `Bold`) |
| Ícone inativo | `navBar.inactiveIcon` (`color.onSurfaceMuted`) | `24 dp` (`icon.md`), estilo contornado (`-outline`) |
| Rótulo inativo | `navBar.inactiveLabel` (`color.onSurfaceMuted`) | `12 dp`, `Regular` |
| Alvo mínimo de toque | `navBar.itemMinHeight` (`space['2xl']`) | `48 dp` mínimo por destino |

---

## 3. Acessibilidade (WCAG 2.1 AA / IHC)

1. O container usa `accessibilityRole="tablist"`.
2. Cada item usa `accessibilityRole="tab"`, `accessibilityLabel` descritivo e `accessibilityState={{ selected: isActive }}`.
3. Todos os itens exibem **ícone + rótulo textual** (nunca apenas ícone sem texto), garantindo compreensão imediata por qualquer faixa etária no Pequeno Grupo.
4. Suporta navegação por teclado/switch com `useKeyboardFocus` e anel duplo M3 (`getFocusRingStyle`).
