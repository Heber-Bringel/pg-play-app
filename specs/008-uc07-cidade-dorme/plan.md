# 🏗️ Plano de Implementação Técnica (`plan.md`): UC07 — Cidade Dorme em Sala Multiplayer com Narrador por Áudio

- **Branch:** `feat/008-uc07-cidade-dorme`
- **Data:** 2026-11-18 (atualizado em 2026-11-19)
- **Especificação de Origem:** `specs/008-uc07-cidade-dorme/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

Implementar o Caso de Uso **UC07 — Jogar Partida de Cidade Dorme em Sala Multiplayer com Narrador por Áudio (`RF18–RF20`, `RNF08`, `RNF11`, Issue `#32`)** seguindo estritamente as 7 camadas do **Harness MVVM Sofisticado**:
1. **Domínio (`src/model/`)**: Definir as entidades puras do Cidade Dorme em `src/model/entities/multiplayerSession.ts`, estender `IMultiplayerRoomService` com as operações de sala do Cidade Dorme (incluindo `leaveCidadeDormeRoom`) e criar o contrato `INarratorAudioService` em `src/model/services/iNarratorAudioService.ts`.
2. **Infraestrutura (`src/infra/`)**: Habilitar o Cidade Dorme no catálogo (`MemoryGameCatalogDataSource`), implementar os métodos de sala em `SupabaseMultiplayerRoomService` (com lista de jogadores na tabela `room_players`, reconexão idempotente e validação de apelidos) e `MemoryMultiplayerRoomService` (para testes unitários), além de implementar `ExpoSpeechNarratorAudioService` (usando `expo-speech` em `pt-BR`) e `MemoryNarratorAudioService` (para testes).
3. **Caso de Uso e DI (`src/usecase/` e `src/di/`)**: Implementar `ICidadeDormeUseCases` e `CidadeDormeUseCases` coordenando criação/entrada/saída de sala, sorteio de papéis, turnos noturnos (Assassino, Anjo, Detetive), amanhecer, debate, votação secreta, condições de vitória e reprodução de áudio restrita ao dispositivo do Anfitrião (`speakIfHost`, `speakNarratorCaption`, `stopNarratorAudio`), injetados em `src/di/container.ts`.
4. **Apresentação (`src/viewmodel/`, `src/view/`, `src/app/`)**: Implementar `useCidadeDormeViewModel` (com disparo automático de áudio no aparelho do Anfitrião quando `narratorCaption` muda, limpeza no unmount/saída e `router.replace('/')`), a tela modularizada `src/view/cidade-dorme.tsx` (alternando dinamicamente entre `darkTokens` durante A Noite e `tokens` durante O Dia, respeitando as permissões estritas de `RNF11` e sem modo offline/demo na UI) e a rota fina de 2 linhas `src/app/cidade-dorme.tsx`.

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo devem estar marcados antes de gerar o `tasks.md` ou iniciar código.*

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada com os requisitos `UC07` / `RF18–RF20` / `RNF11`.
- [x] **Artigo II (MVVM 7 Pastas)**: Todos os arquivos planejados residem apenas em `app`, `view`, `viewmodel`, `usecase`, `model`, `infra` ou `di`.
- [x] **Artigo II (Rotas Finas e View Burra)**: A rota em `src/app/cidade-dorme.tsx` terá apenas 2 linhas (`import CidadeDormeScreen from '@/view/cidade-dorme'; export default CidadeDormeScreen;`) e toda a navegação (`expo-router`) ficará em `src/viewmodel/useCidadeDormeViewModel.ts`.
- [x] **Artigo II (Vocabulário)**: Nenhum arquivo, interface ou classe usa `Repository` ou `Connector` (apenas `DataSource` e `Service`).
- [x] **Artigo III (Design System)**: Todos os estilos usam exclusivamente tokens de `@/view/theme` (`tokens` para o Dia/Lobby e `darkTokens` para a Noite) e componentes de `@/view/components/`.
- [x] **Artigo IV (Testabilidade em Memória)**: Toda dependência de `src/infra/` possui implementação `Memory*` (`MemoryMultiplayerRoomService` e `MemoryNarratorAudioService`) mantida exclusivamente para testes unitários determinísticos (`npm test`).

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

```text
src/
├─ model/
│  ├─ entities/multiplayerSession.ts                    # CidadeDormeRoom, CidadeDormePlayer, CidadeDormeRole, CidadeDormeConfig, etc.
│  ├─ services/iMultiplayerRoomService.ts               # Operações de sala do Cidade Dorme, leaveCidadeDormeRoom e subscribeToCidadeDormeRoom
│  └─ services/iNarratorAudioService.ts                 # Contrato export interface INarratorAudioService
├─ infra/
│  ├─ datasources/memoryGameCatalogDataSource.ts        # Ativa o minigame 'cidade-dorme' (available: true, 'Multi-Celular · 5–16 jogadores')
│  └─ services/
│     ├─ memoryMultiplayerRoomService.ts                # Implementação em memória determinística para testes unitários
│     ├─ supabaseMultiplayerRoomService.ts              # Implementação Supabase Realtime usando room_players + reconexão segura
│     ├─ expoSpeechNarratorAudioService.ts              # Implementação real com expo-speech (pt-BR, voz masculina/feminina e deduplicação)
│     └─ memoryNarratorAudioService.ts                  # Implementação em memória determinística para testes unitários
├─ usecase/
│  ├─ iCidadeDormeUseCases.ts                           # Contrato export interface ICidadeDormeUseCases (inclui speakNarratorCaption/stopNarratorAudio)
│  └─ cidadeDormeUseCases.ts                            # Classe CidadeDormeUseCases implements ICidadeDormeUseCases (sem addPlayer offline)
├─ di/
│  └─ container.ts                                      # Instancia ExpoSpeechNarratorAudioService e exporta cidadeDormeUseCases
├─ viewmodel/
│  └─ useCidadeDormeViewModel.ts                        # export function useCidadeDormeViewModel(): [CidadeDormeState, CidadeDormeActions]
├─ view/
│  ├─ cidade-dorme.tsx                                  # Tela espelhada com transição Tema Claro (tokens) <-> Tema Escuro (darkTokens)
│  └─ components/
│     ├─ cidadeDormeEntrySection.tsx                    # Etapa de entrada multiplayer: Apelido, Criar Sala e Entrar com PIN
│     ├─ cidadeDormeLobbySection.tsx                    # Lobby: PIN, lista de jogadores conectados, Voz do Narrador e parâmetros
│     ├─ cidadeDormeRoleSection.tsx                     # Fase 0: Card fechado de segurança, Revelar Meu Papel e Esconder/Estou Pronto
│     ├─ cidadeDormeNightSection.tsx                    # Fase 1 (Noite - darkTokens): Legenda do Narrador, turno exclusivo do papel e veredito restrito ao Detetive
│     └─ cidadeDormeDaySection.tsx                      # Fases 2–4 (Dia - tokens): Boletim da Manhã, Debate, Votação Secreta e controles exclusivos do Anfitrião
└─ app/
   └─ cidade-dorme.tsx                                  # Rota fina de 2 linhas reexportando @/view/cidade-dorme
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento da Tela | Componente (`@/view/components/`) | Tokens Semânticos (`@/view/theme`) |
| :--- | :--- | :--- |
| **Entrada na Sala (Apelido e Código PIN)** | `ExpressiveTextField` + `ExpressiveButton` + `GameCard` | `tokens.component.input.*`, `tokens.component.button.*`, `tokens.semantic.space.md` |
| **Lobby e Parâmetros do Moderador (Voz, Tempos, Assassinos)** | `ExpressiveChip` + `GameCard` + `ExpressiveButton` (`primaryJumbo`) | `tokens.semantic.color.actionContainer`, `tokens.semantic.radius.full`, `tokens.semantic.space.lg` |
| **Card Secreto de Papel (Fase 0)** | `GameCard` + `ExpressiveButton` (`primaryJumbo`, `successJumbo`) | `tokens.semantic.color.surfaceContainer`, `tokens.semantic.font.display`, `tokens.semantic.radius.xl` |
| **A Noite e Legenda do Narrador (Fase 1)** | `GameCard` + `ExpressiveTimer` + `QuizOption` + `ExpressiveButton` | `darkTokens.semantic.color.surface`, `darkTokens.semantic.color.onSurface`, `darkTokens.component.timer.*` |
| **Veredito Silencioso do Detetive (Inocente vs. Assassino)** | Container semântico com `MaterialCommunityIcons` (`check-circle` / `alert-circle`) | `darkTokens.semantic.color.errorContainer` + `radius.sm` (Assassino) / `darkTokens.semantic.color.success` + `radius.md` (Inocente) |
| **O Dia, Boletim da Manhã, Espera e Votação Secreta (Fases 2 e 3)** | `GameCard` + `ExpressiveTimer` + `QuizOption` + `ExpressiveButton` + Card de espera | `tokens.semantic.color.surface`, `tokens.semantic.color.actionContainer`, `tokens.component.quiz.*`, `tokens.component.timer.*` |
| **Saída Segura da Partida** | `ConfirmModal` + `ExpressiveButton` (`outlined`) | `tokens.semantic.color.scrim`, `tokens.semantic.radius.xl` |

---

## 5. Estratégia de Testes (`tests/`)

- **Testes Unitários do Narrador (`tests/unit/expoSpeechNarratorAudioService.test.ts`)**:
  - `speak` chamando `Speech.stop` e `Speech.speak` com `language: 'pt-BR'` para vozes `'masculina'` e `'feminina'`, histórico e deduplicação em `< 1500 ms`.
  - `stop()` limpando o estado ativo e conversão de erros para `DataSourceError`.
- **Testes Unitários do UseCase (`tests/unit/cidadeDormeUseCases.test.ts`)**:
  - Criação/entrada/saída em sala e validações (`ValidationError` para apelido curto, PIN inválido ou `< 5` jogadores).
  - Sorteio e distribuição de papéis (`Assassino`, `Anjo`, `Detetive`, `Cidadão`), confirmação de leitura e transição para `night_assassin`.
  - Turnos noturnos: ataque do Assassino, proteção do Anjo, investigação do Detetive e garantia de que aparelhos de convidados não disparam `narratorService.speak`.
  - Votação diurna: eliminação por maioria simples, empate/maioria de `"Abster-se / Pular Voto"`, verificação de vitória da Cidade e vitória dos Assassinos, e revanche (`restartMatch`).
- **Testes de Hook (`tests/hooks/useCidadeDormeViewModel.test.ts`)**:
  - Fluxo completo da ViewModel (`Entry` → `Lobby` → `Role Reveal` → `Night` → `Day Debate` → `Day Voting` → `Vote Result / Finished`).
  - Disparo centralizado de `speakNarratorCaption` apenas para o Anfitrião e parada com `stopNarratorAudio` ao sair/desmontar.
- **Testes de Tela com Mocks (`tests/mocks/cidadeDormeScreen.mock.test.tsx`)**:
  - Renderização dos estados (`loading`, `entry` sem sala demo offline, `lobby`, `role_reveal`, `night` com `darkTokens`, `day_debate`, `day_voting` e `finished`).
  - Validação das permissões estritas `RNF11`: veredito oculto para não-Detetive (mesmo se Anfitrião) e controles públicos do Dia/Revanche ocultos para convidados.
