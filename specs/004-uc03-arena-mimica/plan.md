# 🏗️ Plano de Implementação Técnica (`plan.md`): 004-uc03-arena-mimica

- **Branch:** `feat/004-uc03-arena-mimica`
- **Data:** 2026-11-09
- **Especificação de Origem:** `specs/004-uc03-arena-mimica/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`
- **Issue Vinculada:** `#11` (`[UC03] Implementar Arena de Mímica Expressiva (RF07–RF09)`)

---

## 1. Resumo Técnico

Implementação completa da **Arena de Mímica Expressiva (`UC03`)** de dentro para fora seguindo as 7 camadas do **MVVM Sofisticado**:
1. Domínio puro em `src/model/` com erros semânticos (`errors.ts`), entidades (`Team`, `MimicaCard`, `MimicaCategory`) e contratos (`ITeamDataSource`, `IGameCatalogDataSource`).
2. Infraestrutura offline em memória (`MemoryTeamDataSource`, `MemoryGameCatalogDataSource`) com banco misto de cartas de mímica.
3. Regras de negócio em `PgPlayUseCases` (cálculo de `+20 pts` no acerto, penalidade `-5 pts` com piso `0` no pulo e filtro de pacotes de categorias).
4. ViewModel `useMimicaViewModel` gerenciando fases do turno (`pass-turn`, `playing`, `turn-summary`, `finished`), cronômetro e navegação (`expo-router`), espelhada por `src/view/mimica.tsx` e rota fina `src/app/mimica.tsx`.

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo foram validados:*

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada com os requisitos `UC03` (`RF09–RF13`, `RF24–RF25`, `RF28–RF31`).
- [x] **Artigo II (MVVM 7 Pastas)**: Todos os arquivos residem exclusivamente em `app`, `view`, `viewmodel`, `usecase`, `model`, `infra` ou `di`.
- [x] **Artigo II (Rotas Finas e View Burra)**: A rota `src/app/mimica.tsx` possui apenas 2 linhas e toda a navegação (`expo-router`) reside em `src/viewmodel/useMimicaViewModel.ts`.
- [x] **Artigo II (Vocabulário)**: Nenhum arquivo, interface ou classe usa `Repository` ou `Connector` (apenas `DataSource`).
- [x] **Artigo III (Design System)**: Todos os estilos usam exclusivamente tokens de `@/view/theme` e componentes de `@/view/components/`.
- [x] **Artigo IV (Testabilidade Offline)**: As dependências de `src/infra/` possuem implementações `Memory*` injetadas via `src/di/container.ts`.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

```text
src/
├─ model/
│  ├─ entities/team.ts                        # export type Team = { id, name, score }
│  ├─ entities/arenaChallenge.ts              # export type MimicaCategory, export type MimicaCard
│  ├─ datasources/iTeamDataSource.ts          # export interface ITeamDataSource
│  ├─ datasources/iGameCatalogDataSource.ts   # export interface IGameCatalogDataSource
│  └─ errors.ts                               # DomainError, ValidationError, AuthError, DataSourceError
├─ infra/
│  ├─ datasources/memoryTeamDataSource.ts     # export class MemoryTeamDataSource implements ITeamDataSource
│  └─ datasources/memoryGameCatalogDataSource.ts # export class MemoryGameCatalogDataSource implements IGameCatalogDataSource
├─ usecase/
│  ├─ iPgPlayUseCases.ts                      # export interface IPgPlayUseCases
│  └─ pgPlayUseCases.ts                       # export class PgPlayUseCases implements IPgPlayUseCases
├─ di/
│  └─ container.ts                            # Instancia Memory* e exporta pgPlayUseCases
├─ viewmodel/
│  └─ useMimicaViewModel.ts                   # export function useMimicaViewModel(): [MimicaState, MimicaActions]
├─ view/
│  └─ mimica.tsx                              # Tela da Arena de Mímica consumindo useMimicaViewModel e @/view/theme
└─ app/
   └─ mimica.tsx                              # Rota fina de 2 linhas reexportando @/view/mimica
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento da Tela | Componente (`@/view/components/`) | Tokens Semânticos (`@/view/theme`) |
| :--- | :--- | :--- |
| Cabeçalho e botão Sair | `ExpressiveButton` (`variant="outlined"`, `icon="close-circle"`) | `space.md`, `color.surface`, `color.onSurface`, `font.title` |
| Cronômetro de 60s da rodada | `ExpressiveTimer` (`secondsRemaining`) | `timer.bgNormal`, `timer.bgCritical`, `timer.radiusNormal`, `timer.radiusCritical` |
| Card de Passagem de Turno / Palavra Secreta | `GameCard` (`icon="drama-masks"`, `highlightLeader`) | `card.bg`, `card.radius`, `card.padding`, `font.display`, `color.actionContainer` |
| Ocultar / Revelar Palavra do Grupo | `ExpressiveButton` (`variant="tonal"`, `icon="eye"`) | `color.actionContainer`, `color.onActionContainer`, `button.minHeight` |
| Botão Acertaram! (+20 pts) | `ExpressiveButton` (`variant="successJumbo"`, `icon="check"`) | `color.success`, `color.onSuccess`, `button.jumboHeight` (`64 dp`) |
| Botão Pular (-5 pts) | `ExpressiveButton` (`variant="secondary"`, `icon="skip-next"`) | `color.secondary`, `color.onSecondary`, `button.minHeight` |
| Botão Estou Pronto! / Ir para o Placar Final | `ExpressiveButton` (`variant="primaryJumbo"`, `icon="play"` / `"trophy"`) | `button.bg`, `button.label`, `button.jumboHeight` (`64 dp`) |

---

## 5. Estratégia de Testes (`tests/`)

- **Testes Unitários de Caso de Uso (`tests/unit/pgPlayUseCases.mimica.test.ts`)**:
  - listagem de equipes e cartas de mímica por categoria;
  - soma de `+20 pts` no acerto de palavra (`scoreMimicaHit`);
  - penalidade de `-5 pts` no pulo (`scoreMimicaSkip`) garantindo piso em `0` (nunca negativo);
  - lançamento de `ValidationError` quando `teamId` é inválido ou nenhum pacote de categoria é selecionado.
- **Testes de Hook / ViewModel (`tests/hooks/useMimicaViewModel.test.ts`)**:
  - fase inicial `pass-turn` com palavra protegida;
  - início do turno (`handleStartTurn`), alternância de visibilidade da palavra (`handleToggleWordVisibility`), acerto (`handleHit`) e pulo (`handleSkip`);
  - contagem regressiva até `00:00` (`handleTick`) transitando para `turn-summary` e troca de equipe (`handleNextTurn`);
  - conclusão da partida (`finished`) e navegação para `/scoreboard` ou confirmação de saída (`handleRequestExit` / `handleConfirmExit`).
- **Testes de Tela com Mocks (`tests/mocks/mimicaScreen.mock.test.tsx`)**:
  - renderização dos 4 estados visuais (`loading`, `error`, `empty` e `content` nas fases `pass-turn`, `playing`, `turn-summary` e `finished`).
