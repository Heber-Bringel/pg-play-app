# 🏗️ Plano de Implementação Técnica (`plan.md`): ds-validar-design-system

- **Branch:** `feat/025-ds-validar-design-system`
- **Data:** 2026-11-24
- **Especificação de Origem:** `specs/025-ds-validar-design-system/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`
- **Issue:** `#75`

---

## 1. Resumo Técnico

Um verificador estático novo, `scripts/check-design-system.mjs`, lê cada `.tsx` de `src/view/` com `ts.createSourceFile` (TypeScript já é `devDependency`, sem pacote novo), percorre a árvore JSX e os `StyleSheet.create` e emite erros/avisos no formato do `check-arquitetura.mjs`. O hook `.githooks/pre-commit` o executa só sobre os arquivos preparados. Nenhuma das 7 camadas ganha arquivo novo; em `src/view/` há apenas três ajustes para o projeto começar com 0 erros.

**Decisões já tomadas com o grupo (2026-11-24):**
- Parser: **AST do TypeScript** (preciso; ~150 ms no hook, ~250 ms na varredura completa).
- Severidade: **4 regras bloqueiam** (`DS-USE-THEME`, `DS-ALVO-TOQUE`, `DS-ACESSIBILIDADE`, `DS-NUMERO-MAGICO`) e **1 avisa** (`DS-COMPONENTE-PADRAO`).
- Hook: **`.githooks/` + script `prepare`**, sem Husky.

---

## 2. Verificação Constitucional (*Constitution Check*)

- [x] **Artigo I (SDD)**: `spec.md` completa, vinculada a `RNF07`, `RNF08`, `RNF10` e à issue `#75`.
- [x] **Artigo II (MVVM 7 Pastas)**: os arquivos novos ficam em `scripts/`, `.githooks/` e `tests/`; em `src/` só há edição de 3 arquivos existentes de `src/view/components/`.
- [x] **Artigo II (Rotas Finas e View Burra)**: nenhuma rota nem ViewModel é alterada.
- [x] **Artigo II (Vocabulário)**: sem `Repository`/`Connector`.
- [x] **Artigo III (Design System)**: a entrega **reforça** o Artigo III; os ajustes usam só tokens já existentes (`space['2xl']`, `activeTokens.semantic.*`).
- [x] **Artigo IV (Testabilidade Offline)**: o verificador roda 100% local; os testes usam pastas temporárias, sem rede.
- [x] **Artigo IV (Portão de Qualidade)**: o `npm run check` passa a incluir o novo verificador.

> ⚠️ `AGENTS.md` §6 proíbe alterar `scripts/check-arquitetura.mjs` para silenciar erros. Este plano **não toca** nesse arquivo: o verificador novo é independente.

---

## 3. Mapeamento de Arquivos

```text
scripts/
├─ check-design-system.mjs     # NOVO — verificador (regras, modos --files/--staged, relatório)
└─ instalar-hooks.mjs          # NOVO — define core.hooksPath=.githooks; ignora sem Git/CI
.githooks/
└─ pre-commit                  # NOVO — sh: node scripts/check-design-system.mjs --staged
package.json                   # "check:ds", "prepare" e "check" atualizado
src/view/components/
├─ gameCard.tsx                # minHeight: activeTokens.semantic.space['2xl'] no Pressable
├─ cidadeDormeCityPanel.tsx    # tokens estáticos -> useTheme() (só espaço/raio/fonte/borda)
└─ cidadeDormePhaseTimeline.tsx# idem
tests/unit/
└─ checkDesignSystem.test.ts   # NOVO — executa o script com node sobre pastas temporárias
docs/harness/04-views-e-design-system.md  # seção "Verificador do Design System"
```

Nenhum arquivo em `src/model`, `src/infra`, `src/usecase`, `src/di`, `src/viewmodel` ou `src/app`.

### Como cada regra é verificada (AST)

| Regra | Nó analisado | Passa quando |
| :--- | :--- | :--- |
| `DS-USE-THEME` | arquivo inteiro | Arquivo sem estilo, **ou** há chamada `useTheme(` e não há `import { tokens \| darkTokens }` de `@/view/theme` |
| `DS-ACESSIBILIDADE` | `JsxOpeningElement`/`JsxSelfClosingElement` `Pressable`/`Touchable*` | Tem `accessibilityRole`/`role` **e** `accessibilityLabel`/`aria-label`; ou há `{...spread}` |
| `DS-ALVO-TOQUE` | idem, atributo `style` | Algum objeto do `style` (inline, `styles.chave` resolvido no `StyleSheet.create` do mesmo arquivo, ou dentro de `({ pressed }) => [...]`) tem `minHeight`/`height`; ou preenche o pai (`absolute` + `top/right/bottom/left: 0`); ou `style` vem de prop/spread |
| `DS-NUMERO-MAGICO` | `PropertyAssignment` dentro de objeto de estilo | Valor não é `NumericLiteral` (nem `-literal`) diferente de `0` |
| `DS-COMPONENTE-PADRAO` (aviso) | `Pressable`/`Touchable*` | Arquivo está em `src/view/components/` |

Exceção: `// ds-ignore-next-line DS-REGRA: motivo` (motivo obrigatório) na linha anterior.

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Onde | Componente | Tokens |
| :--- | :--- | :--- |
| `GameCard` (alvo de toque) | `GameCard` | `activeTokens.semantic.space['2xl']` (48 dp) |
| Cidade Dorme (painel e linha do tempo) | — | `activeTokens.semantic.space.*`, `radius.*`, `font.*`, `border.*` via `useTheme()` |
| Mensagens do verificador | — | Sugerem `space.*`, `radius.*`, `font.*`, `border.*`, `component.*.minHeight` e os componentes `ExpressiveButton`, `ExpressiveChip`, `SelectableOptionItem`, `QuizOption`, `LetterKey` |

Nenhum token ou componente novo.

---

## 5. Estratégia de Testes (`tests/`)

- **`tests/unit/checkDesignSystem.test.ts`**: cria uma pasta temporária com `src/view/` de exemplo, roda `node scripts/check-design-system.mjs --root <tmp>` e confere código de saída e mensagens:
  - para cada uma das 5 regras: 1 caso que viola e 1 que passa;
  - `0` e expressões com token não são *magic numbers*;
  - `styles.chave` resolvido no `StyleSheet.create`; `style` por prop não gera falso positivo;
  - fundo de modal "cobre o pai" passa;
  - `ds-ignore-next-line` com motivo ignora, sem motivo não ignora;
  - `--files` analisa só os arquivos passados;
  - aviso não muda o código de saída (`0`).
- **Projeto real:** `npm run check:ds` com 0 erros.
- **Hook (manual, registrado no PR):** commit com violação é bloqueado; commit sem `src/view/` passa; tempo medido do hook com 5 arquivos.
- `npm run check` com 0 violações.
