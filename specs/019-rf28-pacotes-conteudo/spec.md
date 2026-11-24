# 📋 Especificação de Funcionalidade (`spec.md`): Seleção de Pacotes de Conteúdo na Mímica, Quiz e Forca (`RF28` / `RF30`)

- **Branch da Feature:** `feat/019-rf28-pacotes-conteudo`
- **Criado em:** 2026-11-20
- **Status:** Aprovado
- **Caso(s) de Uso / Requisito(s):** `UC03`, `UC04`, `UC05` (`RF28`, `RF30`) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md`
- **Issue vinculada:** `#30`

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Selecionar pacotes de conteúdo com multisseleção por chips antes do início da partida (Prioridade: P1)

Como **Líder / Moderador do PG**, antes de iniciar o primeiro turno de **Mímica Expressiva**, **Quiz Relâmpago** ou **Jogo da Forca** (na tela de passagem de turno `pass-turn`), desejo visualizar todos os pacotes de conteúdo disponíveis marcados por padrão e poder alternar (marcar/desmarcar) um ou mais pacotes por meio de `ExpressiveChip`, para personalizar os temas da partida ou iniciar imediatamente com 1 toque em *"Estou Pronto!"*.

**Por que esta prioridade:** Permite ao grupo adaptar o conteúdo da dinâmica (apenas Bíblico ou combinado com temas gerais) sem adicionar telas extras que atrasem o início rápido em 1 toque (`RF28`, `RF29`).

**Como testar independentemente:** Abrir `/mimica`, `/quiz` ou `/forca`, verificar que todos os chips de pacotes vêm selecionados na fase `pass-turn` do 1º turno, desmarcar pacotes mantendo apenas `"Bíblico"`, iniciar o turno e confirmar que apenas itens da categoria `"Bíblico"` são sorteados sem repetição.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o Líder abriu a arena de Mímica, Quiz ou Forca na fase `pass-turn` antes do primeiro turno, **Quando** a tela é carregada, **Então** todos os pacotes de conteúdo do respectivo jogo aparecem selecionados por padrão (`selectedCategories` completo) e o botão `"Estou Pronto!"` permite iniciar a partida com 1 toque.
2. **Dado** que o Líder está na fase `pass-turn` antes do primeiro turno, **Quando** toca em um `ExpressiveChip` de pacote de conteúdo para alternar sua seleção, **Então** o banco de cartas/perguntas/palavras da partida é atualizado apenas com os itens dos pacotes ativos, sem repetir itens ao longo dos turnos (`RF28`, `RF30`).
3. **Dado** que o primeiro turno já foi iniciado (ou a partida está nos turnos seguintes), **Quando** a tela retorna para `pass-turn` na passagem para a próxima equipe, **Então** os pacotes selecionados para a partida são mantidos sem reiniciar o baralho já jogado, garantindo que nenhuma palavra ou pergunta se repita na mesma partida (`RF30`).

---

### História de Usuário 2 — Impedir início ou seleção vazia sem nenhum pacote ativo (Prioridade: P2)

Como **Líder / Moderador do PG**, caso eu tente desmarcar o último pacote de conteúdo ativo (ou caso o caso de uso receba uma lista vazia de pacotes), desejo receber um feedback claro de validação informando que ao menos um pacote deve permanecer selecionado, impedindo uma partida sem conteúdo.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que apenas 1 pacote de conteúdo está selecionado na tela de passagem de turno, **Quando** o usuário tenta desmarcar esse último pacote ou o `PgPlayUseCases` é chamado com `categories = []`, **Então** o `PgPlayUseCases` lança `ValidationError` e a `ViewModel` preserva a seleção válida exibindo um aviso semântico (`categoryWarning` / `error`) sem quebrar a partida.

---

### Casos de Borda (Edge Cases)

- **Tentativa de desmarcar o último chip ativo:** o `PgPlayUseCases` valida `categories.length === 0` lançando `ValidationError('Selecione pelo menos um pacote de...')`; a `ViewModel` captura o `DomainError`, mantém o último pacote selecionado para não esvaziar o jogo e expõe a mensagem de aviso na `pass-turn`.
- **Banco selecionado menor que o total de rodadas/perguntas:** quando os itens dos pacotes selecionados se esgotam antes do término das rodadas, a arena encerra a partida automaticamente exibindo a fase `finished` (`RF12`, `RF30`).
- **Operação 100% offline:** todos os pacotes e itens residem em `MemoryGameCatalogDataSource` com resposta `< 150 ms` (`RNF02`).

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF28`**: Antes de iniciar *Mímica Expressiva*, *Quiz Relâmpago* ou *Jogo da Forca*, o sistema deve permitir selecionar um ou mais pacotes de conteúdo por chips (`ExpressiveChip`), combinando-os na mesma partida. Por padrão, todos os pacotes vêm selecionados e ao menos um deve permanecer ativo.
- **`RF30`**: O sistema não deve repetir palavra, pergunta ou palavra secreta dentro da mesma partida. Quando o banco selecionado se esgotar antes do fim das rodadas, deve acionar o card de conclusão (`RF12`).
- **`RF-03` (Validação no UseCase)**: `PgPlayUseCases.listContentPacks(gameId)` deve listar os pacotes de conteúdo de cada jogo (`'mimica' | 'quiz' | 'forca'`), e `listMimicaCards`, `listQuizQuestions` e `listForcaPuzzles` devem lançar `ValidationError` quando a lista de pacotes selecionados estiver vazia.

### Entidades de Domínio Envolvidas (`src/model/entities/`)
- **`ContentPack` (`src/model/entities/contentPack.ts`)**:
  - `id: string`
  - `gameId: ContentPackGameId` (`'mimica' | 'quiz' | 'forca'`)
  - `category: MimicaCategory | QuizCategory | ForcaCategory`
  - `label: string`
  - `description: string`
  - `icon: string`

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (IHC / Acessibilidade)**: Todos os chips (`ExpressiveChip`) respeitam o alvo de toque mínimo (`minHeight: 48 dp`), anunciam `accessibilityState={{ selected, disabled }}` e combinam cor, borda e ícone (`check` quando selecionado).
- **`CS-02` (Arquitetura MVVM)**: `npm run check` (`check-arquitetura.mjs` + `tsc --noEmit` + `jest`) executa com **0 violações**.
