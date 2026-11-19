# 🏗️ Plano de Implementação Técnica (`plan.md`): Correção de Travamento da Noite e Cadência Fixa no Cidade Dorme

- **Branch:** `fix/016-cidade-dorme-noite-trava`
- **Data:** 2026-11-19
- **Especificação de Origem:** `specs/016-fix-cidade-dorme-noite-trava/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

Corrigir o travamento dos turnos noturnos e garantir cadência uniforme anti-dedução (`RNF11`) nas 7 camadas do **MVVM Sofisticado**:
1. **Domínio (`src/model/`):** Adicionar `phaseEndsAt: string | null` em `CidadeDormeRoom`;
2. **Infraestrutura (`src/infra/`):** Persistir e mapear `phaseEndsAt` (`phase_ends_at` / `rooms.config.phaseEndsAt`) em `SupabaseMultiplayerRoomService` e `MemoryMultiplayerRoomService`;
3. **Caso de Uso (`src/usecase/`):** Injetar relógio `now?: () => number` em `CidadeDormeUseCases`, gravar `phaseEndsAt` nas transições de fase, manter ações noturnas gravadas sem pular o relógio e tornar `autoAdvanceNightTurn` idempotente mantendo ações não realizadas como `null` até chamar `advanceToDawn`;
4. **ViewModel (`src/viewmodel/`):** Calcular `secondsRemaining` diretamente de `room.phaseEndsAt`, expor estado `hasSubmittedNightAction` e acionar `handleAutoAdvanceNightTurn` automaticamente no Anfitrião quando `secondsRemaining === 0`;
5. **View (`src/view/components/`):** Remover o botão *"Concluir Noite e Amanhecer"* do veredito do Detetive e exibir feedback de ação confirmada aguardando o fim do turno em `cidadeDormeNightSection.tsx` (exclusivamente com `darkTokens`).

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo devem estar marcados antes de gerar o `tasks.md` ou iniciar código.*

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada com os critérios de `RF19` e `RNF11`.
- [x] **Artigo II (MVVM 7 Pastas)**: Todas as alterações respeitam estritamente `model`, `infra`, `usecase`, `viewmodel` e `view`.
- [x] **Artigo II (Rotas Finas e View Burra)**: `src/view/components/cidadeDormeNightSection.tsx` não possui timers nem regras de avanço automático (toda coordenação fica em `useCidadeDormeViewModel` + `CidadeDormeUseCases`).
- [x] **Artigo II (Vocabulário)**: Nenhum arquivo, interface ou classe usa termos proibidos (apenas `DataSource`, `Service` e `UseCases`).
- [x] **Artigo III (Design System)**: Feedback de confirmação noturna e estado de espera utilizam exclusivamente `darkTokens` e ícones semânticos (`check-circle`, `clock-outline`).
- [x] **Artigo IV (Testabilidade Offline)**: `MemoryMultiplayerRoomService` e relógio injetável `now` permitem testar toda a cadência da noite instantaneamente sem `sleep` reais.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

```text
src/
├─ model/
│  └─ entities/multiplayerSession.ts               # Adiciona phaseEndsAt: string | null em CidadeDormeRoom
├─ infra/
│  └─ services/
│     ├─ memoryMultiplayerRoomService.ts           # Inicializa e preserva phaseEndsAt nas salas de Cidade Dorme
│     └─ supabaseMultiplayerRoomService.ts         # Grava/lê phaseEndsAt em rooms (saveCidadeDormeRoom / mapRowToCidadeDormeRoom)
├─ usecase/
│  ├─ iCidadeDormeUseCases.ts                      # Atualiza assinatura de autoAdvanceNightTurn(roomId, expectedPhase?, expectedRound?)
│  └─ cidadeDormeUseCases.ts                       # Calcula phaseEndsAt, mantém ação vazia em timeout e não antecipa fim de turno
├─ di/
│  └─ container.ts                                 # Mantém default now = Date.now sem quebra
├─ viewmodel/
│  └─ useCidadeDormeViewModel.ts                   # Sincroniza secondsRemaining por phaseEndsAt, controla hasSubmittedNightAction e dispara autoAdvanceNightTurn no host ao zerar
└─ view/
   ├─ cidade-dorme.tsx                             # Passa hasSubmittedNightAction para CidadeDormeNightSection
   └─ components/
      └─ cidadeDormeNightSection.tsx               # Remove botão manual "Concluir Noite e Amanhecer" e mostra confirmação após agir
tests/
├─ unit/cidadeDormeUseCases.test.ts                # Regressão: Anjo morto, Detetive morto, papel não agiu, duração idêntica RNF11
├─ hooks/useCidadeDormeViewModel.test.ts           # Regressão: timer por phaseEndsAt e disparo automático no Anfitrião ao zerar
└─ mocks/cidadeDormeScreen.mock.test.tsx           # Atualiza asserções removendo botão do Detetive e validando confirmação de turno
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento da Tela | Componente (`@/view/components/`) | Tokens Semânticos (`@/view/theme`) |
| :--- | :--- | :--- |
| Cronômetro noturno sincronizado | `ExpressiveTimer` (`cidadeDormeNightSection.tsx`) | `tokens.component.timer.*` |
| Banner de ação noturna registrada (aguardando fim do turno) | Card informativo em `darkTokens` | `darkTokens.semantic.color.actionContainer`, `darkTokens.semantic.color.onActionContainer`, `darkTokens.semantic.radius.lg` |
| Card de veredito do Detetive sem botão de concluir noite | Container de veredito em `darkTokens` | `darkTokens.semantic.color.errorContainer`, `darkTokens.semantic.color.success`, `darkTokens.semantic.radius.sm` / `radius.md` |

---

## 5. Estratégia de Testes (`tests/`)

- **Testes de Regressão no UseCase (`tests/unit/cidadeDormeUseCases.test.ts`):**
  - **Anjo morto:** com `anjo.isAlive === false`, verificar `phaseEndsAt` definido em `night_angel` com duração idêntica e avanço de `autoAdvanceNightTurn` para `night_detective` com `nightProtectedId === null`.
  - **Detetive morto:** com `detetive.isAlive === false`, verificar `phaseEndsAt` em `night_detective` e avanço de `autoAdvanceNightTurn` para `day_debate` (ou `finished`) com `detectiveVerdict === null`.
  - **Papel vivo não agiu no tempo:** verificar que Assassino, Anjo ou Detetive sem ação resulta em `nightTargetId === null`, `nightProtectedId === null` e `detectiveVerdict === null` ao fim de cada turno (sem escolher `alivePlayers[0]`).
  - **Invariância de duração (`RNF11`):** confirmar que `submitAssassinTarget` e `submitAngelProtection` preservam a fase atual até o término do turno (ou retornam fase sem pular o timer), mantendo duração igual para vivo/morto.
- **Testes de ViewModel (`tests/hooks/useCidadeDormeViewModel.test.ts`):**
  - Usando `jest.useFakeTimers()`, validar cálculo de `secondsRemaining` a partir de `room.phaseEndsAt` e chamada automática única a `autoAdvanceNightTurn` pelo Anfitrião quando o tempo zera.
- **Testes de Tela (`tests/mocks/cidadeDormeScreen.mock.test.tsx`):**
  - Confirmar ausência do botão *"Concluir Noite e Amanhecer"* no card do Detetive e exibição do estado de confirmação após o jogador registrar sua ação noturna.
