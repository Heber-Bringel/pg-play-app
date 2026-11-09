# 🛡️ Harness MVVM Sofisticado — Documentação Arquitetural (PG PLAY)

Esta pasta compõe o **Pilar 2 (Documentação Sob Demanda)** do Harness de Engenharia de Contexto do **PG PLAY**, projetado para guiar desenvolvedores e agentes de IA na arquitetura **MVVM Sofisticado** (evolução dos Capítulos 8 e 10 do livro *Tutoriais de PDM*).

---

## 📖 Guias de Referência Obrigatória

| Documento | Quando consultar | Conteúdo Principal |
| :--- | :--- | :--- |
| **[`01-arquitetura-mvvm.md`](01-arquitetura-mvvm.md)** | Ao criar ou alterar qualquer arquivo em `src/` | As 7 pastas canônicas (`app`, `view`, `viewmodel`, `usecase`, `model`, `infra`, `di`), fluxo de dados unidirecional e matriz de importações permitidas. |
| **[`02-convencoes-de-codigo.md`](02-convencoes-de-codigo.md)** | Ao criar tipos, interfaces, classes ou testes | Padrões de nomenclatura (`camelCase`, prefixo `i`), `type` vs `interface`, proibição de `any`/`React.FC`/`Repository` e hierarquia `DomainError`. |
| **[`03-expo-e-react-native.md`](03-expo-e-react-native.md)** | Ao trabalhar com rotas, navegação ou pacotes Expo | Rotas finas de 2 linhas em `src/app/`, espelhamento 1:1 com `src/view/` e navegação restrita à camada `src/viewmodel/`. |
| **[`04-views-e-design-system.md`](04-views-e-design-system.md)** | Ao criar telas (`src/view/`) ou componentes visuais | Integração com o **PG Play Expressive (`design-system/`)**, uso exclusivo de tokens de `@/view/theme` e acessibilidade WCAG 2.1. |
| **[`05-infraestrutura-e-supabase.md`](05-infraestrutura-e-supabase.md)** | Ao criar `DataSources` ou `Services` em `src/infra/` | Roteiro 1 (`Memory*` + `AsyncStorage` nos jogos de 1 celular) e Roteiro 2 (**Supabase** Realtime/RLS + `expo-av` nas Salas Multiplayer). |
| **[`06-testes-e-qualidade-es3.md`](06-testes-e-qualidade-es3.md)** | Ao criar testes (`tests/` e `e2e/`) | As 7 categorias obrigatórias de **Engenharia de Software III** (unitários, componentes RNTL, mocks, hooks, cobertura `>= 80%`, integração e 3 fluxos E2E Maestro). |

---

## 🛠️ Receitas de Trabalho (`.claude/skills/` e `.github/prompts/`)

Os fluxos passo a passo para especificação (**GitHub Spec Kit**) e construção incremental do aplicativo estão em `.claude/skills/` e `.github/prompts/`:

0. **[`/speckit`](../../.claude/skills/speckit/SKILL.md)** — Conduz o ciclo **GitHub Spec Kit** (`specify` → `plan` → `tasks` → `implement`) em [`specs/`](../../specs/README.md) sob a governança de [`.specify/memory/constitution.md`](../../.specify/memory/constitution.md).
1. **[`/sincronizar-tema`](../../.claude/skills/sincronizar-tema/SKILL.md)** — Traduz `design-system/02-tokens.md` e `design-system/04-componentes/` para `src/view/theme.ts` e `src/view/components/`.
2. **[`/nova-funcionalidade`](../../.claude/skills/nova-funcionalidade/SKILL.md)** — Implementa regras de negócio de dentro para fora (`model` → `infra` → `usecase` → `di` → `tests`).
3. **[`/nova-tela`](../../.claude/skills/nova-tela/SKILL.md)** — Cria `ViewModel` (`[state, actions]`), `View` espelhada e rota fina em `src/app/`.
4. **[`/revisar-arquitetura`](../../.claude/skills/revisar-arquitetura/SKILL.md)** — Executa `npm run check` e corrige eventuais desvios arquiteturais.
5. **[`/commit-e-pr`](../../.claude/skills/commit-e-pr/SKILL.md)** — Padroniza branches, Conventional Commits por camada MVVM e abertura de Pull Requests.

---

## ✅ Verificação Automatizada

Toda regra descrita nestes documentos é validada deterministicamente pelo script [`scripts/check-arquitetura.mjs`](../../scripts/check-arquitetura.mjs):

```bash
npm run arquitetura
```
