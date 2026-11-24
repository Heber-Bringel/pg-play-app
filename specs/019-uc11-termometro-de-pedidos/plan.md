# 🏗️ Plano de Implementação Técnica (`plan.md`): Termômetro de Pedidos de Oração (`UC11`)

- **Branch:** `feat/019-uc11-termometro-de-pedidos`
- **Data:** 2026-11-20
- **Especificação de Origem:** `specs/019-uc11-termometro-de-pedidos/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

Implementa a dinâmica de encerramento **Termômetro de Pedidos (`UC11`, `RF38`–`RF40`, `RNF12`)** nas 7 camadas do MVVM Sofisticado.
No domínio (`src/model/entities/termometro.ts`), modelamos a sessão da roda de fala e o resumo anônimo sem persistência externa (`RNF12`). Na infraestrutura (`src/infra/datasources/memoryGameCatalogDataSource.ts`), adicionamos o card ativo do **Termômetro de Pedidos** ao catálogo do Hub com a tag `"1 Celular · Encerramento"` e rota `"/termometro"`. Na camada de caso de uso (`src/usecase/iTermometroUseCases.ts` e `src/usecase/termometroUseCases.ts`), implementamos toda a máquina de estados e validações (`ValidationError`) em memória pura, injetando `ITeamDataSource` apenas para leitura opcional dos nomes das equipes (sem nunca alterar pontuação). Na camada de apresentação, evoluímos `ExpressiveTimer` com a variante `'thermometer'` e criamos `useTermometroViewModel.ts`, `src/view/termometro.tsx` e a rota fina `src/app/termometro.tsx`.

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo devem estar marcados antes de gerar o `tasks.md` ou iniciar código.*

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada com os requisitos `RF38`–`RF40`, `RNF12` e `UC11`.
- [x] **Artigo II (MVVM 7 Pastas)**: Todos os arquivos planejados residem apenas em `app`, `view`, `viewmodel`, `usecase`, `model`, `infra` ou `di`.
- [x] **Artigo II (Rotas Finas e View Burra)**: `src/app/termometro.tsx` terá apenas 2 linhas e toda a navegação (`expo-router`) ficará em `useTermometroViewModel.ts`.
- [x] **Artigo II (Vocabulário)**: Nenhum arquivo, interface ou classe usa `Repository` ou `Connector`.
- [x] **Artigo III (Design System)**: Todos os estilos usam exclusivamente tokens de `@/view/theme` e componentes de `@/view/components/` (com a variante `thermometer` no `ExpressiveTimer`).
- [x] **Artigo IV (Testabilidade Offline e Privacidade RNF12)**: Estado 100% em memória durante o momento e descartado ao encerrar; zero persistência ou chamadas de rede.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

```text
src/
├─ model/
│  └─ entities/termometro.ts                    # Novo: tipos TermometroSession, TermometroConfig, TermometroSummary, etc.
├─ infra/
│  └─ datasources/memoryGameCatalogDataSource.ts # Atualizado: inclui card "Termômetro de Pedidos" ("1 Celular · Encerramento", rota "/termometro")
├─ usecase/
│  ├─ iTermometroUseCases.ts                    # Novo: contrato ITermometroUseCases
│  └─ termometroUseCases.ts                     # Novo: regras RF38–RF40 e descarte em memória RNF12
├─ di/
│  └─ container.ts                              # Atualizado: exporta instância termometroUseCases
├─ viewmodel/
│  └─ useTermometroViewModel.ts                 # Novo: hook [TermometroState, TermometroActions] com timer e navegação
├─ view/
│  ├─ components/expressiveTimer.tsx            # Atualizado: variante 'thermometer' (0–70% frio, 70–100% quente, 100% concluído + MM:SS)
│  └─ termometro.tsx                            # Novo: tela espelhada com fases setup, turn, summary e prayer
└─ app/
   └─ termometro.tsx                            # Novo: rota fina de 2 linhas reexportando @/view/termometro
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento da Tela | Componente (`@/view/components/`) | Tokens Semânticos (`@/view/theme`) |
| :--- | :--- | :--- |
| Termômetro de tempo de fala (`MM:SS` + barra que enche) | `ExpressiveTimer` (`variant="thermometer"`, `totalSeconds`, `secondsRemaining`, `paused`) | `color.actionContainer`, `color.onActionContainer`, `color.highlight`, `color.onHighlight`, `color.surfaceContainer`, `radius.full`, `radius.lg`, `font.title`, `font.caption` |
| Seleção de modo de participantes, tempo (`1/2/3 min`) e ordem | `ExpressiveChip` | `color.actionContainer`, `color.surfaceContainer`, `space.sm` |
| Entrada de nomes na hora (modo lista digitada) | `ExpressiveTextField` | `input.bg`, `input.borderFocus`, `input.borderError` |
| Card de participante da vez / resumo / oração | `GameCard` | `card.bg`, `card.border`, `card.radius`, `card.padding`, `font.title` |
| Ações (`Começar a falar`, `Próximo`, `Pular minha vez`, `Pausar`, `Momento de Oração`, `Encerrar Encontro`) | `ExpressiveButton` (`primaryJumbo`, `tonal`, `outlined`, `secondary`) | `button.bg`, `button.minHeight`, `button.jumboHeight`, `space.sm` |
| Modal de saída segura | `ConfirmModal` | `color.surfaceContainer`, `color.scrim`, `radius.xl` |

---

## 5. Estratégia de Testes (`tests/`)

- **Testes Unitários de Caso de Uso (`tests/unit/termometroUseCases.test.ts`)**:
  - Configuração com equipes cadastradas (`teams`), nomes digitados (`custom`) e modo livre (`free`), tempos `1`, `2` e `3 min`, ordem de lista e sorteada (`RF38`).
  - Validações com `ValidationError` (tempo inválido, nome curto `< 2` letras, nome duplicado, lista `custom` vazia).
  - Início de fala (`startSpeaking`), contagem de tempo sem cortar a fala ao chegar em `00:00`, `nextSpeaker` (`sharedCount`), `skipSpeaker` (`skippedCount`), `togglePause` (`RF39`).
  - Resumo anônimo sem nomes, transição para `"Momento de Oração"` e descarte completo dos nomes ao encerrar (`endSession`) sem alterar o placar das equipes (`RF40`, `RNF12`).
- **Testes de Componente (`tests/components.test.tsx`)**:
  - Renderização do `ExpressiveTimer` na variante `'thermometer'` nas 3 faixas (`< 70%` frio, `70%–99%` `"Pode ir concluindo"`, `100%` `"Tempo concluído"`).
- **Testes de Hook (`tests/hooks/useTermometroViewModel.test.ts`)**:
  - Fluxo completo da ViewModel: configuração, início da roda, timer preenchendo apenas após `"Começar a falar"`, pausa, pulo, resumo anônimo, momento de oração e saída limpando nomes e navegando para `'/'`.
- **Testes de Tela com Mocks (`tests/mocks/termometroScreen.mock.test.tsx`)**:
  - Renderização da rota fina `src/app/termometro.tsx`, estados `loading`, `error`, `setup`, `turn`, `summary` (verificando ausência de nomes) e `prayer`.
