# ✅ Lista de Tarefas (`tasks.md`): ds-som-contagem-regressiva

- **Input:** `specs/028-ds-som-contagem-regressiva/spec.md` e `specs/028-ds-som-contagem-regressiva/plan.md`
- **Issue:** `#92`
- **Ordem de Execução Obrigatória:** De dentro para fora (`assets/docs` → `model` → `infra` → `usecase` → `tests`)

---

## Fase 0: Ativo Sonoro CC0 (`< 200ms`, `< 20 KB`) e Design System

- [x] **T001** Gerar o efeito sonoro ritmado curto de contagem regressiva `assets/sons/tick-10s.wav` (`< 200 ms`, `< 20 KB`, licença CC0 1.0), incluir o refinamento de `passe.wav` e `tempo-esgotado.wav` e atualizar `assets/sons/CREDITOS.md`.
- [x] **T002** Atualizar `design-system/04-componentes/cronometro-expressivo.md` documentando o som ritmado `playTimerTick` (`tick-10s.wav`) nos últimos 10 segundos (`10s` → `1s`).

---

## Fase 1: Domínio Puro (`src/model/`)

- [x] **T003** Adicionar o método `playTimerTick(): Promise<void>` ao contrato `src/model/services/iSoundService.ts` (mantendo `playTimerCritical()` por compatibilidade).

---

## Fase 2: Infraestrutura (`src/infra/`)

- [x] **T004** Atualizar `src/infra/services/memorySoundService.ts` implementando `playTimerTick()` e expondo `timerTick` em `SoundFeedbackCounts`.
- [x] **T005** Atualizar `src/infra/services/expoAudioSoundService.ts` registrando e pré-carregando `timerTick` (`assets/sons/tick-10s.wav`) e implementando `playTimerTick()`.

---

## Fase 3: Caso de Uso (`src/usecase/`)

- [x] **T006** Atualizar `src/usecase/gameFeedbackUseCases.ts` para acionar `this.soundService.playTimerTick()` a cada segundo restante na faixa crítica (`1 <= currentSeconds <= 10`) quando o som estiver ligado.

---

## Fase 4: Testes Unitários e de Hooks (`tests/`)

- [x] **T007** Atualizar `tests/unit/gameFeedbackUseCases.test.ts`, `tests/unit/expoAudioSoundService.test.ts` e `tests/hooks/gameFeedback.viewmodels.test.ts` validando os 10 pulsos sonoros (`timerTick: 10`) nos últimos 10 segundos, o apito em `0s` (`timerExpired: 1`), o respeito à opção de som desligado (`enabled: false`) e a independência em relação a `reduceMotion`.

---

## Fase 5: Verificação Final e Pull Request

- [x] **T008** Executar `npm run check` garantindo **0 violações** de arquitetura, Design System, TypeScript e 100% dos testes passando, criar a branch `feat/028-ds-som-contagem-regressiva`, realizar os commits convencionais e abrir o Pull Request vinculado à Issue `#92` (`Closes #92`).
