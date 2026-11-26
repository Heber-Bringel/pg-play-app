# 📋 Especificação de Funcionalidade (`spec.md`): ds-sons-de-jogo

- **Branch da Feature:** `feat/027-ds-sons-de-jogo`
- **Criado em:** 2026-11-25
- **Status:** Em Revisão
- **Caso(s) de Uso / Requisito(s):** `UC03` (Mímica), `UC04` (Quiz), `UC05` (Forca), `UC09` (Quem Sou Eu), `UC10` (Complete o Versículo) — `RF10` (cronômetro com modo crítico), `RF14`, `RF15`, `RF33` (acerto/erro/passe), `RNF06` (independência de cor: cor + forma + ícone + tato + **som**) e `RNF08` (acessibilidade assistiva) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md` e `design-system/04-componentes/cronometro-expressivo.md`
- **Issue vinculada:** `#84`

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Ouvir o acerto, erro e passe nos jogos de 1 celular (Prioridade: P1)

Os **Participantes do Pequeno Grupo** ouvem efeitos sonoros curtos e distintos de **acerto**, **erro**, **letra errada** e **passe/pular** durante as partidas presenciais de **1 celular** (**Quiz Relâmpago**, **Jogo da Forca**, **Complete o Versículo**, **Mímica Expressiva** e **Quem Sou Eu?**), somados à vibração háptica existente (`spec 026`), para que o grupo inteiro perceba imediatamente o que aconteceu mesmo quando não está olhando para a tela.

**Por que esta prioridade:** em um encontro animado e barulhento de Pequeno Grupo, apenas uma pessoa segura o celular. O feedback sonoro coletivo reforça a percepção do grupo inteiro sobre acertos, erros e pulos.

**Como testar independentemente:** jogar uma rodada de Quiz, Forca, Versículo, Mímica e Quem Sou Eu com o som ligado e confirmar cada efeito sonoro correspondente. Nos testes automatizados, o `MemorySoundService` registra cada chamada.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Quiz e Versículo — Dado** que o som de jogo está ligado, **Quando** a equipe responde corretamente, **Então** toca o som curto de **acerto** (`playCorrect`) junto com a vibração de sucesso; **Quando** responde incorretamente, **Então** toca o som curto de **erro** (`playWrong`) junto com a vibração de erro.
2. **Forca — Dado** que o som de jogo está ligado, **Quando** a equipe escolhe uma letra ausente na palavra (sem perder a última tentativa), **Então** toca o clique discreto de **letra errada** (`playLetterWrong`); **Quando** escolhe uma letra presente sem completar a palavra, **Então** nenhum som toca; **Quando** completa a palavra, **Então** toca o som de **acerto** (`playCorrect`); **Quando** perde a última tentativa, **Então** toca apenas o som de **erro** (`playWrong`).
3. **Mímica e Quem Sou Eu — Dado** que o som de jogo está ligado, **Quando** o jogador registra um acerto, **Então** toca o som de **acerto** (`playCorrect`); **Quando** pula/passa a carta (`notifyPass`), **Então** toca o som curto de **passe** (`playPass`).

---

### História de Usuário 2 — Ouvir a sequência de bipes nos 10 segundos finais e o fim do tempo (Prioridade: P1)

Os **Participantes do Pequeno Grupo** ouvem **um bipe curto a cada segundo** nos 10 segundos finais da contagem regressiva (`10s` até `1s`) e um **som de tempo esgotado** quando chega a `0s` nos jogos com contagem regressiva (**Mímica**, **Quiz**, **Quem Sou Eu** e **Complete o Versículo**).

**Por que esta prioridade:** avisar sonoramente o grupo da contagem regressiva final a cada segundo e do encerramento do turno.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** um turno em andamento com o som ligado, **Quando** o cronômetro cai de `11s` para `10s` e segue de segundo em segundo até `1s`, **Então** toca **um bipe por segundo** (`playTimerCritical`, 10 bipes no total), junto com o pulso tátil.
2. **Dado** que o cronômetro está acima de `10s`, **Quando** desce um segundo, **Então** nenhum bipe toca.
3. **Dado** o cronômetro em `1s`, **Quando** chega a `0s`, **Então** toca o som de **tempo esgotado** (`playTimerExpired`) junto com a vibração forte, sem tocar o som de resposta errada em seguida.

---

### História de Usuário 3 — Ligar e desligar os sons do jogo com preferência persistida (Prioridade: P1)

O **Líder ou Participante do PG** pode ligar ou desligar todos os sons de jogo a qualquer momento pelo botão de som no cabeçalho global (`src/app/_layout.tsx` / Hub), e a escolha fica salva no aparelho entre sessões.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** o primeiro acesso ao aplicativo (sem preferência salva), **Quando** o app inicia, **Então** o som começa **ligado por padrão** (`enabled: true`) com ícone `volume-high`.
2. **Dado** que o usuário toca no botão de som, **Quando** o som é desligado (`enabled: false`), **Então** o ícone muda para `volume-off`, a escolha é salva no armazenamento local e **nenhum som de jogo é reproduzido** (mantendo a vibração háptica normal).
3. **Dado** que o usuário fecha e reabre o aplicativo, **Quando** a preferência salva é carregada, **Então** o estado de som ligado/desligado anterior é restaurado.

---

### Casos de Borda (Edge Cases)

- **Aparelho ou navegador sem suporte a áudio / falha no player:** `ExpoAudioSoundService` captura qualquer erro silenciosamente (`try/catch`) sem travar ou interromper a partida.
- **Modo silencioso do iOS:** a configuração de áudio respeita a chave física de silencioso do iPhone (`playsInSilentMode: false`).
- **JSON inválido ou corrompido no `AsyncStorage`:** `AsyncStorageSoundPreferenceDataSource` faz fallback seguro para `{ enabled: true }`.
- **Fora do escopo:** **Termômetro de Pedidos** (momento reflexivo de oração, sem som), **Cidade Dorme** (sigilo noturno e narrador próprio por voz) e **Adedonha Bíblica** (jogo multiplayer em vários celulares simultâneos).

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-01`**: Criar o contrato `ISoundService` em `src/model/services/iSoundService.ts` com os métodos `playCorrect()`, `playWrong()`, `playLetterWrong()`, `playPass()`, `playTimerCritical()` e `playTimerExpired()`.
- **`RF-02`**: Criar a entidade `SoundPreference` (`export type SoundPreference = { enabled: boolean };`) em `src/model/entities/soundPreference.ts` e o contrato `ISoundPreferenceDataSource` em `src/model/datasources/iSoundPreferenceDataSource.ts`.
- **`RF-03`**: Implementar `ExpoAudioSoundService` (`src/infra/services/expoAudioSoundService.ts`) com `expo-audio`, pré-carregamento dos 6 arquivos de áudio CC0 (`assets/sons/`, `< 1 s` e `< 50 KB` cada, documentados em `assets/sons/CREDITOS.md`), respeito ao modo silencioso do iOS e degradação silenciosa, além de `MemorySoundService` (`src/infra/services/memorySoundService.ts`) para testes.
- **`RF-04`**: Implementar `AsyncStorageSoundPreferenceDataSource` e `MemorySoundPreferenceDataSource` em `src/infra/datasources/` com padrão `{ enabled: true }` e fallback seguro para valores inválidos.
- **`RF-05`**: Criar `ISoundPreferenceUseCases` e `SoundPreferenceUseCases` em `src/usecase/` (`getSoundPreference`, `setSoundEnabled`, `toggleSoundEnabled`).
- **`RF-06`**: Estender `IGameFeedbackUseCases` / `GameFeedbackUseCases` com `notifyPass()` e integrar `ISoundService` e `ISoundPreferenceDataSource` (ou estado sincronizado de preferência): tocar os sons correspondentes em `notifyAnswer`, `notifyLetterGuess`, `notifyPass` e `notifyTimerTick` (alerta crítico apenas na transição `11 → 10` e tempo esgotado em `1 → 0`) somente quando o som estiver habilitado.
- **`RF-07`**: Integrar `useMimicaViewModel` (`handleHit` → `notifyAnswer('correct')`, `handleSkip` → `notifyPass()`) e `useQuemSouEuViewModel` (`registerOutcome` → `notifyAnswer('correct')` / `notifyPass()`) ao `GameFeedbackUseCases`.
- **`RF-08`**: Criar `useSoundPreferenceViewModel` (`src/viewmodel/useSoundPreferenceViewModel.ts`) e expor o botão acessível (`48 dp`, ícone `volume-high` / `volume-off`, `accessibilityLabel`) no cabeçalho do aplicativo (`src/app/_layout.tsx` e `src/view/index.tsx`).
- **`RF-09`**: Documentar o feedback sonoro em `design-system/04-componentes/cronometro-expressivo.md`, `alternativa-quiz.md` e `teclado-forca.md`.

### Entidades de Domínio Envolvidas (`src/model/`)
- `SoundPreference` (`src/model/entities/soundPreference.ts`)
- `ISoundPreferenceDataSource` (`src/model/datasources/iSoundPreferenceDataSource.ts`)
- `ISoundService` (`src/model/services/iSoundService.ts`)

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (IHC / Acessibilidade)**: todos os eventos críticos de jogo combinam **cor + forma + ícone + tato + som** (`RNF06`), com botão de controle de som com alvo mínimo de `48 dp × 48 dp` (`RNF07`) e rótulo acessível (`RNF08`).
- **`CS-02` (Arquitetura MVVM)**: `npm run check` (`check-arquitetura` + `check-design-system` + `tsc --noEmit` + `jest`) aprovado com **0 violações**.
- **`CS-03` (Testabilidade)**: 100% das regras de feedback sonoro e preferência de som testadas offline com `MemorySoundService` e `MemorySoundPreferenceDataSource`, além de testes unitários para `ExpoAudioSoundService` e `AsyncStorageSoundPreferenceDataSource`.
