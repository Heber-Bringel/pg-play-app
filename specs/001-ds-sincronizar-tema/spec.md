# 📋 Especificação de Funcionalidade (`spec.md`): ds-sincronizar-tema

- **Branch da Feature:** `feat/001-ds-sincronizar-tema`
- **Criado em:** 2026-11-09
- **Status:** Aprovado
- **Milestone:** `v0.1.0 — Fundação: Harness MVVM & Design System`
- **Caso(s) de Uso / Requisito(s):** Fundação visual e Design System PG Play Expressive v1.0.0 (`design-system/`)
- **Issue vinculada:** `#8` (`[DS] Sincronizar src/view/theme.ts e os 6 componentes do PG Play Expressive`)

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Renderização de Componentes e Tokens Semânticos nos Modos Claro e Escuro (Prioridade: P1)

Como desenvolvedor ou usuário do PG PLAY, desejo que a aplicação utilize tokens semânticos centralizados e componentes consistentes com o sistema PG Play Expressive (Material 3 Expressive), para que a interface ofereça alto contraste, ergonomia para dinâmicas em grupo e suporte tanto ao modo claro quanto escuro.

**Por que esta prioridade:** O Design System é a base visual e de acessibilidade (WCAG 2.1 AA) de todas as telas e minigames subsequentes do aplicativo.

**Como testar independentemente:** Executar a suíte de testes em `tests/tokens.test.ts` e `tests/components.test.tsx`, garantindo que os valores correspondam à especificação de `design-system/02-tokens.md` e `04-componentes/`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** o tema Claro ativo por padrão, **Quando** um componente consome `tokens.semantic.color.action`, **Então** o valor resolvido deve ser `#5B21B6` (`purple-600`) com texto `onAction` `#FFFFFF`.
2. **Dado** o tema Escuro ativo, **Quando** um componente consome `darkTokens.semantic.color.action`, **Então** o valor resolvido deve ser `#D8B4FE` (`purple-300`) com texto `onAction` `#2E1065`.
3. **Dado** o objeto `primitive`, **Quando** inspecionado em `src/view/theme.ts`, **Então** ele deve permanecer estritamente privado (não exportado), impedindo acessos diretos fora do tema.

---

### História de Usuário 2 — Interatividade e Acessibilidade dos 6 Componentes Expressivos (Prioridade: P1)

Como participante de um Pequeno Grupo, desejo interagir com botões, campos de texto, cards, cronômetro, alternativas de quiz e teclado da forca que respondam com feedback multissensorial (cor + forma + ícone), para que seja fácil e inclusivo jogar em grupo.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** um `ExpressiveButton` em repouso, **Quando** o jogador pressiona o botão, **Então** o raio de borda sofre *Shape Morphing* de `9999 dp` para `16 dp` (`radiusPressed`) e a cor passa para `button.bgPressed`.
2. **Dado** um `ExpressiveTimer`, **Quando** os segundos restantes são maiores que 10, **Então** o cronômetro exibe fundo `color.highlight` (`#FACC15`) e formato de pílula (`radius.full`); **Quando** restam 10 segundos ou menos, **Então** o container transmuta para fundo `color.error` (`#B91C1C`), formato retangular suavizado (`16 dp`) e ícone `alert`.
3. **Dado** uma `QuizOption`, **Quando** o status é `correct`, **Então** o fundo deve ser `quiz.optionCorrectBg` (`#15803D`) com ícone `check-circle`; **Quando** o status é `wrong`, **Então** o fundo deve ser `quiz.optionWrongBg` (`#B91C1C`) com ícone `close-circle`.
4. **Dado** uma tecla `LetterKey`, **Quando** o jogador toca uma letra disponível, **Então** o callback `onPress` é disparado com a letra; **Quando** o status é `hit` ou `miss`, **Então** o botão fica desabilitado e com o formato/estilo semântico correspondente.

---

### Casos de Borda (Edge Cases)

- **Cores literais fora de theme.ts**: O linter arquitetural (`npm run arquitetura`) deve falhar caso qualquer arquivo fora de `src/view/theme.ts` contenha `#hex` ou `rgb()`.
- **Alvo de toque**: Componentes devem respeitar no mínimo `48 dp × 48 dp` (padrão) e `64 dp` (botões Jumbo).

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-DS01`**: Centralizar todos os valores literais de cores, tipografia, espaçamento e elevação em `src/view/theme.ts`.
- **`RF-DS02`**: Implementar os 6 componentes expressivos em `src/view/components/` com nomes em `camelCase.tsx` (`expressiveButton`, `expressiveTextField`, `gameCard`, `expressiveTimer`, `quizOption`, `letterKey`).
- **`RF-DS03`**: Exportar apenas componentes nomeados (`export const Nome = ...`) com `type` para props (sem `interface` e sem `any`).

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (Acessibilidade)**: Alvos mínimos de toque `48 dp` / `64 dp`, atributos `accessibilityRole`, `accessibilityLabel` e `accessibilityState` configurados.
- **`CS-02` (Arquitetura MVVM)**: `npm run check` com 0 violações, `tsc --noEmit` sem erros e cobertura de testes Jest com 100% de sucesso.
