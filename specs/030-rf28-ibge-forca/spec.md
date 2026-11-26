# 📋 Especificação de Funcionalidade (`spec.md`): Importar Capitais do Brasil e Países do IBGE para o Pacote da Forca (`RF28`)

- **Branch da Feature:** `feat/026-rf28-ibge-forca`
- **Criado em:** 2026-11-24
- **Atualizado em:** 2026-11-26 (Pós-merge com develop, revisão do PR #87 e renumeração para specs/030-rf28-ibge-forca)
- **Status:** Implementado e Validado (PR #87)
- **Caso(s) de Uso / Requisito(s):** `UC05` (`RF15`, `RF28`, `RF30`, `RNF02`, `RNF03`, `RNF06`) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md` e `docs/jogos/jogo-da-forca.md`
- **Issue vinculada:** `#78` (`v0.2.0 — Núcleo & Jogos em 1 Celular (UC01–UC06)`)
- **Fonte dos Dados:** [API de Localidades do IBGE](https://servicodados.ibge.gov.br/api/docs/localidades) (pública, gratuita, sem chave e em português)

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Sortear capitais brasileiras e países do mundo no pacote "Países e Cidades" (Prioridade: P1)

Como **Líder / Moderador do PG**, ao selecionar o pacote **"Países e Cidades"** (isoladamente ou combinado com outros pacotes) no **Jogo da Forca** (`UC05`), desejo que a arena embaralhe uniformemente o baralho da partida e sorteie palavras variadas entre as **27 capitais brasileiras** (26 estaduais + Brasília) e **países do mundo** em português com dicas claras que não revelem nenhum termo da resposta, para que o grupo jogue diversas partidas sem cair sempre na mesma ordem fixa nem repetir rapidamente as palavras.

**Por que esta prioridade:** Hoje o pacote `"Países e Cidades"` possui apenas `1` palavra (`PORTUGAL`) e `useForcaViewModel` percorre o array em ordem estática (`[0]`, `slice(1)`), o que impediria o sorteio real entre capitais e países.

**Como testar independentemente:** Abrir `/forca`, manter apenas o chip `"Países e Cidades"` selecionado, iniciar duas partidas seguidas e verificar que a ordem das palavras varia entre sessões (`shufflePuzzles`), exibindo capitais brasileiras e países curados do IBGE com dicas em português sem vazar a resposta.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o Líder abriu a Arena da Forca ou alterou a seleção de pacotes para `"Países e Cidades"`, **Quando** `useForcaViewModel` carrega os puzzles de `PgPlayUseCases.listForcaPuzzles(['Países e Cidades'])`, **Então** o baralho contém as 27 capitais brasileiras + países curados do IBGE + entradas manuais deduplicadas e é **embaralhado uniformemente** (Fisher-Yates via `shufflePuzzles`), evitando ordem fixa e sem repetir palavras na mesma partida (`RF28`, `RF30`).
2. **Dado** uma capital brasileira sorteada (ex.: `TERESINA`, `BRASÍLIA`, `SÃO PAULO`, `RIO DE JANEIRO`), **Quando** exibida na Arena da Forca, **Então** a dica está em português correto e não contém a palavra nem nenhum de seus vocábulos significativos (ex.: `"Capital do estado do Piauí"`, `"Capital do Brasil"`, `"Capital da unidade federativa mais populosa do Brasil"`, `"Capital fluminense conhecida pelo Cristo Redentor"`).
3. **Dado** um país sorteado do IBGE (ex.: `ARGENTINA`, `AUSTRÁLIA`, `ÁFRICA DO SUL`, `COREIA DO SUL`), **Quando** exibido na Arena da Forca, **Então** a dica usa o mapeamento limpo de região/sub-região ou dica curada sem entregar nenhum vocábulo da resposta, e países já existentes no catálogo manual (ex.: `PORTUGAL`) mantêm sua dica manual original sem duplicidade.
4. **Dado** uma palavra composta com espaço ou hífen (ex.: `BELO HORIZONTE`, `GUINÉ-BISSAU`, `TIMOR-LESTE`), **Quando** renderizada em `src/view/forca.tsx` em telas móveis (`360 dp`), **Então** cada palavra é agrupada visualmente sem quebrar sílabas ao meio na mudança de linha, o hífen `'-'` aparece revelado sem sublinhado de lacuna e o conjunto expõe `accessibilityLabel` dinâmico para leitores de tela.

---

### História de Usuário 2 — Operação 100% offline sem requisições de rede durante a partida (Prioridade: P1)

Como **Jogador / Moderador em encontro de Pequeno Grupo sem Wi-Fi**, desejo que todas as palavras e dicas importadas do IBGE estejam embutidas localmente no aplicativo, para que o Jogo da Forca funcione integralmente offline e com resposta instantânea (`RNF02`, `RNF03`).

**Por que esta prioridade:** O Jogo da Forca é uma dinâmica de `1 Celular (Passa-Celular)` e a Constituição (Artigos II e IV) exige funcionamento 100% offline via implementações `Memory*`.

**Como testar independentemente:** Executar o aplicativo sem conexão de rede (ou em testes unitários sem `fetch`) e iniciar uma partida da Forca apenas com `"Países e Cidades"`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o aparelho está offline, **Quando** o usuário joga o Jogo da Forca com `"Países e Cidades"`, **Então** `MemoryGameCatalogDataSource` lê os puzzles localmente de `MemoryIbgeForcaDataSource` em memória (`< 150 ms`), sem qualquer chamada HTTP à API do IBGE.

---

### História de Usuário 3 — Importação determinística, auto-validada e curada por script fora do app (Prioridade: P2)

Como **Desenvolvedor / Mantenedor do PG PLAY**, desejo executar manualmente `node scripts/importar-pacotes-ibge.mjs` (fora de `src/`) para consultar a API do IBGE, aplicar renomeações canônicas, filtros de curadoria e auto-validação em memória antes de gravar `src/infra/datasources/memoryIbgeForcaDataSource.ts` com quebras de linha fixas (`\n`) e `id`s estáveis, garantindo que rodar o script novamente gere exatamente o mesmo arquivo (`git diff` vazio).

**Por que esta prioridade:** Atende aos Critérios de Aceite 3, 4 e 5 da Issue `#78` e protege o repositório contra dados sujos, falhas de rede ou diffs de fim de linha entre Windows e Linux.

**Como testar independentemente:** Executar `node scripts/importar-pacotes-ibge.mjs` duas vezes seguidas no Windows e confirmar `git diff` vazio em `src/infra/datasources/memoryIbgeForcaDataSource.ts`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o desenvolvedor executa `node scripts/importar-pacotes-ibge.mjs` com internet disponível, **Quando** a API do IBGE responde com sucesso, **Então** o script aplica curadoria, valida todas as invariantes em memória (27 capitais, zero duplicatas, zero vazamento de tokens na dica, `word.length <= 20`, regex válida) e grava `src/infra/datasources/memoryIbgeForcaDataSource.ts` com terminador `\n` e cabeçalho `"Fonte: IBGE"`.
2. **Dado** que a API do IBGE está indisponível, expira o timeout ou viola alguma invariante de validação, **Quando** o script falha, **Então** ele encerra com código de erro (`exit 1`) **sem sobrescrever nem corromper** o arquivo `memoryIbgeForcaDataSource.ts` existente.

---

## 2. Casos de Borda Catalogados & Regras de Curadoria

### 2.1. Vazamento de resposta total ou por vocábulo (`Hint Leak`)
A API do IBGE possui sub-regiões que repetem o nome do país ou parte dele (`"Austrália e Nova Zelândia"`, `"Micronésia"`, `"África meridional (Sul da África)"`), além dos estados homônimos às capitais (`São Paulo`, `Rio de Janeiro`).
- **Regra estrita anti-vazamento (`RF-03`):** Normalizando `word` e `hint` (maiúsculas, sem acentos), a `hint`:
  1. **Nunca** pode conter a `word` inteira como substring (`!normHint.includes(normWord)`);
  2. **Nunca** pode compartilhar nenhum vocábulo/palavra inteira (`>= 3` letras, ignorando apenas conectivos `DE`, `DO`, `DA`, `DOS`, `DAS`, `E`) com os vocábulos de `word` (ex.: `ÁFRICA` ou `SUL` não podem aparecer como palavras na dica de `ÁFRICA DO SUL`; `SÃO` ou `PAULO` não podem aparecer na dica de `SÃO PAULO`; já `"Capital do Brasil"` é válida para `BRASÍLIA`, pois o vocábulo inteiro `BRASIL` ≠ `BRASILIA`, e `"País da América Central"` é válida para `COSTA RICA`, pois `AMERICA` ≠ `RICA` como vocábulo inteiro).
- **Dicas especiais obrigatórias:**
  - `BRASÍLIA` (`UF 53`): `"Capital do Brasil"`
  - `SÃO PAULO` (`UF 35`): `"Capital da unidade federativa mais populosa do Brasil"`
  - `RIO DE JANEIRO` (`UF 33`): `"Capital fluminense conhecida pelo Cristo Redentor"`
  - `BRASIL` (`M49 76`): `"Maior país sul-americano em território"`
  - `ÁFRICA DO SUL` (`M49 710`): `"País conhecido pela Cidade do Cabo e Joanesburgo"`
  - `SUDÃO DO SUL` (`M49 728`): `"País africano cuja capital é Juba"`
  - `MACEDÔNIA DO NORTE` (`M49 807`): `"País balcânico na península europeia"`
  - `COREIA DO NORTE` (`M49 408`): `"País asiático cuja capital é Pyongyang"`
  - `COREIA DO SUL` (`M49 410`): `"País asiático cuja capital é Seul"`
  - `TIMOR-LESTE` (`M49 626`): `"País lusófono insular no arquipélago malaio"`

### 2.2. Normalização da Hierarquia Geográfica do IBGE
Os nomes brutos da API do IBGE trazem parênteses redundantes, espaços duplos (`"Europa meridional  (Sul da Europa)"`) e caixa inconsistente (`"América do sul"`), além de colocar América do Sul/Central/Caribe em `regiao-intermediaria` em vez de `sub-regiao`.
- **Regra:** Usar precedência `regiao-intermediaria.nome ?? sub-regiao.nome` (com espaços colapsados e normalizados) mapeada por tabela fechada:
  - `América do sul` → `"País da América do Sul"`
  - `América central` → `"País da América Central"`
  - `Caribe` → `"País insular do Caribe"`
  - `América do Norte` → `"País da América do Norte"`
  - `América Latina e Caribe` → `"País da América Latina"`
  - `Europa ocidental (Oeste da Europa)` → `"País do Oeste da Europa"`
  - `Europa oriental (Leste da Europa)` → `"País do Leste da Europa"`
  - `Europa setentrional (Norte da Europa)` → `"País do Norte da Europa"`
  - `Europa meridional (Sul da Europa)` → `"País do Sul da Europa"`
  - `África setentrional (Norte da África)` → `"País do Norte da África"`
  - `África ocidental (Oeste da África)` → `"País do Oeste da África"`
  - `África oriental (Leste da África)` → `"País do Leste da África"`
  - `África central` → `"País da África Central"`
  - `África meridional (Sul da África)` → `"País do Sul da África"`
  - `África subsaariana` → `"País da África Subsaariana"`
  - `Ásia oriental (Leste da Ásia)` → `"País do Leste da Ásia"`
  - `Ásia meridional (Sul da Ásia)` → `"País do Sul da Ásia"`
  - `Ásia ocidental (Oeste da Ásia)` → `"País do Oeste da Ásia"`
  - `Ásia central` → `"País da Ásia Central"`
  - `Sudeste da Ásia` → `"País do Sudeste Asiático"`
  - `Austrália e Nova Zelândia` → `"País da Oceania"` *(evita vazar Austrália / Nova Zelândia)*
  - `Melanésia` / `Micronésia` / `Polinésia` → `"País insular da Oceania"` *(evita vazar Micronésia)*

### 2.3. Renomeações Canônicas e Exclusão de Microestados (`Curadoria`)
- **Renomeações canônicas por código M49 (`RENOMEACOES_CANONICAS_M49`):**
  - `643` (`"Rússia (Federação Russa)"`) → `"RÚSSIA"`
  - `840` (`"Estados Unidos da América"`) → `"ESTADOS UNIDOS"`
  - `408` (`"República Popular Democrática da Coreia"`) → `"COREIA DO NORTE"`
  - `410` (`"República da Coreia"`) → `"COREIA DO SUL"`
  - `562` (`"Niger"` sem acento no IBGE) → `"NÍGER"`
  - `112` (`"Belarus"`) → `"BIELORRÚSSIA"`
- **Filtro automático de tamanho e caracteres:** Excluir nomes que, mesmo após renomeação, tenham `word.length > 20` ou caracteres fora de `/^[A-ZÁÀÂÃÉÊÍÓÔÕÚÜÇ -]+$/` (ex.: `REPÚBLICA CENTRO-AFRICANA`, `REPÚBLICA DEMOCRÁTICA DO CONGO`, `EMIRADOS ÁRABES UNIDOS`, `SÃO CRISTÓVÃO E NEVIS`, `SÃO VICENTE E GRANADINAS`).
- **Exclusão explícita de microestados/ilhas pouco conhecidos (`EXCLUIDOS_CURADORIA_M49`):** Lista auditável no script (`Antígua e Barbuda [28]`, `Ilhas Salomão [90]`, `Comores [174]`, `Dominica [212]`, `Djibouti [262]`, `Kiribati [296]`, `Lesoto [426]`, `Malauí [454]`, `Maurício [480]`, `Nauru [520]`, `Vanuatu [548]`, `Micronésia [583]`, `Ilhas Marshall [584]`, `Palau [585]`, `Santa Lúcia [662]`, `San Marino [674]`, `São Tomé e Príncipe [678]`, `Seichelles [690]`, `Eswatini [748]`, `Tonga [776]`, `Trinidad e Tobago [780]`, `Tuvalu [798]`, `Burkina Faso [854]`).

### 2.4. Renderização de Espaços e Hífens em `src/view/forca.tsx`
- Agrupar `state.maskedWord` por palavras separadas por `' '` (`wordGroups`), evitando que `flexWrap: 'wrap'` quebre uma palavra no meio da sílaba quando houver múltiplas palavras.
- Renderizar `letter.original === '-'` em estilo dedicado (`hyphenSlot` / `hyphenText`), já revelado, **sem** `slotUnderline` e **sem** caixa de letra oculta.
- Adicionar `accessibilityLabel` dinâmico no contêiner das lacunas anunciando letras reveladas, `"lacuna"`, `"espaço"` e `"hífen"`.

---

## 3. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-01` (Ampliação do pacote `'Países e Cidades'` — `RF28`)**: O pacote `'Países e Cidades'` deve conter as **27 capitais brasileiras** + os **países curados do IBGE** em português, mantendo `ForcaCategory` inalterado.
- **`RF-02` (Script de importação determinístico e seguro)**: `scripts/importar-pacotes-ibge.mjs` deve buscar estados e países do IBGE com timeout de rede, aplicar renomeações, exclusões e mapeamento de dicas, validar todas as invariantes em memória e gravar `src/infra/datasources/memoryIbgeForcaDataSource.ts` com quebras de linha `\n` e crédito `"Fonte: IBGE"`.
- **`RF-03` (Invariantes estritas de cada `ForcaPuzzle` gerado)**:
  - `id` único e estável (`forca-ibge-capital-<ufId>` ou `forca-ibge-pais-<m49Id>`);
  - `word` em maiúsculas, `2 <= word.length <= 20`, casando com `/^[A-ZÁÀÂÃÉÊÍÓÔÕÚÜÇ -]+$/`;
  - `hint` não vazia, sem conter `word` normalizada nem compartilhar vocábulos inteiros significativos (`>= 3` letras fora `DE/DO/DA/DOS/DAS/E`) com `word`;
  - `category === 'Países e Cidades'`.
- **`RF-04` (Mesclagem assíncrona, deduplicação e conversão de erro)**: `MemoryGameCatalogDataSource` deve expor fábrica limpa `MemoryGameCatalogDataSource.withIbgeLocalidades(ibgeDataSource)` (preservando `new MemoryGameCatalogDataSource()` intacto para testes legados) e realizar a mesclagem/deduplicação dentro de `async listForcaPuzzles()`, preservando entradas manuais (ex.: `PORTUGAL`) e convertendo falhas em `DataSourceError` (Regra 8).
- **`RF-05` (Sorteio uniforme na ViewModel)**: `useForcaViewModel` deve embaralhar uniformemente (`shufflePuzzles` com `randomFn: () => number = Math.random` injetável para testes determinísticos) os puzzles carregados no início da sessão e ao alternar categorias.
- **`RF-06` (Ergonomia visual de palavras compostas e hífen)**: `src/view/forca.tsx` deve agrupar lacunas por palavra (`wordGroup`), exibir hífen sem sublinhado de lacuna e expor `accessibilityLabel` dinâmico, usando exclusivamente tokens de `@/view/theme`.
- **`RF-07` (Atribuição da fonte)**: Citar `"Fonte: IBGE"` em `src/infra/datasources/memoryIbgeForcaDataSource.ts` e em `docs/jogos/jogo-da-forca.md`.

### Entidades e Contratos Envolvidos
- **`ForcaPuzzle` / `ForcaCategory` (`src/model/entities/arenaChallenge.ts`)**: reutilizados sem alteração.
- **`IIbgeForcaDataSource` (`src/model/datasources/iIbgeForcaDataSource.ts`)**: `export interface IIbgeForcaDataSource { listForcaPuzzles(): Promise<ForcaPuzzle[]>; }`.

---

## 4. Decisões Fechadas (Human Checkpoint)

1. **Categoria:** Mantida a categoria única existente `'Países e Cidades'`.
2. **Limite de tamanho:** Confirmado o teto de `<= 20` caracteres (com renomeações canônicas para países populares).
3. **Sorteio (Opção 1-B):** Embaralhamento uniforme (`shufflePuzzles`) em `useForcaViewModel` com `randomFn` opcional para preservar determinismo nos testes unitários de hook.
4. **Renderização na View (Opção 2-A):** Ajuste pontual em `src/view/forca.tsx` para agrupamento por palavra, hífen sem sublinhado e `accessibilityLabel` dinâmico.
5. **Curadoria (Opção 3-Sim):** Mapa explícito de renomeações populares e exclusão de microestados pouco conhecidos incluído no script.

---

## 5. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (Conteúdo & Sorteio — `UC05` / `RF28`)**: Selecionando `"Países e Cidades"`, a Forca sorteia aleatoriamente entre as 27 capitais brasileiras e 165 países curados (192 localidades no total) do IBGE sem repetir na mesma partida e sem revelar a resposta na dica.
- **`CS-02` (Offline-First — `RNF02` / `RNF03`)**: Zero chamadas HTTP durante a execução do app.
- **`CS-03` (IHC / Acessibilidade — `RNF06`)**: Palavras compostas não quebram sílabas entre linhas quando cabem na largura útil, hífens são distinguíveis de lacunas e `slotsRow` possui `accessibilityLabel` dinâmico; zero números mágicos ou cores literais (`check:ds` com 0 erros).
- **`CS-04` (Arquitetura MVVM & Qualidade)**: `npm run check` (`check-arquitetura.mjs` + `check-design-system.mjs` + `tsc --noEmit` + `jest`) executa com **0 violações**.
