# 🏗️ Plano de Implementação Técnica (`plan.md`): ds-feedback-haptico-cronometro

- **Branch:** `feat/026-ds-feedback-haptico-cronometro`
- **Data:** 2026-11-24
- **Especificação de Origem:** `specs/026-ds-feedback-haptico-cronometro/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`
- **Issue:** `#77`

---

## 1. Resumo Técnico

O `IHapticService` (já usado pelo Quem Sou Eu) ganha dois métodos para o cronômetro. Um UseCase novo e pequeno, `GameFeedbackUseCases`, decide **quando** vibrar a partir do segundo anterior e do atual. As 4 ViewModels guardam o segundo anterior em um `useRef` e avisam o UseCase quando o cronômetro muda. O "Reduzir movimento" é lido na View (como já fazem `cidade-dorme.tsx` e `quem-sou-eu.tsx`), agora por um hook reutilizável, e segue para a ViewModel e para o `ExpressiveTimer`.

**Decisões já tomadas com o grupo (2026-11-24):**
- Vibração só nos **4 jogos de 1 celular** com contagem regressiva (Mímica, Quiz, Quem Sou Eu, Complete o Versículo).
- Seguir o **"Reduzir movimento"** do sistema: sem pulsos (e sem pulsação visual) nos 10s finais; a vibração de tempo esgotado continua.

**Por que um UseCase próprio, e não um método em cada UseCase de jogo:** a regra é a mesma nos 4 jogos, e eles usam 3 UseCases diferentes (`PgPlayUseCases`, `QuemSouEuUseCases`, `VersiculoUseCases`). Um UseCase único evita repetir a regra e não muda os construtores existentes (mais de 30 chamadas nos testes).

---

## 2. Verificação Constitucional (*Constitution Check*)

- [x] **Artigo I (SDD)**: `spec.md` vinculada a `UC03`, `UC04`, `UC09`, `UC10`, `RNF06`, `RNF09` e à issue `#77`.
- [x] **Artigo II (MVVM 7 Pastas)**: todos os arquivos ficam nas 7 pastas de `src/` e em `tests/`.
- [x] **Artigo II (Rotas Finas e View Burra)**: nenhuma rota muda; a View só lê `AccessibilityInfo` (permitido, é `react-native`) e chama ações. A vibração nunca sai da View.
- [x] **Artigo II (Vocabulário)**: `Service` (háptico) e `UseCases`; sem `Repository`/`Connector`.
- [x] **Artigo II (Isolamento de Infra)**: só `src/di/container.ts` instancia `ExpoHapticService`.
- [x] **Artigo III (Design System)**: só a prop `reduceMotion` do `ExpressiveTimer`, que já existe; nenhum token novo.
- [x] **Artigo IV (Testabilidade Offline)**: `MemoryHapticService` registra as chamadas para os testes.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

```text
src/
├─ model/
│  └─ services/iHapticService.ts          # + triggerTimerPulse() e triggerTimerExpired()
├─ infra/
│  └─ services/
│     ├─ expoHapticService.ts             # Light impact / Notification Error, com try/catch
│     └─ memoryHapticService.ts           # conta pulsos e esgotados (getCounts)
├─ usecase/
│  ├─ iGameFeedbackUseCases.ts           # NOVO — export interface IGameFeedbackUseCases
│  └─ gameFeedbackUseCases.ts            # NOVO — regra de quando vibrar
├─ di/
│  └─ container.ts                        # + gameFeedbackUseCases (reusa o hapticService)
├─ viewmodel/
│  ├─ useMimicaViewModel.ts               # 2º parâmetro, reduceMotion, handleSetReduceMotion, efeito do tick
│  ├─ useQuizViewModel.ts                 # idem
│  ├─ useQuemSouEuViewModel.ts            # idem
│  └─ useVersiculoViewModel.ts            # idem
└─ view/
   ├─ components/useReduceMotion.ts       # NOVO — hook do "Reduzir movimento" (AccessibilityInfo)
   ├─ mimica.tsx                          # useReduceMotion → actions + <ExpressiveTimer reduceMotion>
   ├─ quiz.tsx                            # idem
   ├─ quem-sou-eu.tsx                     # troca o useEffect local pelo hook
   └─ versiculo.tsx                       # idem mimica
design-system/04-componentes/cronometro-expressivo.md   # seção do comportamento tátil
```

### Regra do UseCase (`notifyTimerTick(previous, current, { reduceMotion })`)

| Condição | Efeito |
| :--- | :--- |
| `current !== previous - 1` (subiu, igual ou pulou) | nada |
| `current === 0` | `triggerTimerExpired()` (mesmo com `reduceMotion`) |
| `1 <= current <= 10` e `!reduceMotion` | `triggerTimerPulse()` |
| `1 <= current <= 10` e `reduceMotion` | nada |
| `current > 10` | nada |

### Integração na ViewModel (igual nas 4)

```ts
const previousSecondsRef = useRef<number>(secondsRemaining);
useEffect(() => {
  const previous = previousSecondsRef.current;
  previousSecondsRef.current = secondsRemaining;
  void gameFeedback.notifyTimerTick(previous, secondsRemaining, { reduceMotion });
}, [secondsRemaining]); // reduceMotion lido no momento do tick
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento | Componente | Tokens |
| :--- | :--- | :--- |
| Cronômetro do turno nas 4 telas | `ExpressiveTimer` (prop `reduceMotion`, já existente) | nenhum novo (`motion.spring.spatial` deixa de ser usado com "Reduzir movimento") |

---

## 5. Estratégia de Testes (`tests/`)

- **`tests/unit/gameFeedbackUseCases.test.ts`**: com `MemoryHapticService`, a sequência `15 → 0` gera 10 pulsos e 1 esgotado; com `reduceMotion`, 0 pulsos e 1 esgotado; subida (`0 → 60`), valor repetido e salto (`12 → 8`) não vibram.
- **`tests/unit/expoHapticService.test.ts`** (ou o teste de serviço existente): os métodos novos chamam o `expo-haptics` certo e não lançam quando ele falha.
- **Hooks** (`tests/hooks/use*ViewModel.test.ts` dos 4 jogos): um caso por jogo confirmando que um tick nos 10s finais chama o UseCase de feedback (dublê injetado) e que `handleSetReduceMotion` chega ao estado.
- **Telas** (`tests/mocks/*Screen.mock.test.tsx`): incluir `reduceMotion` e `handleSetReduceMotion` nos mocks de estado/ações.
- `npm run check` com 0 violações; **teste manual em celular** (Expo Go) para sentir a vibração, registrado no PR.

## Adendo (2026-11-24): acerto e erro

- `GameFeedbackUseCases` ganha `notifyAnswer(outcome)` (sucesso → `triggerHit`, erro → `triggerAnswerWrong`) e `notifyLetterGuess(isInWord)` (letra errada → `triggerLetterWrong`, letra certa não vibra).
- Quiz (`handleSelectOption`), Forca (`handleGuessLetter`) e Versículo (`submitAnswers`) chamam o UseCase só em ações do jogador; o tempo esgotado continua só com `triggerTimerExpired`.
- `useForcaViewModel` passa a receber `IGameFeedbackUseCases` como 2º parâmetro.
- Testes: `tests/unit/gameFeedbackUseCases.test.ts` e `tests/hooks/gameFeedback.viewmodels.test.ts`.
