# 🏗️ Plano de Implementação Técnica (`plan.md`): UC12 — Desenho Relâmpago (Multiplayer)

- **Branch:** `feat/028-uc12-desenho-relampago`
- **Data:** 2026-11-25 (Refatoração Multiplayer + Formas Geométricas + Canvas Expandido + Tema 5s)
- **Especificação de Origem:** `specs/028-uc12-desenho-relampago/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

Refatoração arquitetural do minigame **Desenho Relâmpago** (`UC12`, Issue `#83`) da modalidade 1 Celular para **Sala Multiplayer em Tempo Real** (estilo *Gartic*, `2` a `16` jogadores via PIN), adicionando **4 formas geométricas** (*Linha*, *Retângulo*, *Círculo*, *Triângulo*) com alternância **Contorno/Preenchido**, **canvas expandido** (`canvas.expandedMinHeight`) que ocupa o espaço do tema após **`5 segundos`** e botão discreto **"Espiar palavra"** (`3s`).

Seguindo o mesmo padrão consolidado de **Adedonha Bíblica (`UC08`)** e **Cidade Dorme (`UC07`)**:
- O domínio (`src/model/`) define `DrawingElement` (pincel livre + formas geométricas com `fillMode`), `DesenhoRoom`, `DesenhoPlayer`, `DesenhoGuess`, `DesenhoConfig` e estende `IMultiplayerRoomService` com operações da sala de desenho.
- A infraestrutura (`src/infra/`) atualiza o card `'desenho'` no `MemoryGameCatalogDataSource` para `mode: 'Sala Multiplayer'` (`2 a 16 jogadores`), implementa a sala de desenho em `MemoryMultiplayerRoomService` (offline/testes) e `SupabaseMultiplayerRoomService` (Realtime + tabela/colunas via migração SQL em `supabase/migrations/007_desenho_multiplayer.sql` com RLS protegendo o segredo do desenhista — `RNF11`).
- O caso de uso dedicado **`DesenhoUseCases`** (`src/usecase/iDesenhoUseCases.ts` + `src/usecase/desenhoUseCases.ts`, injetado em `src/di/container.ts`) concentra criação/entrada de sala, validação de configurações e pacotes, sorteio sem repetição, normalização/validação de palpites, cálculo de pontuação (`+20`/`+15`/`+10` e `+10`/`+5`), encerramento de turno e premiação final (`DesenhoAwards`).
- Na apresentação, `src/view/theme.ts` sincroniza `canvas.minHeight` (`320 dp`) e `canvas.expandedMinHeight` (`384 dp`), `DrawingCanvas` ganha ferramentas de forma + preenchimento + modo `expanded` + modo `readOnly`, `useDesenhoViewModel` orquestra sala Realtime + timer de `5s` do tema + espiada de `3s` + `IGameFeedbackUseCases`, e `src/view/desenho.tsx` renderiza Lobby, Arena do Desenhista, Arena do Adivinhador, Resumo do Turno e Pódio Final.

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo devem estar verificados antes de iniciar `/speckit.implement`.*

- [x] **Artigo I (SDD)**: `spec.md`, `docs/jogos/desenho-relampago.md`, `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md` e `design-system/04-componentes/tela-de-desenho.md` atualizados e alinhados; implementação aguardando aprovação humana das tarefas (`tasks.md`).
- [x] **Artigo II (MVVM 7 Pastas)**: Todos os arquivos em `src/` permanecem estritamente dentro das 7 pastas canônicas (`app`, `view`, `viewmodel`, `usecase`, `model`, `infra`, `di`).
- [x] **Artigo II (Rotas Finas e View Burra)**: `src/app/desenho.tsx` permanece com 2 linhas e toda a navegação/timers/efeitos de rede ficam isolados na ViewModel/UseCase/Service.
- [x] **Artigo II (Vocabulário)**: Apenas `DataSource` e `Service` (zero `Repository` ou `Connector`).
- [x] **Artigo III (Design System)**: `canvas.expandedMinHeight` e `canvas.minHeight` formalizados em `design-system/02-tokens.md` (`v1.3.0`) e `tela-de-desenho.md`; zero `#hex` ou números mágicos fora de `theme.ts`.
- [x] **Artigo IV (Testabilidade Offline)**: 100% testável offline com `MemoryMultiplayerRoomService` + `MemoryGameCatalogDataSource` sem depender de rede nos testes Jest.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

Ordem estrita de criação/alteração de dentro para fora:

```text
supabase/
└─ migrations/
   └─ 007_desenho_multiplayer.sql                  # [CRIAR] Tabelas/RLS/RPCs da sala de Desenho Relâmpago (proteção RNF11 da palavra secreta)

src/
├─ model/
│  ├─ entities/drawingChallenge.ts                 # [ALTERAR] Adicionar DrawingToolId, DrawingFillMode, DrawingElement (freehand + 4 formas geométricas)
│  ├─ entities/multiplayerSession.ts               # [ALTERAR] Adicionar DesenhoPhase, DesenhoConfig, DesenhoPlayer, DesenhoGuess, DesenhoAwards, DesenhoRoom
│  └─ services/iMultiplayerRoomService.ts          # [ALTERAR] Adicionar métodos da sala de desenho (create, join, leave, updateConfig, startTurn, addElement, undoElement, clearCanvas, submitGuess, finishTurn, advanceTurn, restartLobby, subscribeToDesenhoRoom)
├─ infra/
│  ├─ datasources/memoryGameCatalogDataSource.ts   # [ALTERAR] Atualizar minigame 'desenho' para mode: 'Sala Multiplayer' e playersLabel: '2 a 16 jogadores'
│  ├─ services/memoryMultiplayerRoomService.ts     # [ALTERAR] Implementar todos os métodos de DesenhoRoom em memória com isolamento de segredo (viewerPlayerId)
│  └─ services/supabaseMultiplayerRoomService.ts   # [ALTERAR] Implementar persistência + Supabase Realtime (Postgres Changes + Broadcast de elementos) com isolamento RNF11
├─ usecase/
│  ├─ iDesenhoUseCases.ts                          # [CRIAR] Contrato IDesenhoUseCases (sala, config, desenho, palpites, turnos, prêmios)
│  ├─ desenhoUseCases.ts                           # [CRIAR] Implementação DesenhoUseCases (validações, normalização de palpites, pontuação +20/+15/+10 e +10/+5, sorteio sem repetição)
│  ├─ iPgPlayUseCases.ts                           # [VERIFICAR/LIMPAR] Manter listDesenhoCards ou remover métodos legados de 1-celular (scoreDesenhoHit/Skip) se não usados
│  └─ pgPlayUseCases.ts                            # [VERIFICAR/LIMPAR] Alinhar com o contrato de catálogo/configurações
├─ di/
│  └─ container.ts                                 # [ALTERAR] Instanciar e exportar desenhoUseCases: IDesenhoUseCases com multiplayerRoomService + gameCatalogDataSource
├─ viewmodel/
│  └─ useDesenhoViewModel.ts                       # [ALTERAR] Refatorar para Sala Multiplayer + timer de tema 5s + espiar 3s + estado de ferramenta/forma/preenchimento + envio de palpites + IGameFeedbackUseCases
├─ view/
│  ├─ theme.ts                                     # [ALTERAR] Sincronizar canvas.minHeight (320 dp) e canvas.expandedMinHeight (384 dp) conforme v1.3.0
│  ├─ components/drawingCanvas.tsx                 # [ALTERAR] Suportar DrawingElement (Path, Line, Rect, Ellipse, Polygon), pré-visualização ao arrastar, 5 ferramentas, Contorno/Preenchido, expanded e readOnly
│  └─ desenho.tsx                                  # [ALTERAR] Renderizar Lobby PIN, Arena do Desenhista (tema 5s -> canvas expandido + botão Espiar 3s), Arena do Adivinhador (canvas readOnly + feed + campo palpite), Resumo do Turno e Pódio Final
└─ app/
   └─ desenho.tsx                                  # [MANTER] Rota fina de 2 linhas reexportando @/view/desenho
```

---

## 4. Inventário do Design System (`PG Play Expressive v1.3.0`)

| Elemento da Tela | Componente (`@/view/components/`) | Tokens (`@/view/theme`) |
| :--- | :--- | :--- |
| Lobby (Criar/Entrar PIN + Config) | `GameCard`, `ExpressiveTextField`, `ExpressiveChip`, `ExpressiveTag`, `ExpressiveButton` (`primaryJumbo`) | `card.*`, `input.*`, `chip.*`, `tag.*`, `button.jumbo.height` |
| Cabeçalho do turno + Espiar palavra | `ExpressiveButton` (`outlined`, `tonal`), `ExpressiveTag`, `ExpressiveTimer` | `space.sm`, `timer.*`, `tag.action.*`, `tag.secondary.*` |
| Tema temporário (5s inicial / 3s espiar) | Container/Overlay temático + `ExpressiveTag` + banner `Sem letras nem números` | `card.bg`, `card.border`, `card.radius`, `font.display`, `banner.warning.*` |
| Folha expandida + Formas + Preenchimento | `DrawingCanvas` (`Svg`: `Path`, `Line`, `Rect`, `Ellipse`, `Polygon`) + `useKeyboardFocus` | `canvas.paperBg`, `canvas.border`, `canvas.radius`, `canvas.minHeight`, `canvas.expandedMinHeight`, `canvas.pen.*`, `canvas.stroke.*`, `canvas.tool.*` |
| Adivinhação (Adivinhador) | `DrawingCanvas` (`readOnly`), `ExpressiveTextField`, `ExpressiveButton`, `ExpressiveTag` | `input.*`, `banner.success.*`, `tag.success.*`, `color.surfaceContainer` |
| Resumo do Turno e Pódio Final | `GameCard` (`highlightLeader`), `ExpressiveTag`, `ExpressiveButton` (`primaryJumbo`, `outlined`) | `card.borderLeader`, `tag.highlight.*`, `tag.success.*` |
| Saída Segura (`RF11`) | `ConfirmModal` | `elevation.floating`, `color.scrim`, `card.radius` |

---

## 5. Estratégia de Testes (`tests/`)

- **Tokens (`tests/tokens.test.ts`):** validar `canvas.minHeight` (`320 dp`) e `canvas.expandedMinHeight` (`384 dp`) nos modos claro e escuro + contrastes WCAG das 4 cores e `onPen`.
- **Unitários (`tests/unit/desenhoUseCases.test.ts`, `tests/unit/pgPlayUseCases.hub.test.ts`):** criar/entrar sala, validações (`ValidationError`), isolamento de segredo para adivinhadores (`RNF11`), adição/desfazer/limpar elementos (pincel e 4 formas com `stroke`/`fill`), normalização de palpites, cálculo de pontos (`+20`/`+15`/`+10` e `+10`/`+5`), encerramento antecipado quando todos acertam, premiação final e contagem no Hub (`3` jogos em `'Sala Multiplayer'`, `6` em `'1 Celular'`).
- **Componente (`tests/components/drawingCanvas.test.tsx`):** renderização de `Path`, `Line`, `Rect`, `Ellipse` e `Polygon` em modos `stroke` e `fill`, pré-visualização via `PanResponder`, seleção de ferramentas/preenchimento com acessibilidade (`48 dp`, `accessibilityState`), modo `expanded` (`384 dp`) e modo `readOnly` (oculta toolbar e mantém opacidade cheia).
- **Hook (`tests/hooks/useDesenhoViewModel.test.ts`, `tests/hooks/gameFeedback.viewmodels.test.ts`):** Lobby, início de turno, desaparecimento automático do tema após `5000 ms`, expansão do canvas, espiada de `3000 ms`, ferramentas/formas/preenchimento, envio de palpite, feedback háptico do cronômetro e saída segura.
- **Mock de Tela e Integração (`tests/mocks/desenhoScreen.mock.test.tsx`, `tests/integration/desenho.integration.test.tsx`):** todas as fases (Lobby, Desenhista com/sem tema 5s, Adivinhador, Resumo, Pódio) + fluxo real ponta a ponta com `MemoryMultiplayerRoomService` e 2 jogadores simulados.
