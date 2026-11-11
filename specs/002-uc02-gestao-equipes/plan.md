# 📐 Plano Técnico de Arquitetura (`plan.md`): 002-uc02-gestao-equipes

- **Branch da Feature:** `feat/002-uc02-gestao-equipes`
- **Criado em:** 2026-11-11
- **Status:** Aprovado
- **Autor / Perfil:** Douglas Leone (`DouglasLeone`)
- **Milestone:** `v0.2.0 — Núcleo & Jogos em 1 Celular (UC01–UC06)`
- **Issue vinculada:** `#10` (`[UC02] Implementar Configuração e Gestão de Equipes (RF04–RF06)`)

---

## 1. Verificação de Conformidade com a Constituição (Artigos I a V)

- [x] **Artigo I — 7 Camadas:** O código será organizado estritamente nas pastas `model`, `infra`, `usecase`, `di`, `viewmodel`, `view` e `app`.
- [x] **Artigo II — Fluxo Unidirecional e Dependências:** `view` renderiza a partir de `useTeamsViewModel`; regras de negócio e validações em `pgPlayUseCases`; infraestrutura isolada e instanciada em `container.ts`.
- [x] **Artigo III — Governança de Roteamento e View:** `src/app/teams.tsx` será uma rota fina de exatamente 2 linhas; `src/view/teams.tsx` espelha 1:1 e não importa `expo-router`.
- [x] **Artigo IV — Design System PG Play Expressive:** Uso exclusivo de tokens semânticos de `@/view/theme` e dos componentes `ExpressiveButton`, `ExpressiveTextField` e `GameCard`.
- [x] **Artigo V — Qualidade e Pirâmide de Testes:** Testes unitários para UseCase em `tests/unit/pgPlayUseCases.teams.test.ts`, teste de Hook em `tests/hooks/useTeamsViewModel.test.ts` e teste de tela com mock em `tests/mocks/teamsScreen.mock.test.tsx`.

---

## 2. Mapeamento dos Arquivos nas 7 Camadas

```text
src/
├── model/
│   ├── entities/
│   │   └── team.ts                     # type Team = { id: string; name: string; score: number }
│   ├── datasources/
│   │   └── iTeamDataSource.ts          # interface ITeamDataSource (list, add, remove, addScore, reset)
│   └── errors.ts                       # ValidationError, DataSourceError (existentes)
├── infra/
│   └── datasources/
│       ├── memoryTeamDataSource.ts      # implements ITeamDataSource (existente - validações)
│       └── asyncStorageTeamDataSource.ts# implements ITeamDataSource (persistência em storage)
├── usecase/
│   ├── iPgPlayUseCases.ts              # Adicionar addTeam(name) e removeTeam(id)
│   └── pgPlayUseCases.ts               # Implementar addTeam e removeTeam com validações
├── di/
│   └── container.ts                    # Injeção das instâncias no container compartilhado
├── viewmodel/
│   └── useTeamsViewModel.ts            # Hook: [TeamsState, TeamsActions]
├── view/
│   └── teams.tsx                       # Tela espelhada da gestão de equipes
└── app/
    └── teams.tsx                       # Rota fina: import TeamsScreen from "@/view/teams"; export default TeamsScreen;
```

---

## 3. Interfaces e Tipos por Camada

### 3.1. Camada `model`
```ts
// src/model/entities/team.ts
export type Team = {
  id: string;
  name: string;
  score: number;
};

// src/model/datasources/iTeamDataSource.ts
export interface ITeamDataSource {
  listTeams(): Promise<Team[]>;
  addTeam(name: string): Promise<Team>;
  removeTeam(id: string): Promise<void>;
  addScore(teamId: string, points: number): Promise<void>;
  resetScores(): Promise<void>;
}
```

### 3.2. Camada `usecase`
```ts
// Métodos a adicionar em IPgPlayUseCases:
export interface IPgPlayUseCases {
  // ... métodos existentes ...
  listTeams(): Promise<Team[]>;
  addTeam(name: string): Promise<Team>;
  removeTeam(teamId: string): Promise<Team[]>;
}
```

**Regras de Negócio em `PgPlayUseCases`:**
- `addTeam(name)`:
  - Valida se `name.trim().length >= 2` (se menor, lança `ValidationError("Digite um nome com pelo menos 2 letras para a equipe.")`).
  - Valida se `name.trim().length <= 20` (se maior, lança `ValidationError("O nome da equipe deve ter no máximo 20 caracteres.")`).
  - Valida se equipe duplicada case-insensitive já existe (se sim, lança `ValidationError("Já existe uma equipe cadastrada com este nome.")`).
  - Valida se número de equipes atuais `>= 6` (se sim, lança `ValidationError("Limite máximo de 6 equipes atingido para a sessão.")`).
- `removeTeam(teamId)`:
  - Valida se `teamId.trim()` não está vazio.
  - Executa remoção no datasource e retorna a lista atualizada de equipes.

### 3.3. Camada `viewmodel`
```ts
export type TeamsState = {
  teams: Team[];
  newTeamName: string;
  errorMessage: string | null;
  isLoading: boolean;
  canStartRound: boolean; // teams.length >= 2
};

export type TeamsActions = {
  setNewTeamName: (name: string) => void;
  handleAddTeam: () => Promise<void>;
  handleRemoveTeam: (id: string) => Promise<void>;
  handleStartRound: () => void;
  handleBack: () => void;
  clearError: () => void;
};

export function useTeamsViewModel(
  useCase: IPgPlayUseCases = pgPlayUseCases
): [TeamsState, TeamsActions];
```

### 3.4. Camada `view`
- Consome tokens de `@/view/theme` (cores `color.surface`, `color.surface-container-high`, `color.primary`, etc.).
- Consome componentes do Design System:
  - `ExpressiveTextField`: para entrada de novo nome com contador `(N/20)`, estado de erro contextual e placeholder.
  - `ExpressiveButton`:
    - Variante `tonal` para o botão "Adicionar Equipe".
    - Variante `primaryJumbo` (`64 dp`) para "Começar Rodada!" (desabilitado quando `!canStartRound`).
    - Variante `outlined` para botão Voltar/Sair.
  - Ícones do `@expo/vector-icons/MaterialCommunityIcons`: `account-group`, `trash-can-outline`, `plus`, `arrow-left`.

---

## 4. Testes Automatizados

1. **Unitários (`tests/unit/pgPlayUseCases.teams.test.ts`)**:
   - Listar equipes sugeridas padrão (2 equipes).
   - Adicionar equipe com sucesso.
   - Rejeitar nome com menos de 2 caracteres (`ValidationError`).
   - Rejeitar nome duplicado case-insensitive (`ValidationError`).
   - Rejeitar ultrapassar o limite de 6 equipes (`ValidationError`).
   - Remover equipe com sucesso.
2. **Hook (`tests/hooks/useTeamsViewModel.test.ts`)**:
   - Montagem inicial carrega equipes e define `canStartRound = true`.
   - `handleAddTeam` insere equipe, limpa campo de texto e atualiza `teams`.
   - `handleAddTeam` com nome inválido atualiza `errorMessage`.
   - `handleRemoveTeam` remove equipe e atualiza `canStartRound = false` se < 2 equipes.
   - `handleStartRound` navega via router.
3. **Mock de Tela (`tests/mocks/teamsScreen.mock.test.tsx`)**:
   - Renderização da lista de equipes, campo de texto e botão Jumbo.
   - Estado vazio quando não houver equipes.
