# 🏗️ Plano de Implementação Técnica (`plan.md`): fix-sincronizacao-salas

- **Branch:** `fix/019-sincronizacao-salas`
- **Data:** 2026-11-21
- **Especificação de Origem:** `specs/019-fix-sincronizacao-salas/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

A autoridade do estado da sala passa para o banco: cada sala ganha `version` (monotônico) e, no Adedonha, `phase_ends_at`. Transições viram *compare-and-set* via RPCs SQL (`where phase = esperada`, retorno com `version`), eliminando corridas. O cliente apenas descarta snapshots antigos (ViewModel) e trata `ConflictError` como "ressincronize". A regra de entrada (lobby-only) vive no UseCase e é reforçada no banco. Sem mudanças visuais.

---

## 2. Verificação Constitucional (*Constitution Check*)

- [x] **Artigo I (SDD)**: `spec.md` completa com `RF-19-xx`.
- [x] **Artigo II (MVVM 7 Pastas)**: arquivos apenas em `model`, `infra`, `usecase`, `di`, `viewmodel` (+ `supabase/migrations`, `tests`).
- [x] **Artigo II (Rotas Finas e View Burra)**: nenhuma rota/tela nova; `view/` e `app/` intocados.
- [x] **Artigo II (Vocabulário)**: apenas `Service`/`DataSource`; sem `Repository`/`Connector`.
- [x] **Artigo III (Design System)**: N/A (sem UI nova).
- [x] **Artigo IV (Testabilidade Offline)**: `MemoryMultiplayerRoomService` reproduz as mesmas regras (versão, fase esperada, lobby-only).
- [ ] **Artigo V (Qualidade)**: `npm run check` com 0 violações (verificado no `T017`).

> Decisão em aberto para o usuário: ver seção 6.

---

## 3. Mapeamento por Camada (`src/` + `supabase/` + `tests/`)

### `src/model/`
| Arquivo | Alteração |
| :--- | :--- |
| `errors.ts` | + `ConflictError extends DomainError` |
| `entities/multiplayerSession.ts` | `AdedonhaRoom` + `version`, `phaseEndsAt`; `CidadeDormeRoom` + `version` |
| `services/iMultiplayerRoomService.ts` | Transições do Adedonha recebem `expectedPhase`; `submitPlayerAnswers` sem `playerId` confiável (usa usuário autenticado); `raiseDoubt`/`triggerAdedonhaStop` atômicos |

### `supabase/migrations/` (novas)
| Arquivo | Conteúdo |
| :--- | :--- |
| `003_rooms_version_phase_ends_at.sql` | `rooms.version int not null default 0`, `rooms.phase_ends_at` (se faltar), trigger `before update` que incrementa `version` |
| `004_adedonha_atomic_rpcs.sql` | RPCs `adedonha_set_phase(room, expected, next, ends_at)`, `adedonha_trigger_stop`, `adedonha_submit_answers` (upsert), `adedonha_raise_doubt` (incremento atômico + 1 por jogador) |
| `005_room_players_integrity.sql` | Índice único `(room_id, lower(nickname))`; RPC `join_room` que valida `phase = 'lobby'` para novos jogadores; (P3) host-migration/expiração |

### `src/infra/`
| Arquivo | Alteração |
| :--- | :--- |
| `services/supabaseMultiplayerRoomService.ts` | Trocar `update` diretos por RPCs; mapear `version`/`phase_ends_at`; converter erro de fase/unicidade em `ConflictError`/`ValidationError`; `refresh` com contador de requisição para descartar resposta antiga |
| `services/memoryMultiplayerRoomService.ts` | Mesmas regras: `version++` por mutação, *compare-and-set*, lobby-only, apelido único |

### `src/usecase/`
| Arquivo | Alteração |
| :--- | :--- |
| `adedonhaUseCases.ts` / `iAdedonhaUseCases.ts` | `joinRoom` valida lobby/reentrada; transições passam `expectedPhase`; `finishRoundByTimeOut` só executa se `phaseEndsAt` expirou; `ConflictError` → snapshot atual |
| `cidadeDormeUseCases.ts` / `iCidadeDormeUseCases.ts` | `joinRoom` lobby-only; passa `expectedRound/phase` onde faltar |

### `src/di/`
`container.ts`: sem novas dependências (reuso do serviço existente).

### `src/viewmodel/`
| Arquivo | Alteração |
| :--- | :--- |
| `useAdedonhaViewModel.ts` | Descartar `updatedRoom.version <= room.version`; contador derivado de `phaseEndsAt`; só host chama `finishRoundByTimeOut`; `ConflictError` → `refresh` silencioso |
| `useCidadeDormeViewModel.ts` | Descartar snapshot antigo; não zerar seleção/voto quando `phaseKey` não mudou de fato (comparar `version`) |

### `src/view/` e `src/app/`
Sem alterações.

---

## 4. Componentes e Tokens do Design System
Nenhum (correção sem UI).

---

## 5. Estratégia de Testes (`tests/`)

- `tests/unit/adedonhaUseCases.test.ts` / `cidadeDormeUseCases.test.ts`: join em lobby × em andamento × reentrada; apelido duplicado; `Promise.all` de STOPs e dúvidas; `ConflictError`.
- `tests/unit/supabaseMultiplayerRoomService.test.ts`: chamadas de RPC com `expectedPhase`; mapeamento de erro; descarte de resposta antiga.
- `tests/hooks/useAdedonhaViewModel.test.ts` / `useCidadeDormeViewModel.test.ts`: snapshots fora de ordem; relógio via `phaseEndsAt`; só host dispara timeout; seleção preservada.
- **Manual (`T000` e `T018`)**: roteiro de 3 abas no navegador (DevTools: rede/console) antes e depois.

---

## 6. Riscos e Decisões para Aprovação

1. **RPC SQL vs. optimistic `update ... where phase`**: o plano usa RPCs (atômicas e testáveis no banco). Alternativa mais leve: `update` condicional pelo cliente, sem migração de RPC — resolve A2/A6, mas não A5/A7.
2. **`phase_ends_at` por relógio do servidor**: exige `now()` do banco; clientes calculam o offset a partir do snapshot.
3. **Migrações exigem aplicação no Supabase do projeto** (fora do repositório) — coordenar antes do merge.
4. **P3 (host-migration/expiração)** pode virar spec própria (`020`) se o escopo crescer.
