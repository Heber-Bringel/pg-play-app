# 01 · Arquitetura MVVM Sofisticado

Este guia contém o padrão canônico de arquitetura do projeto **PG PLAY**, baseado nos Capítulos 8 e 10 de *Tutoriais de PDM* e no Harness MVVM Sofisticado.

---

## 1. Direção das Dependências

```text
app/ (Rota fina) ──► view/ (Tela) ──► viewmodel/ (Hook) ──► usecase/ (Contrato + Regra) ──► model/ (Domínio Puro)
                                                                                              ▲
                                                                                              │ implements
                                                    di/container.ts ──────────────────► infra/ (Memory / Real)
```

---

## 2. Como Decidir: Entidade, DataSource, Service ou Use Case?

- **Entidade (`src/model/entities/`)**: Representa um conceito puro do domínio (ex.: `Team`, `Minigame`, `QuizQuestion`). Sempre declarada com `export type`, criada como objeto literal, sem métodos nem classes.
- **DataSource (`src/model/datasources/` + `src/infra/datasources/`)**: Responde à pergunta *"Preciso guardar ou recuperar dados?"* (memória, `AsyncStorage`, `SQLite`, `Firestore`, API REST).
- **Service (`src/model/services/` + `src/infra/services/`)**: Responde à pergunta *"Preciso executar uma funcionalidade ou operar um recurso externo/nativo?"* (autenticação, sala multiplayer em tempo real, síntese/reprodução de voz do narrador, câmera, localização).
- **Use Case (`src/usecase/`)**: Responde à pergunta *"O que a aplicação faz?"*. Valida parâmetros de entrada, aplica regras de negócio e coordena chamadas entre `Services` e `DataSources`. A ViewModel **nunca** chama um `Service` ou `DataSource` diretamente.

---

## 3. Exemplos Canônicos por Camada

### 3.1. Rota Fina (`src/app/teams.tsx`)
```tsx
import Teams from "@/view/teams";
export default Teams;
```

### 3.2. Entidade (`src/model/entities/team.ts`)
```ts
export type Team = {
  id: string;
  name: string;
  score: number;
};
```

### 3.3. Erros de Domínio (`src/model/errors.ts`)
```ts
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class AuthError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class DataSourceError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "DataSourceError";
  }
}
```

### 3.4. Contratos no Domínio (`src/model/datasources/iTeamDataSource.ts`)
```ts
import type { Team } from "@/model/entities/team";

export interface ITeamDataSource {
  listTeams(): Promise<Team[]>;
  addTeam(name: string): Promise<Team>;
  removeTeam(id: string): Promise<void>;
  addScore(teamId: string, points: number): Promise<void>;
  resetScores(): Promise<void>;
}
```

### 3.5. Implementação na Infraestrutura (`src/infra/datasources/memoryTeamDataSource.ts`)
```ts
import type { ITeamDataSource } from "@/model/datasources/iTeamDataSource";
import type { Team } from "@/model/entities/team";
import { DataSourceError } from "@/model/errors";

export class MemoryTeamDataSource implements ITeamDataSource {
  private teams: Team[] = [
    { id: "team-1", name: "Tribo de Judá", score: 0 },
    { id: "team-2", name: "Leões da Fé", score: 0 },
  ];

  async listTeams(): Promise<Team[]> {
    return [...this.teams];
  }

  async addTeam(name: string): Promise<Team> {
    try {
      const created: Team = { id: `team-${Date.now()}`, name, score: 0 };
      this.teams.push(created);
      return created;
    } catch {
      throw new DataSourceError("Não foi possível salvar a equipe.");
    }
  }

  async removeTeam(id: string): Promise<void> {
    this.teams = this.teams.filter((t) => t.id !== id);
  }

  async addScore(teamId: string, points: number): Promise<void> {
    this.teams = this.teams.map((t) =>
      t.id === teamId ? { ...t, score: t.score + points } : t
    );
  }

  async resetScores(): Promise<void> {
    this.teams = this.teams.map((t) => ({ ...t, score: 0 }));
  }
}
```

### 3.6. Caso de Uso (`src/usecase/iPgPlayUseCases.ts` e `src/usecase/pgPlayUseCases.ts`)
- O Use Case recebe contratos (`ITeamDataSource`, `IGameCatalogDataSource`, `IMultiplayerRoomService`) no construtor e valida regras (lançando `ValidationError`).

### 3.7. Container de Injeção de Dependências (`src/di/container.ts`)
- Único arquivo que importa de `@/infra/*` e instancia os objetos concretos.

### 3.8. ViewModel (`src/viewmodel/useTeamsViewModel.ts`)
```ts
export type TeamsState = {
  teams: Team[];
  loading: boolean;
  error: string | null;
  canStartRound: boolean;
};

export type TeamsActions = {
  handleAddTeam: (name: string) => Promise<boolean>;
  handleRemoveTeam: (id: string) => Promise<void>;
  handleStartRound: () => void;
  handleBackToHub: () => void;
};

export function useTeamsViewModel(
  useCases: IPgPlayUseCases = pgPlayUseCases
): [TeamsState, TeamsActions] {
  // Gerencia estados, chama useCases, trata DomainError e executa router.push/back
}
```

### 3.9. View (`src/view/teams.tsx`)
- Consome `const [state, actions] = useTeamsViewModel();`.
- Pode manter `useState` apenas para o texto digitado no formulário antes do envio.
- Usa apenas componentes de `@/view/components/*` e tokens de `@/view/theme`.
- Termina com `export default Teams;`.
