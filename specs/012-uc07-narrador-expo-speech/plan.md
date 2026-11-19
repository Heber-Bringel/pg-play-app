# 🏗️ Plano de Implementação Técnica (`plan.md`): Narrador por Áudio do Cidade Dorme com expo-speech

- **Branch:** `feat/012-uc07-narrador-expo-speech`
- **Data:** 2026-11-19
- **Especificação de Origem:** `specs/012-uc07-narrador-expo-speech/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

Completar os critérios pendentes da **Issue `#32`** sobre a base de `expo-speech` entregue no PR `#37` nas 7 camadas do **MVVM Sofisticado**:
1. Estender `INarratorAudioService` (`src/model/services/iNarratorAudioService.ts`) com `setMuted`, `isMuted` e opção `{ force?: boolean }` em `speak`;
2. Implementar controle de `muted` e `force` em `MemoryNarratorAudioService` e `ExpoSpeechNarratorAudioService` (`src/infra/services/`), garantindo silenciamento imediato via `Speech.stop()` e repetição manual sem bloqueio pela janela de `1500 ms`;
3. Expor `setNarratorMuted`, `isNarratorMuted` e `repeatNarratorCaption` em `ICidadeDormeUseCases` e `CidadeDormeUseCases` (`src/usecase/`);
4. Expor `isNarratorMuted`, `handleToggleNarratorMute` e `handleRepeatNarratorCaption` em `useCidadeDormeViewModel` (`src/viewmodel/`), mantendo sincronia com `useEffect` de legenda;
5. Criar um componente reutilizável de banner do Narrador ou integrar os controles compactos (`>= 48 dp`) exclusivamente para `isCurrentPlayerHost` nas seções `cidadeDormeRoleSection.tsx`, `cidadeDormeNightSection.tsx` (`darkTokens`) e `cidadeDormeDaySection.tsx` (`tokens`).

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo devem estar marcados antes de gerar o `tasks.md` ou iniciar código.*

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada com os requisitos `UC07` / `RF19` / `RNF08` / `RNF11`.
- [x] **Artigo II (MVVM 7 Pastas)**: Todos os arquivos planejados residem apenas em `app`, `view`, `viewmodel`, `usecase`, `model`, `infra` ou `di`.
- [x] **Artigo II (Rotas Finas e View Burra)**: `src/app/cidade-dorme.tsx` permanece com 2 linhas e nenhuma lógica de `expo-speech` ou `try/catch` entra em `src/view/`.
- [x] **Artigo II (Vocabulário)**: Nenhum arquivo, interface ou classe usa termos proibidos — mantém estritamente `INarratorAudioService`, `ExpoSpeechNarratorAudioService` e `MemoryNarratorAudioService`.
- [x] **Artigo III (Design System)**: Todos os estilos usam exclusivamente `tokens` (Revelação/Dia) e `darkTokens` (Noite) de `@/view/theme`, com alvos `>= 48 dp` e cor + forma + ícone.
- [x] **Artigo IV (Testabilidade Offline)**: `MemoryNarratorAudioService` espelha `setMuted`, `isMuted` e `force` para execução determinística em `npm test`.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

```text
src/
├─ model/
│  └─ services/
│     └─ iNarratorAudioService.ts               # Adiciona NarratorSpeakOptions ({ force?: boolean }), setMuted(muted) e isMuted()
├─ infra/
│  └─ services/
│     ├─ memoryNarratorAudioService.ts          # Implementa muted + force na síntese em memória para testes
│     └─ expoSpeechNarratorAudioService.ts      # Implementa muted (chama Speech.stop() ao silenciar) e force (ignora janela 1500ms)
├─ usecase/
│  ├─ iCidadeDormeUseCases.ts                   # Expõe setNarratorMuted, isNarratorMuted e repeatNarratorCaption
│  └─ cidadeDormeUseCases.ts                    # Implementa silenciamento/repetição respeitando speakIfHost
├─ di/
│  └─ container.ts                              # Mantém injeção de ExpoSpeechNarratorAudioService em CidadeDormeUseCases
├─ viewmodel/
│  └─ useCidadeDormeViewModel.ts                # Estado isNarratorMuted + ações handleToggleNarratorMute e handleRepeatNarratorCaption
├─ view/
│  ├─ cidade-dorme.tsx                          # Passa isCurrentPlayerHost, isNarratorMuted e callbacks de áudio às seções
│  └─ components/
│     ├─ narratorBanner.tsx                     # (Opcional recomendado) Banner único reutilizável Claro/Escuro com legenda e controles >= 48dp do Host
│     ├─ cidadeDormeRoleSection.tsx             # Exibe banner com controles apenas quando isCurrentPlayerHost === true
│     ├─ cidadeDormeNightSection.tsx            # Exibe banner em darkTokens com controles apenas para Host
│     └─ cidadeDormeDaySection.tsx              # Exibe banner em tokens com controles apenas para Host
└─ app/
   └─ cidade-dorme.tsx                          # Rota fina inalterada (2 linhas)
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento da Tela | Componente (`@/view/components/`) | Tokens Semânticos (`@/view/theme`) |
| :--- | :--- | :--- |
| Banner de Legenda do Narrador (Dia / Revelação) | `NarratorBanner` / seção de legenda | `tokens.semantic.color.actionContainer`, `tokens.semantic.color.action`, `tokens.semantic.color.onActionContainer`, `tokens.semantic.radius.lg` |
| Banner de Legenda do Narrador (Noite) | `NarratorBanner` / seção de legenda | `darkTokens.semantic.color.actionContainer`, `darkTokens.semantic.color.action`, `darkTokens.semantic.color.onActionContainer` |
| Botão Silenciar / Ativar Áudio (`>= 48 dp`) | `Pressable` acessível (`minWidth/minHeight: space['2xl']`) | `tokens.semantic.space['2xl']` (`48`), `tokens.semantic.color.errorContainer` (quando silenciado), `tokens.semantic.color.focus`, `tokens.semantic.radius.md` / `radius.full` |
| Botão Repetir Fala (`>= 48 dp`) | `Pressable` acessível com ícone `replay` | `tokens.semantic.space['2xl']`, `tokens.semantic.color.surfaceContainer`, `tokens.semantic.color.onSurface`, `tokens.semantic.border.thin` |

---

## 5. Estratégia de Testes (`tests/`)

- **Testes de Serviço (`tests/unit/expoSpeechNarratorAudioService.test.ts`):**
  - Validar que `setMuted(true)` chama `Speech.stop()` e impede chamadas subsequentes a `Speech.speak`.
  - Validar que `speak(caption, voice, { force: true })` reproduz novamente mesmo dentro de `DUPLICATE_SPEECH_WINDOW_MS`.
- **Testes de UseCase (`tests/unit/cidadeDormeUseCases.test.ts`):**
  - Validar `setNarratorMuted`, `isNarratorMuted` e `repeatNarratorCaption` com `MemoryNarratorAudioService`.
- **Testes de Hook (`tests/hooks/useCidadeDormeViewModel.test.ts`):**
  - Validar estado `isNarratorMuted`, alternância via `handleToggleNarratorMute` e repetição via `handleRepeatNarratorCaption` respeitando `isCurrentPlayerHost`.
- **Testes de Tela (`tests/mocks/cidadeDormeScreen.mock.test.tsx`):**
  - Validar que botões de silenciar e repetir aparecem para Anfitrião, disparam as respectivas ações, não aparecem para convidados e que a legenda segue visível mesmo com `isNarratorMuted: true`.
