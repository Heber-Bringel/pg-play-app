# ✅ Lista de Tarefas (`tasks.md`): Validação de Atores e Alvos na Noite e Votação do Cidade Dorme

- **Input:** `specs/017-fix-cidade-dorme-validacao-acoes-alvos/spec.md` e `specs/017-fix-cidade-dorme-validacao-acoes-alvos/plan.md`
- **Ordem de Execução Obrigatória:** De dentro para fora (`model/infra` → `usecase` → `tests` → `viewmodel` → `view` → `npm run check`)
- **Receitas do Harness:** `/nova-funcionalidade`, `/revisar-arquitetura`, `/commit-e-pr`

---

## Fase 1: Contratos e Regra de Negócio (`src/usecase/` e `src/infra/`)
*Objetivo: Exigir identificação do ator e validar todas as permissões e alvos no UseCase (e no servidor).*

- [ ] **T001** Atualizar `ICidadeDormeUseCases` (`src/usecase/iCidadeDormeUseCases.ts`) adicionando `actorPlayerId: string` em `submitAssassinTarget`, `submitAngelProtection` e `submitDetectiveInvestigation`
- [ ] **T002** Implementar helper de validação de ator noturno em `src/usecase/cidadeDormeUseCases.ts` verificando existência na sala, `isAlive === true` e correspondência exata do `role` com a fase
- [ ] **T003** Validar alvos em `src/usecase/cidadeDormeUseCases.ts`: bloquear auto-ataque e ataque a parceiro Assassino; bloquear segunda investigação na mesma rodada e auto-investigação do Detetive; bloquear autovoto em `castVote`; preservar proteção própria do Anjo
- [ ] **T004** Alinhar validações de ator/alvo nas chamadas/RPCs de `src/infra/services/supabaseMultiplayerRoomService.ts` e `src/infra/services/memoryMultiplayerRoomService.ts`

---

## Fase 2: Testes Unitários de Regressão (`tests/unit/`)
*Objetivo: Cobrir todos os cenários inválidos com `ValidationError` antes de ajustar a UI.*

- [ ] **T005** Atualizar chamadas existentes e adicionar testes de regressão em `tests/unit/cidadeDormeUseCases.test.ts` cobrindo: 2ª investigação do Detetive, ação por morto, ação por papel errado, auto-ataque/parceiro do Assassino, auto-investigação do Detetive, autovoto e auto-proteção válida do Anjo

---

## Fase 3: Apresentação — ViewModel e Filtragem na View (`src/viewmodel/` e `src/view/`)
*Objetivo: Repassar `activePlayerId` e ocultar opções inválidas nas listas da interface.*

- [ ] **T006** Atualizar `src/viewmodel/useCidadeDormeViewModel.ts` para passar `activePlayerId` em `handleConfirmAssassinTarget`, `handleConfirmAngelProtection` e `handleConfirmDetectiveInvestigation`, expondo listas elegíveis filtradas
- [ ] **T007** Atualizar `src/view/components/cidadeDormeNightSection.tsx` para filtrar alvos do Assassino (sem si nem parceiros), filtrar alvos do Detetive (sem si) e ocultar a lista de suspeitos quando `detectiveVerdict` da rodada já existir (mantendo Anjo com todos os vivos)
- [ ] **T008** Atualizar `src/view/components/cidadeDormeDaySection.tsx` para omitir o próprio jogador da lista de suspeitos na votação secreta, preservando *"Abster-se / Pular Voto"*

---

## Fase 4: Testes de Apresentação, Verificação e Pull Request
*Objetivo: Garantir 0 violações no Harness e cobertura completa da interface.*

- [ ] **T009** Atualizar `tests/hooks/useCidadeDormeViewModel.test.ts` e `tests/mocks/cidadeDormeScreen.mock.test.tsx` validando listas filtradas e bloqueio visual pós-veredito
- [ ] **T010** Executar `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest`) e confirmar **0 violações**
- [ ] **T011** Realizar commits convencionais e abrir Pull Request seguindo a receita `/commit-e-pr` vinculando `Closes #42`
