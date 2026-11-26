# 🏗️ Plano de Implementação Técnica (`plan.md`): ds-som-contagem-regressiva

- **Branch:** `feat/028-ds-som-contagem-regressiva`
- **Data:** 2026-11-25
- **Especificação de Origem:** `specs/028-ds-som-contagem-regressiva/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`
- **Issue:** `#92`

---

## 1. Resumo Técnico

Esta entrega evolui o serviço de som e o caso de uso transversal `GameFeedbackUseCases` para cumprir integralmente a **Issue #92** (`[DS/IHC] Adicionar som ritmado de contagem regressiva ao cronômetro nos últimos 10 segundos`):

1. **Contrato de Domínio (`src/model/services/iSoundService.ts`)**:
   - Adiciona o método `playTimerTick(): Promise<void>` para o pulso ritmado segundo a segundo nos últimos 10 segundos (`10s` → `1s`), mantendo `playTimerCritical(): Promise<void>` para retrocompatibilidade do contrato.
2. **Ativo Sonoro CC0 (`assets/sons/tick-10s.wav` e `assets/sons/CREDITOS.md`)**:
   - Síntese PCM 16-bit mono (`22.050 Hz`) de um pulso ritmado de contagem regressiva estilo tique-taque percussivo + harmônico curto (`120 ms` / `< 200 ms`, `~5,3 KB` / `< 20 KB`), livre de direitos (**CC0 1.0**), evitando qualquer sobreposição entre segundos consecutivos;
   - Inclui também na `develop` os arquivos refinados de `passe.wav` (*whoosh/swoosh*) e `tempo-esgotado.wav` (apito trinado *"piriiririm"*).
3. **Infraestrutura (`src/infra/services/expoAudioSoundService.ts` e `memorySoundService.ts`)**:
   - `ExpoAudioSoundService` mapeia e pré-carrega a chave `timerTick` (`assets/sons/tick-10s.wav`), reposicionando com `seekTo(0)` a cada segundo para resposta instantânea sem latência;
   - `MemorySoundService` contabiliza `timerTick` (e sincroniza `timerCritical`) em `getSoundCounts()`.
4. **Caso de Uso (`src/usecase/gameFeedbackUseCases.ts`)**:
   - Em `notifyTimerTick(previousSeconds, currentSeconds, options)`, quando `currentSeconds > 0 && currentSeconds <= TIMER_CRITICAL_SECONDS` e o som está ligado, chama `await this.soundService.playTimerTick()`.

---

## 2. Verificação Constitucional (*Constitution Check*)

- [x] **Artigo I (SDD)**: `spec.md`, `plan.md` e `tasks.md` criados em `specs/028-ds-som-contagem-regressiva/` antes de qualquer alteração em `src/`.
- [x] **Artigo II (MVVM 7 Pastas)**: código restrito a `src/model/`, `src/infra/` e `src/usecase/` (e testes em `tests/`).
- [x] **Artigo II (Rotas Finas e View Burra)**: nenhuma View ou ViewModel precisa conhecer `expo-audio`; toda a orquestração ocorre via `GameFeedbackUseCases` e `ISoundService`.
- [x] **Artigo II (Vocabulário)**: uso estrito de `Service` (`ISoundService`, `ExpoAudioSoundService`, `MemorySoundService`) e `DataSource` (`ISoundPreferenceDataSource`).
- [x] **Artigo II (Isolamento de Infra)**: apenas `src/di/container.ts` e `tests/` importam `@/infra/*`.
- [x] **Artigo III (Design System)**: documentação sincronizada em `design-system/04-componentes/cronometro-expressivo.md`, mantendo a harmonia multimodal (cor + forma + ícone + vibração + som ritmado).
- [x] **Artigo IV (Tipagem Estrita e `npm run check`)**: zero `any`, imports com `@/` e validação completa via `npm run check`.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

```text
assets/
└─ sons/
   ├─ tick-10s.wav                                     # NOVO — Som ritmado curto de contagem regressiva (< 200ms, < 20 KB, CC0)
   ├─ passe.wav                                        # ATUALIZADO — Refinamento whoosh aerodinâmico CC0
   ├─ tempo-esgotado.wav                               # ATUALIZADO — Refinamento apito de árbitro CC0
   └─ CREDITOS.md                                      # ATUALIZADO — Documentação acústica e licença CC0 do tick-10s.wav
design-system/
└─ 04-componentes/
   └─ cronometro-expressivo.md                         # ATUALIZADO — Referência ao som ritmado playTimerTick (tick-10s.wav)
src/
├─ model/
│  └─ services/
│     └─ iSoundService.ts                              # ATUALIZADO — + playTimerTick(): Promise<void>
├─ infra/
│  └─ services/
│     ├─ memorySoundService.ts                         # ATUALIZADO — + playTimerTick() e contador timerTick
│     └─ expoAudioSoundService.ts                      # ATUALIZADO — + fonte timerTick (tick-10s.wav) e playTimerTick()
└─ usecase/
   └─ gameFeedbackUseCases.ts                          # ATUALIZADO — notifyTimerTick aciona playTimerTick() nos últimos 10s
tests/
├─ unit/
│  ├─ gameFeedbackUseCases.test.ts                     # ATUALIZADO — Valida 10 chamadas a playTimerTick (10s -> 1s) e 1 a playTimerExpired (0s)
│  └─ expoAudioSoundService.test.ts                    # ATUALIZADO — Valida preload e execução de playTimerTick()
└─ hooks/
   └─ gameFeedback.viewmodels.test.ts                  # ATUALIZADO — Valida contagem regressiva sonora nas ViewModels com cronômetro
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Componente / Especificação | Relação com a Feature |
| :--- | :--- |
| `ExpressiveTimer` (`design-system/04-componentes/cronometro-expressivo.md`) | O som ritmado `playTimerTick` (`< 200 ms`) acompanha a variante **Crítico (`≤ 10s`)** em sincronia com o *shape morphing* (`timer.radius.normal` → `timer.radius.critical`), a pulsação elástica (`motion.spring.spatial`) e o pulso háptico (`triggerTimerPulse`). |

---

## 5. Estratégia de Testes (`tests/`)

- **`tests/unit/gameFeedbackUseCases.test.ts`**:
  - Verifica que, de `15s` até `0s`, `playTimerTick` é chamado exatamente **10 vezes** (`10s` até `1s`), `playTimerExpired` é chamado **1 vez** (`0s`), e nenhum som é emitido acima de `10s` ou quando o som está desligado (`enabled: false`).
  - Verifica que com `reduceMotion: true` e som ligado, a vibração de pulso é suprimida (`pulses: 0`), mas os **10 ticks sonoros** (`timerTick: 10`) continuam tocando normalmente.
- **`tests/unit/expoAudioSoundService.test.ts`**:
  - Verifica o pré-carregamento e a reprodução de `playTimerTick()` com `seekTo(0)` e degradação silenciosa em caso de erro.
- **`tests/hooks/gameFeedback.viewmodels.test.ts`**:
  - Verifica a integração das ViewModels com o cronômetro nos últimos 10 segundos acionando `timerTick: 10` e `timerExpired: 1`.
