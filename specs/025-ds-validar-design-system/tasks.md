# ✅ Lista de Tarefas (`tasks.md`): ds-validar-design-system

- **Input:** `specs/025-ds-validar-design-system/spec.md` e `specs/025-ds-validar-design-system/plan.md`
- **Issue:** `#75`
- **Ordem:** a entrega não cria camadas de domínio; segue *tooling* → testes do *tooling* → ajustes em `src/view/` → integração (`package.json`, hook) → docs → verificação.

---

## Fase 1: Verificador (`scripts/`)

- [x] **T001** Criar `scripts/check-design-system.mjs`: descoberta dos `.tsx` de `src/view/` (ignora `theme.ts`), parse com `ts.createSourceFile`, opções `--root`, `--files` e `--staged`, relatório no formato do `check-arquitetura.mjs` e código de saída
- [x] **T002** Regra `DS-NUMERO-MAGICO` (erro)
- [x] **T003** Regra `DS-USE-THEME` (erro), incluindo import estático de `tokens`/`darkTokens`
- [x] **T004** Regra `DS-ACESSIBILIDADE` (erro)
- [x] **T005** Regra `DS-ALVO-TOQUE` (erro), resolvendo `styles.chave` no `StyleSheet.create` do arquivo e o caso "cobre o pai"
- [x] **T006** Regra `DS-COMPONENTE-PADRAO` (aviso, não bloqueia)
- [x] **T007** Exceção `// ds-ignore-next-line DS-REGRA: motivo` (motivo obrigatório)

## Fase 2: Testes do verificador (`tests/`)

- [x] **T008** Criar `tests/unit/checkDesignSystem.test.ts` com pastas temporárias: 1 caso que falha e 1 que passa por regra, exceção com e sem motivo, `--files`, e aviso sem bloquear

## Fase 3: Ajustes do código atual (`src/view/components/`)

> Necessários para o critério "o projeto atual passa com 0 erros". Nenhuma mudança visual esperada.

- [x] **T009** `gameCard.tsx`: declarar `minHeight: activeTokens.semantic.space['2xl']` no estilo do `Pressable`
- [x] **T010** `cidadeDormeCityPanel.tsx` e `cidadeDormePhaseTimeline.tsx`: trocar `tokens` estático por `useTheme()` (só espaço, raio, fonte e borda; as cores já vêm do tema ativo)
- [x] **T011** Rodar `node scripts/check-design-system.mjs` no projeto e corrigir o que mais aparecer
  - Fora do previsto: `src/view/cidade-dorme.tsx` importa `tokens`/`darkTokens` de propósito (a transição dia/noite interpola as duas superfícies). Resolvido com `ds-ignore-next-line` justificado, sem mudar o código.
  - Ajuste na regra `DS-ALVO-TOQUE`: variáveis e helpers locais (ex.: `focusRingStyle`) não contam como garantia de altura; só estilo recebido por prop fica "indeterminado". Sem isso, quase nenhum componente seria verificado.

## Fase 4: Integração (`package.json` e hook)

- [x] **T012** `package.json`: `"check:ds"`, `"prepare": "node scripts/instalar-hooks.mjs"` e `"check"` com o novo verificador
- [x] **T013** Criar `scripts/instalar-hooks.mjs` (define `core.hooksPath=.githooks`; ignora sem Git ou com `CI`/`VERCEL`/`EAS_BUILD`)
- [x] **T014** Criar `.githooks/pre-commit` e `.gitattributes` (`.githooks/* text eol=lf`, para o script `sh` funcionar em Linux/macOS) (`sh`, modo `--staged`, sai na hora se não houver `src/view/*.tsx` no commit) com permissão de execução no Git (`git update-index --chmod=+x`)

## Fase 5: Documentação (`docs/`)

- [x] **T015** `docs/harness/04-views-e-design-system.md`: seção "Verificador do Design System" com as 5 regras, a exceção `ds-ignore-next-line` e como o hook é instalado

## Fase 6: Verificação e PR

- [x] **T016** Teste manual do hook: commit com `padding: 13` bloqueado (nenhum commit criado), commit sem `src/view/` liberado. Tempos registrados no `CS-03` da spec
- [x] **T017** `npm run check` com **0 violações**
- [ ] **T018** Commits convencionais e PR para a `develop` com `Closes #75` (`/commit-e-pr`)
