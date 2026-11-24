# 🏗️ Plano de Implementação Técnica (`plan.md`): Importar Capitais do Brasil e Países do IBGE para o Pacote da Forca (`RF28`)

- **Branch:** `feat/026-rf28-ibge-forca`
- **Data:** 2026-11-24
- **Especificação de Origem:** `specs/026-rf28-ibge-forca/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`
- **Issue vinculada:** `#78`

---

## 1. Resumo Técnico

Um script offline de desenvolvimento (`scripts/importar-pacotes-ibge.mjs`) consulta `/api/v1/localidades/estados` e `/api/v1/localidades/paises` da API do IBGE, aplica renomeações canônicas (`RÚSSIA`, `ESTADOS UNIDOS`, `COREIA DO SUL`, `COREIA DO NORTE`, `NÍGER`, `BIELORRÚSSIA`), curadoria de exclusão de microestados, mapeamento fechado de regiões e auto-validação anti-vazamento de tokens antes de gerar `src/infra/datasources/memoryIbgeForcaDataSource.ts` (`implements IIbgeForcaDataSource`).

Em `src/di/container.ts`, o catálogo principal é instanciado via `MemoryGameCatalogDataSource.withIbgeLocalidades(new MemoryIbgeForcaDataSource())`, mesclando e deduplicando de forma assíncrona em `listForcaPuzzles()` (preservando entradas manuais como `PORTUGAL` e convertendo erros em `DataSourceError`). Na camada de apresentação, `useForcaViewModel` passa a embaralhar uniformemente os puzzles carregados (`shufflePuzzles` com `randomFn` injetável para testes determinísticos), e `src/view/forca.tsx` recebe ajuste de IHC para agrupar lacunas por palavra (`wordGroup`), renderizar hífen sem sublinhado e expor `accessibilityLabel` dinâmico.

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo devem estar marcados antes de gerar o `tasks.md` ou iniciar código.*

- [x] **Artigo I (SDD)**: `spec.md` completa, auditada contra dados reais do IBGE e validada com `UC05`, `RF15`, `RF28`, `RF30`, `RNF02`, `RNF03` e `RNF06`.
- [x] **Artigo II (MVVM 7 Pastas)**: Todo código de runtime reside apenas em `src/model/`, `src/infra/`, `src/di/`, `src/viewmodel/` e `src/view/`; o script gerador reside em `scripts/` (fora de `src/`).
- [x] **Artigo II (Rotas Finas e View Burra)**: `src/app/forca.tsx` permanece com 2 linhas; `src/view/forca.tsx` apenas renderiza `state.maskedWord` sem lógica de negócio nem imports proibidos.
- [x] **Artigo II (Vocabulário)**: Usa estritamente `DataSource` (`IIbgeForcaDataSource`, `MemoryIbgeForcaDataSource`), sem `Repository` ou `Connector`.
- [x] **Artigo II (Isolamento de Infraestrutura e `implements`)**: `MemoryIbgeForcaDataSource` declara `export class MemoryIbgeForcaDataSource implements IIbgeForcaDataSource` (`INFRA-IMPLEMENTS`) e só é importado por `src/di/container.ts` e `tests/` (`DI-ISOLAMENTO-INFRA`).
- [x] **Artigo III (Design System)**: Ajustes em `src/view/forca.tsx` consomem apenas tokens semânticos de `useTheme()` (`space.xs`, `space.sm`, `space.md`, `space.xl`, `space['2xl']`, `font.title`, `color.onSurface`), sem números mágicos nem cores literais (`check-design-system.mjs` = 0 violações).
- [x] **Artigo IV (Testabilidade Offline)**: O app opera 100% em memória offline; `useForcaViewModel` aceita `randomFn` opcional mantendo 100% de determinismo nos testes existentes.
- [x] **Artigo V (Governança Git)**: Commits seguem escopos oficiais de `CONTRIBUTING.md` (`model`, `harness`, `infra`, `di`, `viewmodel`, `view`, `docs`, `tests`).

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

Ordem estrita de criação/alteração (de dentro para fora):

```text
src/
├─ model/
│  ├─ entities/arenaChallenge.ts                      # [SEM ALTERAÇÃO] Reutiliza ForcaPuzzle e ForcaCategory
│  └─ datasources/iIbgeForcaDataSource.ts             # [NOVO] export interface IIbgeForcaDataSource { listForcaPuzzles(): Promise<ForcaPuzzle[]>; }
├─ infra/
│  └─ datasources/
│     ├─ memoryIbgeForcaDataSource.ts                 # [NOVO - GERADO] Snapshot IBGE + MemoryIbgeForcaDataSource implements IIbgeForcaDataSource
│     └─ memoryGameCatalogDataSource.ts               # [ALTERAR] Método estático withIbgeLocalidades(...) + deduplicação async em listForcaPuzzles()
├─ usecase/                                           # [SEM ALTERAÇÃO] PgPlayUseCases.listForcaPuzzles já valida e repassa categorias
├─ di/
│  └─ container.ts                                    # [ALTERAR] MemoryGameCatalogDataSource.withIbgeLocalidades(new MemoryIbgeForcaDataSource())
├─ viewmodel/
│  └─ useForcaViewModel.ts                            # [ALTERAR] Exporta shufflePuzzles e adiciona randomFn: () => number = Math.random no hook
├─ view/
│  └─ forca.tsx                                       # [ALTERAR] Agrupamento por palavra (wordGroup), hífen sem sublinhado e accessibilityLabel
└─ app/
   └─ forca.tsx                                       # [SEM ALTERAÇÃO] Rota fina de 2 linhas intacta

scripts/
└─ importar-pacotes-ibge.mjs                          # [NOVO] Gerador determinístico (timeout, curadoria, auto-validação e EOL \n)

docs/
└─ jogos/jogo-da-forca.md                             # [ALTERAR] Crédito "Fonte: IBGE" na seção de conteúdo

tests/
├─ unit/
│  ├─ ibgeForcaSnapshot.test.ts                       # [NOVO] Integridade das 27 capitais + países (ids, tamanho <= 20, regex, anti-vazamento por token)
│  └─ pgPlayUseCases.forca.test.ts                    # [ALTERAR] Integração MemoryGameCatalogDataSource.withIbgeLocalidades + deduplicação de PORTUGAL
├─ hooks/
│  └─ useForcaViewModel.test.ts                       # [ALTERAR] Preserva determinismo com randomFn fixo no harness + novo teste de embaralhamento
└─ mocks/
   └─ forcaScreen.mock.test.tsx                       # [ALTERAR] Testa renderização de palavras compostas com espaço, hífen e accessibilityLabel
```

---

## 4. Detalhamento Técnico das Camadas Alteradas

### 4.1. `MemoryGameCatalogDataSource` (`src/infra/datasources/memoryGameCatalogDataSource.ts`)
- Mantém os 5 parâmetros atuais do construtor intactos (compatibilidade total com todos os testes existentes) e adiciona `private readonly ibgeForcaDataSource?: IIbgeForcaDataSource` (6º parâmetro opcional privado/interno) + fábrica estática explícita:
  ```ts
  static withIbgeLocalidades(ibgeForcaDataSource: IIbgeForcaDataSource): MemoryGameCatalogDataSource
  ```
- Dentro de `async listForcaPuzzles(categories?: ForcaCategory[])`:
  - Lê `this.forcaPuzzles` (manuais vêm primeiro);
  - Se `this.ibgeForcaDataSource` estiver configurado, aguarda `await this.ibgeForcaDataSource.listForcaPuzzles()` e adiciona apenas itens cuja chave `normalizeWordKey(puzzle.word)` ainda não exista no `Set` (garantindo que `PORTUGAL` mantenha `id: 'forca-6'` e sua dica manual);
  - Aplica o filtro `categories` e retorna cópias `{ ...puzzle }`; qualquer exceção é convertida em `DataSourceError`.

### 4.2. `useForcaViewModel` (`src/viewmodel/useForcaViewModel.ts`)
- Exporta `function shufflePuzzles(puzzles: ForcaPuzzle[], randomFn: () => number = Math.random): ForcaPuzzle[]` (Fisher-Yates de `length - 1` até `1`).
- Assinatura compatível com a Regra 5 e `check-arquitetura.mjs`:
  ```ts
  export function useForcaViewModel(
    useCases: IPgPlayUseCases = pgPlayUseCases,
    randomFn: () => number = Math.random
  ): [ForcaState, ForcaActions]
  ```
- Aplica `shufflePuzzles(loadedPuzzles, randomFn)` em `loadSession` e em `handleToggleCategory`.
- Nos testes existentes em `tests/hooks/useForcaViewModel.test.ts`, `createHookHarness` passa `randomFn = () => 0.999999` por padrão (no Fisher-Yates reverso, `Math.floor(0.999999 * (i + 1)) === i`, preservando a ordem exata `['COMUNHÃO', ...]`), além de um teste dedicado provando que valores distintos de `randomFn` embaralham o baralho.

### 4.3. `ForcaScreen` (`src/view/forca.tsx`)
- Divide `state.maskedWord` em blocos separados por `' '` (palavras) para renderizar cada palavra dentro de `<View style={styles.wordGroup}>`, com `slotsRow` usando `columnGap: space.md` e `rowGap: space.sm`. Assim, palavras compostas quebram de linha preferencialmente nos espaços entre palavras.
- Quando `letter.original === '-'`, renderiza `<View style={styles.hyphenSlot}><Text allowFontScaling style={styles.hyphenText}>-</Text></View>` sem `slotUnderline`.
- Calcula `maskedWordAccessibilityLabel` na View a partir de `state.maskedWord` (ex.: `"Palavra secreta: B, lacuna, L, lacuna, espaço, H, lacuna..."`) aplicado em `slotsRow`.

---

## 5. Inventário do Design System (`PG Play Expressive`)

| Elemento da Tela (`src/view/forca.tsx`) | Componente / Estrutura | Tokens Semânticos (`@/view/theme`) |
| :--- | :--- | :--- |
| Linha de palavras (`slotsRow`) | `View` (`flexDirection: 'row'`, `flexWrap: 'wrap'`) | `space.md` (`columnGap`), `space.sm` (`rowGap`) |
| Grupo de letras de cada palavra (`wordGroup`) | `View` (`flexDirection: 'row'`, `flexWrap: 'wrap'`) | `space.xs` (`gap`) |
| Lacuna de letra (`letterSlot` + `slotUnderline`) | `View` + `Text` | `space.xl`, `space['2xl']`, `space.xs`, `radius.sm`, `color.surfaceVariant`, `color.action`, `font.title`, `color.onSurface` |
| Separador de hífen (`hyphenSlot` + `hyphenText`) | `View` + `Text` (sem `slotUnderline`) | `space.md` (`minWidth`), `space['2xl']` (`minHeight`), `font.title`, `color.onSurfaceMuted` |
| Seleção de pacotes | `ExpressiveChip` | `component.chip.*`, `space.sm` |
| Teclado A–Z | `LetterKey` (`48 dp × 48 dp`) | `component.key.size`, `space.sm` |

---

## 6. Estratégia de Testes (`tests/`)

1. **`tests/unit/ibgeForcaSnapshot.test.ts`**:
   - Valida 27 capitais (`forca-ibge-capital-*`) e presença de países (`forca-ibge-pais-*`), incluindo renomeados (`RÚSSIA`, `ESTADOS UNIDOS`, `COREIA DO SUL`, `COREIA DO NORTE`, `NÍGER`, `BIELORRÚSSIA`).
   - Valida unicidade de `id`s e de `word` normalizada.
   - Valida `2 <= word.length <= 20` e regex `/^[A-ZÁÀÂÃÉÊÍÓÔÕÚÜÇ -]+$/`.
   - Valida regra anti-vazamento completa: `hint` não vazia, não contém `word` inteira normalizada e não compartilha nenhum vocábulo inteiro (`>= 3` letras fora `DE/DO/DA/DOS/DAS/E`) com `word`.
   - Valida imutabilidade (cópia defensiva) de `MemoryIbgeForcaDataSource.listForcaPuzzles()`.
2. **`tests/unit/pgPlayUseCases.forca.test.ts`**:
   - Valida `MemoryGameCatalogDataSource.withIbgeLocalidades(new MemoryIbgeForcaDataSource())` integrado a `PgPlayUseCases.listForcaPuzzles(['Países e Cidades'])`, verificando total expandido e ausência de duplicata para `PORTUGAL` (mantendo dica manual).
3. **`tests/hooks/useForcaViewModel.test.ts`**:
   - Mantém todos os testes existentes passando com `randomFn` injetável + adiciona teste unitário de `shufflePuzzles` e sorteio em `useForcaViewModel`.
4. **`tests/mocks/forcaScreen.mock.test.tsx`**:
   - Testa renderização de palavra composta com espaço e hífen (ex.: `GUINÉ-BISSAU` / `RIO BRANCO`), garantindo presença do hífen sem sublinhado extra e `accessibilityLabel` dinâmico.
5. **Portão de Qualidade (`npm run check`)**:
   - `node scripts/check-arquitetura.mjs && node scripts/check-design-system.mjs && tsc --noEmit && jest --passWithNoTests` com **0 erros e 0 avisos**.
