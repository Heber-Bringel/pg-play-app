# ✅ Lista de Tarefas (`tasks.md`): UC08 — Salas Reais, Refatoração Visual e Supabase Realtime na Adedonha Bíblica

- **Input:** `specs/010-uc08-adedonha-salas-realtime/spec.md` e `specs/010-uc08-adedonha-salas-realtime/plan.md`
- **Ordem de Execução Obrigatória:** De dentro para fora (`model` → `infra` → `usecase` → `di` → `tests` → `viewmodel` → `view` → `app`)
- **Receitas do Harness:** `/nova-funcionalidade`, `/nova-tela`, `/revisar-arquitetura`, `/commit-e-pr`

---

## Fase 0: Dependência e Configuração de Ambiente
- [x] **T001** Instalar `@supabase/supabase-js` com `npx expo install @supabase/supabase-js`
- [x] **T002** Criar `.env.example` com `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` e garantir `.env` no `.gitignore`

---

## Fase 1: Domínio Puro (`src/model/`)
*Objetivo: Atualizar contratos sem dependências externas.*

- [x] **T003** Atualizar `src/model/services/iMultiplayerRoomService.ts` adicionando `subscribeToRoom(roomId: string, onRoomUpdated: (room: AdedonhaRoom) => void): () => void` e identificação do jogador autenticado na sessão (`getLocalPlayerId(roomId?: string): Promise<string | null>`)

---

## Fase 2: Infraestrutura Offline e Supabase Realtime (`src/infra/`)
*Objetivo: Manter `MemoryMultiplayerRoomService` completo e implementar `SupabaseMultiplayerRoomService` real.*

- [x] **T004** Atualizar `src/infra/services/memoryMultiplayerRoomService.ts` com emissão de eventos para `subscribeToRoom`, rastreio do `localPlayerId` ao criar/entrar em sala e opção de simular sala demo
- [x] **T005** Implementar `SupabaseMultiplayerRoomService` em `src/infra/services/supabaseMultiplayerRoomService.ts` usando `@supabase/supabase-js` (Auth Anônima `signInAnonymously`, leitura/escrita em `rooms`, `room_players`, `adedonha_submissions` e canal Realtime `postgres_changes`), convertendo falhas em `AuthError` e `DataSourceError`

---

## Fase 3: Caso de Uso e Injeção de Dependências (`src/usecase/` e `src/di/`)
*Objetivo: Expor assinatura Realtime no UseCase e selecionar automaticamente Supabase vs. Memory no DI.*

- [x] **T006** Atualizar `src/usecase/iAdedonhaUseCases.ts` e `src/usecase/adedonhaUseCases.ts` expondo `subscribeToRoom` e `getLocalPlayerId`
- [x] **T007** Atualizar `src/di/container.ts` para instanciar `SupabaseMultiplayerRoomService` quando `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` estiverem configuradas, mantendo `MemoryMultiplayerRoomService` como fallback automático offline

---

## Fase 4: Testes Unitários de Infra e UseCase (`tests/`)
*Objetivo: Validar regra de negócio e integração Supabase mockada antes da camada de apresentação.*

- [x] **T008** Atualizar `tests/unit/adedonhaUseCases.test.ts` cobrindo `createRoom`, `joinRoom`, `subscribeToRoom` e `getLocalPlayerId`
- [x] **T009** Criar `tests/unit/supabaseMultiplayerRoomService.test.ts` validando Auth anônima, criação/entrada em sala, submissão, julgamento e conversão de erros

---

## Fase 5: Apresentação — ViewModel e View Refatorada (`src/viewmodel/` e `src/view/`)
*Objetivo: Fluxo real de identificação/sala e correção de todos os problemas visuais da auditoria.*

- [x] **T010** Atualizar `src/viewmodel/useAdedonhaViewModel.ts`: iniciar na etapa de identificação (sem autoentrar em sala), implementar `handleCreateRoom`, `handleJoinRoom`, `handleJoinDemoRoom` (quando em modo offline), `currentPlayerId`, `isCurrentPlayerHost` e assinatura `subscribeToRoom` com cleanup
- [x] **T011** Refatorar `src/view/adedonha.tsx` consumindo exclusivamente `tokens` de `@/view/theme`:
  - Etapa de entrada (Apelido + Criar Sala / Entrar com Código PIN + botão discreto de Sala Demo offline);
  - Lobby com destaque do Código PIN, lista de jogadores com selo de Moderador/Você e chips de sugestão de colunas;
  - Preenchimento (`filling`) com separação clara (`space.lg`) entre botão Jumbo **ADEDONHA!** e controle do Moderador;
  - Apuração (`tally`) com cards espaçados, selo semântico único (`Cor + Ícone + Texto`) e barra compacta horizontal de veredito (`>= 48 dp`), eliminando o empilhamento de 4 botões gigantes por jogador
- [x] **T012** Atualizar `tests/hooks/useAdedonhaViewModel.test.ts` e `tests/mocks/adedonhaScreen.mock.test.tsx`

---

## Fase 6: Verificação Arquitetural, Teste Web e Screenshots
*Objetivo: Validar funcionamento real e 0 violações.*

- [x] **T013** Executar `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest`) e confirmar **0 violações** e todos os testes passando
- [x] **T014** Testar a aplicação no navegador (etapa de entrada → criar sala → lobby → preenchimento → apuração → resumo) e registrar prints validando as correções visuais

---

## Fase 7: Auditoria Pós-Entrega (Stop Countdown 5s, Modularização e Conformidade Completa com Design System)
- [x] **T015** Adicionar `submitAnswers`, `startStopCountdown` e `finalizeStopCountdown` em `IAdedonhaUseCases` e `AdedonhaUseCases`, atualizando `useAdedonhaViewModel` para fluxo real de 5s (`stop_countdown`) com envio automático no Realtime
- [x] **T016** Criar `ExpressiveChip` em `src/view/components/expressiveChip.tsx` com alvo `>= 48 dp`, `border.focus`/`color.focus`, *shape morphing* (`pressed`), `lineHeight` e `maxFontSizeMultiplier={1.5}`
- [x] **T017** Extrair as 5 seções da Adedonha para componentes modulares em `src/view/components/` (`adedonhaEntrySection.tsx`, `adedonhaLobbySection.tsx` com abas *Jogar*/*Configurar*, `adedonhaFillingSection.tsx`, `adedonhaTallySection.tsx`, `adedonhaSummarySection.tsx`), aplicando `elevation.card` e corrigindo tipografia/acessibilidade
- [x] **T018** Limpar estilos mortos (`exitBanner`, `exitTitle`, `exitActions`) em `adedonha.tsx`, `forca.tsx`, `mimica.tsx` e `quiz.tsx`
- [x] **T019** Atualizar e ampliar testes unitários (`adedonhaUseCases.test.ts`, `useAdedonhaViewModel.test.ts`, `adedonhaScreen.mock.test.tsx`, `components.test.tsx`) e validar com `npm run check` e navegador
