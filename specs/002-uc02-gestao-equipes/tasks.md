# 📋 Checklist de Tarefas (`tasks.md`): 002-uc02-gestao-equipes

- **Branch da Feature:** `feat/002-uc02-gestao-equipes`
- **Criado em:** 2026-11-11
- **Status:** Concluído
- **Autor / Perfil:** Douglas Leone (`DouglasLeone`)
- **Milestone:** `v0.2.0 — Núcleo & Jogos em 1 Celular (UC01–UC06)`
- **Issue vinculada:** `#10` (`[UC02] Implementar Configuração e Gestão de Equipes (RF04–RF06)`)

---

## Ordem de Implementação (De Dentro para Fora)

### Fase 1: Domínio Puro (`model/`)
- [x] **T01 — Entidade e Contratos:** Validar `src/model/entities/team.ts` e `src/model/datasources/iTeamDataSource.ts`.
- [x] **T02 — Erros de Domínio:** Verificar `ValidationError` e `DataSourceError` em `src/model/errors.ts`.

### Fase 2: Infraestrutura (`infra/`)
- [x] **T03 — DataSource em Memória:** Garantir que `MemoryTeamDataSource` implemente `listTeams`, `addTeam`, `removeTeam`, `addScore` e `resetScores` com tratamento de `DataSourceError`.
- [x] **T04 — DataSource Persistente:** Criar `src/infra/datasources/asyncStorageTeamDataSource.ts` com persistência segura em `@react-native-async-storage/async-storage`.

### Fase 3: Regras de Negócio (`usecase/`)
- [x] **T05 — Interface de Casos de Uso:** Adicionar assinaturas `addTeam(name: string): Promise<Team>` e `removeTeam(teamId: string): Promise<Team[]>` em `src/usecase/iPgPlayUseCases.ts`.
- [x] **T06 — Implementação de Casos de Uso:** Implementar em `src/usecase/pgPlayUseCases.ts`:
  - Validação de nome mínimo de 2 caracteres (`ValidationError`).
  - Validação de nome máximo de 20 caracteres (`ValidationError`).
  - Validação de duplicidade case-insensitive e trim (`ValidationError`).
  - Restrição de no máximo 6 equipes por sessão (`ValidationError`).
  - Remoção de equipe e retorno da lista atualizada.

### Fase 4: Injeção de Dependências (`di/`)
- [x] **T07 — Container:** Validar injeção do `teamDataSource` em `src/di/container.ts`.

### Fase 5: Testes Unitários de Domínio (`tests/unit/`)
- [x] **T08 — Testes de UseCase:** Criar `tests/unit/pgPlayUseCases.teams.test.ts` cobrindo sucesso, validação de caracteres, duplicatas, limite máximo de 6 equipes e remoção (9 testes).

### Fase 6: Estado e Ações (`viewmodel/`)
- [x] **T09 — ViewModel Custom Hook:** Criar `src/viewmodel/useTeamsViewModel.ts` exportando `TeamsState`, `TeamsActions` e o hook `useTeamsViewModel` com encapsulamento de navegação e tratamento de erros.
- [x] **T10 — Testes de Hook:** Criar `tests/hooks/useTeamsViewModel.test.ts` validando montagem, adição com sucesso, erro de validação, remoção e navegação (8 testes).

### Fase 7: Visual e Rotas (`view/` e `app/`)
- [x] **T11 — Tela Espelhada:** Criar `src/view/teams.tsx` consumindo `ExpressiveTextField`, `ExpressiveButton` (tonal, primaryJumbo, outlined), lista de equipes com avatar/ícone e estado vazio contextual.
- [x] **T12 — Rota Fina Expo Router:** Criar `src/app/teams.tsx` com exatamente 2 linhas (`import TeamsScreen from '@/view/teams'; export default TeamsScreen;`).
- [x] **T13 — Testes de Mock de Tela:** Criar `tests/mocks/teamsScreen.mock.test.tsx` validando renderização de equipes, campo de texto, botão Jumbo e estado vazio (7 testes).

### Fase 8: Verificação Final e Governança
- [x] **T14 — Verificação Completa:** Executar `npm run check` garantindo 0 erros de arquitetura, TypeScript e Jest (14 suítes, 93 testes passando).
- [x] **T15 — Commits e Pull Request:** Fazer commits convencionais por camada e abrir PR vinculando à Issue `#10`.
