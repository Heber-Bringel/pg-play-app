# 🗺️ Planejamento de Milestones, Labels e Issues — PG PLAY

Este documento especifica o roteiro oficial de entregas (**Milestones**), **Labels** e **Issues** do repositório **PG PLAY**, conectando:
- Os **Casos de Uso (`UC01` a `UC08`)** e **Requisitos (`RF01` a `RF23`)** em [`docs/requisitos/requisitos-e-casos-de-uso-pg-play.md`](../requisitos/requisitos-e-casos-de-uso-pg-play.md);
- O **Sistema de Design PG Play Expressive** em [`design-system/README.md`](../../design-system/README.md);
- O **Harness MVVM Sofisticado** em [`AGENTS.md`](../../AGENTS.md).

> 💡 **Automação via GitHub CLI (`gh`)**: Para cadastrar automaticamente todas as Labels, Milestones e Issues abaixo no GitHub, execute:
> ```bash
> # Pré-visualizar sem criar no GitHub:
> npm run github:setup -- --dry-run
>
> # Criar todas as Labels, Milestones e Issues no repositório remoto:
> npm run github:setup
> ```

---

## 🏷️ 1. Padronização de Labels

| Label | Cor (`#hex`) | Descrição |
| :--- | :---: | :--- |
| `harness` | `#5B21B6` | Engenharia de contexto, regras MVVM e linter arquitetural |
| `design-system` | `#C2410C` | Tokens Material 3 Expressive (`theme.ts`) e componentes (`src/view/components/`) |
| `camada:model` | `#0F766E` | Entidades (`type`), contratos (`i*DataSource`, `i*Service`) e `errors.ts` |
| `camada:infra` | `#0369A1` | Implementações concretas (`Memory*`, armazenamento local, rede, áudio) |
| `camada:usecase` | `#4338CA` | Regras de negócio, validações e orquestração (`src/usecase/`) |
| `camada:viewmodel` | `#7E22CE` | Estado reativo, ações e navegação (`src/viewmodel/`) |
| `camada:view` | `#BE185D` | Telas espelhadas (`src/view/`) e rotas finas (`src/app/`) |
| `modo:1-celular` | `#15803D` | Jogos presenciais em 1 celular compartilhado (Passa-Celular) |
| `modo:multiplayer` | `#B45309` | Jogos em Sala Multiplayer (1 celular por jogador via PIN/QR) |
| `tests` | `#374151` | Testes unitários e de integração com Jest |

---

## 🏁 2. Milestones do Projeto

| # | Milestone | Escopo Principal | Issues Vinculadas |
| :-: | :--- | :--- | :--- |
| **M1** | **`v0.1.0` — Fundação: Harness MVVM & Design System** | Os 5 Pilares do Harness, árvore de 7 pastas com `.gitkeep`, sincronização de `src/view/theme.ts` e dos 6 componentes do `PG Play Expressive`. | Issues **#1**, **#2** |
| **M2** | **`v0.2.0` — Núcleo & Jogos em 1 Celular (`UC01–UC06`)** | Domínio base, `MemoryDataSources`, Hub de Jogos, Gestão de Equipes, Mímica Expressiva, Quiz Relâmpago, Jogo da Forca e Placar Geral. | Issues **#3**, **#4**, **#5**, **#6**, **#7**, **#8** |
| **M3** | **`v1.0.0` — Jogos em Sala Multiplayer (`UC07–UC08`)** | Serviço de salas multiplayer, Cidade Dorme com Narrador por áudio clonado (Noite/Dia) e Adedonha Bíblica com Roleta Expressiva e botão *"Levantar Dúvida ✋"*. | Issues **#9**, **#10** |

---

## 📋 3. Catálogo Detalhado de Issues

### Milestone 1: `v0.1.0` — Fundação: Harness MVVM & Design System

#### Issue #1 — `[HARNESS] Configurar os 5 Pilares do Harness MVVM Sofisticado e estrutura de pastas`
- **Milestone:** `v0.1.0 — Fundação: Harness MVVM & Design System`
- **Labels:** `harness`, `tests`
- **Descrição:**
  Estruturar os 5 Pilares do Harness de Engenharia de Contexto para guiar agentes e desenvolvedores na arquitetura MVVM Sofisticado:
  1. `AGENTS.md`, `CLAUDE.md` e `harness.config.json`.
  2. Documentação sob demanda em `docs/harness/01..04.md`.
  3. Skills em `.claude/skills/` (`nova-tela`, `nova-funcionalidade`, `sincronizar-tema`, `revisar-arquitetura`).
  4. Linter determinístico `scripts/check-arquitetura.mjs` e hook `.claude/settings.json`.
  5. Estrutura das 7 pastas em `src/` (`app`, `view`, `viewmodel`, `usecase`, `model`, `infra`, `di`) com `.gitkeep`.
- **Critérios de Aceite:**
  - `npm run arquitetura` executando com 0 violações.
  - Templates de PR e Issues configurados em `.github/`.

---

#### Issue #2 — `[DS] Sincronizar src/view/theme.ts e os 6 componentes do PG Play Expressive`
- **Milestone:** `v0.1.0 — Fundação: Harness MVVM & Design System`
- **Labels:** `design-system`, `camada:view`, `tests`
- **Receita do Harness:** `/sincronizar-tema`
- **Descrição:**
  Traduzir as especificações de [`design-system/02-tokens.md`](../../design-system/02-tokens.md) e [`design-system/04-componentes/`](../../design-system/04-componentes/) para código em `src/view/`:
  - `src/view/theme.ts` (com `primitive` privado/não exportado e tokens semânticos/componentes para modo Claro e Escuro).
  - `src/view/components/expressiveButton.tsx` (Botão com *shape morphing* e variante Jumbo `64dp`).
  - `src/view/components/expressiveTextField.tsx` (Campo de texto com foco, contador e erro semântico).
  - `src/view/components/gameCard.tsx` (Card de minigame com emblema e tags de modalidade).
  - `src/view/components/expressiveTimer.tsx` (Cronômetro expressivo com estado crítico `<= 10s`).
  - `src/view/components/quizOption.tsx` (Alternativa `A–D` com confirmação visual dupla).
  - `src/view/components/letterKey.tsx` (Tecla `48x48dp` com estados `available`, `hit` e `miss`).
- **Critérios de Aceite:**
  - Zero cores hexadecimais fora de `src/view/theme.ts`.
  - Testes unitários de tokens e componentes em `tests/tokens.test.ts` e `tests/components.test.tsx`.
  - `npm run check` passando com 0 violações.

---

### Milestone 2: `v0.2.0` — Núcleo & Jogos em 1 Celular (`UC01–UC06`)

#### Issue #3 — `[UC01] Implementar Catálogo e Hub de Jogos com busca e filtro (RF01–RF03)`
- **Milestone:** `v0.2.0 — Núcleo & Jogos em 1 Celular (UC01–UC06)`
- **Labels:** `camada:model`, `camada:infra`, `camada:usecase`, `camada:viewmodel`, `camada:view`, `modo:1-celular`
- **Receitas:** `/nova-funcionalidade` e `/nova-tela`
- **Arquivos por camada:**
  - `src/model/errors.ts` (`DomainError`, `ValidationError`, `AuthError`, `DataSourceError`)
  - `src/model/entities/minigame.ts` (`export type Minigame = { ... }`)
  - `src/model/datasources/iGameCatalogDataSource.ts`
  - `src/infra/datasources/memoryGameCatalogDataSource.ts`
  - `src/usecase/iPgPlayUseCases.ts` e `src/usecase/pgPlayUseCases.ts`
  - `src/di/container.ts`
  - `src/viewmodel/useHubViewModel.ts`
  - `src/view/index.tsx`, `src/app/index.tsx` e `src/app/_layout.tsx`

---

#### Issue #4 — `[UC02] Implementar Configuração e Gestão de Equipes (RF04–RF06)`
- **Milestone:** `v0.2.0 — Núcleo & Jogos em 1 Celular (UC01–UC06)`
- **Labels:** `camada:model`, `camada:infra`, `camada:usecase`, `camada:viewmodel`, `camada:view`, `modo:1-celular`, `tests`
- **Receitas:** `/nova-funcionalidade` e `/nova-tela`
- **Regras de negócio (`PgPlayUseCases`):**
  - Validar nome mínimo de 2 caracteres (`ValidationError`).
  - Impedir nomes de equipes duplicados (`ValidationError`).
  - Garantir mínimo de 2 e máximo de 6 equipes por sessão.
- **Arquivos por camada:**
  - `src/model/entities/team.ts`, `src/model/datasources/iTeamDataSource.ts`
  - `src/infra/datasources/memoryTeamDataSource.ts`
  - `src/viewmodel/useTeamsViewModel.ts`
  - `src/view/teams.tsx` ↔ `src/app/teams.tsx`

---

#### Issue #5 — `[UC03] Implementar Arena de Mímica Expressiva (RF07–RF09)`
- **Milestone:** `v0.2.0 — Núcleo & Jogos em 1 Celular (UC01–UC06)`
- **Labels:** `camada:model`, `camada:usecase`, `camada:viewmodel`, `camada:view`, `modo:1-celular`, `tests`
- **Descrição:**
  Arena Passa-Celular com carta de palavra secreta (revelar/ocultar), cronômetro de 60s (`ExpressiveTimer`), botão Jumbo de acerto (`+pontos` para a equipe da vez) e pulo de carta.
- **Arquivos por camada:**
  - `src/model/entities/arenaChallenge.ts` (`MimicaCard`)
  - `src/viewmodel/useMimicaViewModel.ts`
  - `src/view/mimica.tsx` ↔ `src/app/mimica.tsx`

---

#### Issue #6 — `[UC04] Implementar Arena de Quiz Relâmpago (RF10–RF12)`
- **Milestone:** `v0.2.0 — Núcleo & Jogos em 1 Celular (UC01–UC06)`
- **Labels:** `camada:model`, `camada:usecase`, `camada:viewmodel`, `camada:view`, `modo:1-celular`, `tests`
- **Descrição:**
  Arena de perguntas bíblicas/temáticas com 4 alternativas (`QuizOption` `A–D`), cronômetro de 30s, confirmação visual dupla (cor + ícone de acerto/erro), explicação bíblica imediata e pontuação automática.
- **Arquivos por camada:**
  - `src/model/entities/arenaChallenge.ts` (`QuizQuestion`, `QuizOptionKey`)
  - `src/viewmodel/useQuizViewModel.ts`
  - `src/view/quiz.tsx` ↔ `src/app/quiz.tsx`

---

#### Issue #7 — `[UC05] Implementar Arena do Jogo da Forca (RF13–RF15)`
- **Milestone:** `v0.2.0 — Núcleo & Jogos em 1 Celular (UC01–UC06)`
- **Labels:** `camada:model`, `camada:usecase`, `camada:viewmodel`, `camada:view`, `modo:1-celular`, `tests`
- **Descrição:**
  Arena cooperativa/por equipes com dica temática, máscara da palavra secreta, contador de erros (`máx. 6`) e grade alfabética `A–Z` com `LetterKey` (`available`, `hit`, `miss`).
- **Arquivos por camada:**
  - `src/model/entities/arenaChallenge.ts` (`ForcaPuzzle`)
  - `src/viewmodel/useForcaViewModel.ts`
  - `src/view/forca.tsx` ↔ `src/app/forca.tsx`

---

#### Issue #8 — `[UC06] Implementar Placar e Ranking Geral do PG (RF16–RF17)`
- **Milestone:** `v0.2.0 — Núcleo & Jogos em 1 Celular (UC01–UC06)`
- **Labels:** `camada:usecase`, `camada:viewmodel`, `camada:view`, `modo:1-celular`, `tests`
- **Descrição:**
  Tela de classificação geral das equipes ordenada por pontuação e vitórias, destaque de Pódio Líder, concessão de pontos bônus e reinício de sessão (`resetScoreboard`).
- **Arquivos por camada:**
  - `src/viewmodel/useScoreboardViewModel.ts`
  - `src/view/scoreboard.tsx` ↔ `src/app/scoreboard.tsx`

---

### Milestone 3: `v1.0.0` — Jogos em Sala Multiplayer (`UC07–UC08`)

#### Issue #9 — `[UC07] Implementar Cidade Dorme em Sala Multiplayer com Narrador por Áudio (RF18–RF20)`
- **Milestone:** `v1.0.0 — Jogos em Sala Multiplayer (UC07–UC08)`
- **Labels:** `camada:model`, `camada:infra`, `camada:usecase`, `camada:viewmodel`, `camada:view`, `modo:multiplayer`, `tests`
- **Especificação detalhada:** [`docs/jogos/cidade-dorme.md`](../jogos/cidade-dorme.md)
- **Descrição:**
  Jogo de dedução social em Sala Multiplayer (mínimo 4–5 jogadores) com sorteio secreto de papéis (`Cidadão`, `Sabotador/Assassino`, `Anjo`, `Detetive`), condução automática das fases (`Noite` em Tema Escuro ↔ `Dia/Votação` em Tema Claro) e verificação de vitória.
- **Arquivos por camada:**
  - `src/model/entities/multiplayerSession.ts` (`CidadeDormeRoom`, `CidadeDormePlayer`)
  - `src/model/services/iMultiplayerRoomService.ts`
  - `src/infra/services/memoryMultiplayerRoomService.ts`
  - `src/viewmodel/useCidadeDormeViewModel.ts`
  - `src/view/cidade-dorme.tsx` ↔ `src/app/cidade-dorme.tsx`

---

#### Issue #10 — `[UC08] Implementar Adedonha Bíblica em Sala Multiplayer com Roleta Expressiva (RF21–RF23)`
- **Milestone:** `v1.0.0 — Jogos em Sala Multiplayer (UC07–UC08)`
- **Labels:** `camada:model`, `camada:infra`, `camada:usecase`, `camada:viewmodel`, `camada:view`, `modo:multiplayer`, `tests`
- **Especificação detalhada:** [`docs/jogos/adedonha-biblica.md`](../jogos/adedonha-biblica.md)
- **Descrição:**
  Disputa em Sala Multiplayer com sorteio da letra da rodada, preenchimento de categorias bíblicas/temáticas, validação da letra inicial, botão Jumbo **STOP!** para travar a rodada e apuração assistida com botão *"Levantar Dúvida ✋"*.
- **Arquivos por camada:**
  - `src/model/entities/multiplayerSession.ts` (`AdedonhaRoom`, `AdedonhaSubmission`)
  - `src/viewmodel/useAdedonhaViewModel.ts`
  - `src/view/adedonha.tsx` ↔ `src/app/adedonha.tsx`
