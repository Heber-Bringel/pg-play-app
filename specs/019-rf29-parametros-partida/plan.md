# 🏗️ Plano de Implementação Técnica (`plan.md`): rf29-parametros-partida

- **Branch:** `feat/019-rf29-parametros-partida`
- **Data:** 2026-11-21
- **Especificação de Origem:** `specs/019-rf29-parametros-partida/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

A funcionalidade **Parâmetros da Partida (`RF29` / Issue `#31`)** adiciona a entidade pura `MatchSettings` e o contrato `IMatchSettingsDataSource` em `src/model/`, implementados em `src/infra/` por `MemoryMatchSettingsDataSource` e `AsyncStorageMatchSettingsDataSource`. O `PgPlayUseCases` passa a carregar, validar (lançando `ValidationError` para valores fora da faixa) e salvar as configurações de Mímica, Quiz e Forca, conectado via `src/di/container.ts`. As ViewModels (`useMimicaViewModel`, `useQuizViewModel`, `useForcaViewModel`) sincronizam e aplicam esses parâmetros (incluindo `questionCount` no Quiz), e as Views (`mimica.tsx`, `quiz.tsx`, `forca.tsx`) exibem os seletores com `ExpressiveChip` antes do primeiro turno.

---

## 2. Verificação Constitucional (*Constitution Check*)

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada com os requisitos `RF29` e `RF31`.
- [x] **Artigo II (MVVM 7 Pastas)**: Todos os arquivos planejados residem apenas em `app`, `view`, `viewmodel`, `usecase`, `model`, `infra` ou `di`.
- [x] **Artigo II (Rotas Finas e View Burra)**: As telas em `src/view/` apenas renderizam `state` e disparam `actions`.
- [x] **Artigo II (Vocabulário)**: Apenas `DataSource` e `UseCases` (sem `Repository` ou `Connector`).
- [x] **Artigo III (Design System)**: Apenas tokens de `@/view/theme` e `ExpressiveChip` de `@/view/components/`.
- [x] **Artigo IV (Testabilidade Offline)**: `IMatchSettingsDataSource` possui `MemoryMatchSettingsDataSource` para testes e `AsyncStorageMatchSettingsDataSource` para persistência local.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

```text
src/
├─ model/
│  ├─ entities/
│  │  └─ matchSettings.ts                         # MimicaSettings, QuizSettings, ForcaSettings, MatchSettings, DEFAULT_MATCH_SETTINGS
│  └─ datasources/
│     └─ iMatchSettingsDataSource.ts              # export interface IMatchSettingsDataSource
├─ infra/
│  └─ datasources/
│     ├─ memoryMatchSettingsDataSource.ts         # implements IMatchSettingsDataSource
│     └─ asyncStorageMatchSettingsDataSource.ts   # implements IMatchSettingsDataSource
├─ usecase/
│  ├─ iPgPlayUseCases.ts                          # getMatchSettings, update*Settings (parcial) e planQuizMatch
│  └─ pgPlayUseCases.ts                           # Validação, saneamento ao carregar, fila de gravação e plano justo do Quiz
├─ di/
│  └─ container.ts                                # Injeta AsyncStorageMatchSettingsDataSource em PgPlayUseCases
├─ viewmodel/
│  ├─ useMimicaViewModel.ts                       # Carrega/salva MimicaSettings via UseCase
│  ├─ useQuizViewModel.ts                         # Carrega/salva QuizSettings (inclui questionCount: 5|10|15)
│  └─ useForcaViewModel.ts                        # Carrega/salva ForcaSettings via UseCase
└─ view/
   ├─ mimica.tsx                                  # Seção Parâmetros da Partida com ExpressiveChip no turno 1
   ├─ quiz.tsx                                    # Seção Parâmetros da Partida com ExpressiveChip no turno 1
   └─ forca.tsx                                   # Seção Parâmetros da Partida com ExpressiveChip no turno 1
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento da Tela | Componente (`@/view/components/`) | Tokens Semânticos (`@/view/theme`) |
| :--- | :--- | :--- |
| Chips de tempo, tentativas e rodadas/perguntas/palavras (com `accessibilityLabel` descritivo) | `ExpressiveChip` | `color.action`, `color.surfaceContainer`, `space.sm` |
| Card de parâmetros na preparação do 1º turno | `View` estilizado | `card.bg`, `card.radius`, `card.border`, `border.thin`, `space.md` |

---

## 5. Estratégia de Testes (`tests/`)

- **Testes Unitários (`tests/unit/pgPlayUseCases.matchSettings.test.ts`)**:
  - Carregamento de padrões, atualização válida e persistência em `MemoryMatchSettingsDataSource`.
  - Lançamento de `ValidationError` para valores fora da faixa em Mímica, Quiz e Forca.
  - Atualização parcial, gravações simultâneas sem perda, saneamento de valores inválidos e `planQuizMatch`.
- **Testes de Infraestrutura (`tests/unit/asyncStorageMatchSettingsDataSource.test.ts`)**: padrões, persistência, configuração parcial antiga e conversão de erros em `DataSourceError`.
- **Testes de Hooks e Mocks (`tests/hooks/use*ViewModel.test.ts`, `tests/mocks/*Screen.mock.test.tsx`)**:
  - Atualizar mocks/asserts se necessário e validar seleção de parâmetros (incluindo `questionCount` no Quiz).
