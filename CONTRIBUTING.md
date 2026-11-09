# 🤝 Guia de Contribuição — PG PLAY (Commits, Branches e Pull Requests)

Este documento define o padrão oficial de **Commits Convencionais**, **Branches**, **Issues** e **Pull Requests** para o desenvolvimento do **PG PLAY** (trabalho final integrado de **IHC**, **PDM** e **Engenharia de Software III** — **IFPI Campus Piripiri**).

Todo código submetido ao repositório deve respeitar estritamente o **Harness MVVM Sofisticado** ([`AGENTS.md`](AGENTS.md)) e o sistema de design **PG Play Expressive** ([`design-system/README.md`](design-system/README.md)).

---

## 1. Padrão de Commits Convencionais (Conventional Commits)

Seguimos a especificação [Conventional Commits v1.0.0](https://www.conventionalcommits.org/pt-br/v1.0.0/) com escopos mapeados diretamente para as **7 camadas do MVVM Sofisticado**.

### Formato Obrigatório

```text
<tipo>(<escopo>): <descrição curta no imperativo e em minúsculas>

[corpo opcional explicando o "porquê" e listando arquivos por camada]

[rodapé opcional: Closes #ID_DA_ISSUE | Refs UC01, RF01]
```

**Regras da primeira linha:**
- Máximo de **72 caracteres**.
- Verbo no **imperativo** em português (`adicionar`, `implementar`, `corrigir`, `sincronizar`, `refatorar`, `remover`) — nunca no passado (`adicionado`, `corrigido`).
- Sem ponto final na primeira linha.

### 1.1. Tipos Permitidos (`<tipo>`)

| Tipo | Quando utilizar | Exemplo |
| :--- | :--- | :--- |
| `feat` | Nova funcionalidade, caso de uso, tela ou componente | `feat(usecase): implementar validacao de cadastro de equipes` |
| `fix` | Correção de bug funcional, visual ou de regra de negócio | `fix(viewmodel): corrigir reinicio do cronometro na mimica` |
| `refactor` | Melhoria de código ou adequação às regras do Harness sem mudar comportamento | `refactor(view): extrair navegacao da tela para a viewmodel` |
| `style` | Ajustes visuais usando tokens de `@/view/theme` ou formatação | `style(view): aplicar tokens de espacamento na tela de placar` |
| `test` | Criação ou atualização de testes unitários em `tests/` | `test(usecase): cobrir casos de erro de duplicidade de equipe` |
| `docs` | Atualização de documentação em `docs/`, `design-system/` ou `README.md` | `docs(harness): detalhar padrao de commits e pull requests` |
| `chore` | Configurações de projeto, pacotes, scripts ou estrutura `.gitkeep` | `chore(harness): configurar estrutura inicial mvvm e linter` |
| `ci` | Configuração de workflows do GitHub Actions ou hooks | `ci(harness): adicionar validacao automatica do npm run check` |

### 1.2. Escopos Oficiais (`<escopo>`)

| Escopo | Pasta / Alvo no Repositório |
| :--- | :--- |
| `model` | `src/model/` (entidades `type`, contratos `i*DataSource` / `i*Service` e `errors.ts`) |
| `infra` | `src/infra/` (implementações `Memory*`, `AsyncStorage`, `Firebase`, serviços nativos) |
| `usecase` | `src/usecase/` (contratos `i*UseCases.ts` e classes `*UseCases.ts`) |
| `di` | `src/di/container.ts` (injeção de dependências) |
| `viewmodel` | `src/viewmodel/` (hooks `use*ViewModel.ts` retornando `[state, actions]`) |
| `view` | `src/view/` (`theme.ts`, `components/*` e telas espelhadas) |
| `app` | `src/app/` (rotas finas de 2 linhas e `_layout.tsx`) |
| `design-system` | `design-system/` (documentação de tokens, componentes, padrões e acessibilidade) |
| `harness` | `AGENTS.md`, `CLAUDE.md`, `harness.config.json`, `docs/harness/`, `.claude/`, `scripts/` |
| `tests` | `tests/` (testes unitários de UseCases, ViewModels, Componentes e Tokens) |
| `docs` | `docs/` e `README.md` (requisitos, casos de uso, planejamento e catálogos) |

---

## 2. Padrão de Nomenclatura de Branches

Nunca faça commits diretamente na `main` para funcionalidades novas. Crie uma branch a partir da `main` seguindo o padrão:

```text
<prefixo>/<identificador-curto>
```

| Prefixo | Finalidade | Exemplo |
| :--- | :--- | :--- |
| `feat/ucXX-...` | Implementação de Caso de Uso (`UC01` a `UC08`) | `feat/uc02-gestao-equipes` |
| `feat/ds-...` | Implementação de Tema/Componentes do Design System | `feat/ds-sincronizar-tema` |
| `fix/...` | Correção de bug ou violação arquitetural | `fix/validacao-minimo-equipes` |
| `docs/...` | Documentação de IHC, PDM ou Harness | `docs/milestones-e-issues` |
| `chore/...` | Configuração de ferramentas, scripts e estrutura | `chore/setup-harness-mvvm` |

---

## 3. Fluxo de Desenvolvimento: GitHub Spec Kit + Harness MVVM

Adotamos o **GitHub Spec Kit** (`.specify/` e `specs/`) aliado ao **Harness MVVM Sofisticado**. Nenhum integrante deve escrever código direto em `src/` sem antes gerar os artefatos da especificação:

1. **Inicialize o workspace da especificação no Spec Kit**:
   ```bash
   npm run spec:new -- uc02-gestao-equipes
   ```
   Isso criará `specs/NNN-uc02-gestao-equipes/` com os templates `spec.md`, `plan.md` e `tasks.md`.
2. **Crie a branch** correspondente à Issue/Spec (ex.: `git checkout -b feat/003-uc02-gestao-equipes`).
3. **Siga as 4 etapas do Spec Kit (`/speckit`)**:
   - **Specify (`spec.md`)**: Defina Histórias de Usuário (*Dado/Quando/Então*) e requisitos (`RF`/`UC`).
   - **Plan (`plan.md`)**: Passe pelo *Constitution Check* ([`.specify/memory/constitution.md`](.specify/memory/constitution.md)) e mapeie os arquivos nas 7 pastas de `src/` + tokens/componentes do Design System.
   - **Tasks (`tasks.md`)**: Liste as tarefas de dentro para fora (`model` → `infra` → `usecase` → `di` → `tests` → `viewmodel` → `view` → `app`).
   - **Implement (`src/`)**: Use as receitas (`.claude/skills/`) na ordem:
     - `/sincronizar-tema` → gera `src/view/theme.ts` e `src/view/components/`.
     - `/nova-funcionalidade` → cria `model` → `infra` (`Memory*`) → `usecase` → `di` → `tests`.
     - `/nova-tela` → cria `viewmodel` → `view` → rota fina em `app`.
4. **Rode a verificação obrigatória** antes de cada commit e antes de abrir o Pull Request:
   ```bash
   npm run check
   ```
   *(Executa `node scripts/check-arquitetura.mjs && tsc --noEmit && jest --passWithNoTests`)*
5. **Abra o Pull Request** preenchendo integralmente o template [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md) e vinculando a Issue (`Closes #X`) e a pasta `specs/NNN-slug/`.

---

## 4. Vistoria do Histórico Git para Testes Automatizados (Engenharia de Software III)

Na disciplina de **Engenharia de Software III**, o histórico de commits (`git log --oneline` e `git show`) é avaliado diretamente:

1. **Proibido concentrar todos os testes em um único commit**: os testes devem ser commitados de forma incremental e separada por categoria ao longo do desenvolvimento.
2. **Mínimo de 5 commits de testes (`test(...)`) distribuídos em categorias diferentes**:
   - `test(view): adicionar testes de componentes do design system com rntl`
   - `test(usecase): adicionar testes unitarios de regras de equipes e arenas`
   - `test(viewmodel): adicionar testes dos hooks de viewmodel com renderhook`
   - `test(view): adicionar testes de telas com mocks de viewmodel e servicos`
   - `test(tests): adicionar testes de integracao real de formulario e estado`
   - `test(tests): configurar cobertura minima de 80% e adicionar 3 fluxos e2e maestro`
3. **Qualidade da Suíte**: nunca faça commit de arquivos de teste contendo `.only` ou `.skip` indevidos, nem commits vazios/repetidos. Consulte [`docs/qualidade-e-testes/estrategia-testes-e-iso25010.md`](docs/qualidade-e-testes/estrategia-testes-e-iso25010.md).
