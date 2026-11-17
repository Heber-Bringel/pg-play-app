# 🏗️ Plano de Implementação Técnica (`plan.md`): UC08 — Salas Reais, Refatoração Visual e Supabase Realtime na Adedonha Bíblica

- **Branch:** `feat/010-uc08-adedonha-salas-realtime`
- **Data:** 2026-11-17
- **Especificação de Origem:** `specs/010-uc08-adedonha-salas-realtime/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

Evolução da funcionalidade **Adedonha Bíblica (`UC08`)** nas 7 camadas do **MVVM Sofisticado**:
1. Adicionar assinatura Realtime (`subscribeToRoom`) e suporte a identificação do jogador local no contrato `IMultiplayerRoomService` e em `IAdedonhaUseCases`;
2. Implementar `SupabaseMultiplayerRoomService` com `@supabase/supabase-js` (Auth anônima, Postgres CRUD em `rooms`, `room_players`, `adedonha_submissions` e Supabase Realtime) mantendo `MemoryMultiplayerRoomService` 100% funcional para offline/testes;
3. Configurar seleção automática por variáveis `EXPO_PUBLIC_SUPABASE_*` em `src/di/container.ts` e fornecer `.env.example`;
4. Refatorar `useAdedonhaViewModel` e `src/view/adedonha.tsx` para incluir a etapa de entrada (Apelido + Criar Sala / Entrar com PIN), distinguir Moderador vs. Participante e reorganizar a fase de Apuração (`tally`) com tokens semânticos de `@/view/theme` e botões de veredito compactos (`>= 48 dp`).

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo devem estar marcados antes de gerar o `tasks.md` ou iniciar código.*

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada com os requisitos `UC08` / `RF21–RF23`.
- [x] **Artigo II (MVVM 7 Pastas)**: Todos os arquivos planejados residem apenas em `app`, `view`, `viewmodel`, `usecase`, `model`, `infra` ou `di`.
- [x] **Artigo II (Rotas Finas e View Burra)**: A rota `src/app/adedonha.tsx` permanece com 2 linhas e toda lógica de estado/navegação fica em `src/viewmodel/useAdedonhaViewModel.ts`.
- [x] **Artigo II (Vocabulário)**: Nenhum arquivo, interface ou classe usa `Repository` ou `Connector` (apenas `Service`).
- [x] **Artigo III (Design System)**: Todos os estilos usam exclusivamente `tokens` de `@/view/theme` e componentes de `@/view/components/`.
- [x] **Artigo IV (Testabilidade Offline)**: `MemoryMultiplayerRoomService` continua sendo o fallback automático sem rede e a base dos testes unitários.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

```text
.env.example                                            # Modelo com EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY
.gitignore                                              # Garante que .env nunca seja versionado
src/
├─ model/
│  ├─ entities/multiplayerSession.ts                    # Mantém tipos puros + tipo de callback/sessão se necessário
│  └─ services/iMultiplayerRoomService.ts               # Adiciona subscribeToRoom(roomId, onRoomChange) e getCurrentPlayerId?
├─ infra/
│  └─ services/
│     ├─ memoryMultiplayerRoomService.ts                # Emite notificações para listeners locais + suporte a múltiplos jogadores
│     └─ supabaseMultiplayerRoomService.ts              # Implementação real com @supabase/supabase-js (Auth Anônima + Postgres + Realtime)
├─ usecase/
│  ├─ iAdedonhaUseCases.ts                              # Expõe subscribeToRoom e utilitários de sessão
│  └─ adedonhaUseCases.ts                               # Coordena createRoom, joinRoom, subscribeToRoom e validações
├─ di/
│  └─ container.ts                                      # Seleciona SupabaseMultiplayerRoomService se EXPO_PUBLIC_SUPABASE_* existir; senão Memory*
├─ viewmodel/
│  └─ useAdedonhaViewModel.ts                           # Estado de entrada (entry vs room), currentPlayerId, subscribeToRoom e ações
├─ view/
│  └─ adedonha.tsx                                      # Etapa de identificação/sala + refatoração visual semântica (especialmente fase tally)
└─ app/
   └─ adedonha.tsx                                      # Rota fina inalterada (2 linhas)
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento da Tela | Componente (`@/view/components/`) | Tokens Semânticos (`@/view/theme`) |
| :--- | :--- | :--- |
| Campos de Apelido, PIN, Nova Coluna e Respostas | `ExpressiveTextField` | `tokens.component.input.*`, `tokens.semantic.color.*`, `tokens.semantic.space.md` |
| Ações principais (Criar Sala, Girar Roleta, ADEDONHA!, Confirmar Coluna) | `ExpressiveButton` (`primaryJumbo`, `tonal`, `outlined`, `secondary`) | `tokens.component.button.*`, `tokens.semantic.color.*`, `tokens.semantic.space.lg` |
| Cabeçalhos de fase, Pódio e Ranking | `GameCard` | `tokens.component.card.*`, `tokens.semantic.color.highlight` |
| Cronômetro da rodada | `ExpressiveTimer` | `tokens.component.timer.*`, `tokens.semantic.motion.*` |
| Grade de letras na Roleta | `LetterKey` | `tokens.component.key.*`, `tokens.semantic.space.sm` |
| Card de submissão e barra segmentada de veredito na Apuração (`tally`) | Container semântico local com `Pressable` (`>= 48 dp`) + `MaterialCommunityIcons` | `tokens.component.card.*`, `tokens.semantic.color.success/secondary/error/actionContainer`, `tokens.semantic.radius.md/lg`, `tokens.semantic.space.sm/md/lg` |

---

## 5. Estratégia de Testes (`tests/`)

- **Testes Unitários de Serviço/UseCase (`tests/unit/adedonhaUseCases.test.ts` e novo `tests/unit/supabaseMultiplayerRoomService.test.ts`):**
  - Validar `createRoom`, `joinRoom`, `subscribeToRoom` com `MemoryMultiplayerRoomService`.
  - Validar `SupabaseMultiplayerRoomService` com cliente `@supabase/supabase-js` mockado (Auth anônima, criação/entrada em sala, envio de respostas, julgamento e conversão de erros para `AuthError`/`DataSourceError`).
- **Testes de ViewModel (`tests/hooks/useAdedonhaViewModel.test.ts`):**
  - Fluxo inicial sem sala carregada automaticamente (etapa de entrada: Criar Sala / Entrar com PIN / Modo Demonstração Offline).
  - Atualização automática via callback `subscribeToRoom`.
  - Identificação correta de `currentPlayerId` e `isCurrentPlayerHost`.
- **Testes de Tela (`tests/mocks/adedonhaScreen.mock.test.tsx`):**
  - Renderização da etapa de entrada (Apelido, Criar Sala, Entrar com PIN).
  - Renderização do Lobby (código PIN + chips + lista de jogadores).
  - Renderização da fase `tally` refatorada com botões compactos de veredito e *Levantar Dúvida*.
