# ✅ Lista de Tarefas (`tasks.md`): UC09 — Quem Sou Eu?

- **Input:** `specs/021-uc09-quem-sou-eu/spec.md` e `specs/021-uc09-quem-sou-eu/plan.md`
- **Ordem de Execução Obrigatória:** De dentro para fora (`model` → `infra` → `usecase` → `di` → `tests` → `viewmodel` → `view` → `app`)
- **Receitas do Harness:** `/nova-funcionalidade`, `/nova-tela`, `/revisar-arquitetura`, `/commit-e-pr`

---

## Fase 0: Dependência Expo
- [x] **T001** Instalar `expo-sensors` com `npx expo install expo-sensors`

---

## Fase 1: Domínio Puro (`src/model/`)
*Objetivo: Definir entidades (`type`) e contratos (`interface`) sem nenhuma dependência externa.*

- [x] **T002** Atualizar `src/model/entities/minigame.ts` adicionando rota `'/quem-sou-eu'` e ícone `'account-question-outline'`
- [x] **T003** Criar entidades puras em `src/model/entities/quemSouEuCard.ts` (`QuemSouEuPack`, `QuemSouEuDurationOption`, `QuemSouEuCard`, `QuemSouEuMatchConfig`, `QuemSouEuTurnOutcome`, `QuemSouEuCardResult`, `TiltGesture`)
- [x] **T004** Criar contrato `IQuemSouEuDataSource` em `src/model/datasources/iQuemSouEuDataSource.ts`
- [x] **T005** Criar contrato `ITiltSensorService` em `src/model/services/iTiltSensorService.ts`

---

## Fase 2: Infraestrutura Offline/Memória e Sensor (`src/infra/`)
*Objetivo: Implementar os contratos do domínio com `Memory*` e `expo-sensors`.*

- [x] **T006** Registrar o card ativo **Quem Sou Eu?** em `src/infra/datasources/memoryGameCatalogDataSource.ts`
- [x] **T007** Implementar `MemoryQuemSouEuDataSource` em `src/infra/datasources/memoryQuemSouEuDataSource.ts` com 8 pacotes temáticos genéricos (sem conteúdo bíblico) e dicas opcionais
- [x] **T008** Implementar `MemoryTiltSensorService` em `src/infra/services/memoryTiltSensorService.ts` com cooldown de `1 s` e helper para testes
- [x] **T009** Implementar `ExpoSensorsTiltSensorService` em `src/infra/services/expoSensorsTiltSensorService.ts` com `Accelerometer`, histerese e cooldown de `1 s`

---

## Fase 3: Caso de Uso e Injeção de Dependências (`src/usecase/` e `src/di/`)
*Objetivo: Concentrar validações, pontuação e orquestração no UseCase e conectá-lo no container.*

- [x] **T010** Definir contrato `IQuemSouEuUseCases` em `src/usecase/iQuemSouEuUseCases.ts`
- [x] **T011** Implementar `QuemSouEuUseCases` em `src/usecase/quemSouEuUseCases.ts` (validações com `ValidationError`, embaralhamento sem repetição, `+10 pts` por acerto, `0 pts` por passe, gravação no placar)
- [x] **T012** Registrar `quemSouEuUseCases` em `src/di/container.ts`

---

## Fase 4: Testes Unitários da Regra de Negócio (`tests/`)
*Objetivo: Validar o UseCase e o serviço de sensor isoladamente antes de construir a interface.*

- [x] **T013** Criar testes unitários em `tests/unit/quemSouEuUseCases.test.ts` (caminho feliz, validações `ValidationError`, filtro de pacotes, ausência de conteúdo bíblico, pontuação e cooldown do `MemoryTiltSensorService`)

---

## Fase 5: Apresentação — ViewModel, View e Rota Fina (`src/viewmodel/`, `src/view/`, `src/app/`)
*Objetivo: Expor estado/ações na ViewModel, renderizar com tokens do Design System na View e criar rota fina de 2 linhas.*

- [x] **T014** Implementar `useQuemSouEuViewModel` em `src/viewmodel/useQuemSouEuViewModel.ts` (fases `setup`, `handoff`, `countdown`, `playing`, `summary`, `finished`; timer; sensor; feedback; pausa ao sair; navegação)
- [x] **T015** Implementar a tela `src/view/quem-sou-eu.tsx` usando exclusivamente tokens de `@/view/theme` e componentes de `@/view/components/`, com respeito a `Reduce Motion` e acessibilidade WCAG 2.1 AA
- [x] **T016** Criar a rota fina de 2 linhas em `src/app/quem-sou-eu.tsx`

---

## Fase 6: Testes de Hook, Integração e Verificação Final
*Objetivo: Garantir cobertura, qualidade e 0 violações no Harness MVVM Sofisticado.*

- [x] **T017** Criar testes de hook em `tests/hooks/useQuemSouEuViewModel.test.ts` e teste de integração em `tests/integration/quemSouEu.integration.test.tsx`
- [x] **T018** Executar `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest`) e confirmar **0 violações**
- [ ] **T019** Realizar commits convencionais e abrir Pull Request vinculado à Issue `#33` seguindo `/commit-e-pr`
