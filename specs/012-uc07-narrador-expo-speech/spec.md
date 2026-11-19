# 📋 Especificação de Funcionalidade (`spec.md`): Narrador por Áudio do Cidade Dorme com expo-speech

- **Branch da Feature:** `feat/012-uc07-narrador-expo-speech`
- **Criado em:** 2026-11-19
- **Status:** Em Revisão
- **Caso(s) de Uso / Requisito(s):** `UC07` (`RF19`, `RNF07`, `RNF08`, `RNF10`, `RNF11`) — Ref.: `docs/jogos/cidade-dorme.md`, `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md` (v1.2.0) e `specs/008-uc07-cidade-dorme/spec.md`
- **Issue vinculada:** `#32` (`v1.0.0 — Jogos em Sala Multiplayer (UC07–UC08)`)

---

## 1. Contexto Atual & Cenários de Usuário *(Obrigatório)*

### Estado Já Entregue vs. Pendências da Issue `#32`
- **Base já entregue no PR `#37` (`specs/008-uc07-cidade-dorme/`):**
  - Instalação de `expo-speech` e mock Jest em `tests/__mocks__/expo-speech.ts`;
  - `ExpoSpeechNarratorAudioService` (`implements INarratorAudioService`) em `pt-BR` com seleção de voz **Masculina** / **Feminina** e conversão de erros para `DataSourceError`;
  - Injeção no `src/di/container.ts`, reprodução centralizada no dispositivo do Anfitrião (`speakIfHost`, `speakNarratorCaption`, `stopNarratorAudio`) e legendas sincronizadas na tela.
- **Lacunas reais ainda abertas na Issue `#32`:**
  1. Ausência de controles para o Anfitrião **Silenciar / Ativar áudio do Narrador** (`isNarratorMuted`) e **Repetir fala do Narrador**;
  2. Propagação do estado `muted` no contrato `INarratorAudioService` para que tanto `CidadeDormeUseCases.speakIfHost` quanto `useCidadeDormeViewModel` respeitem o silenciamento sem vazar áudio;
  3. Ao acionar **Repetir fala**, a janela anti-duplicação atual (`DUPLICATE_SPEECH_WINDOW_MS = 1500` em `ExpoSpeechNarratorAudioService`) bloqueia a repetição imediata da mesma legenda se não houver parâmetro explícito `force?: boolean` (ou chamada prévia a `stop()`);
  4. Testes específicos de UI e ViewModel cobrindo silenciamento, repetição imediata e permanência das legendas visuais para todos os participantes mesmo quando o áudio estiver silenciado (`RNF08`).

---

### História de Usuário 1 — Síntese de Voz em pt-BR Exclusiva no Anfitrião e Controle de Silenciamento (Prioridade: P1)

Como **Moderador/Anfitrião da Sala**, quero que as transições de fase do **Cidade Dorme** sejam narradas automaticamente em português (`pt-BR`) respeitando a voz **Masculina** ou **Feminina** escolhida no Lobby, podendo **silenciar e reativar** o áudio do Narrador a qualquer momento sem desligar as legendas na tela.

**Por que esta prioridade:** Permite que 100% da roda jogue sem precisar de um narrador humano excluído (`RF19`), evitando eco entre aparelhos e dando autonomia caso o grupo prefira conduzir silenciosamente em algum momento da reunião.

**Como testar independentemente:** Iniciar uma partida com voz Masculina/Feminina, verificar chamada a `expo-speech` apenas no aparelho do Anfitrião, ativar o silêncio e avançar de fase comprovando que `Speech.speak` não é disparado enquanto `narratorCaption` continua visível.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o Anfitrião selecionou voz `masculina` ou `feminina` no Lobby e iniciou a partida, **Quando** a sala muda para `role_reveal`, turnos de `night_*`, `day_debate`, `day_voting`, `vote_result` ou `finished`, **Então** o aparelho do Anfitrião executa `ExpoSpeechNarratorAudioService.speak` em `pt-BR` com a voz configurada e os demais celulares exibem apenas a legenda visual (`RF19`, `RNF08`).
2. **Dado** que o Anfitrião tocou no controle **Silenciar Narrador** no banner do Narrador, **Quando** o estado muda para `isNarratorMuted === true`, **Então** o áudio em andamento é interrompido (`Speech.stop()`), novas transições de fase não reproduzem som no aparelho do Anfitrião e a legenda visual permanece 100% visível em todos os celulares (`RNF08`).
3. **Dado** que o Narrador está silenciado (`isNarratorMuted === true`), **Quando** o Anfitrião toca em **Ativar Áudio do Narrador**, **Então** futuras falas voltam a ser sintetizadas normalmente sem necessidade de recriar a sala.

---

### História de Usuário 2 — Repetir Última Fala do Narrador (Prioridade: P1)

Como **Moderador/Anfitrião**, quero tocar no botão **Repetir Fala** junto ao banner do Narrador quando o grupo não ouviu a instrução por barulho no ambiente, reproduzindo novamente a legenda atual sem bloqueio mesmo em cliques seguidos.

**Por que esta prioridade:** Em salas presenciais com jovens e adultos, ruídos momentâneos exigem repetição imediata da última fala do Narrador (`RF19`).

**Como testar independentemente:** Exibir uma legenda na fase atual, acionar **Repetir Fala** duas vezes em menos de 1,5 segundo e validar que o serviço interrompe a fala anterior e reproduz a legenda atual mesmo com `DUPLICATE_SPEECH_WINDOW_MS`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que existe `room.narratorCaption` na tela do Anfitrião, **Quando** o Anfitrião toca em **Repetir Fala**, **Então** `useCidadeDormeViewModel` aciona `repeatNarratorCaption(caption, voice)`, que força a reprodução (`force: true`) ignorando o debounce de deduplicação automática.
2. **Dado** que o áudio estava silenciado (`isNarratorMuted === true`), **Quando** o Anfitrião toca explicitamente em **Repetir Fala** (ou primeiro reativa), **Então** o comportamento é determinístico e transparente: ou o botão exibe estado informativo/reativa conforme regra definida, garantindo que o usuário nunca clique em um controle sem resposta nem que o convidado veja controles exclusivos do Anfitrião (`RNF11`).

---

### História de Usuário 3 — Acessibilidade Sensorial e Controles do Anfitrião (Prioridade: P2)

Como **Participante com deficiência auditiva ou em ambiente ruidoso**, quero visualizar todas as falas do Narrador como **legendas expressivas sincronizadas** combinando cor semântica, ícone (`volume-high` / `volume-off` / `replay`) e rótulos de leitor de tela (`RNF08`), com controles de áudio acessíveis (`>= 48 dp`) exibidos somente para o Anfitrião (`RNF11`).

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** qualquer jogador conectado (Anfitrião ou convidado) durante revelação de papel, noite ou dia, **Quando** o banner do Narrador é renderizado, **Então** a legenda (`room.narratorCaption`) está sempre visível com `accessibilityRole="text"` e contraste WCAG AA (`tokens` no Dia/Revelação, `darkTokens` na Noite).
2. **Dado** um jogador convidado (`isCurrentPlayerHost === false`), **Quando** visualiza o banner do Narrador, **Então** vê apenas a legenda sincronizada (sem botões de silenciar/repetir que induzam ao erro de achar que seu celular reproduz áudio).
3. **Dado** o Anfitrião (`isCurrentPlayerHost === true`), **Quando** visualiza os botões de **Silenciar/Ativar** e **Repetir**, **Então** ambos possuem área mínima de toque `>= 48 dp × 48 dp` (`RNF07`), foco visível (`3 dp`) e ícone + texto/descrição acessível (`RNF06`, `RNF08`).

---

### Casos de Borda (Edge Cases)

- **Legenda vazia ou espaços em branco:** `speak` e `repeatNarratorCaption` ignoram strings vazias sem chamar `Speech.speak` e sem lançar erro.
- **Dispositivo sem voz `pt-BR` específica ou com apenas uma voz instalada:** `ExpoSpeechNarratorAudioService.resolveVoiceIdentifier` faz fallback seguro para `pt` genérico ou voz padrão ajustando `pitch` (`0.92` masculina / `1.08` feminina).
- **Falha nativa do sintetizador `expo-speech`:** capturada com `catch (err: unknown)` e convertida em `DataSourceError` no serviço; a ViewModel absorve falha de síntese sem travar o avanço da partida (`RNF08` garante continuidade pela legenda).
- **Saída ou desmontagem da tela (`/cidade-dorme`):** `stopNarratorAudio()` interrompe imediatamente qualquer fala em curso e limpa estado de controle de áudio.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-32-01` (`RF19`)**: Reproduzir a narração em `pt-BR` com `expo-speech` respeitando o perfil `masculina` ou `feminina` escolhido no Lobby, exclusivamente no aparelho do Anfitrião.
- **`RF-32-02` (`RF19` / `RNF08`)**: Permitir ao Anfitrião silenciar e reativar a síntese de áudio (`setNarratorMuted` / `isNarratorMuted`) mantendo 100% das legendas sincronizadas na tela de todos os jogadores.
- **`RF-32-03` (`RF19`)**: Permitir ao Anfitrião repetir manualmente a fala atual do Narrador (`repeatNarratorCaption`) ignorando a janela anti-duplicação (`force: true`).
- **`RF-32-04` (`RNF07` / `RNF08` / `RNF11`)**: Exibir botões compactos acessíveis (`>= 48 dp`) com cor + forma + ícone apenas no banner do Narrador do Anfitrião, sem vazar controle nem áudio para convidados.

### Entidades e Contratos Envolvidos (`src/model/`)
- **`CidadeDormeVoiceProfile`**: `'masculina' | 'feminina'` em `src/model/entities/multiplayerSession.ts`.
- **`NarratorSpeechOptions` / `INarratorAudioService`**: contrato em `src/model/services/iNarratorAudioService.ts` estendido com `setMuted(muted: boolean): void`, `isMuted(): boolean` e `speak(caption, voice, options?: { force?: boolean }): Promise<void>`.

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (IHC / Acessibilidade)**: Legendas sempre visíveis com `accessibilityRole="text"`; botões de controle do Narrador com mínimo `48 dp × 48 dp`, `accessibilityRole="button"`, `accessibilityLabel`, `accessibilityState` e suporte a `tokens` (Dia) e `darkTokens` (Noite).
- **`CS-02` (Isolamento de Áudio e Papéis)**: Testes automatizados comprovam que apenas o Anfitrião dispara `speak`, silenciamento bloqueia novos disparos sem ocultar legendas e convidados não disparam áudio nem exibem controles do Anfitrião.
- **`CS-03` (Arquitetura MVVM)**: `npm run check` (`check-arquitetura.mjs` + `tsc --noEmit` + `jest`) executa com **0 violações** e todos os testes passando.
