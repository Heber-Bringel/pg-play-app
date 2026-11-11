# 🏗️ Plano de Implementação Técnica (`plan.md`): UC08 — Adedonha Bíblica em Sala Multiplayer

- **Branch:** `feat/009-uc08-adedonha-biblica`
- **Data:** 2026-11-11
- **Especificação de Origem:** `specs/009-uc08-adedonha-biblica/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

Implementar o Caso de Uso **UC08 — Jogar e Apurar Rodada de Adedonha Bíblica em Sala Multiplayer (`RF21–RF23`)** seguindo estritamente as 7 camadas do **Harness MVVM Sofisticado**. O domínio define as entidades puras em `src/model/entities/multiplayerSession.ts` e o contrato `IMultiplayerRoomService` em `src/model/services/iMultiplayerRoomService.ts`. A infraestrutura fornece `MemoryMultiplayerRoomService` (operação local/offline e testes) e `SupabaseMultiplayerRoomService` em `src/infra/services/`. As regras de negócio de colunas, sorteio na Roleta Expressiva, validação de letra inicial, grito de *"ADEDONHA!"* e apuração com *"Levantar Dúvida ✋"* ficam isoladas em `AdedonhaUseCases` (`src/usecase/`), injetadas via `src/di/container.ts`, consumidas por `useAdedonhaViewModel` e renderizadas em `src/view/adedonha.tsx` ↔ `src/app/adedonha.tsx`.

---

## 2. Verificação Constitucional (*Constitution Check*)

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada com os requisitos `RF21`, `RF22`, `RF23` e `UC08`.
- [x] **Artigo II (MVVM 7 Pastas)**: Todos os arquivos planejados residem apenas em `app`, `view`, `viewmodel`, `usecase`, `model`, `infra` ou `di`.
- [x] **Artigo II (Rotas Finas e View Burra)**: A rota em `src/app/adedonha.tsx` terá apenas 2 linhas e toda a navegação (`expo-router`) ficará em `src/viewmodel/useAdedonhaViewModel.ts`.
- [x] **Artigo II (Vocabulário)**: Nenhum arquivo, interface ou classe usa `Repository` ou `Connector` (apenas `DataSource` e `Service`).
- [x] **Artigo III (Design System)**: Todos os estilos usam exclusivamente tokens de `@/view/theme` e componentes de `@/view/components/`.
- [x] **Artigo IV (Testabilidade Offline)**: A infraestrutura em `src/infra/services/` possui implementação `MemoryMultiplayerRoomService` injetada via `src/di/container.ts`.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

```text
src/
├─ model/
│  ├─ entities/multiplayerSession.ts             # export type AdedonhaRoom, AdedonhaPlayer, AdedonhaSubmission, etc.
│  ├─ services/iMultiplayerRoomService.ts        # export interface IMultiplayerRoomService
│  └─ errors.ts                                  # DomainError, ValidationError, AuthError, DataSourceError
├─ infra/
│  └─ services/
│     ├─ memoryMultiplayerRoomService.ts         # export class MemoryMultiplayerRoomService implements IMultiplayerRoomService
│     └─ supabaseMultiplayerRoomService.ts       # export class SupabaseMultiplayerRoomService implements IMultiplayerRoomService
├─ usecase/
│  ├─ iAdedonhaUseCases.ts                       # export interface IAdedonhaUseCases
│  └─ adedonhaUseCases.ts                        # export class AdedonhaUseCases implements IAdedonhaUseCases
├─ di/
│  └─ container.ts                               # Instancia MemoryMultiplayerRoomService e exporta adedonhaUseCases
├─ viewmodel/
│  └─ useAdedonhaViewModel.ts                    # export function useAdedonhaViewModel(): [AdedonhaState, AdedonhaActions]
├─ view/
│  └─ adedonha.tsx                               # Tela espelhada consumindo useAdedonhaViewModel e @/view/theme
└─ app/
   └─ adedonha.tsx                               # Rota fina de 2 linhas reexportando @/view/adedonha
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento da Tela | Componente (`@/view/components/`) | Tokens Semânticos (`@/view/theme`) |
| :--- | :--- | :--- |
| **Roleta Expressiva do Alfabeto (A–Z)** | `LetterKey` (`available`, `hit`, `miss`) + `GameCard` | `color.action`, `color.actionContainer`, `radius.full`, `radius.xl`, `font.display` |
| **Configuração e Preenchimento de Colunas** | `ExpressiveTextField` | `color.surfaceContainer`, `color.error`, `color.errorContainer`, `space.md` |
| **Cronômetro da Rodada / Contagem Final** | `ExpressiveTimer` | `timer.bgNormal`, `timer.bgCritical`, `radius.full`, `radius.md` |
| **Botão "ADEDONHA!" e Confirmações** | `ExpressiveButton` (`primaryJumbo`, `successJumbo`, `tonal`, `outlined`) | `button.jumboHeight`, `button.minHeight`, `color.action`, `color.success` |
| **Cards de Apuração (+10, +5, 0) e Pódio** | `GameCard` | `color.surfaceContainer`, `color.highlight`, `color.outline`, `space.lg` |

---

## 5. Estratégia de Testes (`tests/`)

- **Testes Unitários (`tests/unit/adedonhaUseCases.test.ts`)**:
  - Criação/gestão de colunas bíblicas no Lobby, validação de colunas inválidas/duplicadas (`ValidationError`).
  - Sorteio na Roleta Expressiva sem repetir letras usadas e validação instantânea da letra inicial (ignorando acentos).
  - Acionamento do botão *"ADEDONHA!"* e pré-classificação automática (`+10` única, `+5` repetida, `0` inválida), botão *"Levantar Dúvida ✋"* e julgamento pelo Moderador.
- **Testes de Hook (`tests/hooks/useAdedonhaViewModel.test.ts`)**:
  - Fluxo reativo completo da ViewModel (`Lobby` → `Roleta` → `Preenchimento` → `Apuração` → `Placar/Pódio`).
- **Testes de Tela com Mocks (`tests/mocks/adedonhaScreen.mock.test.tsx`)**:
  - Renderização dos 4 estados (`loading`, `error`, `empty`, `content`) e interações nas fases da Adedonha Bíblica.
