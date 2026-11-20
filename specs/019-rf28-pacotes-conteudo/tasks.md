# ✅ Lista de Tarefas (`tasks.md`): Seleção de Pacotes de Conteúdo na Mímica, Quiz e Forca (`RF28` / `RF30`)

- **Input:** `specs/019-rf28-pacotes-conteudo/spec.md` e `specs/019-rf28-pacotes-conteudo/plan.md`
- **Ordem de Execução Obrigatória:** De dentro para fora (`model` → `infra` → `usecase` → `di` → `tests` → `viewmodel` → `view` → `app`)
- **Receitas do Harness:** `/nova-funcionalidade`, `/nova-tela`, `/revisar-arquitetura`, `/commit-e-pr`

---

## Fase 1: Domínio Puro (`src/model/`)
*Objetivo: Definir a entidade `ContentPack` (`type`) e atualizar o contrato `IGameCatalogDataSource` sem nenhuma dependência externa.*

- [x] **T001** Criar `src/model/entities/contentPack.ts` com `export type ContentPackGameId = 'mimica' | 'quiz' | 'forca'` e `export type ContentPack = { id: string; gameId: ContentPackGameId; category: MimicaCategory | QuizCategory | ForcaCategory; label: string; description: string; icon: string }`
- [x] **T002** Atualizar `src/model/datasources/iGameCatalogDataSource.ts` adicionando `listContentPacks(gameId?: ContentPackGameId): Promise<ContentPack[]>`

---

## Fase 2: Infraestrutura Offline/Memória (`src/infra/`)
*Objetivo: Implementar o catálogo de pacotes de conteúdo em `MemoryGameCatalogDataSource`.*

- [x] **T003** Implementar `DEFAULT_CONTENT_PACKS` e o método `listContentPacks(gameId?: ContentPackGameId)` em `src/infra/datasources/memoryGameCatalogDataSource.ts` cobrindo todas as categorias de Mímica, Quiz e Forca

---

## Fase 3: Caso de Uso (`src/usecase/`)
*Objetivo: Expor e validar a listagem e filtragem de pacotes de conteúdo no `PgPlayUseCases`.*

- [x] **T004** Adicionar `listContentPacks(gameId?: ContentPackGameId): Promise<ContentPack[]>` em `src/usecase/iPgPlayUseCases.ts` e implementar em `src/usecase/pgPlayUseCases.ts` com validação `ValidationError`

---

## Fase 4: Testes Unitários da Regra de Negócio (`tests/unit/`)
*Objetivo: Validar a listagem de pacotes e as regras de `RF28`/`RF30` no `PgPlayUseCases`.*

- [x] **T005** Adicionar testes unitários de `listContentPacks` e filtragem combinada de múltiplos pacotes em `tests/unit/pgPlayUseCases.mimica.test.ts`, `tests/unit/pgPlayUseCases.quiz.test.ts` e `tests/unit/pgPlayUseCases.forca.test.ts`

---

## Fase 5: Apresentação — ViewModels e Views (`src/viewmodel/` e `src/view/`)
*Objetivo: Expor seleção de pacotes nas 3 ViewModels e renderizar os chips `ExpressiveChip` na fase `pass-turn` inicial de Mímica, Quiz e Forca.*

- [x] **T006** Atualizar `src/viewmodel/useQuizViewModel.ts` adicionando `selectedCategories: QuizCategory[]` (iniciando com `ALL_QUIZ_CATEGORIES`) e `handleToggleCategory(category: QuizCategory): Promise<void>` (delegando ao `useCase.listQuizQuestions` e capturando `ValidationError` quando tentar desmarcar o último pacote)
- [x] **T007** Ajustar `handleToggleCategory` em `src/viewmodel/useMimicaViewModel.ts` e `src/viewmodel/useForcaViewModel.ts` para delegar a validação de lista vazia ao `useCases` (`ValidationError`), mantendo o último pacote ativo e exibindo feedback legível sem bloquear a tela
- [x] **T008** Renderizar a seção de seleção de pacotes com `ExpressiveChip` (multisseleção) na fase `pass-turn` antes do 1º turno em `src/view/mimica.tsx`, `src/view/quiz.tsx` e `src/view/forca.tsx`
- [x] **T009** Atualizar os testes de hooks (`tests/hooks/useMimicaViewModel.test.ts`, `useQuizViewModel.test.ts`, `useForcaViewModel.test.ts`) e de telas (`tests/mocks/mimicaScreen.mock.test.tsx`, `quizScreen.mock.test.tsx`, `forcaScreen.mock.test.tsx`)

---

## Fase 6: Verificação Arquitetural e Pull Request
*Objetivo: Garantir 0 violações no Harness MVVM Sofisticado antes do commit/PR.*

- [x] **T010** Executar `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest`) e confirmar **0 violações**
- [x] **T011** Realizar commits convencionais e abrir Pull Request vinculando `Closes #30` seguindo a receita `/commit-e-pr`
