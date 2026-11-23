# 📋 Especificação de Funcionalidade (`spec.md`): Correção da Seleção de Voz Masculina do Narrador

- **Branch da Feature:** `fix/024-narrador-voz-masculina`
- **Criado em:** 2026-11-23
- **Status:** Em Revisão
- **Caso(s) de Uso / Requisito(s):** `UC07` (`RF19`, `RNF08`) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md`, `docs/jogos/cidade-dorme.md` e `specs/012-uc07-narrador-expo-speech/spec.md`

---

## 1. Descrição do Problema & Cenários de Usuário *(Obrigatório)*

### Causa Raiz Identificada em `ExpoSpeechNarratorAudioService`
Quando o Moderador seleciona o perfil `masculina` no Lobby do **Cidade Dorme**, `ExpoSpeechNarratorAudioService` (`src/infra/services/expoSpeechNarratorAudioService.ts`) acabava selecionando e reproduzindo uma **voz feminina** pelos seguintes problemas:

1. **Colisão de substring `'male'` dentro de `'female'`:** `MALE_VOICE_HINTS` incluía `'male'` com `target.includes(hint)`. Qualquer voz feminina contendo `'female'` (ex.: `'pt-br-female-luciana'`, `'Portuguese (Brazil) Female'`) satisfazia `'female'.includes('male') === true` e era selecionada para o perfil `'masculina'` caso aparecesse antes na lista.
2. **Código Android Google TTS feminino classificado como masculino:** `'pt-br-x-pte'` (voz feminina do Google TTS no Android) estava em `MALE_VOICE_HINTS`, enquanto identificadores masculinos reais (`'pt-br-x-htm'`, `'pt-br-x-bmm'`) estavam ausentes.
3. **Ausência de vozes masculinas padrão (Windows/Edge/Web, Android, iOS e Cloud TTS):** Vozes comuns em `pt-BR`/`pt` (`antonio`, `fabio`, `humberto`, `nicolau`, `valerio`, `donato`, `thiago`, `luca`, `joaquim`, `neural2-b`, `wavenet-b`, `standard-b`, etc.) não constavam em `MALE_VOICE_HINTS`. Sem match, o fallback `ptVoices[0]` escolhia a primeira voz do sistema (quase sempre feminina, como `Microsoft Francisca`, `Luciana` ou `pt-br-x-afs-local`).
4. **Locale com underscore (`pt_BR`) e cache de lista vazia (`[]`):** Motores TTS que retornam `language: 'pt_BR'` não eram reconhecidos por `.startsWith('pt-br')`, e uma primeira consulta retornando `[]` durante a inicialização do motor ficava presa no cache `this.cachedVoices`.
5. **Fallback sem voz masculina nativa instalada (ex.: `"Google português do Brasil"` única voz do navegador):** Usar `pitch: 0.92` sobre uma voz feminina padrão mantém o timbre feminino perceptível; quando não há match explícito de voz masculina, é necessário aplicar `pitch: 0.65` e `rate: 0.94` para deslocar o timbre para o registro masculino.

---

### História de Usuário 1 — Seleção Precisa de Voz Masculina e Feminina em `pt-BR` / `pt` (Prioridade: P1)

Como **Moderador/Anfitrião da Sala no Cidade Dorme**, quero que ao escolher `Voz Masculina (Líder)` o serviço de áudio selecione corretamente uma voz masculina disponível no dispositivo (sem confundir `'female'` com `'male'` nem classificar vozes femininas como masculinas), garantindo distinção clara entre os perfis `'masculina'` e `'feminina'`.

**Por que esta prioridade:** Cumpre diretamente o requisito `RF19` ("escolher voz masculina ou feminina do Narrador do app") sem confundir os participantes da roda presencial.

**Como testar independentemente:** Simular listas reais de `Speech.getAvailableVoicesAsync()` (iOS, Android Google TTS com `pt_BR`, Windows/Edge Web e fallback de voz única) e verificar os parâmetros enviados a `Speech.speak` para `'masculina'` e `'feminina'`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que a lista de vozes contém `'pt-br-female-luciana'` na posição `0` e `'pt-br-male-daniel'` na posição `1`, **Quando** o Anfitrião executa `speak(caption, 'masculina')`, **Então** o serviço ignora `'pt-br-female-luciana'` (sem falso-positivo em `'male'`) e seleciona `'pt-br-male-daniel'` com `pitch: 0.92` e `rate: 0.98`.
2. **Dado** que a lista de vozes do Android contém `pt-br-x-afs-local`, `pt-br-x-pte-local`, `pt-br-x-ptd-local` e `pt-br-x-htm-local` com `language: 'pt_BR'`, **Quando** o Anfitrião executa `speak(caption, 'masculina')`, **Então** o serviço ignora `afs` e `pte` (femininas) e seleciona uma das vozes masculinas (`ptd` ou `htm`) com `pitch: 0.92`.
3. **Dado** uma lista Web/Windows contendo `Microsoft Francisca` e `Microsoft Antonio`, **Quando** o Anfitrião executa `speak(caption, 'masculina')`, **Então** o serviço seleciona `Microsoft Antonio`.
4. **Dado** um dispositivo que possui apenas uma voz feminina ou genérica (ex.: `"Google português do Brasil"` ou apenas `"Luciana"`), **Quando** o Anfitrião executa `speak(caption, 'masculina')`, **Então** `hasExplicitGenderMatch` é `false` e o serviço aplica `pitch: 0.65` e `rate: 0.94` para produzir timbre masculino grave.
5. **Dado** que a primeira chamada a `Speech.getAvailableVoicesAsync()` retorna `[]` durante a inicialização do TTS e a segunda retorna vozes disponíveis, **Quando** `speak` é chamado pela segunda vez, **Então** o serviço consulta novamente `getAvailableVoicesAsync()` e resolve a voz correta.

---

### Casos de Borda (Edge Cases)

- **Nomes com acento ou maiúsculas (`"Antônio"`, `"Vitória"`, `"Inês"`, `"Lúcia"`):** a normalização NFD remove diacríticos antes de comparar com os hints.
- **Falha ao listar vozes (`getAvailableVoicesAsync` rejeita):** mantém fallback seguro com `voiceId: undefined` e ajusta `pitch: 0.65` / `rate: 0.94` para `'masculina'` e `pitch: 1.08` / `rate: 0.98` para `'feminina'`.
- **Dispositivo com voz masculina apenas em `pt-PT` ou `pt` genérico:** se não houver voz explícita do gênero solicitado em `pt-BR`, busca match explícito em `allPtVoices` antes de recorrer ao fallback sem match explícito.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-24-01` (`RF19`)**: Impedir falso-positivo de `'male'` em identificadores/nomes contendo `'female'` utilizando verificação por fronteira de palavra e rejeição explícita quando o token `'female'` estiver presente.
- **`RF-24-02` (`RF19`)**: Corrigir mapeamento de vozes Android Google TTS (movendo `'pt-br-x-pte'` para feminino e adicionando `'pt-br-x-htm'` e `'pt-br-x-bmm'` ao masculino) e ampliar catálogo de vozes `pt-BR`/`pt` (Web/Windows, Android, iOS e Google Cloud TTS).
- **`RF-24-03` (`RF19`)**: Normalizar `language` (`pt_BR` → `pt-br`) e não cachear listas vazias (`[]`) em `this.cachedVoices`.
- **`RF-24-04` (`RF19`)**: Aplicar ajuste prosódico grave (`pitch: 0.65`, `rate: 0.94`) no perfil `'masculina'` quando não houver voz explícita masculina disponível no dispositivo.

### Entidades e Contratos Envolvidos
> Nenhuma alteração em `src/model/` ou `src/usecase/` — a interface `INarratorAudioService` e `CidadeDormeVoiceProfile` permanecem intactas.

---

## 3. Critérios de Sucesso *(Obrigatório)*

- **`CS-01` (Precisão da Voz Masculina)**: Todos os cenários unitários em `tests/unit/expoSpeechNarratorAudioService.test.ts` (incluindo ordenação feminina-antes-de-masculina, Android `pt_BR`, Windows/Web `Microsoft Antonio`, fallback sem voz masculina e reconsulta após `[]`) passam integralmente.
- **`CS-02` (Arquitetura MVVM)**: `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest --passWithNoTests`) passa com **0 violações** e **0 erros**.
