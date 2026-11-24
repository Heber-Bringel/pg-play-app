# ✅ Lista de Tarefas (`tasks.md`): Termômetro de Pedidos de Oração (`UC11`)

- **Input:** `specs/019-uc11-termometro-de-pedidos/spec.md` e `specs/019-uc11-termometro-de-pedidos/plan.md`
- **Ordem de Execução Obrigatória:** De dentro para fora (`model` → `infra` → `usecase` → `di` → `tests` → `viewmodel` → `view` → `app`)
- **Receitas do Harness:** `/sincronizar-tema`, `/nova-funcionalidade`, `/nova-tela`, `/revisar-arquitetura`, `/commit-e-pr`

---

## Fase 1: Domínio Puro (`src/model/`)
*Objetivo: Definir as entidades e tipos da roda de fala do Termômetro de Pedidos sem dependências externas.*

- [x] **T001** Criar `src/model/entities/termometro.ts` com `TermometroParticipantMode`, `TermometroDurationMinutes`, `TermometroOrderMode`, `TermometroStage`, `TermometroThermalZone`, `TermometroSummary` e `TermometroSession`

---

## Fase 2: Infraestrutura Offline/Memória (`src/infra/`)
*Objetivo: Registrar a dinâmica Termômetro de Pedidos no catálogo do Hub sem criar nenhuma persistência de pedidos (`RNF12`).*

- [x] **T002** Adicionar o card `'termometro'` (`title: 'Termômetro de Pedidos'`, `playersTag: '1 Celular · Encerramento'`, `route: '/termometro'`, `available: true`) em `src/infra/datasources/memoryGameCatalogDataSource.ts` e ajustar testes do Hub que validam a contagem do catálogo

---

## Fase 3: Caso de Uso e Injeção de Dependências (`src/usecase/` e `src/di/`)
*Objetivo: Implementar as regras `RF38`, `RF39`, `RF40` e `RNF12` no `TermometroUseCases` e registrá-lo no container.*

- [x] **T003** Criar o contrato `src/usecase/iTermometroUseCases.ts` (`export interface ITermometroUseCases`)
- [x] **T004** Implementar `src/usecase/termometroUseCases.ts` (`export class TermometroUseCases implements ITermometroUseCases`) com validações `ValidationError`, controle de vez/tempo sem corte de fala, resumo anônimo sem nomes e descarte em memória ao encerrar (`RNF12`)
- [x] **T005** Registrar e exportar `termometroUseCases` em `src/di/container.ts`

---

## Fase 4: Testes Unitários da Regra de Negócio (`tests/unit/`)
*Objetivo: Validar o `TermometroUseCases` isoladamente antes da camada de apresentação.*

- [x] **T006** Criar `tests/unit/termometroUseCases.test.ts` cobrindo configuração (`teams`, `custom`, `free`), validações `ValidationError`, início de fala, fim do tempo sem corte, pulo, pausa, resumo anônimo sem nomes, momento de oração, descarte de memória (`RNF12`) e preservação do placar (`RF40`)

---

## Fase 5: Apresentação — Componente, ViewModel, View e Rota Fina (`src/view/`, `src/viewmodel/`, `src/app/`)
*Objetivo: Evoluir `ExpressiveTimer` com a variante `'thermometer'`, criar `useTermometroViewModel`, a tela `src/view/termometro.tsx` e a rota fina `src/app/termometro.tsx`.*

- [x] **T007** Atualizar `src/view/components/expressiveTimer.tsx` adicionando suporte à variante `variant?: 'countdown' | 'thermometer'`, `totalSeconds?: number` e `paused?: boolean` (com barra de preenchimento, `MM:SS`, faixas `< 70%` frio, `70–99%` `"Pode ir concluindo"` e `100%` `"Tempo concluído"` com ícone `heart`)
- [x] **T008** Implementar `src/viewmodel/useTermometroViewModel.ts` exportando `TermometroState`, `TermometroActions` e `useTermometroViewModel`
- [x] **T009** Implementar `src/view/termometro.tsx` consumindo `useTermometroViewModel`, `ExpressiveTimer` (`variant="thermometer"`), `ExpressiveChip`, `ExpressiveTextField`, `ExpressiveButton`, `GameCard` e `ConfirmModal`
- [x] **T010** Criar a rota fina de 2 linhas em `src/app/termometro.tsx`
- [x] **T011** Criar os testes `tests/hooks/useTermometroViewModel.test.ts`, `tests/mocks/termometroScreen.mock.test.tsx` e ampliar `tests/components.test.tsx` para a variante `thermometer`

---

## Fase 6: Verificação Arquitetural e Pull Request
*Objetivo: Garantir 0 violações no Harness MVVM Sofisticado antes do commit/PR.*

- [x] **T012** Executar `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest`) e confirmar **0 violações**
- [x] **T013** Realizar commits convencionais e abrir Pull Request vinculando `Closes #35` seguindo a receita `/commit-e-pr`
