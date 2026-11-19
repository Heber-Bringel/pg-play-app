# ✅ Lista de Tarefas (`tasks.md`): Sorteio Aleatório de Papéis (Fisher-Yates) no Cidade Dorme

- **Input:** `specs/014-fix-cidade-dorme-sorteio-papeis/spec.md` e `specs/014-fix-cidade-dorme-sorteio-papeis/plan.md`
- **Ordem de Execução Obrigatória:** De dentro para fora (`usecase` → `tests` → verificação `npm run check` e PR)
- **Receitas do Harness:** `/nova-funcionalidade`, `/revisar-arquitetura`, `/commit-e-pr`

---

## Fase 1: Regra de Negócio (`src/usecase/`)
*Objetivo: Substituir o deslocamento determinístico pelo algoritmo Fisher-Yates com aleatoriedade injetável.*

- [x] **T001** Implementar função pura `shuffleRoles(roles: CidadeDormeRole[], random: () => number)` com o algoritmo Fisher-Yates em `src/usecase/cidadeDormeUseCases.ts`
- [x] **T002** Adicionar parâmetro opcional `private readonly random: () => number = Math.random` ao construtor de `CidadeDormeUseCases` mantendo compatibilidade com `src/di/container.ts`
- [x] **T003** Atualizar `buildRolePool` e `startMatch` / `restartMatch` em `src/usecase/cidadeDormeUseCases.ts` para usar `shuffleRoles` (preservando `preferredRoles` quando explicitamente informado)

---

## Fase 2: Testes de Regressão (`tests/unit/`)
*Objetivo: Proteger aleatoriedade, quantidades exatas e revanche de forma determinística.*

- [x] **T004** Adicionar testes em `tests/unit/cidadeDormeUseCases.test.ts` validando que o sorteio muda com fontes `random` injetadas (anfitrião não é sempre Detetive), respeita quantidades exatas para 5–16 jogadores e 1–3 assassinos, trata extremos (`0` e `0.999999`) e re-sorteia em `restartMatch`

---

## Fase 3: Verificação Arquitetural e Pull Request
*Objetivo: Garantir 0 violações antes de enviar o PR.*

- [x] **T005** Executar `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest`) e confirmar **0 violações**
- [ ] **T006** Realizar commits convencionais e abrir Pull Request seguindo a receita `/commit-e-pr` vinculando `Closes #39`
