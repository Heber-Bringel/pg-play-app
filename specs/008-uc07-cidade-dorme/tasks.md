# ✅ Lista de Tarefas (`tasks.md`): UC07 — Cidade Dorme em Sala Multiplayer com Narrador por Áudio

- **Input:** `specs/008-uc07-cidade-dorme/spec.md` e `specs/008-uc07-cidade-dorme/plan.md`
- **Ordem de Execução Obrigatória:** De dentro para fora (`model` → `infra` → `usecase` → `di` → `tests` → `viewmodel` → `view` → `app`)
- **Receitas do Harness:** `/nova-funcionalidade`, `/nova-tela`, `/revisar-arquitetura`, `/commit-e-pr`

---

## Fase 1: Domínio Puro (`src/model/`)
*Objetivo: Definir entidades (`type`) e contratos de serviço (`interface`) do Cidade Dorme sem nenhuma dependência externa.*

- [x] **T001** Adicionar os tipos puros do Cidade Dorme (`CidadeDormeRole`, `CidadeDormeAlignment`, `CidadeDormeVoiceProfile`, `CidadeDormePhase`, `CidadeDormeConfig`, `CidadeDormeDetectiveVerdict`, `CidadeDormeDawnReport`, `CidadeDormeVoteReport`, `CidadeDormePlayer` e `CidadeDormeRoom`) em `src/model/entities/multiplayerSession.ts`
- [x] **T002** Criar o contrato `export interface INarratorAudioService` em `src/model/services/iNarratorAudioService.ts` para condução por voz (Masculina/Feminina) e legendas sincronizadas
- [x] **T003** Estender `export interface IMultiplayerRoomService` em `src/model/services/iMultiplayerRoomService.ts` com os métodos de sala do Cidade Dorme (`getCidadeDormeRoom`, `createCidadeDormeRoom`, `joinCidadeDormeRoom`, `updateCidadeDormeConfig`, `saveCidadeDormeRoom`, `subscribeToCidadeDormeRoom`)

---

## Fase 2: Infraestrutura Offline/Memória e Supabase (`src/infra/`)
*Objetivo: Ativar o jogo no catálogo e implementar os contratos do domínio com classes concretas `Memory*` e `Supabase*`.*

- [x] **T004** Ativar o minigame `'cidade-dorme'` (`available: true`, `playersTag: 'Multi-Celular · 5–16 jogadores'`) em `src/infra/datasources/memoryGameCatalogDataSource.ts`
- [x] **T005** Implementar `MemoryNarratorAudioService` (`implements INarratorAudioService`) em `src/infra/services/memoryNarratorAudioService.ts`
- [x] **T006** Implementar os métodos de sala do Cidade Dorme (incluindo sala demo pré-carregada com 6 jogadores para teste/modo offline) em `src/infra/services/memoryMultiplayerRoomService.ts` e `src/infra/services/supabaseMultiplayerRoomService.ts`

---

## Fase 3: Caso de Uso e Injeção de Dependências (`src/usecase/` e `src/di/`)
*Objetivo: Concentrar todas as regras e validações do Cidade Dorme (`RF18–RF20`) no UseCase e conectá-lo no container DI.*

- [x] **T007** Criar o contrato `export interface ICidadeDormeUseCases` em `src/usecase/iCidadeDormeUseCases.ts`
- [x] **T008** Implementar `export class CidadeDormeUseCases implements ICidadeDormeUseCases` em `src/usecase/cidadeDormeUseCases.ts` (criação/entrada em sala, adição de jogador no lobby, configuração, sorteio secreto de papéis, confirmação de leitura, turnos noturnos de Assassino/Anjo/Detetive com veredito silencioso, amanhecer, debate, votação secreta com apuração de maioria/empate, verificação de vitória e revanche)
- [x] **T009** Instanciar `MemoryNarratorAudioService` e exportar `cidadeDormeUseCases` em `src/di/container.ts`

---

## Fase 4: Testes Unitários da Regra de Negócio (`tests/unit/`)
*Objetivo: Validar `CidadeDormeUseCases` isoladamente antes da camada de apresentação.*

- [x] **T010** Criar testes unitários em `tests/unit/cidadeDormeUseCases.test.ts` cobrindo `RF18`, `RF19`, `RF20`, salvamento pelo Anjo, veredito do Detetive, vitória da Cidade, vitória dos Assassinos, empate na votação e lançamentos de `ValidationError`

---

## Fase 5: Apresentação — ViewModel, View e Rota Fina (`src/viewmodel/`, `src/view/`, `src/app/`)
*Objetivo: Expor `[state, actions]` na ViewModel, renderizar com transição Tema Escuro (Noite) ↔ Tema Claro (Dia) na View e criar a rota fina de 2 linhas.*

- [x] **T011** Implementar `useCidadeDormeViewModel` retornando `[CidadeDormeState, CidadeDormeActions]` em `src/viewmodel/useCidadeDormeViewModel.ts`
- [x] **T012** Criar os componentes modulares de seção do Cidade Dorme em `src/view/components/` (`cidadeDormeEntrySection.tsx`, `cidadeDormeLobbySection.tsx`, `cidadeDormeRoleSection.tsx`, `cidadeDormeNightSection.tsx` com `darkTokens` e `cidadeDormeDaySection.tsx` com `tokens`)
- [x] **T013** Implementar a tela espelhada `src/view/cidade-dorme.tsx` e a rota fina de 2 linhas em `src/app/cidade-dorme.tsx`

---

## Fase 6: Testes de Hook, Mocks de Tela e Verificação Arquitetural
*Objetivo: Cobrir ViewModel e View com testes automatizados e garantir 0 violações em `npm run check`.*

- [x] **T014** Criar `tests/hooks/useCidadeDormeViewModel.test.ts` e `tests/mocks/cidadeDormeScreen.mock.test.tsx` (e atualizar asserções de catálogo caso necessário)
- [x] **T015** Executar `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest`) e confirmar **0 violações** e todos os testes passando
