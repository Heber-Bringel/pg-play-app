# 🏗️ Plano de Implementação Técnica (`plan.md`): Isolamento de Papéis e Segredos no Cidade Dorme (RNF11)

- **Branch:** `fix/015-cidade-dorme-sigilo-rnf11`
- **Data:** 2026-11-19
- **Especificação de Origem:** `specs/015-fix-cidade-dorme-sigilo-rnf11/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

Eliminar o vazamento de papéis e segredos no payload público de `rooms.config` (**Issue `#40`**, `RNF11`) em todas as camadas do **MVVM Sofisticado** + PostgreSQL/Supabase:
1. **Domínio (`src/model/`):** Tornar `CidadeDormePlayer.role` anulável (`CidadeDormeRole | null`) e adicionar `allyAssassinIds?: string[]` e métodos públicos de ciclo na interface `IMultiplayerRoomService` para distribuir, resolver amanhecer e apurar votos sem expor segredos no cliente;
2. **Backend Supabase (`docs/harness/05-infraestrutura-e-supabase.md` + SQL):** Configurar `cidade_dorme_secrets` (RLS `auth.uid() = user_id`), `cidade_dorme_actions` (RLS restrita ao autor) e RPCs `security definer` (`cidade_dorme_start_match`, `cidade_dorme_submit_night_action`, `cidade_dorme_resolve_dawn`, `cidade_dorme_tally_votes`);
3. **Infraestrutura (`src/infra/services/`):** Atualizar `SupabaseMultiplayerRoomService` (`saveCidadeDormeRoom` e `mapRowToCidadeDormeRoom`) para nunca gravar segredos em `rooms.config` e hidratar apenas o segredo do usuário autenticado; espelhar o mesmo filtro por `localPlayerId` em `MemoryMultiplayerRoomService`;
4. **UseCase, ViewModel e View:** Adaptar leitura de `player.role` anulável e manter revelação total em `phase === 'finished'`.

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo devem estar marcados antes de gerar o `tasks.md` ou iniciar código.*

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada contra `RNF11` e `docs/jogos/cidade-dorme.md`.
- [x] **Artigo II (MVVM 7 Pastas)**: Toda comunicação com `cidade_dorme_secrets`, `cidade_dorme_actions` e RPCs permanece encapsulada em `src/infra/services/`.
- [x] **Artigo II (Rotas Finas e View Burra)**: A View apenas lê `state.currentPlayer?.role` e `room.players[i].role` sem filtrar segredos manualmente para segurança.
- [x] **Artigo II (Vocabulário)**: Nenhum arquivo, interface ou classe usa termos proibidos (apenas `IMultiplayerRoomService`, `SupabaseMultiplayerRoomService`, `MemoryMultiplayerRoomService`).
- [x] **Artigo III (Design System)**: Revelação final e estado do papel continuam usando os mesmos tokens e componentes de `@/view/theme`.
- [x] **Artigo IV (Testabilidade Offline)**: `MemoryMultiplayerRoomService` mantém armazenamento segregado em memória filtrando por `localPlayerId` para testes determinísticos de `RNF11`.

---

## 3. Mapeamento de Arquivos nas Camadas do MVVM e Banco

```text
docs/harness/05-infraestrutura-e-supabase.md        # Atualiza DDL de cidade_dorme_secrets, RLS e RPCs security definer
supabase/migrations/002_cidade_dorme_rnf11_rls.sql  # Script SQL idempotente com tabelas secretas, RLS e funções security definer
src/
├─ model/
│  ├─ entities/multiplayerSession.ts                  # CidadeDormePlayer.role: CidadeDormeRole | null + allyAssassinIds?: string[]
│  └─ services/iMultiplayerRoomService.ts             # Contratos startCidadeDormeMatch, resolveCidadeDormeDawn, tallyCidadeDormeVotes
├─ infra/
│  └─ services/
│     ├─ memoryMultiplayerRoomService.ts              # Mapas privados de segredos/ações com visão filtrada por localPlayerId
│     └─ supabaseMultiplayerRoomService.ts            # Grava apenas metadados públicos em rooms.config e consulta cidade_dorme_secrets (RLS)
├─ usecase/
│  └─ cidadeDormeUseCases.ts                          # Usa operações seguras do serviço e trata role possivelmente nulo
├─ viewmodel/
│  └─ useCidadeDormeViewModel.ts                      # Trata currentPlayer?.role ?? null ao resolver currentRoleMeta
└─ view/
   └─ components/
      ├─ cidadeDormeRoleSection.tsx                   # Renderiza papel do jogador local quando disponível
      ├─ cidadeDormeNightSection.tsx                  # Mantém exibição apenas para titular vivo do papel
      └─ cidadeDormeDaySection.tsx                    # Exibe papel revelado na morte (se revealRoleOnDeath) e lista completa em finished
tests/
└─ unit/
   ├─ supabaseMultiplayerRoomService.test.ts          # Prova que rooms.config não recebe roles/alvos/votos/veredito
   └─ cidadeDormeUseCases.test.ts                     # Prova isolamento por jogador (inclusive Anfitrião) e revelação em finished
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento da Tela | Componente (`@/view/components/`) | Tokens Semânticos (`@/view/theme`) |
| :--- | :--- | :--- |
| Card secreto e revelado do jogador local | `CidadeDormeRoleSection` (`ExpressiveButton`, `GameCard`) | `tokens.component.card.*`, `tokens.semantic.color.success`, `tokens.semantic.color.errorContainer` |
| Resumo final com revelação de todos os papéis | `CidadeDormeDaySection` (`finished`) | `tokens.semantic.color.actionContainer`, `tokens.semantic.color.errorContainer`, `tokens.semantic.radius.full` |

---

## 5. Estratégia de Testes (`tests/`)

- **Testes Unitários de Infra (`tests/unit/supabaseMultiplayerRoomService.test.ts`):**
  - Capturar payloads enviados a `.from('rooms').update(...)` / `.insert(...)` e garantir que `config` nunca contenha `role`, `nightTargetId`, `nightProtectedId`, `detectiveVerdict` ou `votesByPlayerId` durante a partida.
  - Simular resposta de `cidade_dorme_secrets` para o usuário local e confirmar que `mapRowToCidadeDormeRoom` preenche apenas o `role` do usuário atual mantendo os demais como `null`.
- **Testes Unitários de UseCase (`tests/unit/cidadeDormeUseCases.test.ts`):**
  - Validar que, em `MemoryMultiplayerRoomService` com visão de outro jogador (ou do Anfitrião que não é Detetive/Assassino), os papéis dos demais jogadores vivos retornam `null` e `detectiveVerdict` retorna `null`.
  - Validar que em `phase === 'finished'` todos os papéis ficam disponíveis para o resumo final.
