# 📋 Especificação de Funcionalidade (`spec.md`): 007-uc01-hub-jogos

- **Branch da Feature:** `feat/007-uc01-hub-jogos`
- **Criado em:** 2026-11-16
- **Status:** Em Revisão
- **Autor / Perfil:** Héber Bringel (`Heber-Bringel`)
- **Milestone:** `v0.2.0 — Núcleo & Jogos em 1 Celular (UC01–UC06)`
- **Caso(s) de Uso / Requisito(s):** `UC01` (`RF01`, `RF02`, `RF03`, `RF04`, `RNF02`, `RNF05`, `RNF07`, `RNF08`, `RNF10`) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md` e `design-system/05-padroes.md` (Padrão 3)
- **Issue vinculada:** `#9` (`[UC01] Implementar Catálogo e Hub de Jogos com busca e filtro (RF01–RF03)`)

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Explorar Catálogo de Minigames e Destaque da Equipe Líder (Prioridade: P1)

Como Líder ou Moderador de um Pequeno Grupo (PG), desejo visualizar na tela inicial (*Hub de Jogos*, rota `/`) o banner com a equipe que lidera o placar do encontro e o catálogo completo de minigames (*Mímica Expressiva*, *Quiz Relâmpago*, *Jogo da Forca*, *Adedonha Bíblica* e *Cidade Dorme*), com atalhos rápidos para **Equipes** e **Placar do PG**, para escolher em segundos a dinâmica ideal para o grupo.

**Por que esta prioridade:** É a porta de entrada principal do aplicativo (rota raiz `/`), já referenciada pelo botão *"Escolher Outro Jogo"* em `useScoreboardViewModel.ts`, e fecha o ciclo completo de navegação dos casos de uso da Milestone `v0.2.0`.

**Como testar independentemente:** Abrir o app na rota inicial `/` (ou renderizar `HubScreen` / testar `useHubViewModel`) e verificar que os 5 minigames são listados via `GameCard`, que a equipe líder aparece em destaque quando há equipes carregadas e que o toque em um jogo disponível dispara a navegação para sua rota correspondente.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o Hub de Jogos termina de carregar, **Quando** o Líder visualiza a tela inicial, **Então** o sistema exibe os cards dos 5 minigames com ícone expressivo, título, descrição curta e tag de jogadores/modalidade (**RF01**).
2. **Dado** que existem equipes cadastradas com pontuação na sessão, **Quando** o Hub carrega o placar via `getScoreboard()`, **Então** exibe no topo um card de destaque (`highlightLeader`) com o nome e a pontuação da equipe líder (**RF02**), permitindo navegar para `/scoreboard`.
3. **Dado** um minigame disponível no catálogo (ex.: *Mímica Expressiva*, *Quiz Relâmpago*, *Jogo da Forca* ou *Adedonha Bíblica*), **Quando** o Líder toca no card correspondente, **Então** a `ViewModel` executa `router.push(...)` para a rota do jogo selecionado.
4. **Dado** que o Líder deseja gerenciar participantes ou conferir o ranking geral, **Quando** toca nos atalhos **Equipes** ou **Placar do PG**, **Então** o sistema navega para `/teams` ou `/scoreboard`.

---

### História de Usuário 2 — Buscar em Tempo Real e Filtrar por Modalidade (Prioridade: P1)

Como Líder do PG, desejo buscar minigames por nome, tema ou descrição em tempo real e alternar o filtro de modalidade entre **Todos**, **1 Celular** e **Multi-Celular**, para encontrar rapidamente o jogo adequado à quantidade de aparelhos disponíveis na roda.

**Por que esta prioridade:** Atende diretamente aos requisitos **RF03** e à descrição da Issue `#9` (filtragem por modalidade `1 Celular` vs `Multi-Celular`), evitando rolagem ou tentativa e erro durante o encontro presencial.

**Como testar independentemente:** Digitar termos no campo de busca e selecionar os chips de modalidade (`Todos`, `1 Celular`, `Multi-Celular`), verificando a atualização imediata da lista sem necessidade de pressionar *Enter*.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** o catálogo completo no Hub, **Quando** o Líder digita `"quiz"` ou `"bíbl"` no campo de busca, **Então** a lista é filtrada instantaneamente em memória (`0 ms`) mantendo apenas os minigames correspondentes (**RF03**).
2. **Dado** os filtros de modalidade no topo da lista, **Quando** o Líder seleciona `"1 Celular"`, **Então** apenas *Mímica Expressiva*, *Quiz Relâmpago* e *Jogo da Forca* são exibidos; ao selecionar `"Multi-Celular"`, apenas *Adedonha Bíblica* e *Cidade Dorme* são exibidos.
3. **Dado** que há busca textual e filtro de modalidade ativos ao mesmo tempo, **Quando** o catálogo é consultado, **Então** ambos os critérios são combinados (`AND`).

---

### História de Usuário 3 — Tratar Estado Vazio da Busca, Erro de Carregamento e Jogos "Em Breve" (Prioridade: P2)

Como Líder do PG, quando nenhuma dinâmica corresponder à busca ou filtro, desejo ver um estado vazio amigável com o botão *"Limpar busca"* para restaurar o catálogo com um toque, e quando algum minigame ainda estiver em desenvolvimento (ex.: *Cidade Dorme* da Milestone 3), desejo vê-lo sinalizado com clareza para não abrir uma rota inexistente.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** uma busca sem correspondências (ex.: `"xadrez"`), **Quando** o filtro é aplicado, **Então** a tela exibe o estado vazio com ícone `magnify-close`, título *"Nenhum minigame encontrado"* e o botão `Tonal` *"Limpar busca"* (**RF04**).
2. **Dado** o estado vazio exibido, **Quando** o Líder toca em *"Limpar busca"*, **Então** o termo de busca é limpo, o filtro de modalidade volta para `"Todos"` e os 5 minigames voltam a ser exibidos com 1 toque (**RF04**).
3. **Dado** que o carregamento inicial do catálogo ou placar falha com `DomainError`, **Quando** o erro é capturado pela `ViewModel`, **Então** a tela exibe o card de erro com botão *"Tentar Novamente"*.
4. **Dado** um jogo marcado como `available: false` (*Cidade Dorme*, aguardando `UC07` / Issue `#15`), **Quando** renderizado no Hub, **Então** seu `GameCard` aparece desabilitado (`disabled={true}`) com indicação `"Multi-Celular · Em breve"`.

---

### Casos de Borda (Edge Cases)

- **Busca com espaços ou acentos/maiúsculas:** Espaços nas pontas (`trim()`), diferença entre maiúsculas/minúsculas e acentuação (ex.: `"mimica"` encontrando `"Mímica Expressiva"`) devem ser normalizados na filtragem.
- **Critério inválido no UseCase:** Caso uma modalidade inválida seja passada programaticamente ao método de filtragem de `PgPlayUseCases`, deve lançar `ValidationError`.
- **Nenhuma equipe com pontos ainda:** Quando todas as equipes têm `0` pontos, o banner pode exibir um convite cordial para configurar equipes/iniciar a primeira rodada sem quebrar quando a lista de equipes estiver vazia.
- **Modo offline:** Todo o catálogo de minigames é servido localmente via `MemoryGameCatalogDataSource` (`< 150 ms`).

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-01`** (`RF01` do projeto): Exibir o catálogo dos 5 minigames no Hub com ícone expressivo, título, descrição curta e tag de modalidade/jogadores.
- **`RF-02`** (`RF02` do projeto): Exibir no topo do Hub o destaque da equipe líder obtida via `getScoreboard()`.
- **`RF-03`** (`RF03` do projeto): Filtrar minigames em tempo real por texto (nome, tema ou descrição) e por modalidade (`Todos` | `1 Celular` | `Multi-Celular`).
- **`RF-04`** (`RF04` do projeto): Exibir estado vazio *"Nenhum minigame encontrado"* com botão *"Limpar busca"* para restaurar o catálogo completo em 1 toque.

### Entidades e Contratos de Domínio Envolvidos (`src/model/`)
- **`Minigame` (`src/model/entities/minigame.ts`)**: `export type Minigame = { id: string; title: string; description: string; modality: GameModality; playersTag: string; route: MinigameRoute; icon: MinigameIconName; themes: string[]; available: boolean; }`.
- **`GameModality` e `GameModalityFilter`**: `'1 Celular' | 'Multi-Celular'` e `'Todos' | GameModality`.
- **`IGameCatalogDataSource` (`src/model/datasources/iGameCatalogDataSource.ts`)**: adicionar `listMinigames(): Promise<Minigame[]>`.

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (IHC / Acessibilidade)**: Alvos interativos >= `48 dp × 48 dp`, chips de modalidade com `accessibilityRole="button"` e `accessibilityState={{ selected }}`, uso de `GameCard`, `ExpressiveTextField` e `ExpressiveButton` sem valores literais de cor fora de `src/view/theme.ts`.
- **`CS-02` (Arquitetura MVVM)**: `npm run check` (`check-arquitetura.mjs` + `tsc --noEmit` + `jest --passWithNoTests`) passando com **0 violações e 0 erros**.
