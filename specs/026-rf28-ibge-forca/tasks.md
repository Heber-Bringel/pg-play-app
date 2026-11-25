# ✅ Lista de Tarefas (`tasks.md`): Importar Capitais do Brasil e Países do IBGE para o Pacote da Forca (`RF28`)

- **Input:** `specs/026-rf28-ibge-forca/spec.md` e `specs/026-rf28-ibge-forca/plan.md`
- **Issue vinculada:** `#78`
- **Ordem de Execução Obrigatória:** De dentro para fora (`model` → `scripts/harness` → `infra` → `di` → `viewmodel` → `view` → `docs` → `tests` → verificação)
- **Receitas do Harness:** `/nova-funcionalidade`, `/revisar-arquitetura`, `/commit-e-pr`

---

## Fase 1: Domínio Puro (`src/model/`)
*Objetivo: Definir contrato assíncrono puro para o banco local de localidades do IBGE.*

- [x] **T001** Criar `src/model/datasources/iIbgeForcaDataSource.ts` declarando `export interface IIbgeForcaDataSource { listForcaPuzzles(): Promise<ForcaPuzzle[]>; }` (importando apenas `import type { ForcaPuzzle } from '@/model/entities/arenaChallenge'`).

---

## Fase 2: Script Gerador Determinístico e Snapshot Local (`scripts/` e `src/infra/`)
*Objetivo: Baixar localidades do IBGE uma única vez, aplicar curadoria/auto-validação e gerar o DataSource offline.*

- [x] **T002** Criar `scripts/importar-pacotes-ibge.mjs` (fora de `src/`) com:
  - busca com timeout em `/api/v1/localidades/estados` e `/api/v1/localidades/paises`;
  - mapa das 27 capitais brasileiras com preposições corretas e dicas especiais anti-vazamento (`BRASÍLIA`, `SÃO PAULO`, `RIO DE JANEIRO`);
  - `RENOMEACOES_CANONICAS_M49` (`RÚSSIA`, `ESTADOS UNIDOS`, `COREIA DO NORTE`, `COREIA DO SUL`, `NÍGER`, `BIELORRÚSSIA`), `EXCLUIDOS_CURADORIA_M49` (microestados pouco conhecidos), `DICAS_ESPECIAIS_PAISES_M49` (`BRASIL`, `ÁFRICA DO SUL`, `SUDÃO DO SUL`, `MACEDÔNIA DO NORTE`, `COREIA DO NORTE`, `COREIA DO SUL`, `TIMOR-LESTE`) e tabela fechada de mapeamento de `regiao-intermediaria` / `sub-regiao`;
  - auto-validação estrita em memória antes da escrita (exatamente 27 capitais, `id`s e `word`s únicos, `2 <= word.length <= 20`, regex `/^[A-ZÁÀÂÃÉÊÍÓÔÕÚÜÇ -]+$/` e zero vazamento de palavra ou vocábulo inteiro `>= 3` letras na dica), abortando com `exit 1` sem tocar no disco em caso de erro;
  - emissão determinística de `src/infra/datasources/memoryIbgeForcaDataSource.ts` com quebras de linha fixas `\n` e cabeçalho `"Fonte: IBGE"`.
- [x] **T003** Executar `node scripts/importar-pacotes-ibge.mjs` duas vezes seguidas, inspecionar a lista gerada em `src/infra/datasources/memoryIbgeForcaDataSource.ts` e confirmar idempotência (`git diff` idêntico entre execuções).

---

## Fase 3: Catálogo de Infraestrutura e Injeção de Dependências (`src/infra/` e `src/di/`)
*Objetivo: Integrar e deduplicar os dados do IBGE no catálogo preservando entradas manuais e isolamento de infra.*

- [x] **T004** Atualizar `src/infra/datasources/memoryGameCatalogDataSource.ts` adicionando `MemoryGameCatalogDataSource.withIbgeLocalidades(ibgeForcaDataSource: IIbgeForcaDataSource)` e mesclando/deduplicando de forma assíncrona dentro de `listForcaPuzzles()` (preservando entradas manuais como `PORTUGAL` e convertendo erros em `DataSourceError`).
- [x] **T005** Atualizar `src/di/container.ts` para instanciar `MemoryGameCatalogDataSource.withIbgeLocalidades(new MemoryIbgeForcaDataSource())`.

---

## Fase 4: Apresentação — Sorteio na ViewModel e Compostas/Hífen na View (`src/viewmodel/` e `src/view/`)
*Objetivo: Garantir sorteio real entre capitais/países e renderização acessível de nomes compostos e hifenizados.*

- [x] **T006** Atualizar `src/viewmodel/useForcaViewModel.ts` exportando `shufflePuzzles(puzzles, randomFn)` e adicionando o parâmetro opcional `randomFn: () => number = Math.random` em `useForcaViewModel` para embaralhar uniformemente os puzzles em `loadSession` e `handleToggleCategory`.
- [x] **T007** Atualizar `src/view/forca.tsx` (usando apenas tokens de `useTheme()`, zero números mágicos) para agrupar `state.maskedWord` por palavra (`wordGroup`), renderizar hífen `'-'` sem `slotUnderline` (`hyphenSlot`) e adicionar `accessibilityLabel` dinâmico nas lacunas.

---

## Fase 5: Documentação (`docs/jogos/`)
*Objetivo: Registrar o crédito oficial exigido pela Issue `#78`.*

- [x] **T008** Atualizar `docs/jogos/jogo-da-forca.md` citando `"Fonte: IBGE"` na descrição do pacote `"Países e Cidades"`.

---

## Fase 6: Testes Automatizados (`tests/`)
*Objetivo: Cobrir integridade do snapshot, deduplicação no UseCase, sorteio no Hook e renderização na View.*

- [x] **T009** Criar `tests/unit/ibgeForcaSnapshot.test.ts` validando as 27 capitais, países renomeados, unicidade de `id` e `word`, limite `<= 20` caracteres, regex de caracteres válidos, anti-vazamento completo (palavra inteira + vocábulos `>= 3` letras) e cópia defensiva de `MemoryIbgeForcaDataSource`.
- [x] **T010** Atualizar `tests/unit/pgPlayUseCases.forca.test.ts` testando `MemoryGameCatalogDataSource.withIbgeLocalidades(new MemoryIbgeForcaDataSource())` em `PgPlayUseCases.listForcaPuzzles(['Países e Cidades'])` e confirmando que `PORTUGAL` não duplica e preserva a dica manual.
- [x] **T011** Atualizar `tests/hooks/useForcaViewModel.test.ts` injetando `randomFn` determinístico (`() => 0.999999`) no harness padrão e adicionando teste dedicado de embaralhamento (`shufflePuzzles` / `useForcaViewModel`).
- [x] **T012** Atualizar `tests/mocks/forcaScreen.mock.test.tsx` adicionando teste de renderização para palavras compostas com espaço e hífen e validação do `accessibilityLabel` das lacunas.

---

## Fase 7: Verificação Global e Governança Git
*Objetivo: Garantir 0 violações em todos os verificadores antes de commits e Pull Request.*

- [x] **T013** Executar `npm run check` (`node scripts/check-arquitetura.mjs && node scripts/check-design-system.mjs && tsc --noEmit && jest --passWithNoTests`) e confirmar **0 violações e 100% dos testes passando**.
- [x] **T014** Criar branch `feat/026-rf28-ibge-forca`, realizar commits convencionais usando exclusivamente escopos oficiais de `CONTRIBUTING.md` (`model`, `harness` para `scripts/`, `infra`, `di`, `viewmodel`, `view`, `docs`, `tests`) e abrir Pull Request vinculando `Closes #78` (`/commit-e-pr`).
