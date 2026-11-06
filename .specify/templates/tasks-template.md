# ✅ Lista de Tarefas (`tasks.md`): [NOME DA FUNCIONALIDADE]

- **Input:** `specs/[NNN-slug-da-feature]/spec.md` e `specs/[NNN-slug-da-feature]/plan.md`
- **Ordem de Execução Obrigatória:** De dentro para fora (`model` → `infra` → `usecase` → `di` → `tests` → `viewmodel` → `view` → `app`)
- **Receitas do Harness:** `/sincronizar-tema`, `/nova-funcionalidade`, `/nova-tela`, `/revisar-arquitetura`, `/commit-e-pr`

---

## Fase 1: Domínio Puro (`src/model/`)
*Objetivo: Definir entidades (`type`), erros (`DomainError`) e contratos (`interface`) sem nenhuma dependência externa.*

- [ ] **T001** Verificar/atualizar classes de erro em `src/model/errors.ts` (`DomainError`, `ValidationError`, `AuthError`, `DataSourceError`)
- [ ] **T002** Criar/atualizar entidade(s) como `export type` em `src/model/entities/[nome].ts`
- [ ] **T003** Criar/atualizar contrato(s) `export interface` em `src/model/datasources/i[Nome]DataSource.ts` e/ou `src/model/services/i[Nome]Service.ts`

---

## Fase 2: Infraestrutura Offline/Memória (`src/infra/`)
*Objetivo: Implementar os contratos do domínio com classes concretas `Memory*`.*

- [ ] **T004** Implementar `Memory[Nome]DataSource` com `implements I[Nome]DataSource` em `src/infra/datasources/memory[Nome]DataSource.ts`
- [ ] **T005** Implementar `Memory[Nome]Service` com `implements I[Nome]Service` em `src/infra/services/memory[Nome]Service.ts` *(se aplicável)*

---

## Fase 3: Caso de Uso e Injeção de Dependências (`src/usecase/` e `src/di/`)
*Objetivo: Concentrar todas as validações e regras de negócio no UseCase e conectá-lo no container.*

- [ ] **T006** Definir contrato `export interface I[Nome]UseCases` em `src/usecase/i[Nome]UseCases.ts`
- [ ] **T007** Implementar `export class [Nome]UseCases implements I[Nome]UseCases` em `src/usecase/[nome]UseCases.ts` (lançando `ValidationError` para entradas inválidas)
- [ ] **T008** Registrar e exportar a instância padrão em `src/di/container.ts`

---

## Fase 4: Testes Unitários da Regra de Negócio (`tests/`)
*Objetivo: Validar o UseCase isoladamente antes de construir a interface.*

- [ ] **T009** Criar testes unitários do UseCase (caminho feliz + casos de `ValidationError`) em `tests/[nome].test.ts`

---

## Fase 5: Apresentação — ViewModel, View e Rota Fina (`src/viewmodel/`, `src/view/`, `src/app/`)
*Objetivo: Expor estado/ações na ViewModel, renderizar com tokens do Design System na View e criar rota fina de 2 linhas.*

- [ ] **T010** Implementar `use[Tela]ViewModel` retornando `[state, actions]` (incluindo navegação `expo-router`) em `src/viewmodel/use[Tela]ViewModel.ts`
- [ ] **T011** Implementar a tela `src/view/[rota].tsx` usando exclusivamente tokens de `@/view/theme` e componentes de `@/view/components/`
- [ ] **T012** Criar a rota fina de 2 linhas em `src/app/[rota].tsx` e registrar no `src/app/_layout.tsx`

---

## Fase 6: Verificação Arquitetural e Pull Request
*Objetivo: Garantir 0 violações no Harness MVVM Sofisticado antes do commit/PR.*

- [ ] **T013** Executar `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest`) e confirmar **0 violações**
- [ ] **T014** Realizar commits convencionais e abrir Pull Request seguindo a receita `/commit-e-pr`
