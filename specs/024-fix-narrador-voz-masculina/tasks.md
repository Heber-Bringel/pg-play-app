# ✅ Lista de Tarefas (`tasks.md`): Correção da Seleção de Voz Masculina do Narrador

- **Input:** `specs/024-fix-narrador-voz-masculina/spec.md` e `specs/024-fix-narrador-voz-masculina/plan.md`
- **Ordem de Execução Obrigatória:** De dentro para fora (`infra` → `tests` → `npm run check`)
- **Receitas do Harness:** `/revisar-arquitetura`, `/commit-e-pr`

---

## Fase 1: Infraestrutura (`src/infra/`)
*Objetivo: Corrigir a identificação da voz masculina e o fallback de pitch/rate em `ExpoSpeechNarratorAudioService`.*

- [x] **T001** Atualizar `src/infra/services/expoSpeechNarratorAudioService.ts` com normalização NFD/locale (`pt_BR`), regex com fronteira de palavra para `'male'`/`'female'`, listas atualizadas de `MALE_VOICE_HINTS` e `FEMALE_VOICE_HINTS` (movendo `'pt-br-x-pte'` para feminino), cache somente para listas não vazias, resolução via `resolveVoiceSelection` (priorizando `pt-BR`, depois `allPtVoices`, depois exclusão de gênero oposto) e fallback grave (`pitch: 0.65`, `rate: 0.94`) quando `!hasExplicitGenderMatch` no perfil `'masculina'`.

---

## Fase 2: Testes Unitários (`tests/unit/`)
*Objetivo: Cobrir todos os cenários de regressão identificados.*

- [x] **T002** Ampliar `tests/unit/expoSpeechNarratorAudioService.test.ts` testando: ordenação com voz feminina antes de masculina (`pt-br-female-luciana` vs `pt-br-male-daniel`), vozes Android `pt_BR` (`afs`, `pte`, `ptd`, `htm`), vozes Microsoft/Web (`Francisca` vs `Antonio`), fallback de voz única genérica/feminina (`pitch: 0.65`, `rate: 0.94`) e reconsulta quando `getAvailableVoicesAsync` retorna `[]` inicialmente.

---

## Fase 3: Verificação Obrigatória
*Objetivo: Garantir conformidade arquitetural, de tipos e testes.*

- [x] **T003** Executar `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest --passWithNoTests`) e confirmar **0 violações** e todos os testes passando.
