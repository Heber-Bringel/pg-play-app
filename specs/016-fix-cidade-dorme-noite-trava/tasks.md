# ✅ Lista de Tarefas (`tasks.md`): Correção de Travamento da Noite e Cadência Fixa no Cidade Dorme

- **Input:** `specs/016-fix-cidade-dorme-noite-trava/spec.md` e `specs/016-fix-cidade-dorme-noite-trava/plan.md`
- **Ordem de Execução Obrigatória:** De dentro para fora (`model` → `infra` → `usecase` → `tests` → `viewmodel` → `view` → `npm run check`)
- **Receitas do Harness:** `/nova-funcionalidade`, `/revisar-arquitetura`, `/commit-e-pr`

---

## Fase 1: Domínio Puro (`src/model/`)
*Objetivo: Incluir marca temporal oficial de fim de fase nas entidades do Cidade Dorme.*

- [x] **T001** Adicionar `phaseEndsAt: string | null` ao tipo `CidadeDormeRoom` em `src/model/entities/multiplayerSession.ts`

---

## Fase 2: Infraestrutura (`src/infra/`)
*Objetivo: Persistir e sincronizar `phaseEndsAt` entre dispositivos e nos testes em memória.*

- [x] **T002** Atualizar `MemoryMultiplayerRoomService` (`src/infra/services/memoryMultiplayerRoomService.ts`) para inicializar e preservar `phaseEndsAt`
- [x] **T003** Atualizar `SupabaseMultiplayerRoomService` (`src/infra/services/supabaseMultiplayerRoomService.ts`) para persistir e mapear `phaseEndsAt` (e coluna `phase_ends_at` no SQL se configurada, com fallback em payload público)

---

## Fase 3: Caso de Uso (`src/usecase/`)
*Objetivo: Padronizar duração fixa anti-dedução e avanço automático idempotente sem inventar alvos.*

- [x] **T004** Atualizar `ICidadeDormeUseCases` (`src/usecase/iCidadeDormeUseCases.ts`) para aceitar `expectedPhase` e `expectedRound` opcionais em `autoAdvanceNightTurn`
- [x] **T005** Injetar relógio opcional `now: () => number = Date.now` em `CidadeDormeUseCases` (`src/usecase/cidadeDormeUseCases.ts`) e calcular `phaseEndsAt` em todas as entradas de fase cronometrada (`night_*` e `day_debate`)
- [x] **T006** Ajustar `submitAssassinTarget`, `submitAngelProtection`, `submitDetectiveInvestigation` e `autoAdvanceNightTurn` em `src/usecase/cidadeDormeUseCases.ts` para manter a duração fixa da fase (`RNF11`), deixar ações não realizadas como `null` no timeout e avançar automaticamente até `advanceToDawn` mesmo com Anjo ou Detetive mortos

---

## Fase 4: Testes Unitários de Regressão (`tests/unit/`)
*Objetivo: Validar todas as regras da noite antes da camada de apresentação.*

- [x] **T007** Adicionar testes de regressão em `tests/unit/cidadeDormeUseCases.test.ts` cobrindo: Anjo morto, Detetive morto, papel vivo sem ação no tempo, idempotência de `autoAdvanceNightTurn` e duração `phaseEndsAt` invariante (`RNF11`)

---

## Fase 5: Apresentação — ViewModel e View (`src/viewmodel/` e `src/view/`)
*Objetivo: Sincronizar o relógio da tela com o servidor e acionar o avanço automático pelo Anfitrião.*

- [x] **T008** Atualizar `src/viewmodel/useCidadeDormeViewModel.ts` para calcular `secondsRemaining` a partir de `room.phaseEndsAt`, expor `hasSubmittedNightAction` e acionar `handleAutoAdvanceNightTurn` uma única vez pelo Anfitrião quando `secondsRemaining === 0`
- [x] **T009** Atualizar `src/view/cidade-dorme.tsx` e `src/view/components/cidadeDormeNightSection.tsx` removendo o botão *"Concluir Noite e Amanhecer"* do card do Detetive e exibindo feedback de aguardando o término do turno após agir

---

## Fase 6: Testes de Apresentação, Verificação e Pull Request
*Objetivo: Garantir 0 violações no Harness e cobertura completa dos cenários de regressão.*

- [x] **T010** Atualizar `tests/hooks/useCidadeDormeViewModel.test.ts` (timer por `phaseEndsAt` + autoavanço pelo host) e `tests/mocks/cidadeDormeScreen.mock.test.tsx`
- [x] **T011** Executar `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest`) e confirmar **0 violações**
- [ ] **T012** Realizar commits convencionais e abrir Pull Request seguindo a receita `/commit-e-pr` vinculando `Closes #41`
