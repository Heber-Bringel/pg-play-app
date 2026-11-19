# ✅ Lista de Tarefas (`tasks.md`): Narrador por Áudio do Cidade Dorme com expo-speech

- **Input:** `specs/012-uc07-narrador-expo-speech/spec.md` e `specs/012-uc07-narrador-expo-speech/plan.md`
- **Ordem de Execução Obrigatória:** De dentro para fora (`model` → `infra` → `usecase` → `di` → `tests` → `viewmodel` → `view` → `app`)
- **Receitas do Harness:** `/nova-funcionalidade`, `/nova-tela`, `/revisar-arquitetura`, `/commit-e-pr`

---

## Fase 1: Domínio Puro (`src/model/`)
*Objetivo: Atualizar o contrato de serviço de áudio sem dependências externas.*

- [ ] **T001** Definir `NarratorSpeakOptions` (`{ force?: boolean }`) e adicionar `setMuted(muted: boolean): void` e `isMuted(): boolean` em `src/model/services/iNarratorAudioService.ts`

---

## Fase 2: Infraestrutura (`src/infra/`)
*Objetivo: Implementar silenciamento e repetição forçada em memória e no `expo-speech`.*

- [ ] **T002** Atualizar `MemoryNarratorAudioService` em `src/infra/services/memoryNarratorAudioService.ts` para suportar `muted` e `{ force?: boolean }`
- [ ] **T003** Atualizar `ExpoSpeechNarratorAudioService` em `src/infra/services/expoSpeechNarratorAudioService.ts` para interromper fala ativa ao silenciar (`Speech.stop()`), ignorar `speak` automático quando `muted` e permitir repetição imediata quando `options?.force === true`

---

## Fase 3: Caso de Uso e DI (`src/usecase/` e `src/di/`)
*Objetivo: Expor operações de controle do Narrador na camada de negócio.*

- [ ] **T004** Atualizar `ICidadeDormeUseCases` em `src/usecase/iCidadeDormeUseCases.ts` com `isNarratorMuted()`, `setNarratorMuted(muted)` e `repeatNarratorCaption(caption, voice)`
- [ ] **T005** Implementar `isNarratorMuted`, `setNarratorMuted` e `repeatNarratorCaption` em `src/usecase/cidadeDormeUseCases.ts` mantendo isolamento de áudio apenas no Anfitrião (`speakIfHost`)
- [ ] **T006** Revisar `src/di/container.ts` garantindo compatibilidade integral da instância `cidadeDormeUseCases`

---

## Fase 4: Testes Unitários de Serviço e UseCase (`tests/unit/`)
*Objetivo: Validar silenciamento e repetição forçada antes da camada de apresentação.*

- [ ] **T007** Ampliar `tests/unit/expoSpeechNarratorAudioService.test.ts` testando `setMuted`, bloqueio de fala quando silenciado e repetição com `{ force: true }` dentro de `1500 ms`
- [ ] **T008** Ampliar `tests/unit/cidadeDormeUseCases.test.ts` cobrindo `setNarratorMuted`, `isNarratorMuted` e `repeatNarratorCaption`

---

## Fase 5: Apresentação — ViewModel e View (`src/viewmodel/` e `src/view/`)
*Objetivo: Expor estado/ações de áudio e renderizar controles acessíveis somente ao Anfitrião sem duplicação de código.*

- [ ] **T009** Atualizar `CidadeDormeState` e `CidadeDormeActions` em `src/viewmodel/useCidadeDormeViewModel.ts` com `isNarratorMuted`, `handleToggleNarratorMute` e `handleRepeatNarratorCaption` (resetando ou mantendo limpeza segura ao sair da sala)
- [ ] **T010** Extrair/criar componente reutilizável `NarratorBanner` (`src/view/components/narratorBanner.tsx`) suportando modos `light` (`tokens`) e `dark` (`darkTokens`), mantendo legenda visível para todos e controles `>= 48 dp` (Silenciar/Ativar e Repetir) apenas quando `isCurrentPlayerHost === true`
- [ ] **T011** Integrar `NarratorBanner` em `cidadeDormeRoleSection.tsx`, `cidadeDormeNightSection.tsx`, `cidadeDormeDaySection.tsx` e `src/view/cidade-dorme.tsx`

---

## Fase 6: Testes de Apresentação, Verificação Arquitetural e Pull Request
*Objetivo: Cobrir ViewModel e View nos testes e validar `npm run check`.*

- [ ] **T012** Atualizar `tests/hooks/useCidadeDormeViewModel.test.ts` e `tests/mocks/cidadeDormeScreen.mock.test.tsx` validando controles exclusivos do Anfitrião, ausência para convidados e permanência das legendas quando silenciado
- [ ] **T013** Executar `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest`) e confirmar **0 violações**
- [ ] **T014** Realizar commits convencionais e abrir Pull Request seguindo a receita `/commit-e-pr` vinculando `Closes #32`
