# 🏗️ Plano de Implementação Técnica (`plan.md`): UC07 — Cidade Dorme em Sala Multiplayer com Narrador por Áudio

- **Branch:** `feat/008-uc07-cidade-dorme`
- **Data:** 2026-11-18
- **Especificação de Origem:** `specs/008-uc07-cidade-dorme/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

Implementar o Caso de Uso **UC07 — Jogar Partida de Cidade Dorme em Sala Multiplayer com Narrador por Áudio (`RF18–RF20`)** seguindo estritamente as 7 camadas do **Harness MVVM Sofisticado**:
1. **Domínio (`src/model/`)**: Definir as entidades puras do Cidade Dorme em `src/model/entities/multiplayerSession.ts`, estender `IMultiplayerRoomService` com as operações de sala do Cidade Dorme e criar o contrato `INarratorAudioService` em `src/model/services/iNarratorAudioService.ts`.
2. **Infraestrutura (`src/infra/`)**: Habilitar o Cidade Dorme no catálogo (`MemoryGameCatalogDataSource`), implementar os métodos de sala em `MemoryMultiplayerRoomService` e `SupabaseMultiplayerRoomService`, e criar `MemoryNarratorAudioService` em `src/infra/services/memoryNarratorAudioService.ts`.
3. **Caso de Uso e DI (`src/usecase/` e `src/di/`)**: Implementar `ICidadeDormeUseCases` e `CidadeDormeUseCases` coordenando sorteio de papéis, turnos noturnos (Assassino, Anjo, Detetive), amanhecer, debate, votação secreta, condições de vitória e narração por áudio, injetados em `src/di/container.ts`.
4. **Apresentação (`src/viewmodel/`, `src/view/`, `src/app/`)**: Implementar `useCidadeDormeViewModel`, a tela modularizada `src/view/cidade-dorme.tsx` (alternando dinamicamente entre `darkTokens` durante A Noite e `tokens` durante O Dia) e a rota fina de 2 linhas `src/app/cidade-dorme.tsx`.

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo devem estar marcados antes de gerar o `tasks.md` ou iniciar código.*

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada com os requisitos `UC07` / `RF18–RF20`.
- [x] **Artigo II (MVVM 7 Pastas)**: Todos os arquivos planejados residem apenas em `app`, `view`, `viewmodel`, `usecase`, `model`, `infra` ou `di`.
- [x] **Artigo II (Rotas Finas e View Burra)**: A rota em `src/app/cidade-dorme.tsx` terá apenas 2 linhas (`import CidadeDormeScreen from '@/view/cidade-dorme'; export default CidadeDormeScreen;`) e toda a navegação (`expo-router`) ficará em `src/viewmodel/useCidadeDormeViewModel.ts`.
- [x] **Artigo II (Vocabulário)**: Nenhum arquivo, interface ou classe usa `Repository` ou `Connector` (apenas `DataSource` e `Service`).
- [x] **Artigo III (Design System)**: Todos os estilos usam exclusivamente tokens de `@/view/theme` (`tokens` para o Dia/Lobby e `darkTokens` para a Noite) e componentes de `@/view/components/`.
- [x] **Artigo IV (Testabilidade Offline)**: Toda dependência de `src/infra/` possui implementação `Memory*` (`MemoryMultiplayerRoomService` e `MemoryNarratorAudioService`) injetada via `src/di/container.ts`.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

```text
src/
├─ model/
│  ├─ entities/multiplayerSession.ts                    # Adiciona CidadeDormeRoom, CidadeDormePlayer, CidadeDormeRole, CidadeDormeConfig, etc.
│  ├─ services/iMultiplayerRoomService.ts               # Adiciona métodos de sala do Cidade Dorme e subscribeToCidadeDormeRoom
│  └─ services/iNarratorAudioService.ts                 # Novo contrato export interface INarratorAudioService
├─ infra/
│  ├─ datasources/memoryGameCatalogDataSource.ts        # Ativa o minigame 'cidade-dorme' (available: true, 'Multi-Celular · 5–16 jogadores')
│  └─ services/
│     ├─ memoryMultiplayerRoomService.ts                # Implementa sala Cidade Dorme em memória + bots/companheiros para modo demo
│     ├─ supabaseMultiplayerRoomService.ts              # Implementa métodos de sala Cidade Dorme no Supabase
│     └─ memoryNarratorAudioService.ts                  # Novo serviço MemoryNarratorAudioService implements INarratorAudioService
├─ usecase/
│  ├─ iCidadeDormeUseCases.ts                           # Novo contrato export interface ICidadeDormeUseCases
│  └─ cidadeDormeUseCases.ts                            # Nova classe export class CidadeDormeUseCases implements ICidadeDormeUseCases
├─ di/
│  └─ container.ts                                      # Instancia MemoryNarratorAudioService e exporta cidadeDormeUseCases
├─ viewmodel/
│  └─ useCidadeDormeViewModel.ts                        # export function useCidadeDormeViewModel(): [CidadeDormeState, CidadeDormeActions]
├─ view/
│  ├─ cidade-dorme.tsx                                  # Tela espelhada com transição Tema Claro (tokens) <-> Tema Escuro (darkTokens)
│  └─ components/
│     ├─ cidadeDormeEntrySection.tsx                    # Etapa de entrada: Apelido, Criar Sala, Entrar com PIN e Sala Demo
│     ├─ cidadeDormeLobbySection.tsx                    # Lobby: PIN, lista de jogadores (adicionar bot offline), Voz do Narrador e parâmetros
│     ├─ cidadeDormeRoleSection.tsx                     # Fase 0: Card fechado de segurança, Revelar Meu Papel e Esconder/Estou Pronto
│     ├─ cidadeDormeNightSection.tsx                    # Fase 1 (Noite - darkTokens): Legenda do Narrador, turnos Assassino/Anjo/Detetive e veredito
│     └─ cidadeDormeDaySection.tsx                      # Fases 2–4 (Dia - tokens): Boletim da Manhã, Debate, Votação Secreta e Fim de Jogo/Revanche
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
| **O Dia, Boletim da Manhã e Votação Secreta (Fases 2 e 3)** | `GameCard` + `ExpressiveTimer` + `QuizOption` + `ExpressiveButton` | `tokens.semantic.color.surface`, `tokens.component.quiz.*`, `tokens.component.timer.*` |
| **Saída Segura da Partida** | `ConfirmModal` + `ExpressiveButton` (`outlined`) | `tokens.semantic.color.scrim`, `tokens.semantic.radius.xl` |

---

## 5. Estratégia de Testes (`tests/`)

- **Testes Unitários do UseCase (`tests/unit/cidadeDormeUseCases.test.ts`)**:
  - Criação/entrada em sala, adição de jogadores no Lobby e validações (`ValidationError` para apelido curto, PIN inválido ou `< 5` jogadores).
  - Sorteio e distribuição de papéis (`Assassino`, `Anjo`, `Detetive`, `Cidadão`), confirmação de leitura (`confirmRoleRead`) e transição para `night_assassin`.
  - Turnos noturnos: ataque do Assassino, proteção do Anjo (com salvamento e com eliminação) e investigação do Detetive (veredito `isAssassin: true` e `false`), além de narração em `MemoryNarratorAudioService`.
  - Votação diurna: eliminação por maioria simples, empate/maioria de `"Abster-se / Pular Voto"`, verificação de vitória da Cidade e vitória dos Assassinos, e revanche (`restartMatch`).
- **Testes de Hook (`tests/hooks/useCidadeDormeViewModel.test.ts`)**:
  - Fluxo completo da ViewModel (`Entry` → `Lobby` → `Role Reveal` → `Night` → `Day Debate` → `Day Voting` → `Vote Result / Finished`).
- **Testes de Tela com Mocks (`tests/mocks/cidadeDormeScreen.mock.test.tsx`)**:
  - Renderização dos estados (`loading`, `entry`, `lobby`, `role_reveal`, `night` com `darkTokens`, `day_debate`, `day_voting` e `finished`).
