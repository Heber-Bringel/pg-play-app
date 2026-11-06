# 04 · Views e Sistema de Design (PG Play Expressive)

Este documento conecta a camada `src/view/` ao nosso sistema de design **PG Play Expressive (`v1.0.0`)**, documentado em `design-system/`.

---

## 1. Ordem de Leitura do Kit de Design (`design-system/`)

Antes de criar ou editar qualquer componente ou tela em `src/view/`:

| Etapa | Arquivo em `design-system/` | O que observar |
| :--- | :--- | :--- |
| **1º** | `design-system/README.md` | Visão geral, inventário de telas × componentes e instruções para IA |
| **2º** | `design-system/01-principios.md`, `02-tokens.md`, `03-fundamentos.md` | Os 4 princípios, hierarquia de tokens (primitivos, semânticos, componentes) e grade de 8 pontos |
| **3º** | `design-system/04-componentes/*.md` | Anatomia, variantes, estados e código de referência do componente |
| **4º** | `design-system/05-padroes.md` | Padrões de interação: Configuração de Equipes, Rodada com Tempo e Busca no Hub |
| **5º** | `design-system/06-acessibilidade.md` | Contraste WCAG 2.1, alvos mínimos (`48 dp` / `64 dp` Jumbo), independência de cor e leitor de tela |

---

## 2. Tradução de Tokens para `src/view/theme.ts`

Conforme definido em `harness.config.json`:
- **`src/view/theme.ts` é o único arquivo do projeto que pode conter cores hexadecimais (`#...`) e primitivos brutos.**
- O objeto `primitive` é interno ao arquivo `src/view/theme.ts` e **não é exportado**, garantindo que nenhuma tela ou componente burle os tokens semânticos ou de componente.
- O arquivo `src/view/theme.ts` exporta:
  - Objetos semânticos diretos: `color`, `space`, `radius`, `font`, `border`, `icon`, `typography`, `elevation`, `motion`.
  - Objetos de componentes diretos: `button`, `input`, `card`, `timer`, `quiz`, `key`.
  - Temas completos Claro e Escuro: `tokens`, `darkTokens` e a fábrica `createTokens(mode)`.

---

## 3. Componentes Visuais (`src/view/components/`)

| Especificação (`design-system/04-componentes/`) | Arquivo (`src/view/components/`) | Componente Exportado |
| :--- | :--- | :--- |
| `botao.md` | `src/view/components/expressiveButton.tsx` | `ExpressiveButton` |
| `campo-de-texto.md` | `src/view/components/expressiveTextField.tsx` | `ExpressiveTextField` |
| `card-de-jogo.md` | `src/view/components/gameCard.tsx` | `GameCard` |
| `cronometro-expressivo.md` | `src/view/components/expressiveTimer.tsx` | `ExpressiveTimer` |
| `alternativa-quiz.md` | `src/view/components/quizOption.tsx` | `QuizOption` |
| `teclado-forca.md` | `src/view/components/letterKey.tsx` | `LetterKey` |

Regras para todos os componentes em `src/view/components/`:
- Recebem todos os dados e callbacks exclusivamente via `props` (`type NomeProps = { ... }`).
- **Nunca** importam ou chamam uma ViewModel (`use...ViewModel`) nem `expo-router`.
- Usam `export` nomeado (`export const Nome = ...`).

---

## 4. Checklist Obrigatório para Cada Tela (`src/view/*.tsx`)

1. **Consumo da ViewModel**: toda tela chama `const [state, actions] = useXViewModel();`.
2. **Os 4 Estados de Tela**: toda tela deve contemplar visualmente os estados de **carregando** (`state.loading`), **erro** (`state.error`), **vazio** (ex.: busca sem resultados ou lista sem equipes) e **conteúdo**.
3. **Independência de Cor (WCAG 1.4.1)**: nunca comunique acerto, erro ou tempo crítico apenas por cor; combine **cor semântica + mudança de forma (`borderRadius`) + ícone ou estilo tipográfico**.
4. **Acessibilidade**: inclua `accessibilityRole`, `accessibilityLabel` e `accessibilityState` nos elementos interativos e respeite os alvos mínimos (`48 dp` padrão, `56 dp` inputs/opções, `64 dp` botões Jumbo).
5. **Se faltar token ou componente**: não invente valores literais; pare, aponte a lacuna e pergunte ao usuário.
