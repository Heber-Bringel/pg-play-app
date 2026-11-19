# 🏗️ Plano de Implementação Técnica (`plan.md`): Correção de Perda de Ações Simultâneas no Cidade Dorme

- **Branch:** `fix/013-cidade-dorme-acoes-simultaneas`
- **Data:** 2026-11-19
- **Especificação de Origem:** `specs/013-fix-cidade-dorme-acoes-simultaneas/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

Eliminar condições de corrida (*lost updates*) no **Cidade Dorme** substituindo leituras-seguidas-de-reescrita-total (`saveCidadeDormeRoom` sobrescrevendo `rooms.config`) por operações granulares e atômicas nas 7 camadas do **MVVM Sofisticado**:
1. Adicionar tipos `CidadeDormeActionKind` e `CidadeDormeActionRecord` em `src/model/entities/multiplayerSession.ts` e declarar `markCidadeDormePlayerReady`, `submitCidadeDormeVote` e `submitCidadeDormeNightAction` em `IMultiplayerRoomService`;
2. Documentar e fornecer esquema SQL (`cidade_dorme_actions` com índice único e RPCs atômicas `cidade_dorme_mark_ready`, `cidade_dorme_cast_vote` e `cidade_dorme_submit_night_action`) em `docs/harness/05-infraestrutura-e-supabase.md` / `supabase/`;
3. Implementar operações atômicas em `MemoryMultiplayerRoomService` (sempre operando sobre o registro mais recente por jogador/rodada, à prova de `Promise.all`) e em `SupabaseMultiplayerRoomService` (via RPCs/upserts por linha + assinatura Realtime em `cidade_dorme_actions`);
4. Atualizar `CidadeDormeUseCases` (`confirmPlayerReady`, `castVote`, ações noturnas) para validar regras de negócio e delegar a escrita atômica ao `IMultiplayerRoomService`.

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo devem estar marcados antes de gerar o `tasks.md` ou iniciar código.*

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada com os cenários de concorrência da Issue `#38`.
- [x] **Artigo II (MVVM 7 Pastas)**: Todos os arquivos planejados em `src/` residem apenas em `model`, `infra` e `usecase` (sem alterar contratos de `view`/`app`).
- [x] **Artigo II (Rotas Finas e View Burra)**: Nenhuma lógica de concorrência ou chamada ao Supabase vaza para `src/view/` ou `src/viewmodel/`.
- [x] **Artigo II (Vocabulário)**: Nenhum arquivo, interface ou classe usa termos proibidos (mantém `IMultiplayerRoomService`, `SupabaseMultiplayerRoomService` e `MemoryMultiplayerRoomService`).
- [x] **Artigo III (Design System)**: Sem alterações visuais diretas; contadores existentes (`Prontos: X/Y`, `Votos registrados: X/Y`) refletem automaticamente os snapshots corretos.
- [x] **Artigo IV (Testabilidade Offline)**: `MemoryMultiplayerRoomService` implementa a mesma semântica atômica e suporta `Promise.all` determinístico nos testes unitários.

---

## 3. Mapeamento de Arquivos nas Camadas e Banco de Dados

```text
docs/harness/05-infraestrutura-e-supabase.md        # Atualiza esquema SQL com cidade_dorme_actions e RPCs atômicas
supabase/migrations/001_cidade_dorme_actions.sql      # (Opcional recomendado) Script SQL idempotente para o projeto Supabase
src/
├─ model/
│  ├─ entities/multiplayerSession.ts                  # Adiciona CidadeDormeActionKind e CidadeDormeActionRecord
│  └─ services/iMultiplayerRoomService.ts             # Adiciona markCidadeDormePlayerReady, submitCidadeDormeVote e submitCidadeDormeNightAction
├─ infra/
│  └─ services/
│     ├─ memoryMultiplayerRoomService.ts              # Implementação atômica resistente a Promise.all + notificações
│     └─ supabaseMultiplayerRoomService.ts            # Chamada às RPCs/tabela cidade_dorme_actions + canal Realtime em 3 tabelas
├─ usecase/
│  └─ cidadeDormeUseCases.ts                          # Atualiza confirmPlayerReady, castVote e ações noturnas para usar métodos atômicos
└─ di/
   └─ container.ts                                    # Sem alteração de assinatura (reusa mesma injeção)
tests/
└─ unit/
   ├─ cidadeDormeUseCases.test.ts                     # Regressão Promise.all (5x confirmPlayerReady e 5x castVote)
   └─ supabaseMultiplayerRoomService.test.ts          # Testes com mock de RPC/upsert atômico e subscription em cidade_dorme_actions
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento da Tela | Componente (`@/view/components/`) | Tokens Semânticos (`@/view/theme`) |
| :--- | :--- | :--- |
| Tag de contagem na Revelação (`Prontos: 5/5`) | `GameCard` (`cidadeDormeRoleSection.tsx`) | `tokens.component.card.*`, `tokens.semantic.color.surfaceVariant` |
| Tag de contagem na Votação (`Votos registrados: 5/5`) | `GameCard` (`cidadeDormeDaySection.tsx`) | `tokens.component.card.*`, `tokens.semantic.color.onActionContainer` |
| Banner de status confirmado após ação | Contêiner de status existente em `cidadeDormeRoleSection.tsx` / `cidadeDormeDaySection.tsx` | `tokens.semantic.color.success`, `tokens.semantic.radius.md` |

---

## 5. Estratégia de Testes (`tests/`)

- **Testes Unitários de UseCase (`tests/unit/cidadeDormeUseCases.test.ts`):**
  - **Regressão 1 (`confirmPlayerReady` concorrente):** criar sala com 5 jogadores, iniciar partida e executar `Promise.all(players.map(p => useCases.confirmPlayerReady(room.id, p.id)))`; garantir que `players.every(p => p.isReady)` é `true`, contagem `5/5` e fase final `night_assassin` (sem travar em `role_reveal`).
  - **Regressão 2 (`castVote` concorrente):** na fase `day_voting`, executar `Promise.all(players.map(p => useCases.castVote(room.id, p.id, targetId)))`; garantir `Object.keys(finalRoom.votesByPlayerId).length === 5` e `players.every(p => p.hasVoted)` é `true`.
  - **Regressão 3 (latência assíncrona simulada):** usar dublê de `IMultiplayerRoomService` com `await Promise.resolve()` entre leitura e escrita para provar que métodos atômicos não perdem atualizações.
- **Testes de Serviço (`tests/unit/supabaseMultiplayerRoomService.test.ts`):**
  - Validar invocação correta das RPCs/tabelas (`cidade_dorme_mark_ready`, `cidade_dorme_cast_vote`, `cidade_dorme_submit_night_action`), conversão de erro para `DataSourceError` e inscrição Realtime em `cidade_dorme_actions`.
