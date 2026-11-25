# 📋 Especificação de Funcionalidade (`spec.md`): ds-feedback-haptico-cronometro

- **Branch da Feature:** `feat/026-ds-feedback-haptico-cronometro`
- **Criado em:** 2026-11-24
- **Status:** Em Revisão
- **Caso(s) de Uso / Requisito(s):** `UC03` (Mímica), `UC04` (Quiz), `UC09` (Quem Sou Eu), `UC10` (Complete o Versículo) — `RNF06` (independência de cor: cor + forma + ícone + **tato**) e `RNF09` (redução de movimento) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md` e `design-system/04-componentes/cronometro-expressivo.md`
- **Issue vinculada:** `#77`

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Sentir a urgência do tempo sem olhar a tela (Prioridade: P1)

O **Jogador da Vez** (ou o grupo que segura o celular) sente o celular vibrar a cada segundo nos últimos 10 segundos do turno e uma vibração forte quando o tempo acaba, nos jogos de **1 celular** com contagem regressiva: **Mímica Expressiva**, **Quiz Relâmpago**, **Quem Sou Eu?** e **Complete o Versículo**.

**Por que esta prioridade:** nesses jogos o celular muitas vezes não está à vista: fica na testa (Quem Sou Eu), com o representante fazendo mímica, ou na mão de quem responde. Hoje o alerta dos 10 segundos é só visual.

**Como testar independentemente:** em um celular real, iniciar um turno e esperar os 10 segundos finais; conferir 10 pulsos leves (10s → 1s) e uma vibração forte em `0s`. Nos testes automatizados, o `MemoryHapticService` registra cada chamada.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** um turno em andamento, **Quando** o cronômetro desce de `11s` para `10s` e segue até `1s`, **Então** o celular emite **um pulso leve por segundo** (10 pulsos), junto com a pulsação visual já existente.
2. **Dado** o cronômetro em `1s`, **Quando** chega a `0s`, **Então** o celular emite **uma vibração forte** de tempo esgotado.
3. **Dado** que o cronômetro está acima de `10s`, **Quando** desce um segundo, **Então** nada vibra.
4. **Dado** que o turno terminou e o cronômetro volta ao tempo inicial para a próxima equipe, **Quando** o valor sobe (ex.: `0s` → `60s`), **Então** nada vibra.

---

### História de Usuário 2 — Respeitar o "Reduzir movimento" do sistema (Prioridade: P1)

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o celular está com **"Reduzir movimento"** ligado, **Quando** o cronômetro passa pelos últimos 10 segundos, **Então** **não** há pulsos táteis **nem** a pulsação elástica visual (a troca de cor, forma e ícone continua), conforme `cronometro-expressivo.md`.
2. **Dado** o "Reduzir movimento" ligado, **Quando** o tempo chega a `0s`, **Então** a **vibração forte de tempo esgotado continua**, porque é um aviso único de fim de turno e não um movimento repetitivo.
3. **Dado** que a pessoa muda a configuração com o jogo aberto, **Quando** o sistema avisa a mudança, **Então** o jogo passa a seguir o novo valor sem reiniciar.

---

### História de Usuário 3 — Sentir se acertou ou errou a resposta (Prioridade: P2, adendo de 2026-11-24)

O jogador sente no celular se a resposta foi **certa** (vibração curta de sucesso) ou **errada** (vibração de erro) no **Quiz Relâmpago**, no **Jogo da Forca** e no **Complete o Versículo**. Acerto e erro têm padrões diferentes, como o Quem Sou Eu já faz no acerto e no passe, para o erro não ser o único momento que vibra.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Quiz — Dado** uma pergunta em andamento, **Quando** a equipe toca na alternativa correta, **Então** vibra o padrão de **sucesso**; **Quando** toca na errada, **Então** vibra o padrão de **erro**.
2. **Quiz — Dado** que o tempo acaba sem resposta, **Quando** o cronômetro chega a `0s`, **Então** vibra **só** a vibração de tempo esgotado (sem a de erro em seguida).
3. **Forca — Dado** uma palavra em andamento, **Quando** a equipe chuta uma letra que não está na palavra, **Então** vibra um **toque curto**; **Quando** a letra está na palavra, **Então** nada vibra (para o teclado não vibrar a cada letra).
4. **Forca — Quando** a equipe completa a palavra, **Então** vibra **sucesso**; **Quando** perde a última tentativa, **Então** vibra **erro**.
5. **Versículo — Dado** um turno em andamento, **Quando** a equipe envia com todas as lacunas certas, **Então** vibra **sucesso**; **Quando** envia com alguma lacuna errada, **Então** vibra **erro**; **Quando** o tempo acaba, **Então** vibra só o tempo esgotado.
6. **Dado** o "Reduzir movimento" ligado, **Quando** há acerto ou erro, **Então** a vibração acontece normalmente (é um aviso único, não um movimento repetitivo).

---

### Casos de Borda (Edge Cases)

- **Sem motor háptico** (web, emulador, celular sem vibração): nenhuma exceção, travamento ou mensagem de erro; o jogo segue igual.
- **Re-renderização sem mudança de segundo** (ex.: abrir o modal "Sair", pausar ao responder): não repete a vibração. Só conta como *tick* uma queda de **exatamente 1 segundo**.
- **Fim do turno por ação do jogador** (ex.: acertar todas as cartas, "Próxima Pergunta") com o cronômetro ainda acima de `0s`: não dispara a vibração forte.
- **Quiz com `15s`**: os pulsos começam em `10s`, como nos demais.
- **Contagem inicial "3, 2, 1" do Quem Sou Eu** (`countdownSeconds`): fica fora, só o cronômetro do turno vibra.
- **Fora do escopo:** Termômetro de Pedidos (momento de oração, sem urgência; o timer dele não pulsa), Adedonha e Cidade Dorme (multiplayer: vários celulares vibrariam juntos e, na noite, poderia atrapalhar o sigilo).

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-01`**: Estender `IHapticService` com `triggerTimerPulse()` (impacto leve) e `triggerTimerExpired()` (notificação de erro, vibração forte), implementados em `ExpoHapticService` (com degradação silenciosa) e `MemoryHapticService` (registra as chamadas).
- **`RF-02`**: Criar `ITimerFeedbackUseCases` / `TimerFeedbackUseCases` (renomeado para `GameFeedbackUseCases` no adendo, RF-06) com `notifyTimerTick(previousSeconds, currentSeconds, options: { reduceMotion })`, que concentra a regra: só reage a uma queda de exatamente 1 segundo; `0` → vibração forte; `1` a `10` → pulso, exceto com `reduceMotion`.
- **`RF-03`**: As ViewModels de Mímica, Quiz, Quem Sou Eu e Complete o Versículo recebem `ITimerFeedbackUseCases` (2º parâmetro, com padrão do container), expõem `reduceMotion` no estado e `handleSetReduceMotion` nas ações, e avisam o UseCase a cada mudança do cronômetro do turno.
- **`RF-04`**: Um hook de View, `useReduceMotion` em `src/view/components/`, lê o "Reduzir movimento" do sistema (`AccessibilityInfo`) e acompanha mudanças; as 4 telas repassam o valor à ViewModel e ao `ExpressiveTimer` (`reduceMotion`).
- **`RF-05`**: Documentar o comportamento tátil em `design-system/04-componentes/cronometro-expressivo.md`.
- **`RF-06`** *(adendo)*: `IHapticService` ganha `triggerAnswerWrong()` (notificação de erro) e `triggerLetterWrong()` (impacto médio, toque curto); o acerto reutiliza `triggerHit()` (notificação de sucesso). O UseCase passa a se chamar `GameFeedbackUseCases` (`IGameFeedbackUseCases`), com `notifyTimerTick`, `notifyAnswer('correct' | 'wrong')` e `notifyLetterGuess(isInWord)`.
- **`RF-07`** *(adendo)*: As ViewModels do Quiz, da Forca e do Versículo avisam acerto/erro só em ações do jogador (alternativa, letra, envio), nunca no fim do tempo, que já tem a vibração própria.
- **`RF-08`** *(adendo)*: Documentar o feedback de acerto/erro em `design-system/04-componentes/alternativa-quiz.md` e `teclado-forca.md` (uma linha cada, apontando para a regra do cronômetro).

### Entidades de Domínio Envolvidas (`src/model/`)
- Nenhuma entidade nova. Contrato alterado: `src/model/services/iHapticService.ts`.

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (IHC / Acessibilidade)**: o alerta dos 10 segundos passa a combinar **cor + forma + ícone + tato** (`RNF06`), e o "Reduzir movimento" desliga a pulsação visual e tátil repetitiva (`RNF09`), mantendo o aviso único de fim de turno.
- **`CS-02` (Arquitetura MVVM)**: `npm run check` (arquitetura + Design System + `tsc` + `jest`) com **0 violações**. A View não chama serviços: a vibração sai da ViewModel pelo UseCase.
- **`CS-03` (Testabilidade)**: a regra de quando vibrar (cronômetro, resposta e letra) é testada no UseCase com `MemoryHapticService`, sem hardware.
