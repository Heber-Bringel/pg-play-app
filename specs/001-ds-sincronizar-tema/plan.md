# 🏗️ Plano de Implementação Técnica (`plan.md`): ds-sincronizar-tema

- **Branch:** `feat/001-ds-sincronizar-tema`
- **Data:** 2026-11-09
- **Especificação de Origem:** `specs/001-ds-sincronizar-tema/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`
- **Issue Vinculada:** `#8` (`[DS] Sincronizar src/view/theme.ts e os 6 componentes do PG Play Expressive`)

---

## 1. Resumo Técnico

Tradução das especificações de `design-system/02-tokens.md` e `design-system/04-componentes/` para código TypeScript/React Native nas camadas correspondentes do Harness MVVM Sofisticado (`src/view/theme.ts` e `src/view/components/`). Criação de container DI inicial e testes com Jest em `tests/tokens.test.ts` e `tests/components.test.tsx`.

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo estão confirmados:*

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada com os requisitos e critérios de aceite.
- [x] **Artigo II (MVVM 7 Pastas)**: Todos os arquivos residem exclusivamente em `src/view/`, `src/di/` e `tests/`.
- [x] **Artigo II (Rotas Finas e View Burra)**: Componentes recebem dados e callbacks exclusivamente via props; nenhuma ViewModel ou rota é importada em `src/view/components/`.
- [x] **Artigo II (Vocabulário)**: Nenhum `Repository` ou `Connector` utilizado.
- [x] **Artigo III (Design System)**: Zero cores hexadecimais fora de `src/view/theme.ts`. O objeto `primitive` é mantido privado.
- [x] **Artigo IV (Testabilidade Offline)**: Testes executam localmente via Jest e mocks sem chamadas de rede.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

```text
src/
├─ di/
│  └─ container.ts                       # Container DI inicial para conformidade arquitetural
├─ view/
│  ├─ theme.ts                           # Tokens semânticos, componentes, tokens e darkTokens (primitive privado)
│  └─ components/
│     ├─ expressiveButton.tsx            # ExpressiveButton com Shape Morphing e variante Jumbo
│     ├─ expressiveTextField.tsx         # ExpressiveTextField com rótulo, foco, contador e erro
│     ├─ gameCard.tsx                    # GameCard com emblema, tags e animação no toque
│     ├─ expressiveTimer.tsx             # ExpressiveTimer com transmutação visual nos <= 10s
│     ├─ quizOption.tsx                  # QuizOption A-D com confirmação visual dupla
│     └─ letterKey.tsx                   # LetterKey 48x48dp com estados available, hit e miss
tests/
├─ __mocks__/
│  ├─ react-native.tsx                   # Mock de componentes RN para execução em Node/Jest
│  └─ expo-vector-icons.tsx              # Mock de ícones MaterialCommunityIcons
├─ tokens.test.ts                        # Testes unitários de tokens de tema e contraste
└─ components.test.tsx                   # Testes dos 6 componentes expressivos com react-test-renderer
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Componente (`@/view/components/`) | Arquivo de Origem (`design-system/04-componentes/`) | Tokens Principais Utilizados |
| :--- | :--- | :--- |
| `ExpressiveButton` | `botao.md` | `button.bg`, `button.label`, `button.radius`, `button.radiusPressed`, `button.minHeight`, `button.jumboHeight`, `color.success`, `color.secondary` |
| `ExpressiveTextField` | `campo-de-texto.md` | `input.bg`, `input.text`, `input.border`, `input.borderFocus`, `input.borderError`, `input.bgError`, `input.radius`, `input.minHeight` |
| `GameCard` | `card-de-jogo.md` | `card.bg`, `card.border`, `card.radius`, `card.padding`, `card.badgeSize`, `color.highlight`, `color.action` |
| `ExpressiveTimer` | `cronometro-expressivo.md` | `timer.bgNormal`, `timer.textNormal`, `timer.bgCritical`, `timer.textCritical`, `timer.radiusNormal`, `timer.radiusCritical` |
| `QuizOption` | `alternativa-quiz.md` | `quiz.optionBg`, `quiz.optionBorder`, `quiz.optionRadius`, `quiz.optionCorrectBg`, `quiz.optionWrongBg` |
| `LetterKey` | `teclado-forca.md` | `key.size`, `key.radius`, `key.hitBg`, `key.missBg`, `color.surfaceContainer` |

---

## 5. Estratégia de Testes (`tests/`)

- **`tests/tokens.test.ts`**:
  - Resolução correta de tokens semânticos no modo claro (`tokens`).
  - Resolução correta no modo escuro (`darkTokens`).
  - Mapeamento correto dos tokens de componentes.
- **`tests/components.test.tsx`**:
  - `ExpressiveButton`: variante primária, *shape morphing* ao pressionar, anel de foco, variantes Jumbo e desabilitada.
  - `ExpressiveTextField`: rótulo fixo, contador de caracteres, estados de foco e erro.
  - `GameCard`: card interativo com emblema, tag de jogadores e destaque de líder.
  - `ExpressiveTimer`: estado normal (pílula e amarelo ouro) vs crítico (16dp e vermelho alerta).
  - `QuizOption`: estados default, selected, correct e wrong com dupla confirmação visual.
  - `LetterKey`: estados disponível (48x48dp), hit (círculo verde) e miss (letra riscada).
