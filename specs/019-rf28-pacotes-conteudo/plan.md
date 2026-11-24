# 🏗️ Plano de Implementação Técnica (`plan.md`): Seleção de Pacotes de Conteúdo na Mímica, Quiz e Forca (`RF28` / `RF30`)

- **Branch:** `feat/019-rf28-pacotes-conteudo`
- **Data:** 2026-11-20
- **Especificação de Origem:** `specs/019-rf28-pacotes-conteudo/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

Esta funcionalidade completa o requisito **`RF28`** (seleção múltipla de pacotes de conteúdo misto por chips) e **`RF30`** (sorteio exclusivo dos pacotes ativos sem repetição na partida) nas três arenas de 1 celular (**Mímica Expressiva**, **Quiz Relâmpago** e **Jogo da Forca**).
No domínio (`src/model/`), definimos a entidade `ContentPack` em `src/model/entities/contentPack.ts` e expomos a listagem de pacotes por jogo no `IGameCatalogDataSource` e `IPgPlayUseCases`. Na apresentação (`src/viewmodel/` e `src/view/`), completamos a seleção de categorias em `useQuizViewModel` (e refinamos `useMimicaViewModel` e `useForcaViewModel` para propagar o `ValidationError` quando o usuário tenta desmarcar o último pacote) e renderizamos a seção de pacotes com `ExpressiveChip` na fase `pass-turn` antes do início do primeiro turno em `src/view/mimica.tsx`, `src/view/quiz.tsx` e `src/view/forca.tsx`.

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo devem estar marcados antes de gerar o `tasks.md` ou iniciar código.*

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada com os requisitos `RF28`/`RF30` e `UC03`–`UC05`.
- [x] **Artigo II (MVVM 7 Pastas)**: Todos os arquivos planejados residem apenas em `app`, `view`, `viewmodel`, `usecase`, `model`, `infra` ou `di`.
- [x] **Artigo II (Rotas Finas e View Burra)**: As rotas em `src/app/` permanecem com 2 linhas e toda a navegação/estado fica nas `ViewModels`.
- [x] **Artigo II (Vocabulário)**: Nenhum arquivo, interface ou classe usa `Repository` ou `Connector` (apenas `DataSource`).
- [x] **Artigo III (Design System)**: Todos os estilos usam exclusivamente tokens de `@/view/theme` e componentes de `@/view/components/` (`ExpressiveChip`, `GameCard`, `ExpressiveButton`).
- [x] **Artigo IV (Testabilidade Offline)**: `MemoryGameCatalogDataSource` fornece os pacotes e itens offline injetados via `src/di/container.ts`.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

```text
src/
├─ model/
│  ├─ entities/contentPack.ts                   # Novo: export type ContentPackGameId, ContentPack
│  └─ datasources/iGameCatalogDataSource.ts     # Atualizado: listContentPacks(gameId?: ContentPackGameId)
├─ infra/
│  └─ datasources/memoryGameCatalogDataSource.ts # Atualizado: catálogo de ContentPack e embaralhamento/filtro por pacotes
├─ usecase/
│  ├─ iPgPlayUseCases.ts                        # Atualizado: listContentPacks(gameId: ContentPackGameId)
│  └─ pgPlayUseCases.ts                         # Atualizado: validação de gameId e pacotes selecionados com ValidationError
├─ viewmodel/
│  ├─ useMimicaViewModel.ts                     # Atualizado: estado/ação de pacotes no início da partida + mensagem de aviso ao tentar desmarcar último pacote
│  ├─ useQuizViewModel.ts                       # Atualizado: selectedCategories, handleToggleCategory e filtro de pacotes sem repetição
│  └─ useForcaViewModel.ts                      # Atualizado: delegação ao UseCase ao tentar desmarcar o último pacote para exibir ValidationError legível
└─ view/
   ├─ mimica.tsx                                # Atualizado: seção de multisseleção com ExpressiveChip na fase pass-turn inicial
   ├─ quiz.tsx                                  # Atualizado: seção de multisseleção com ExpressiveChip na fase pass-turn inicial
   └─ forca.tsx                                 # Atualizado: seção de multisseleção com ExpressiveChip na fase pass-turn inicial
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento da Tela | Componente (`@/view/components/`) | Tokens Semânticos (`@/view/theme`) |
| :--- | :--- | :--- |
| Seletor de pacote de conteúdo (multisseleção) | `ExpressiveChip` (`selected`, `icon="check"`, `tone="action"`) | `color.surfaceContainer`, `color.actionContainer`, `color.onActionContainer`, `space.xs`, `space.sm`, `radius.lg` |
| Aviso de validação (mínimo 1 pacote) | `Text` / Container de aviso na seção de pacotes | `color.errorContainer`, `color.onErrorContainer`, `font.caption`, `radius.md`, `space.sm` |
| Botão de início de turno (1 toque) | `ExpressiveButton` (`variant="primaryJumbo"`) | `color.action`, `space.md` |

---

## 5. Estratégia de Testes (`tests/`)

- **Testes Unitários de UseCase (`tests/unit/pgPlayUseCases.mimica.test.ts`, `pgPlayUseCases.quiz.test.ts`, `pgPlayUseCases.forca.test.ts`)**:
  - Listagem de `ContentPack` por jogo (`listContentPacks('mimica' | 'quiz' | 'forca')`).
  - Filtragem de cartas, perguntas e palavras apenas dos pacotes selecionados (`RF28`).
  - Lançamento de `ValidationError` quando nenhum pacote é selecionado (`categories = []`).
- **Testes de Hooks (`tests/hooks/useMimicaViewModel.test.ts`, `useQuizViewModel.test.ts`, `useForcaViewModel.test.ts`)**:
  - Multisseleção de categorias via `handleToggleCategory` atualizando o baralho da partida.
  - Tentativa de desmarcar a última categoria ativa exibindo mensagem de `ValidationError` sem zerar a seleção.
- **Testes de Tela com Mocks (`tests/mocks/mimicaScreen.mock.test.tsx`, `quizScreen.mock.test.tsx`, `forcaScreen.mock.test.tsx`)**:
  - Renderização dos `ExpressiveChip` na fase `pass-turn` inicial e acionamento de `handleToggleCategory`.
