# ✅ Lista de Tarefas (`tasks.md`): uc10-complete-o-versiculo

- **Input:** `specs/011-uc10-complete-o-versiculo/spec.md` e `specs/011-uc10-complete-o-versiculo/plan.md`
- **Ordem de Execução Obrigatória:** De dentro para fora (`model` → `infra` → `usecase` → `di` → `tests` → `viewmodel` → `view` → `app`)
- **Receitas do Harness:** `/nova-funcionalidade`, `/nova-tela`, `/revisar-arquitetura`, `/commit-e-pr`

---

## Fase 1: Domínio Puro (`src/model/`)
*Objetivo: Definir entidades (`type`) e contratos (`interface`) sem nenhuma dependência externa.*

- [x] **T001** Criar `src/model/entities/versePassage.ts` com `VersePack`, `VerseBlank`, `VersePassage`, `VerseBlankResult` e `VerseMatchConfig`
- [x] **T002** Atualizar `src/model/entities/minigame.ts` adicionando `'/versiculo'` em `MinigameRoute` e `'book-open-variant'` em `MinigameIconName`
- [x] **T003** Criar contrato `export interface IVerseDataSource` em `src/model/datasources/iVerseDataSource.ts`

---

## Fase 2: Infraestrutura (`src/infra/`)
*Objetivo: Implementar o catálogo de passagens bíblicas com a API HelloAO (`por_blj`), fallback offline `MemoryVerseDataSource` e ativar o card no Hub.*

- [x] **T004** Implementar `MemoryVerseDataSource` (`implements IVerseDataSource`) em `src/infra/datasources/memoryVerseDataSource.ts` com passagens famosas nos 4 pacotes (*Salmos e Provérbios*, *Evangelhos*, *Cartas de Paulo*, *Antigo Testamento*) para testes e modo offline
- [x] **T004b** Implementar `HelloAoVerseDataSource` (`implements IVerseDataSource`) em `src/infra/datasources/helloAoVerseDataSource.ts` consumindo `https://bible.helloao.org/api/por_blj/{book}/{chapter}.simple.json` com cache em memória e fallback para `MemoryVerseDataSource`
- [x] **T005** Atualizar `src/infra/datasources/memoryGameCatalogDataSource.ts` adicionando o minigame ativo **Complete o Versículo** (`/versiculo`)

---

## Fase 3: Caso de Uso e Injeção de Dependências (`src/usecase/` e `src/di/`)
*Objetivo: Concentrar regras de negócio, validações e pontuação no UseCase e conectá-lo no container.*

- [x] **T006** Definir contrato `export interface IVersiculoUseCases` em `src/usecase/iVersiculoUseCases.ts`
- [x] **T007** Implementar `export class VersiculoUseCases implements IVersiculoUseCases` em `src/usecase/versiculoUseCases.ts` (validação com `ValidationError`, sorteio sem repetição, dica com primeira letra + contagem, normalização sem acentos/maiúsculas, pontuação `+10`/`+5`/`0`, aceite manual do líder e persistência dos pontos no `ITeamDataSource`)
- [x] **T008** Registrar `HelloAoVerseDataSource` (com fallback `MemoryVerseDataSource`) e exportar `versiculoUseCases` em `src/di/container.ts`

---

## Fase 4: Testes Unitários da Regra de Negócio (`tests/unit/`)
*Objetivo: Validar o UseCase isoladamente antes de construir a interface.*

- [x] **T009** Criar testes unitários de `VersiculoUseCases` (caminho feliz, validações `ValidationError`, dica, normalização, aceite do líder e placar) em `tests/unit/versiculoUseCases.test.ts`

---

## Fase 5: Apresentação — ViewModel, View, Rota Fina e Testes de UI (`src/viewmodel/`, `src/view/`, `src/app/`, `tests/`)
*Objetivo: Expor estado/ações na ViewModel, renderizar com tokens do Design System na View e criar rota fina de 2 linhas.*

- [x] **T010** Implementar `useVersiculoViewModel` retornando `[state, actions]` (incluindo temporizador, confirmação de saída e navegação `expo-router`) em `src/viewmodel/useVersiculoViewModel.ts`
- [x] **T011** Implementar a tela `src/view/versiculo.tsx` usando exclusivamente tokens de `@/view/theme` e componentes de `@/view/components/` (`GameCard`, `ExpressiveTextField`, `ExpressiveTimer`, `ExpressiveButton`, `ExpressiveChip`, `ConfirmModal`), comunicando estados por cor + forma + ícone (`RNF06`)
- [x] **T012** Criar a rota fina de 2 linhas em `src/app/versiculo.tsx`
- [x] **T013** Criar testes do hook em `tests/hooks/useVersiculoViewModel.test.ts` e testes de tela com mocks em `tests/mocks/versiculoScreen.mock.test.tsx`

---

## Fase 6: Verificação Arquitetural e Pull Request
*Objetivo: Garantir 0 violações no Harness MVVM Sofisticado antes do commit/PR.*

- [x] **T014** Executar `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest`) e confirmar **0 violações**
- [x] **T015** Realizar commits convencionais e abrir Pull Request vinculado à Issue `#34` seguindo `/commit-e-pr`
