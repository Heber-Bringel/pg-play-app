# ✅ Lista de Tarefas (`tasks.md`): UC12 — Desenho Relâmpago (Multiplayer)

- **Input:** `specs/028-uc12-desenho-relampago/spec.md` e `specs/028-uc12-desenho-relampago/plan.md`
- **Issue vinculada:** `#83`
- **Ordem de Execução Obrigatória:** De dentro para fora (`model` → `infra` → `usecase` → `di` → `tests` → `theme` → `viewmodel` → `view` → `app`)
- **Status:** Concluído (verificado com `npm run check` — 0 violações e 0 erros)

---

## Fase 1: Domínio Puro (`src/model/`)
*Objetivo: Evoluir os tipos de desenho para formas geométricas + preenchimento e modelar a sala multiplayer `DesenhoRoom`.*

- [x] **T001** Atualizar `src/model/entities/drawingChallenge.ts` adicionando `DrawingToolId` (`'freehand' | 'line' | 'rectangle' | 'circle' | 'triangle'`), `DrawingFillMode` (`'stroke' | 'fill'`) e `DrawingElement` (união discriminada de traço livre + formas geométricas)
- [x] **T002** Atualizar `src/model/entities/multiplayerSession.ts` adicionando `DesenhoPhase`, `DesenhoConfig`, `DesenhoPlayer`, `DesenhoGuess`, `DesenhoAwards` e `DesenhoRoom`
- [x] **T003** Atualizar contrato `IMultiplayerRoomService` em `src/model/services/iMultiplayerRoomService.ts` com as operações de sala de desenho (`createDesenhoRoom`, `joinDesenhoRoom`, `leaveDesenhoRoom`, `getDesenhoRoom`, `updateDesenhoConfig`, `startDesenhoMatch`, `addDesenhoElement`, `undoDesenhoElement`, `clearDesenhoCanvas`, `submitDesenhoGuess`, `finishDesenhoTurn`, `advanceDesenhoTurn`, `restartDesenhoLobby`, `subscribeToDesenhoRoom`)

---

## Fase 2: Infraestrutura Offline/Memória e Supabase (`src/infra/` e `supabase/`)
*Objetivo: Registrar o jogo como Sala Multiplayer no Hub e implementar sincronização em memória e Supabase Realtime com isolamento de segredo (`RNF11`).*

- [x] **T004** Atualizar `src/infra/datasources/memoryGameCatalogDataSource.ts` mudando o minigame `'desenho'` para `mode: 'Sala Multiplayer'` e `playersLabel: '2 a 16 jogadores'`
- [x] **T005** Implementar todos os métodos da sala `DesenhoRoom` em `src/infra/services/memoryMultiplayerRoomService.ts` (com isolamento de `currentSecretWord` por `viewerPlayerId` durante `drawing`)
- [x] **T006** Criar migração `supabase/migrations/007_desenho_multiplayer.sql` (políticas RLS para palavra secreta + suporte a desenho/palpites) e implementar os métodos correspondentes em `src/infra/services/supabaseMultiplayerRoomService.ts` (Realtime + Broadcast de elementos)

---

## Fase 3: Caso de Uso Dedicado e Injeção de Dependências (`src/usecase/` e `src/di/`)
*Objetivo: Concentrar regras de negócio multiplayer, normalização de palpites, pontuação e premiação em `DesenhoUseCases`.*

- [x] **T007** Criar contrato `IDesenhoUseCases` em `src/usecase/iDesenhoUseCases.ts` e implementação `DesenhoUseCases` em `src/usecase/desenhoUseCases.ts` (validações de apelido/PIN/pacotes/mínimo de 2 jogadores, sorteio sem repetição, validação normalizada de palpites, pontuação `+20`/`+15`/`+10` e `+10`/`+5`, encerramento antecipado quando todos acertam e cálculo de `DesenhoAwards`)
- [x] **T008** Registrar e exportar `desenhoUseCases: IDesenhoUseCases` em `src/di/container.ts` (injetando `multiplayerRoomService` e `gameCatalogDataSource`) e revisar métodos/mocks em `IPgPlayUseCases` / `PgPlayUseCases`

---

## Fase 4: Sincronização de Tokens (`v1.3.0`) e Mocks SVG (`src/view/theme.ts` e `tests/`)
*Objetivo: Sincronizar o canvas expandido no tema e preparar mocks de `Line`, `Rect`, `Ellipse` e `Polygon` do `react-native-svg`.*

- [x] **T009** Atualizar `src/view/theme.ts` ajustando `canvas.minHeight` (`320 dp` = `space['3xl'] * 5`) e adicionando `canvas.expandedMinHeight` (`384 dp` = `space['3xl'] * 6`) conforme `design-system/02-tokens.md` (`v1.3.0`)
- [x] **T010** Atualizar `tests/__mocks__/react-native-svg.tsx` para exportar `Line`, `Rect`, `Ellipse` e `Polygon` além de `Svg` e `Path`, e atualizar `tests/tokens.test.ts` validando os novos tokens `canvas.*`

---

## Fase 5: Apresentação — `DrawingCanvas`, `useDesenhoViewModel` e `src/view/desenho.tsx`
*Objetivo: Entregar formas geométricas com preenchimento, tema temporário de 5s + espiar 3s, canvas expandido e arena multiplayer completa.*

- [x] **T011** Refatorar `src/view/components/drawingCanvas.tsx` para renderizar `DrawingElement` (`Path`, `Line`, `Rect`, `Ellipse`, `Polygon`) com pré-visualização em tempo real, barra de ferramentas com **Pincel + 4 Formas + alternador Contorno/Preenchido + 4 Cores + 2 Espessuras + Desfazer/Limpar**, suporte a `expanded` (`canvas.expandedMinHeight`) e modo `readOnly` para adivinhadores
- [x] **T012** Refatorar `src/viewmodel/useDesenhoViewModel.ts` para consumir `IDesenhoUseCases` + `IGameFeedbackUseCases`: fluxos de Lobby (criar/entrar PIN, configurar), assinatura Realtime da sala, temporizador automático de **`5 segundos`** do tema no início de cada turno (expandindo o canvas ao zerar), ação `handlePeekWord` (**`3 segundos`**), seleção de ferramenta/forma/preenchimento/cor/espessura, envio de palpites e saída segura
- [x] **T013** Refatorar `src/view/desenho.tsx` para exibir as 4 fases multiplayer (`lobby`, `drawing` nas visões Desenhista com tema 5s → canvas expandido + botão *"Espiar palavra"* e Adivinhador com canvas `readOnly` + feed + campo de palpite, `turn_summary` revelando palavra/pontuação e `finished` com Pódio e prêmios), mantendo `src/app/desenho.tsx` como rota fina de 2 linhas

---

## Fase 6: Testes Automatizados por Categoria, Verificação e Commits Incrementais
*Objetivo: Cobrir 100% das novas regras multiplayer e formas geométricas com `npm run check` zerado.*

- [x] **T014** Criar `tests/unit/desenhoUseCases.test.ts` e atualizar `tests/unit/pgPlayUseCases.hub.test.ts` e `tests/hooks/useHubViewModel.test.ts` (3 jogos em `'Sala Multiplayer'`, 6 em `'1 Celular'`)
- [x] **T015** Atualizar `tests/components/drawingCanvas.test.tsx` cobrindo as 4 formas geométricas, `stroke` vs `fill`, pré-visualização, modo `expanded` e modo `readOnly`
- [x] **T016** Atualizar `tests/hooks/useDesenhoViewModel.test.ts` e `tests/hooks/gameFeedback.viewmodels.test.ts` cobrindo Lobby, desaparecimento do tema após `5s`, expansão do canvas, espiada de `3s`, palpites e feedback háptico
- [x] **T017** Atualizar `tests/mocks/desenhoScreen.mock.test.tsx` e `tests/integration/desenho.integration.test.tsx` cobrindo fluxo completo multiplayer entre Desenhista e Adivinhador
- [x] **T018** Executar `npm run check` (`check-arquitetura.mjs`, `check-design-system.mjs`, `tsc --noEmit` e `jest`) garantindo **0 violações e 0 erros**, e realizar commits convencionais incrementais (sem `git push`)
