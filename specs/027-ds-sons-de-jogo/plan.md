# 🏗️ Plano de Implementação Técnica (`plan.md`): ds-sons-de-jogo

- **Branch:** `feat/027-ds-sons-de-jogo`
- **Data:** 2026-11-25
- **Especificação de Origem:** `specs/027-ds-sons-de-jogo/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`
- **Issue:** `#84`

---

## 1. Resumo Técnico

Esta feature adiciona efeitos sonoros curtos (`< 1 s`, `< 50 KB`, licença **CC0** em `assets/sons/`) aos jogos presenciais de **1 celular** (**Mímica**, **Quiz**, **Forca**, **Quem Sou Eu** e **Complete o Versículo**), aproveitando a arquitetura transversal do `GameFeedbackUseCases` introduzida na `spec 026` (PR #81).

1. **`ISoundService` + `ExpoAudioSoundService` / `MemorySoundService`**: Serviço de áudio baseado em `expo-audio` com pré-carregamento dos 6 efeitos (`correct`, `wrong`, `letter-wrong`, `pass`, `timer-critical`, `timer-expired`), respeito ao modo silencioso do iOS (`playsInSilentMode: false`) e degradação silenciosa (`try/catch`).
2. **`SoundPreference` + `ISoundPreferenceDataSource` + `SoundPreferenceUseCases`**: Persistência em `@pgplay:sound-preference:v1` (`AsyncStorageSoundPreferenceDataSource` e `MemorySoundPreferenceDataSource`), iniciando com `{ enabled: true }` por padrão.
3. **`GameFeedbackUseCases`**: Recebe `IHapticService`, `ISoundService` (opcional com default no container) e `ISoundPreferenceDataSource` (opcional). Quando o som está habilitado:
   - `notifyAnswer('correct')`: vibra `triggerHit()` + toca `playCorrect()`;
   - `notifyAnswer('wrong')`: vibra `triggerAnswerWrong()` + toca `playWrong()`;
   - `notifyLetterGuess(false)`: vibra `triggerLetterWrong()` + toca `playLetterWrong()`;
   - `notifyPass()`: vibra `triggerPass()` + toca `playPass()`;
   - `notifyTimerTick(prev, current, options)` (`1 <= current <= 10`): pulsa (se `!reduceMotion`) + toca `playTimerCritical()` **a cada segundo** nos 10 segundos finais (`10s → 1s`);
   - `notifyTimerTick(1, 0, options)`: vibra `triggerTimerExpired()` + toca `playTimerExpired()`.
4. **Botão de Som Ligado/Desligado**: `useSoundPreferenceViewModel` + contexto em `src/view/theme.ts` (`useSoundPreference`) conectado no `RootLayout` (`src/app/_layout.tsx`) e botão compacto `SoundToggleButton` (`volume-high` / `volume-off`, alvo de `48 dp`) ao lado do botão de tema no cabeçalho.

---

## 2. Verificação Constitucional (*Constitution Check*)

- [x] **Artigo I (SDD)**: `spec.md` concluída e vinculada a `UC03`, `UC04`, `UC05`, `UC09`, `UC10`, `RF10`, `RF14`, `RF15`, `RF33`, `RNF06`, `RNF08` e à Issue `#84`.
- [x] **Artigo II (MVVM 7 Pastas)**: todos os arquivos de código ficam exclusivamente nas 7 pastas canônicas de `src/` e os testes em `tests/`.
- [x] **Artigo II (Rotas Finas e View Burra)**: nenhuma View chama `expo-audio` ou `AsyncStorage`; toda ação passa por ViewModels e UseCases.
- [x] **Artigo II (Vocabulário)**: utiliza apenas `Entity` (`SoundPreference`), `DataSource` (`ISoundPreferenceDataSource`) e `Service` (`ISoundService`); zero uso de `Repository` ou `Connector`.
- [x] **Artigo II (Isolamento de Infra)**: somente `src/di/container.ts` (e os testes em `tests/`) importa de `@/infra/*`.
- [x] **Artigo III (Design System)**: o botão de som usa `ExpressiveButton` (`variant="icon"`, alvo `48 dp × 48 dp`) e tokens de `@/view/theme`; zero cores ou medidas literais.
- [x] **Artigo IV (Testabilidade Offline)**: `MemorySoundService` e `MemorySoundPreferenceDataSource` permitem testar todas as regras sem hardware de áudio.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

```text
assets/
└─ sons/
   ├─ CREDITOS.md                                      # NOVO — Fonte e licença CC0 dos 6 efeitos sonoros
   ├─ acerto.wav                                       # NOVO — Som curto e alegre ("plim", < 50 KB)
   ├─ erro.wav                                         # NOVO — Som curto e grave (< 50 KB)
   ├─ letra-errada.wav                                 # NOVO — Clique discreto (< 50 KB)
   ├─ passe.wav                                        # NOVO — Som curto de pulo/passe (< 50 KB)
   ├─ alerta-10s.wav                                   # NOVO — Bipe único ao entrar nos 10s finais (< 50 KB)
   └─ tempo-esgotado.wav                               # NOVO — Apito/buzina curta em 0s (< 50 KB)
src/
├─ model/
│  ├─ entities/
│  │  └─ soundPreference.ts                            # NOVO — export type SoundPreference = { enabled: boolean }
│  ├─ datasources/
│  │  └─ iSoundPreferenceDataSource.ts                 # NOVO — export interface ISoundPreferenceDataSource
│  └─ services/
│     └─ iSoundService.ts                              # NOVO — export interface ISoundService
├─ infra/
│  ├─ datasources/
│  │  ├─ memorySoundPreferenceDataSource.ts            # NOVO — Implementação em memória (padrão enabled: true)
│  │  └─ asyncStorageSoundPreferenceDataSource.ts      # NOVO — Persistência em AsyncStorage com fallback seguro
│  └─ services/
│     ├─ memorySoundService.ts                         # NOVO — Contadores em memória para testes
│     └─ expoAudioSoundService.ts                      # NOVO — Pré-carregamento com expo-audio e try/catch
├─ usecase/
│  ├─ iSoundPreferenceUseCases.ts                      # NOVO — export interface ISoundPreferenceUseCases
│  ├─ soundPreferenceUseCases.ts                       # NOVO — Leitura e alternância da preferência de som
│  ├─ iGameFeedbackUseCases.ts                         # + notifyPass(): Promise<void>
│  └─ gameFeedbackUseCases.ts                          # + ISoundService e ISoundPreferenceDataSource
├─ di/
│  └─ container.ts                                     # + soundPreferenceDataSource, soundService, soundPreferenceUseCases
├─ viewmodel/
│  ├─ useSoundPreferenceViewModel.ts                   # NOVO — [SoundPreferenceState, SoundPreferenceActions]
│  ├─ useMimicaViewModel.ts                            # + gameFeedback.notifyAnswer('correct') e notifyPass()
│  └─ useQuemSouEuViewModel.ts                         # + gameFeedback.notifyAnswer('correct') e notifyPass()
├─ view/
│  ├─ theme.ts                                         # + SoundPreferenceContext / useSoundPreference
│  ├─ components/themeModeSwitcher.tsx                 # + SoundToggleButton (volume-high / volume-off, 48 dp)
│  └─ index.tsx                                        # + SoundToggleButton ao lado do ThemeModeToggleButton
└─ app/
   └─ _layout.tsx                                      # + useSoundPreferenceViewModel e botão/contexto global de som
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento | Componente | Tokens |
| :--- | :--- | :--- |
| Botão de ligar/desligar som no cabeçalho | `ExpressiveButton` (`variant="icon"`, ícone `volume-high` / `volume-off`) | `activeTokens.semantic.space['2xl']` (`48 dp`), `activeTokens.semantic.icon.md`, `activeTokens.semantic.color.*` |

---

## 5. Estratégia de Testes (`tests/`)

- **`tests/unit/gameFeedbackUseCases.test.ts`**: valida que `notifyAnswer`, `notifyLetterGuess`, `notifyPass` e `notifyTimerTick` tocam os sons certos quando `enabled: true`, que o alerta de `10s` toca apenas 1 vez (`11 → 10`) e que nenhum som toca quando `enabled: false` (mantendo a vibração).
- **`tests/unit/expoAudioSoundService.test.ts`**: valida o pré-carregamento, reprodução dos 6 sons, respeito ao modo silencioso e degradação silenciosa quando `expo-audio` lança erro (usando mock em `tests/__mocks__/expo-audio.ts`).
- **`tests/unit/soundPreferenceUseCases.test.ts`** e **`tests/unit/asyncStorageSoundPreferenceDataSource.test.ts`**: validam padrão ligado (`true`), salvar/ler, JSON inválido e conversão em `DataSourceError`.
- **`tests/hooks/useSoundPreferenceViewModel.test.ts`**: valida carregamento inicial, alternância (`handleToggleSound` / `handleSetSoundEnabled`) e tratamento de `DomainError`.
- **`tests/hooks/gameFeedback.viewmodels.test.ts`** e **`tests/mocks/hubScreen.mock.test.tsx`**: validam integração nas ViewModels (incluindo Mímica e Quem Sou Eu) e acessibilidade do botão de som (`volume-high` / `volume-off`).
