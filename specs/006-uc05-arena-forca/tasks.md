# ✅ Lista de Tarefas (`tasks.md`): 006-uc05-arena-forca

- **Input:** `specs/006-uc05-arena-forca/spec.md` e `specs/006-uc05-arena-forca/plan.md`
- **Ordem de Execução Obrigatória:** De dentro para fora (`model` → `infra` → `usecase` → `di` → `tests` → `viewmodel` → `view` → `app`)
- **Autor / Perfil:** Roger Pierre (`RogerPierre`)
- **Issue Vinculada:** `#7` (`[UC05] Implementar Arena do Jogo da Forca (RF13–RF15)`)

---

## Fase 1: Domínio Puro (`src/model/`)
*Objetivo: Adicionar tipos e contratos para o Jogo da Forca sem dependências externas.*

- [x] **T001** Adicionar `ForcaCategory` e `ForcaPuzzle` em `src/model/entities/arenaChallenge.ts`.
- [x] **T002** Adicionar contrato `listForcaPuzzles(categories?: ForcaCategory[]): Promise<ForcaPuzzle[]>` em `src/model/datasources/iGameCatalogDataSource.ts`.

---

## Fase 2: Infraestrutura Offline/Memória (`src/infra/`)
*Objetivo: Implementar o banco local de palavras com dicas e categorias na classe em memória.*

- [x] **T003** Implementar `listForcaPuzzles` em `src/infra/datasources/memoryGameCatalogDataSource.ts` com banco padrão de puzzles (incluindo `COMUNHÃO` com dica sobre Pequeno Grupo e palavras bíblicas/gerais).

---

## Fase 3: Caso de Uso e Injeção de Dependências (`src/usecase/` e `src/di/`)
*Objetivo: Adicionar regras de negócio da Forca (+30 pts + 2 pts/tentativa restante) e atualizar container.*

- [x] **T004** Atualizar interface `IPgPlayUseCases` em `src/usecase/iPgPlayUseCases.ts` adicionando `listForcaPuzzles` e `scoreForcaWord`.
- [x] **T005** Implementar `listForcaPuzzles` e `scoreForcaWord` em `src/usecase/pgPlayUseCases.ts` com validações de domínio.
- [x] **T006** Garantir compatibilidade do container `src/di/container.ts`.

---

## Fase 4: Testes Unitários de Regra de Negócio (`tests/unit/`)
*Objetivo: Cobrir casos de uso da Forca com testes antes da interface.*

- [x] **T007** Criar testes unitários em `tests/unit/pgPlayUseCases.forca.test.ts` testando listagem e cálculo de pontuação (+30 pts base + 2 pts por tentativa restante).

---

## Fase 5: Apresentação — ViewModel, View e Rota Fina (`src/viewmodel/`, `src/view/`, `src/app/`)
*Objetivo: Implementar Hook, Tela e Rota Fina com suporte aos 4 estados e tokens do Design System.*

- [x] **T008** Implementar `useForcaViewModel` em `src/viewmodel/useForcaViewModel.ts` com normalização de acentos, palpites com `LetterKey`, reinício de palavra e navegação.
- [x] **T009** Implementar tela `src/view/forca.tsx` espelhando a referência visual com tokens do Design System (`GameCard`, `LetterKey`, `ExpressiveButton`, badge de tentativas).
- [x] **T010** Criar rota fina em `src/app/forca.tsx` (2 linhas).
- [x] **T011** Criar testes de hook em `tests/hooks/useForcaViewModel.test.ts` e testes de tela com mocks em `tests/mocks/forcaScreen.mock.test.tsx`.

---

## Fase 6: Verificação Arquitetural e Governança Git
*Objetivo: Validar que 0 violações existem no Harness e tudo passa nos testes.*

- [x] **T012** Executar `npm run check` (`check-arquitetura.mjs` + `tsc --noEmit` + `jest`) e garantir 0 violações.
