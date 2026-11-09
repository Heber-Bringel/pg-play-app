# 05 · Infraestrutura, Persistência Local e Supabase (Multiplayer)

Este guia especifica a arquitetura da camada `src/infra/` e a injeção de dependências em `src/di/container.ts` para o **PG PLAY**, dividida em dois roteiros alinhados às **Milestones** do projeto e às 12 Regras de Ouro do **Harness MVVM Sofisticado**.

---

## 1. Visão Geral: Roteiro de Infraestrutura em 2 Fases

| Fase | Milestones | Escopo Funcional | Tecnologias em `src/infra/` |
| :--- | :---: | :--- | :--- |
| **Roteiro 1 — Local & Offline** | **`v0.1.0` (M1)** e **`v0.2.0` (M2)** | Hub de Jogos, Equipes, Mímica Expressiva, Quiz Relâmpago, Jogo da Forca e Placar Geral (`UC01` a `UC06`) | `Memory*DataSource` (obrigatório para testes e resposta `< 150 ms`) + `@react-native-async-storage/async-storage` (`AsyncStorage*DataSource`) |
| **Roteiro 2 — Sala Multiplayer** | **`v1.0.0` (M3)** | Cidade Dorme com Narrador por Áudio (`UC07`) e Adedonha Bíblica com Roleta Expressiva (`UC08`) | `Memory*Service` (testes/offline) + **Supabase** (`@supabase/supabase-js`: Auth Anônima, Postgres RLS e Realtime) + `expo-av` (áudio do Narrador) |

> **Regra Inegociável (Isolamento de Infraestrutura)**:
> - Toda classe em `src/infra/` deve declarar explicitamente `implements I...DataSource` ou `implements I...Service`.
> - Toda funcionalidade deve possuir primeiro uma implementação `Memory*` funcional (garantindo que `npm test` e o modo offline funcionem sem rede).
> - Somente `src/di/container.ts` (e os testes em `tests/`) pode importar arquivos de `@/infra/*`.
> - É **proibido** usar os termos `Repository` ou `Connector` em nomes de pastas, arquivos, interfaces ou classes.

---

## 2. Roteiro 1: Persistência Local nos Jogos de 1 Celular (`UC01` a `UC06`)

Nos jogos presenciais de **Passa-Celular**, o requisito não funcional **RNF02** exige operação 100% local e tempo de sorteio/busca inferior a `150 ms`, sem depender de conexão com a internet.

### 2.1. Bancos de Palavras e Catálogo (`MemoryGameCatalogDataSource`)
- Os pacotes temáticos (*Bíblico*, *Filmes e Séries*, *Animais*, *Conhecimentos Gerais*) de **Mímica**, **Quiz** e **Forca** ficam embarcados localmente em `src/infra/datasources/memoryGameCatalogDataSource.ts`.
- O filtro de busca em tempo real (**RF03**) e o controle de palavras já sorteadas na partida (**RF30**) operam em memória com latência `0 ms`.

### 2.2. Equipes e Placar Acumulado (`MemoryTeamDataSource` / `AsyncStorageTeamDataSource`)
- **Desenvolvimento e Testes Unitários (`Jest`)**: utilizam `MemoryTeamDataSource` (`src/infra/datasources/memoryTeamDataSource.ts`), já pré-carregado com as `2` equipes sugeridas por padrão (**RF05**).
- **Persistência no Aparelho (`AsyncStorage`)**: para evitar perda do placar acumulado caso o aplicativo seja fechado acidentalmente durante o encontro do PG, `AsyncStorageTeamDataSource` (`src/infra/datasources/asyncStorageTeamDataSource.ts`) implementa o mesmo contrato `ITeamDataSource`:

```ts
// src/infra/datasources/asyncStorageTeamDataSource.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ITeamDataSource } from "@/model/datasources/iTeamDataSource";
import type { Team } from "@/model/entities/team";
import { DataSourceError } from "@/model/errors";

const TEAMS_STORAGE_KEY = "@pgplay:teams:v1";

const DEFAULT_TEAMS: Team[] = [
  { id: "team-1", name: "Tribo de Judá", score: 0 },
  { id: "team-2", name: "Leões da Fé", score: 0 },
];

export class AsyncStorageTeamDataSource implements ITeamDataSource {
  async listTeams(): Promise<Team[]> {
    try {
      const raw = await AsyncStorage.getItem(TEAMS_STORAGE_KEY);
      if (!raw) {
        await AsyncStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(DEFAULT_TEAMS));
        return [...DEFAULT_TEAMS];
      }
      return JSON.parse(raw) as Team[];
    } catch (err: unknown) {
      throw new DataSourceError(
        err instanceof Error ? err.message : "Erro ao carregar equipes do dispositivo."
      );
    }
  }

  async addTeam(name: string): Promise<Team> {
    try {
      const current = await this.listTeams();
      const created: Team = { id: `team-${Date.now()}`, name, score: 0 };
      const updated = [...current, created];
      await AsyncStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(updated));
      return created;
    } catch (err: unknown) {
      throw new DataSourceError(
        err instanceof Error ? err.message : "Não foi possível salvar a equipe."
      );
    }
  }

  async removeTeam(id: string): Promise<void> {
    try {
      const current = await this.listTeams();
      const updated = current.filter((t) => t.id !== id);
      await AsyncStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(updated));
    } catch (err: unknown) {
      throw new DataSourceError(
        err instanceof Error ? err.message : "Não foi possível remover a equipe."
      );
    }
  }

  async addScore(teamId: string, points: number): Promise<void> {
    try {
      const current = await this.listTeams();
      const updated = current.map((t) =>
        t.id === teamId ? { ...t, score: Math.max(0, t.score + points) } : t
      );
      await AsyncStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(updated));
    } catch (err: unknown) {
      throw new DataSourceError(
        err instanceof Error ? err.message : "Não foi possível atualizar a pontuação."
      );
    }
  }

  async resetScores(): Promise<void> {
    try {
      const current = await this.listTeams();
      const updated = current.map((t) => ({ ...t, score: 0 }));
      await AsyncStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(updated));
    } catch (err: unknown) {
      throw new DataSourceError(
        err instanceof Error ? err.message : "Não foi possível zerar o placar."
      );
    }
  }
}
```

---

## 3. Roteiro 2: Backend-as-a-Service com Supabase no Modo Multiplayer (`UC07` e `UC08`)

Para o [**Cidade Dorme**](../jogos/cidade-dorme.md) e a [**Adedonha Bíblica**](../jogos/adedonha-biblica.md), o projeto adota o **Supabase (`@supabase/supabase-js`)** como plataforma de Backend-as-a-Service (BaaS), eliminando a necessidade de manter um servidor intermediário próprio.

### 3.1. Por que Supabase no PG PLAY?

| Requisito do Projeto | Solução com Supabase + Expo |
| :--- | :--- |
| **Acesso imediato sem cadastro (`RNF03`)** | **Supabase Anonymous Sign-Ins** (`supabase.auth.signInAnonymously()`): gera um `user.id` autenticado invisível para o jogador assim que ele digita seu apelido e o código PIN da sala, sem pedir e-mail ou senha. |
| **Isolamento de papéis secretos (`RNF11`)** | **PostgreSQL Row Level Security (RLS)**: no *Cidade Dorme*, a tabela `cidade_dorme_secrets` possui política `auth.uid() = player_id`, garantindo no nível do banco de dados que nenhum aparelho consiga ler o papel secreto de outro jogador. |
| **Sincronização em Tempo Real (`RF18–RF23`)** | **Supabase Realtime**: combina *Presence* (quem está conectado no Lobby), *Broadcast* de baixa latência (giro da Roleta Expressiva, grito de *"ADEDONHA!"* e botão *"Levantar Dúvida ✋"*) e *Postgres Changes* (mudança de fase *Noite/Dia*, votos e placar). |
| **Narrador com Voz Clonada (`RF19`, `RNF08`)** | **`expo-av` (`INarratorAudioService`)**: os áudios das falas (voz Masculina e Feminina) são reproduzidos apenas no celular do **Anfitrião/Moderador**, enquanto o estado da fala atual é sincronizado via Supabase para exibir **legendas em tempo real** em todos os aparelhos. |

---

### 3.2. Variáveis de Ambiente e Pacotes Necessários (Milestone 3)

Quando iniciar a **Milestone 3 (`v1.0.0`)**, instale os pacotes compatíveis com o SDK do Expo:

```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage expo-av
```

Configure no arquivo `.env` (nunca versionado no Git, mantendo apenas `.env.example` no repositório):

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

> **Segurança**: Variáveis `EXPO_PUBLIC_` são públicas no bundle do aplicativo. **Nunca** coloque a chave `service_role` no código do app; toda segurança de dados deve ser garantida pelas políticas **RLS (Row Level Security)** no banco do Supabase.

---

### 3.3. Modelagem de Tabelas e Políticas RLS no Supabase (SQL de Referência)

Abaixo está o esquema relacional enxuto no PostgreSQL do Supabase para suportar **Cidade Dorme (`UC07`)** e **Adedonha Bíblica (`UC08`)**:

```sql
-- 1. Salas Multiplayer (Cidade Dorme e Adedonha Bíblica)
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code varchar(6) not null unique,
  game_type varchar(20) not null check (game_type in ('cidade-dorme', 'adedonha')),
  host_id uuid not null,
  status varchar(20) not null default 'lobby',
  phase varchar(30) not null default 'waiting',
  config jsonb not null default '{}'::jsonb,
  current_round int not null default 1,
  current_letter char(1),
  narrator_caption text,
  created_at timestamptz not null default now()
);

-- 2. Jogadores da Sala
create table public.room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null,
  nickname varchar(20) not null,
  is_host boolean not null default false,
  is_alive boolean not null default true,
  is_ready boolean not null default false,
  score int not null default 0,
  unique (room_id, user_id)
);

-- 3. Segredos do Cidade Dorme (Isolamento Anti-Trapaça RNF11)
create table public.cidade_dorme_secrets (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null,
  secret_role varchar(20) not null check (secret_role in ('cidadao', 'assassino', 'anjo', 'detetive')),
  detective_verdict jsonb,
  primary key (room_id, user_id)
);

-- 4. Respostas e Apuração da Adedonha Bíblica (RF22 e RF23)
create table public.adedonha_submissions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  round_number int not null,
  user_id uuid not null,
  column_name varchar(40) not null,
  answer_text varchar(60) not null default '',
  status varchar(20) not null default 'pending' check (status in ('pending', 'unique', 'repeated', 'invalid')),
  doubt_count int not null default 0,
  points int not null default 0
);

-- Habilitar Row Level Security (RLS)
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.cidade_dorme_secrets enable row level security;
alter table public.adedonha_submissions enable row level security;

-- Política crítica RNF11: Cada jogador só pode ler o SEU PRÓPRIO papel secreto!
create policy "Jogador lê apenas seu próprio papel secreto"
  on public.cidade_dorme_secrets
  for select
  using (auth.uid() = user_id);
```

---

### 3.4. Posicionamento dos Arquivos nas 7 Camadas do MVVM

O uso do Supabase e do `expo-av` fica **100% encapsulado** dentro de `src/infra/` e conectado apenas em `src/di/container.ts`:

```text
src/
├─ model/
│  ├─ entities/
│  │  └─ multiplayerSession.ts                 # export type Room, RoomPlayer, CidadeDormeRole, AdedonhaSubmission
│  └─ services/
│     ├─ iMultiplayerRoomService.ts            # export interface IMultiplayerRoomService
│     └─ iNarratorAudioService.ts              # export interface INarratorAudioService
├─ infra/
│  ├─ datasources/
│  │  ├─ memoryGameCatalogDataSource.ts        # implements IGameCatalogDataSource
│  │  ├─ memoryTeamDataSource.ts               # implements ITeamDataSource (Testes/Offline)
│  │  └─ asyncStorageTeamDataSource.ts         # implements ITeamDataSource (Persistência Local)
│  └─ services/
│     ├─ memoryMultiplayerRoomService.ts       # implements IMultiplayerRoomService (Testes/Offline)
│     ├─ supabaseMultiplayerRoomService.ts     # implements IMultiplayerRoomService (Produção Realtime)
│     ├─ memoryNarratorAudioService.ts         # implements INarratorAudioService (Testes/Offline)
│     └─ expoAvNarratorAudioService.ts         # implements INarratorAudioService (Áudio Voz Clonada)
└─ di/
   └─ container.ts                             # Único arquivo que importa @/infra/* e injeta nos Use Cases
```

---

### 3.5. Padrão de Implementação em `src/infra/services/` e `src/di/container.ts`

Toda classe em `src/infra/services/` deve implementar seu contrato de `@/model/services/i*Service` e converter falhas de rede/autenticação em subclasses de `DomainError` (`AuthError`, `DataSourceError`):

```ts
// src/infra/services/supabaseMultiplayerRoomService.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { IMultiplayerRoomService } from "@/model/services/iMultiplayerRoomService";
import type { MultiplayerRoom } from "@/model/entities/multiplayerSession";
import { AuthError, DataSourceError } from "@/model/errors";

export class SupabaseMultiplayerRoomService implements IMultiplayerRoomService {
  private readonly client: SupabaseClient;

  constructor(supabaseUrl: string, supabaseAnonKey: string) {
    this.client = createClient(supabaseUrl, supabaseAnonKey);
  }

  async createRoom(hostNickname: string, gameType: "cidade-dorme" | "adedonha"): Promise<MultiplayerRoom> {
    try {
      const { data: authData, error: authError } = await this.client.auth.signInAnonymously();
      if (authError || !authData.user) {
        throw new AuthError("Não foi possível iniciar sessão anônima na sala.");
      }
      // Cria a sala no Supabase e retorna a entidade pura MultiplayerRoom...
      throw new DataSourceError("Implementação completa na Milestone 3 (v1.0.0).");
    } catch (err: unknown) {
      if (err instanceof AuthError || err instanceof DataSourceError) {
        throw err;
      }
      throw new DataSourceError("Falha de conexão com a sala multiplayer.");
    }
  }
}
```

E em `src/di/container.ts`, a troca entre o modo `Memory` (Roteiro 1 / Testes) e `Supabase` (Roteiro 2 / Produção) ocorre em um único ponto:

```ts
// src/di/container.ts
import { MemoryGameCatalogDataSource } from "@/infra/datasources/memoryGameCatalogDataSource";
import { MemoryTeamDataSource } from "@/infra/datasources/memoryTeamDataSource";
import { MemoryMultiplayerRoomService } from "@/infra/services/memoryMultiplayerRoomService";
import { PgPlayUseCases } from "@/usecase/pgPlayUseCases";

const gameCatalogDataSource = new MemoryGameCatalogDataSource();
const teamDataSource = new MemoryTeamDataSource();
const multiplayerRoomService = new MemoryMultiplayerRoomService();

export const pgPlayUseCases = new PgPlayUseCases(
  gameCatalogDataSource,
  teamDataSource,
  multiplayerRoomService
);
```

---

## 4. Checklist de Conformidade Arquitetural (`npm run check`)

Ao criar qualquer arquivo em `src/infra/`:
1. O nome do arquivo está em `camelCase.ts` (ex.: `supabaseMultiplayerRoomService.ts`) e **não** contém `Repository` ou `Connector`?
2. Existe a versão `memory*.ts` correspondente implementando a mesma interface `I*`?
3. A declaração da classe contém explicitamente `export class Nome implements INome`?
4. Todos os blocos `catch` usam `catch (err: unknown)` (nunca `any`) e lançam `DataSourceError` ou `AuthError`?
5. Nenhum arquivo de `view/`, `viewmodel/` ou `usecase/` importou `@supabase/supabase-js`, `AsyncStorage`, `expo-av` ou `@/infra/*`?
