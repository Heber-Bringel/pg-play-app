# 📋 Especificação de Funcionalidade (`spec.md`): ds-validar-design-system

- **Branch da Feature:** `feat/025-ds-validar-design-system`
- **Criado em:** 2026-11-24
- **Status:** Aprovado (2026-11-24)
- **Caso(s) de Uso / Requisito(s):** transversal a todas as telas — `RNF07` (alvos de toque), `RNF08` (leitor de tela), `RNF10` (tokens, sem *magic numbers*) e Artigo III da Constituição — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md`
- **Issue vinculada:** `#75`

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

> Nesta entrega o ator é a **pessoa desenvolvedora do grupo**, e o benefício chega ao **Líder do PG e aos jogadores** como telas que nunca regridem em acessibilidade e tema.

### História de Usuário 1 — Barrar violações do Design System antes do commit (Prioridade: P1)

A pessoa desenvolvedora altera uma tela ou componente em `src/view/` e tenta fazer `git commit`. Se o código ferir o **PG Play Expressive** ou os critérios de IHC, o commit é cancelado com o arquivo, a linha, a regra e como corrigir.

**Por que esta prioridade:** hoje essas regras só são conferidas na revisão manual dos PRs (ex.: revisões dos PRs #45, #46 e #63). O verificador `check-arquitetura.mjs` cobre camadas e cores literais, mas não alvos de toque, *magic numbers*, `useTheme` nem acessibilidade.

**Como testar independentemente:** introduzir uma violação de cada regra em um arquivo de `src/view/`, rodar `npm run check:ds` e depois `git commit`; confirmar a falha com `arquivo:linha`. Remover a violação e confirmar que o commit passa.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** um estilo com `padding: 13` em `src/view/`, **Quando** roda `npm run check:ds`, **Então** o comando falha com `[ERRO] DS-NUMERO-MAGICO — src/view/x.tsx:LINHA` e sugere o token (`space.*`).
2. **Dado** um `Pressable` sem `accessibilityRole` ou sem `accessibilityLabel`, **Quando** roda o verificador, **Então** falha com `DS-ACESSIBILIDADE`.
3. **Dado** um `Pressable` cujo estilo não declara `minHeight` nem `height`, **Quando** roda o verificador, **Então** falha com `DS-ALVO-TOQUE` citando o mínimo de `48 dp` (`space['2xl']`).
4. **Dado** um arquivo `.tsx` de `src/view/` que monta estilos sem chamar `useTheme()` ou que importa `tokens`/`darkTokens` estáticos, **Quando** roda o verificador, **Então** falha com `DS-USE-THEME`.
5. **Dado** qualquer um dos erros acima em um arquivo preparado com `git add`, **Quando** a pessoa roda `git commit`, **Então** o hook de `pre-commit` cancela o commit e mostra as mesmas mensagens.
6. **Dado** que nenhum arquivo de `src/view/` está no commit, **Quando** roda `git commit`, **Então** o hook termina na hora, sem analisar nada.

---

### História de Usuário 2 — Avisar sem bloquear quando faltar reuso de componente (Prioridade: P2)

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** um `Pressable` ou `Touchable*` usado direto em uma tela (fora de `src/view/components/`), **Quando** roda o verificador, **Então** aparece `[AVISO] DS-COMPONENTE-PADRAO` sugerindo `ExpressiveButton`, `ExpressiveChip` ou outro componente do DS, **e** o comando termina com sucesso (não bloqueia o commit).

---

### História de Usuário 2b — Barrar o push com violação de arquitetura ou Design System (Prioridade: P1, adendo)

Hoje nenhuma verificação roda antes do push, e a CI só roda em PRs para a `main`, enquanto os PRs do grupo vão para a `develop`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** um commit local com violação de arquitetura (ex.: import relativo em `src/`) ou de Design System, **Quando** a pessoa roda `git push`, **Então** o hook `pre-push` cancela o envio e mostra os erros dos verificadores.
2. **Dado** que os dois verificadores passam, **Quando** roda `git push`, **Então** o envio segue normalmente, em cerca de 1 segundo a mais.

---

### História de Usuário 3 — Instalação automática do hook para todo o grupo (Prioridade: P2)

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** um clone novo do repositório, **Quando** a pessoa roda `npm install`, **Então** o Git passa a usar `.githooks/` (`core.hooksPath`) sem passo manual.
2. **Dado** um ambiente sem Git ou de integração contínua (ex.: build da Vercel), **Quando** roda `npm install`, **Então** a instalação do hook é ignorada em silêncio e o `npm install` não falha.

---

### Casos de Borda (Edge Cases)

- **Valor `0`** em espaçamento/borda é permitido (não é *magic number*). Expressões derivadas de token (`space['3xl'] * 4`) também são permitidas; só o literal puro é barrado.
- **`src/view/theme.ts`** é ignorado: é o único lugar onde valores brutos podem existir.
- **Estilo vindo de prop** (ex.: `style={style}`) ou com *spread* (`{...rest}`) não pode ser resolvido estaticamente: o verificador não acusa `DS-ALVO-TOQUE`/`DS-ACESSIBILIDADE` nesses casos, para não gerar falso positivo.
- **`Pressable` que cobre o pai** (fundo de modal com `position: 'absolute'` e `top/right/bottom/left: 0`) conta como alvo válido.
- **Exceção justificada:** um comentário `// ds-ignore-next-line DS-REGRA: motivo` ignora a regra na linha seguinte. Sem motivo escrito, a exceção não vale e o erro aparece.
- **Commit parcial:** o hook analisa o conteúdo **preparado** (`git add`), não o que está só na área de trabalho.
- **Arquivo apagado ou renomeado** no commit: arquivos apagados não são analisados.
- **Windows (Git Bash) e Linux/macOS:** o hook é um script `sh` que funciona nos três.
- **Desempenho:** no hook, só os arquivos de `src/view/` do commit são analisados.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-01`**: Criar `scripts/check-design-system.mjs`, que lê os `.tsx` de `src/view/` com o parser do TypeScript (já instalado) e aplica as regras:
  - `DS-USE-THEME` (erro): arquivo que monta estilos chama `useTheme()`; proibido importar `tokens`/`darkTokens` estáticos de `@/view/theme`.
  - `DS-ALVO-TOQUE` (erro): `Pressable`/`Touchable*` com `minHeight` ou `height` declarado no estilo (direto ou via `styles.chave`), salvo o caso "cobre o pai".
  - `DS-ACESSIBILIDADE` (erro): `Pressable`/`Touchable*` com `accessibilityRole` (ou `role`) **e** `accessibilityLabel` (ou `aria-label`).
  - `DS-NUMERO-MAGICO` (erro): literal numérico diferente de `0` em `padding*`, `margin*`, `gap`, `rowGap`, `columnGap`, `borderRadius*`, `borderWidth*`, `fontSize`, `lineHeight`, `letterSpacing`, `minHeight`, `minWidth`, `width`, `height`.
  - `DS-COMPONENTE-PADRAO` (aviso): `Pressable`/`Touchable*` fora de `src/view/components/`.
- **`RF-02`**: Saída no mesmo formato do `check-arquitetura.mjs` (`[ERRO] REGRA — arquivo:linha`, `Problema`, `Como corrigir`, `Referência`), com resumo final e código de saída `1` quando houver erro.
- **`RF-03`**: Modos de execução: projeto inteiro (padrão), `--files <lista>` e `--staged` (conteúdo preparado no Git).
- **`RF-04`**: Hook `.githooks/pre-commit` chamando o verificador em modo `--staged`, instalado por `npm install` via script `prepare` (`scripts/instalar-hooks.mjs`) que ignora ambientes sem Git ou de CI.
- **`RF-05`**: `package.json` com `"check:ds"` e o `"check"` incluindo o novo verificador.
- **`RF-07`** *(adendo de 2026-11-24)*: Hook `.githooks/pre-push` rodando `check-arquitetura.mjs` e `check-design-system.mjs` no projeto inteiro antes de cada `git push`; com qualquer erro, o push é cancelado. `tsc` e `jest` ficam fora do hook para não atrasar o push (continuam no `npm run check`).
- **`RF-08`** *(adendo)*: `CONTRIBUTING.md` descreve o `npm run check` atual e os dois hooks (`pre-commit` e `pre-push`).
- **`RF-06`**: Ajustar o código atual para começar com **0 erros**: `GameCard` declara `minHeight` por token; `cidadeDormeCityPanel` e `cidadeDormePhaseTimeline` passam a usar `useTheme()` em vez de `tokens` estático.

### Entidades de Domínio Envolvidas (`src/model/entities/`)
- Nenhuma. A entrega é de *tooling* (`scripts/`, `.githooks/`) mais ajustes pontuais em `src/view/`.

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (IHC / Acessibilidade)**: Nenhum alvo interativo novo entra no projeto sem `48 dp`, papel e rótulo acessível (`RNF07`, `RNF08`), e nenhum estilo novo usa *magic numbers* (`RNF10`).
- **`CS-02` (Arquitetura MVVM)**: `npm run check` (`check-arquitetura.mjs` + `check-design-system.mjs` + `tsc` + `jest`) executa com **0 violações**.
- **`CS-03` (Desempenho)**: a análise do verificador (medida por `--tempo`, de dentro do script) fica **abaixo de 200 ms**, tanto na varredura completa quanto no hook.
  - Medido em 2026-11-24 (Windows 10, Node 25): varredura completa das 34 telas em **113–158 ms**; 5 arquivos preparados em **145 ms**.
  - O tempo de parede do `pre-commit` soma a abertura de processos (`sh`, Node e 2 chamadas ao Git, ~170 ms no Windows) ao carregamento do TypeScript (~130 ms): **~130 ms** em commits sem telas e **340–410 ms** com 5 telas. Ficar abaixo de 200 ms nesse caso exigiria trocar o parser por um *scanner* próprio, opção descartada pelo grupo para evitar falsos positivos.
- **`CS-04` (Confiabilidade)**: a suíte de testes cobre, para cada regra, um caso que falha e um que passa, além da exceção `ds-ignore-next-line`.
