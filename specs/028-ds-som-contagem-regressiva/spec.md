# 📋 Especificação de Funcionalidade (`spec.md`): ds-som-contagem-regressiva

- **Branch da Feature:** `feat/028-ds-som-contagem-regressiva`
- **Criado em:** 2026-11-25
- **Status:** Em Revisão
- **Caso(s) de Uso / Requisito(s):** `UC03` (Mímica), `UC04` (Quiz), `UC09` (Quem Sou Eu), `UC10` (Complete o Versículo) — `RF10` (cronômetro com modo crítico `<= 10s`), `RNF06` (independência de cor: cor + forma + ícone + tato + **som**) e `RNF08` (acessibilidade assistiva) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md` e `design-system/04-componentes/cronometro-expressivo.md`
- **Issue vinculada:** `#92`

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Ouvir o pulso sonoro ritmado nos últimos 10 segundos do cronômetro (Prioridade: P1)

Os **Participantes do Pequeno Grupo** ouvem um **som ritmado curto de contagem regressiva** (`< 200 ms`, estilo tique-taque/pulso de cronômetro) **a cada segundo restante nos últimos 10 segundos (`10s` até `1s`)** das partidas com limite de tempo (**Mímica Expressiva**, **Quiz Relâmpago**, **Quem Sou Eu?** e **Complete o Versículo**), em perfeita sincronia com a pulsação visual elástica do `ExpressiveTimer` e a vibração tátil do aparelho.

**Por que esta prioridade:** em encontros presenciais animados, a contagem regressiva sonora segundo a segundo nos 10s finais intensifica a percepção coletiva de urgência sem precisar olhar para a tela e sem poluir a conversa dos participantes.

**Como testar independentemente:** iniciar um turno de Mímica, Quiz, Quem Sou Eu ou Complete o Versículo com o som ligado, aguardar a faixa crítica (`10s` → `1s`) e verificar que `playTimerTick` é acionado a cada segundo restante e `playTimerExpired` ao atingir `00:00`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** um turno em andamento com o som ligado (`SoundPreference.enabled = true`), **Quando** o cronômetro entra e percorre os últimos 10 segundos (`10s` até `1s`, descendo 1 segundo por vez), **Então** o sistema dispara `playTimerTick()` a cada segundo (totalizando 10 ticks ritmados de `< 200 ms`), sincronizado com o pulso tátil (`triggerTimerPulse`).
2. **Dado** um turno em andamento com o som ligado, **Quando** o cronômetro está acima de `10s` (ex.: `15s` → `11s`), **Então** nenhum som de contagem regressiva é emitido.
3. **Dado** o cronômetro em `1s` com o som ligado, **Quando** o tempo chega a `0s` (`00:00`), **Então** o sistema dispara o apito enfático de tempo esgotado (`playTimerExpired()`) e **não** dispara o tick de contagem regressiva.

---

### História de Usuário 2 — Respeitar a preferência de som ligado/desligado e a opção "Reduzir movimento" (Prioridade: P1)

O **Líder ou Participante do PG** que desligou o som do jogo no cabeçalho não ouve nenhum tick da contagem regressiva nem o apito final; já quem ativou apenas "Reduzir movimento" no sistema operacional continua ouvindo a contagem regressiva sonora quando o som está ligado, mesmo sem a pulsação tátil.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o usuário desligou o som pelo botão do cabeçalho (`enabled: false`), **Quando** o cronômetro percorre os últimos 10 segundos (`10s` → `0s`), **Então** nenhum efeito sonoro (`playTimerTick` ou `playTimerExpired`) é emitido, mantendo apenas o feedback háptico.
2. **Dado** que "Reduzir movimento" (`reduceMotion: true`) está ativo e o som está ligado (`enabled: true`), **Quando** o cronômetro percorre `10s` → `1s`, **Então** os pulsos táteis são suprimidos, mas o som ritmado (`playTimerTick`) continua sendo emitido a cada segundo.

---

### Casos de Borda (Edge Cases)

- **Saltos ou reinício de cronômetro (`0 → 60`, `12 → 8`, `5 → 5`, `3 → 0`):** `notifyTimerTick` só aciona `playTimerTick` quando `currentSeconds === previousSeconds - 1`, evitando sons espúrios ao pausar, reiniciar turno ou encerrar a rodada antecipadamente.
- **Sem atraso ou sobreposição entre ticks de 1 segundo:** o arquivo `tick-10s.wav` possui duração curta (`< 200 ms` e `< 20 KB`), e o `ExpoAudioSoundService` pré-carrega o player e reposiciona o cursor (`seekTo(0)`) antes de cada `play()`.
- **Degradação silenciosa:** falhas no hardware/API de áudio são capturadas em `try/catch` sem interromper o cronômetro da partida.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-01`**: Adicionar o método `playTimerTick(): Promise<void>` ao contrato `ISoundService` (`src/model/services/iSoundService.ts`) para representar o pulso sonoro ritmado de cada segundo na faixa crítica (`10s` → `1s`), mantendo `playTimerCritical()` como alias compatível.
- **`RF-02`**: Criar o efeito sonoro curto e ritmado `assets/sons/tick-10s.wav` (duração `< 200 ms`, tamanho `< 20 KB`, licença **CC0 1.0** documentada em `assets/sons/CREDITOS.md`, junto com o refinamento acústico de `passe.wav` e `tempo-esgotado.wav`).
- **`RF-03`**: Implementar `playTimerTick()` em `ExpoAudioSoundService` (`src/infra/services/expoAudioSoundService.ts`) com pré-carregamento imediato e reposicionamento `seekTo(0)` sem latência, e em `MemorySoundService` (`src/infra/services/memorySoundService.ts`) contabilizando `timerTick` (e mantendo compatibilidade com `timerCritical`).
- **`RF-04`**: Atualizar `GameFeedbackUseCases.notifyTimerTick` (`src/usecase/gameFeedbackUseCases.ts`) para invocar `this.soundService.playTimerTick()` a cada segundo restante nos últimos 10 segundos (`currentSeconds > 0 && currentSeconds <= 10`) quando o som estiver habilitado, e `playTimerExpired()` ao atingir `0`.
- **`RF-05`**: Atualizar a documentação do componente `ExpressiveTimer` em `design-system/04-componentes/cronometro-expressivo.md` referenciando `playTimerTick` e `tick-10s.wav`.

### Entidades e Contratos de Domínio Envolvidos (`src/model/`)
- `ISoundService` (`src/model/services/iSoundService.ts`)

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (IHC / Percepção de Tempo)**: Durante os últimos 10 segundos (`10s` → `1s`) de qualquer jogo com cronômetro, toca um som ritmado curto (`< 200 ms`) a cada segundo restante, e em `0s` dispara o apito de tempo esgotado.
- **`CS-02` (Controle do Usuário)**: Com a opção de som desligada no cabeçalho (`enabled: false`), nenhum som é emitido.
- **`CS-03` (Arquitetura MVVM & Qualidade)**: `npm run check` (`check-arquitetura`, `check-design-system`, `tsc --noEmit` e `jest`) aprovado com **0 violações** e todos os testes unitários e de hooks passando.
