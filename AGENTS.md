# AGENTS.md · Regras do Harness MVVM Sofisticado (PG PLAY)

Este repositório contém o aplicativo **PG PLAY** (Minigames para Pequenos Grupos), desenvolvido em **React Native + Expo + TypeScript** como projeto final integrado das disciplinas de **Programação para Dispositivos Móveis (PDM)** e **Interação Humano-Computador (IHC)** do **IFPI Campus Piripiri**.

O projeto segue estritamente:
1. O fluxo **GitHub Spec Kit (Spec-Driven Development — SDD)** regido pela Constituição em `.specify/memory/constitution.md`;
2. A arquitetura **MVVM Sofisticado** (evolução do MVVM Simplificado dos Capítulos 8 e 10 do livro *Tutoriais de PDM*);
3. O sistema de design **PG Play Expressive** (`design-system/`).

**As regras abaixo não são sugestões; código que as viola está errado mesmo que funcione.**

---

## 1. Antes de escrever: o que ler em cada tarefa

Antes de criar ou editar qualquer arquivo, leia os documentos correspondentes à tarefa:

| Quando você for… | Leia obrigatoriamente |
| :--- | :--- |
| Iniciar ou planejar qualquer funcionalidade/Caso de Uso (**Spec Kit**) | `.specify/memory/constitution.md`, `specs/README.md` e `.claude/skills/speckit/SKILL.md` |
| Criar ou alterar qualquer código em `src/` | `docs/harness/01-arquitetura-mvvm.md` |
| Criar um arquivo novo ou revisar tipos/nomes | `docs/harness/02-convencoes-de-codigo.md` |
| Usar recursos do Expo, rotas, bibliotecas ou build | `docs/harness/03-expo-e-react-native.md` |
| Criar ou alterar telas (`view/`) ou componentes | `docs/harness/04-views-e-design-system.md` e `design-system/README.md` |
| Consultar requisitos e regras dos jogos do PG PLAY | `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md` |
| Criar branch, fazer commit, abrir PR ou criar/fechar Issues | `CONTRIBUTING.md`, `.github/PULL_REQUEST_TEMPLATE.md` e `docs/planejamento/milestones-e-issues.md` |

### Receitas disponíveis (`.claude/skills/` e `.github/prompts/`)
- `/speckit` (`.claude/skills/speckit/SKILL.md`): conduz o ciclo **GitHub Spec Kit** (`specify` → `plan` → `tasks` → `implement`) em `specs/NNN-slug/`.
- `/sincronizar-tema` (`.claude/skills/sincronizar-tema/SKILL.md`): traduz `design-system/` para `src/view/theme.ts` e `src/view/components/`.
- `/nova-funcionalidade` (`.claude/skills/nova-funcionalidade/SKILL.md`): cria funcionalidade de dentro para fora (`model` → `infra` → `usecase` → `di` → teste).
- `/nova-tela` (`.claude/skills/nova-tela/SKILL.md`): cria ViewModel, View espelhada e rota fina em `app/`.
- `/revisar-arquitetura` (`.claude/skills/revisar-arquitetura/SKILL.md`): executa o verificador, audita o projeto e corrige violações de dentro para fora.
- `/commit-e-pr` (`.claude/skills/commit-e-pr/SKILL.md`): cria branches, commits convencionais e Pull Requests vinculados às Issues e Milestones do projeto.

---

## 2. Estrutura de pastas exata

Todo o código-fonte fica em `src/`, organizado exclusivamente nestas 7 pastas:

```text
src/
├─ app/                  # Só rotas finas do Expo Router e _layout.tsx
├─ view/                 # Espelha app/ 1:1 (telas), além de components/ e theme.ts
│  ├─ components/        # Componentes visuais reutilizáveis do Design System
│  └─ theme.ts           # Único arquivo com valores literais de cor/espaço/tipografia
├─ viewmodel/            # Custom Hooks: useXViewModel.ts (estado, ações e navegação)
├─ usecase/              # Regras de negócio: iXUseCases.ts (interface) e xUseCases.ts (classe)
├─ model/                # Domínio puro (zero dependências externas)
│  ├─ entities/          # Entidades como type em objeto literal
│  ├─ datasources/       # Contratos de dados: iXDataSource.ts (interface)
│  ├─ services/          # Contratos de serviços: iXService.ts (interface)
│  └─ errors.ts          # DomainError e subclasses
├─ infra/                # Implementações concretas (MemoryX, Firebase, AsyncStorage, etc.)
│  ├─ datasources/       # Classes que implementam iXDataSource
│  └─ services/          # Classes que implementam iXService
└─ di/
   └─ container.ts       # Único arquivo do app que importa @/infra e monta os Use Cases
```

**Nenhuma outra pasta é permitida dentro de `src/`.** Contratos arquiteturais usam apenas `interface`.

---

## 3. As 12 Regras de Ouro (inegociáveis)

1. **`app/` só tem rotas finas**: cada arquivo de rota em `src/app/` (exceto `_layout.tsx`) contém apenas `import Tela from "@/view/..."; export default Tela;`.
2. **`view/` espelha `app/` 1:1**: toda rota em `src/app/` tem sua tela correspondente no mesmo caminho em `src/view/` (inclusive `[id].tsx`, `(tabs)` e `+not-found.tsx`).
3. **A View só renderiza**: arquivos em `src/view/` não importam `expo-router`, não fazem `try/catch`, não chamam `fetch` e não acessam `usecase`, `infra` ou `di`.
4. **Toda a navegação fica na ViewModel**: `router.push`, `router.replace`, `router.back`, `router.dismissTo` e `useLocalSearchParams` só podem ser usados em `src/viewmodel/` (ou `_layout.tsx`).
5. **Formato padrão da ViewModel**: arquivo `useXViewModel.ts` (extensão `.ts`, sem JSX), exportando `type XState`, `type XActions` e `function useXViewModel(useCase: IXUseCases = defaultUseCase): [XState, XActions]`.
6. **Regras de negócio e validações ficam nos Use Cases**: a ViewModel não implementa regras de negócio; ela apenas solicita ações ao Use Case e converte `DomainError` em estado legível.
7. **Domínio puro em `model/`**: entidades são `type` (nunca `class`), contratos são `interface` (em arquivos com prefixo `i`), e nenhum arquivo de `src/model/` importa bibliotecas externas (`react`, `react-native`, `expo`, `firebase`, etc.).
8. **Infraestrutura implementa contratos e converte erros**: toda classe em `src/infra/` usa `implements`, possui uma versão `MemoryX` para funcionamento offline/testes e converte erros técnicos em subclasses de `DomainError`.
9. **Isolamento de Infraestrutura**: somente `src/di/container.ts` (e os testes em `tests/`) pode importar de `@/infra/`.
10. **Estilos apenas com tokens do `theme.ts`**: são proibidas cores literais (`#hex`, `rgb()`, `rgba()`, nomes de cores) fora de `src/view/theme.ts`. Se faltar token ou componente no `design-system/`, pare e pergunte ao usuário.
11. **Importações sempre com `@/`**: nunca use caminhos relativos (`./` ou `../`) dentro de `src/`.
12. **Convenções estritas de TypeScript/React**: proibido usar `any`, `React.FC`, `export default function`, declarar componente com `function Nome()`, ou usar `interface` para props/estados/entidades.

---

## 4. Quem pode importar quem

| Camada | Pode importar | Nunca importa |
| :--- | :--- | :--- |
| `src/app/` (rotas) | Apenas a tela espelhada em `@/view/*` | Todo o resto (`react-native`, `viewmodel`, `usecase`, `model`, `infra`, `di`) |
| `src/app/_layout.tsx` | `expo-router`, `@/view/theme`, `@/viewmodel/*` | `model`, `usecase`, `infra`, `di` |
| `src/view/` (telas) | `react`, `react-native`, `@expo/vector-icons`, `@/view/components/*`, `@/view/theme`, `@/viewmodel/*`, `import type` de `@/model/entities/*` | `expo-router`, `usecase`, `infra`, `di` |
| `src/view/components/` | `react`, `react-native`, `@expo/vector-icons`, `@/view/theme`, `import type` de `@/model/entities/*` | `viewmodel`, `expo-router`, `usecase`, `infra`, `di` |
| `src/viewmodel/` | `react`, `expo-router`, `@/usecase/i*`, `@/di/container`, `@/model/entities/*`, `@/model/errors` | `react-native`, `view`, `infra`, classes concretas de `usecase` |
| `src/usecase/` | `@/model/*`, `@/usecase/*` | `react`, `react-native`, `expo-router`, `view`, `viewmodel`, `infra`, `di` |
| `src/model/` | Apenas `@/model/*` | Qualquer biblioteca externa ou outra camada |
| `src/infra/` | `@/model/*`, bibliotecas de dados/recursos nativos | `usecase`, `viewmodel`, `view`, `di`, `expo-router` |
| `src/di/` | `@/infra/*`, `@/usecase/*`, `@/model/*` | `view`, `viewmodel`, `app` |

---

## 5. Vocabulário obrigatório

- **Entidade (`src/model/entities/`)**: `type` em objeto literal; nunca `class` nem `new`.
- **DataSource (`src/model/datasources/` e `src/infra/datasources/`)**: guarda e recupera dados (`Memory`, `AsyncStorage`, `SQLite`, `Firestore`, API REST).
- **Service (`src/model/services/` e `src/infra/services/`)**: executa uma funcionalidade ou operação externa/nativa (autenticação, sala multiplayer, narração por áudio, câmera, localização).
- **Use Case (`src/usecase/`)**: representa o que o aplicativo faz; valida dados e coordena `Services` e `DataSources`.
- **Proibido**: usar `Repository`, “repositório” ou `Connector` em nomes de pastas, arquivos, tipos, interfaces ou classes.

---

## 6. Verificação obrigatória

- Sempre execute `npm run check` após concluir alterações e corrija qualquer erro antes de encerrar.
- **Nunca** altere `scripts/check-arquitetura.mjs`, `AGENTS.md` ou `design-system/` para mascarar ou silenciar um erro sem autorização explícita do usuário.

---

## 7. Expo em uma linha

- Confira a versão do SDK no `package.json`; instale pacotes com `npx expo install`; nunca edite pastas nativas `ios/` ou `android/` manualmente (use `app.json`); variáveis `EXPO_PUBLIC_` não são segredos.

---

## 8. Como se comportar

- Sempre responda em **português-brasil**.
- Pergunte a opinião do usuário antes de implementar novas funcionalidades ou alterações arquiteturais caso haja qualquer decisão em aberto.
- Execute uma tarefa por vez, de forma didática, listando ao final os arquivos criados/alterados por camada e os tokens/componentes do Design System utilizados.

---

## 9. Governança Git: Commits Convencionais, Branches, PRs e Issues

Sempre que executar operações Git ou GitHub (mesmo que o usuário peça apenas "faça o commit" ou "abra o PR"), siga obrigatoriamente o `CONTRIBUTING.md`:

- **Commits Convencionais**: `<tipo>(<escopo>): <descrição curta no imperativo e em minúsculas>` (máx. 72 caracteres, sem ponto final).
  - **Tipos permitidos**: `feat`, `fix`, `refactor`, `style`, `test`, `docs`, `chore`, `ci`.
  - **Escopos permitidos**: `model`, `infra`, `usecase`, `di`, `viewmodel`, `view`, `app`, `design-system`, `harness`, `tests`, `docs`.
- **Branches**: `<prefixo>/<identificador-curto>` (ex.: `feat/uc01-hub-jogos`, `feat/ds-sincronizar-tema`, `fix/validacao-equipes`, `chore/setup-harness`).
- **Antes de qualquer commit ou PR**: execute `npm run check` e garanta 0 violações.
- **Pull Requests e Issues**: preencha integralmente os templates em `.github/PULL_REQUEST_TEMPLATE.md` e `.github/ISSUE_TEMPLATE/`, vinculando a Issue (`Closes #X`), a pasta da especificação (`specs/NNN-slug/`) e a Milestone correspondente em `docs/planejamento/milestones-e-issues.md`.

---

## 10. Fluxo Obrigatório GitHub Spec Kit (Spec-Driven Development)

Adotamos o **GitHub Spec Kit** (`.specify/` e `specs/`). **É proibido escrever código direto em `src/` ("vibe coding") sem antes passar pelas etapas do Spec Kit:**

1. **Constitution (`.specify/memory/constitution.md`)**: Leis imutáveis do projeto (MVVM 7 camadas, Design System PG Play Expressive, testes e governança Git).
2. **Specify (`/speckit.specify` → `specs/NNN-slug/spec.md`)**: Crie o workspace da feature com `npm run spec:new -- <slug>` e documente as Histórias de Usuário, cenários *Dado/Quando/Então* e requisitos (`RF`/`UC`).
3. **Plan (`/speckit.plan` → `specs/NNN-slug/plan.md`)**: Valide o *Constitution Check*, mapeie os arquivos nas 7 camadas de `src/` e liste os tokens/componentes de `@/view/theme`.
4. **Tasks (`/speckit.tasks` → `specs/NNN-slug/tasks.md`)**: Quebre o plano em tarefas ordenadas de dentro para fora (`model` → `infra` → `usecase` → `di` → `tests` → `viewmodel` → `view` → `app`) e **aguarde aprovação humana**.
5. **Implement (`/speckit.implement`)**: Execute as tarefas de `tasks.md` usando as receitas `/sincronizar-tema`, `/nova-funcionalidade` e `/nova-tela`, validando com `npm run check`.


