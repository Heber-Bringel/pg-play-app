# 📜 Constituição do Projeto PG PLAY (`.specify/memory/constitution.md`)

> **Versão:** `1.0.0` · **Ratificada em:** 2026-11-05 · **Escopo:** Todo o repositório **PG PLAY** (IHC + PDM — IFPI Campus Piripiri)

Esta **Constituição** é a fonte suprema e inegociável de governança técnica do projeto **PG PLAY** dentro do fluxo **GitHub Spec Kit (Spec-Driven Development — SDD)**. Qualquer especificação (`spec.md`), plano técnico (`plan.md`), lista de tarefas (`tasks.md`) ou código-fonte (`src/`) que viole qualquer artigo abaixo **deve ser rejeitado**.

---

## Artigo I — Desenvolvimento Guiado por Especificação (Spec-Driven Development)

1. **Proibição de "Vibe Coding" Direto em `src/`**: Nenhuma funcionalidade ou tela pode ser implementada diretamente em `src/` sem antes possuir seus artefatos aprovados em `specs/<NNN-nome-da-feature>/`:
   - `spec.md` (**Specify**): Define *o que* será construído e *por que* (histórias de usuário, cenários *Dado/Quando/Então*, vínculo com `UC01–UC08` e `RF01–RF23`).
   - `plan.md` (**Plan**): Define *como* será construído nas 7 camadas do MVVM Sofisticado e quais tokens/componentes do Design System serão utilizados, incluindo o *Constitution Check*.
   - `tasks.md` (**Tasks**): Quebra o plano em tarefas atômicas ordenadas por dependência, de dentro para fora (`model` → `infra` → `usecase` → `di` → `tests` → `viewmodel` → `view` → `app`).
2. **Ponto de Parada Humano (Human Checkpoint)**: O agente de IA deve sempre aguardar revisão/aprovação humana entre a geração do plano/tarefas (`plan.md` / `tasks.md`) e a execução da implementação (`/speckit.implement`).

---

## Artigo II — Arquitetura MVVM Sofisticada (As 7 Camadas Inegociáveis)

1. **Exatamente 7 Pastas em `src/`**: Todo o código-fonte reside única e exclusivamente em `src/app/`, `src/view/`, `src/viewmodel/`, `src/usecase/`, `src/model/`, `src/infra/` e `src/di/`. Nenhuma outra pasta é permitida dentro de `src/`.
2. **Rotas Finas e Espelhamento 1:1 (`app/` ↔ `view/`)**:
   - Cada arquivo de rota em `src/app/` (exceto `_layout.tsx`) possui apenas 2 linhas (`import Tela from '@/view/...'; export default Tela;`).
   - Toda rota em `src/app/` possui sua tela espelhada no mesmo caminho relativo em `src/view/`.
3. **View Burra e Navegação Exclusiva na ViewModel**:
   - Arquivos em `src/view/` apenas renderizam `state` e disparam `actions` vindos de `const [state, actions] = useXViewModel()`.
   - É proibido usar `expo-router`, `try/catch`, `fetch` ou importar `usecase`/`infra`/`di` dentro de `src/view/`.
   - Toda navegação (`router.push`, `router.replace`, `router.back`) fica em `src/viewmodel/`.
4. **Domínio Puro e Vocabulário Canônico**:
   - Entidades em `src/model/entities/` são `export type Nome = { ... };` (nunca `class` nem `interface`).
   - Contratos em `src/model/datasources/i*DataSource.ts`, `src/model/services/i*Service.ts` e `src/usecase/i*UseCases.ts` usam `export interface I...`.
   - É **proibido** usar os termos `Repository` ou `Connector` em qualquer arquivo, tipo ou classe (use sempre `DataSource` para dados e `Service` para operações nativas/rede/áudio).
5. **Isolamento de Infraestrutura**:
   - Toda classe em `src/infra/` implementa seu contrato de `src/model/` com `implements` e possui uma implementação `Memory*` para execução offline e testes.
   - Apenas `src/di/container.ts` (e os testes em `tests/`) pode importar de `@/infra/`.

---

## Artigo III — Sistema de Design PG Play Expressive (Material 3 Expressive)

1. **Fonte Única de Tokens (`src/view/theme.ts`)**:
   - Nenhum arquivo fora de `src/view/theme.ts` pode conter cores literais (`#hex`, `rgb()`, `rgba()`, nomes de cores).
   - O objeto `primitive` dentro de `src/view/theme.ts` é privado (nunca exportado); componentes e telas consomem apenas tokens semânticos e de componente.
2. **Acessibilidade WCAG 2.1 AA e Ergonomia de Grupo**:
   - Alvos de toque mínimos de `48 dp × 48 dp` (e `64 dp` nos botões Jumbo de ação principal).
   - Nunca usar apenas cor para comunicar estado (acerto, erro, tempo crítico `<= 10s`); combinar sempre **cor + forma (*shape morphing*) + ícone**.

---

## Artigo IV — Qualidade, Tipagem Estrita e Verificação Determinística

1. **Convenções TypeScript e React Native**:
   - Todas as importações internas em `src/` usam o alias `@/` (proibido usar `./` ou `../`).
   - Proibido usar `any`, `React.FC`, `export default function` ou `function NomeComponente()` em arquivos `.tsx`.
   - Erros de negócio herdam de `DomainError` (`ValidationError`, `AuthError`, `DataSourceError` em `src/model/errors.ts`).
2. **Portão de Qualidade (`npm run check`)**:
   - Nenhuma tarefa de implementação é considerada concluída até que `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest`) passe com **0 violações e 0 erros**.

---

## Artigo V — Governança Git, Commits Convencionais e Pull Requests

1. **Commits Convencionais**: Formato obrigatório `<tipo>(<escopo>): <descrição curta no imperativo>` onde `<escopo>` pertence a `{model, infra, usecase, di, viewmodel, view, app, design-system, harness, tests, docs}`.
2. **Rastreabilidade Ponta a Ponta**: Toda entrega conecta `Issue (#X)` ↔ `Pasta Spec (specs/NNN-slug/)` ↔ `Branch (feat/...)` ↔ `Pull Request (.github/PULL_REQUEST_TEMPLATE.md)`.
