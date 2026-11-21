# 🏗️ Plano de Implementação Técnica (`plan.md`): uc10-complete-o-versiculo

- **Branch:** `feat/011-uc10-complete-o-versiculo`
- **Data:** 2026-11-19
- **Especificação de Origem:** `specs/011-uc10-complete-o-versiculo/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

A funcionalidade **Complete o Versículo (`UC10`)** será implementada seguindo estritamente as 7 camadas do MVVM Sofisticado: o domínio puro definirá `VersePassage` e `IVerseDataSource` em `src/model/`; na infraestrutura, `HelloAoVerseDataSource` consumirá a **Free Use Bible API** (`https://bible.helloao.org/api/por_blj/{book}/{chapter}.simple.json`, tradução *Bíblia Livre* em pt-BR) para montar dinamicamente as passagens famosas com lacunas, com fallback automático para `MemoryVerseDataSource` em modo offline/testes; `VersiculoUseCases` concentrará o sorteio sem repetição, a normalização de respostas (ignorando acentos e maiúsculas), o cálculo de pontuação (`+10`/`+5`/`0`), o aceite manual do Líder e o envio dos pontos ao `ITeamDataSource`; o `src/di/container.ts` injetará as dependências; e `useVersiculoViewModel.ts` + `src/view/versiculo.tsx` + rota fina `src/app/versiculo.tsx` entregarão a experiência acessível com componentes do `PG Play Expressive`.

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo devem estar marcados antes de gerar o `tasks.md` ou iniciar código.*

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada com os requisitos `UC10`, `RF28–RF31`, `RF35–RF37`.
- [x] **Artigo II (MVVM 7 Pastas)**: Todos os arquivos planejados residem apenas em `app`, `view`, `viewmodel`, `usecase`, `model`, `infra` ou `di`.
- [x] **Artigo II (Rotas Finas e View Burra)**: A rota `src/app/versiculo.tsx` terá apenas 2 linhas e toda a navegação (`expo-router`) ficará em `src/viewmodel/useVersiculoViewModel.ts`.
- [x] **Artigo II (Vocabulário)**: Nenhum arquivo, interface ou classe usa `Repository` ou `Connector` (apenas `DataSource` e `UseCases`).
- [x] **Artigo III (Design System)**: Todos os estilos usam exclusivamente tokens de `@/view/theme` e componentes de `@/view/components/`.
- [x] **Artigo IV (Testabilidade Offline)**: `IVerseDataSource` possui implementação `MemoryVerseDataSource` injetada via `src/di/container.ts`.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

```text
src/
├─ model/
│  ├─ entities/
│  │  ├─ versePassage.ts                 # VersePack, VerseBlank, VersePassage, VerseBlankResult
│  │  └─ minigame.ts                     # Adicionar '/versiculo' em MinigameRoute e 'book-open-variant' em MinigameIconName
│  └─ datasources/
│     └─ iVerseDataSource.ts             # export interface IVerseDataSource
├─ infra/
│  └─ datasources/
│     ├─ memoryVerseDataSource.ts        # implements IVerseDataSource (offline / testes)
│     ├─ helloAoVerseDataSource.ts       # implements IVerseDataSource (API bible.helloao.org + fallback offline)
│     └─ memoryGameCatalogDataSource.ts  # Incluir card ativo 'versiculo' (/versiculo) no catálogo do Hub
├─ usecase/
│  ├─ iVersiculoUseCases.ts              # export interface IVersiculoUseCases
│  └─ versiculoUseCases.ts               # implements IVersiculoUseCases (validação, dica, conferência, aceite do líder, placar)
├─ di/
│  └─ container.ts                       # Instancia MemoryVerseDataSource e exporta versiculoUseCases
├─ viewmodel/
│  └─ useVersiculoViewModel.ts           # export function useVersiculoViewModel(): [VersiculoState, VersiculoActions]
├─ view/
│  └─ versiculo.tsx                      # Tela espelhada consumindo useVersiculoViewModel e @/view/theme
└─ app/
   └─ versiculo.tsx                      # Rota fina de 2 linhas reexportando @/view/versiculo
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento da Tela | Componente (`@/view/components/`) | Tokens Semânticos (`@/view/theme`) |
| :--- | :--- | :--- |
| Card da passagem / passagem de turno / resumo | `GameCard` | `color.surface`, `color.surfaceContainer`, `space.lg`, `radius.lg` |
| Campos de resposta por lacuna | `ExpressiveTextField` | `color.borderFocus`, `color.statusDanger`, `space.md` |
| Cronômetro da passagem (crítico <= 10s) | `ExpressiveTimer` | `color.statusDanger`, `color.surfaceContainer`, `radius.md` |
| Seleção de pacotes, tempo e rodadas | `ExpressiveChip` | `color.brandPrimary`, `color.onBrandPrimary`, `space.sm` |
| Botões Estou Pronto / Conferir / Ver Dica / Aceitar / Próxima / Sair | `ExpressiveButton` | `color.brandPrimary`, `color.statusSuccess`, `color.statusDanger`, `space.md` |
| Confirmação de saída segura | `ConfirmModal` | `color.surface`, `color.textPrimary`, `space.lg` |

---

## 5. Estratégia de Testes (`tests/`)

- **Testes Unitários do UseCase (`tests/unit/versiculoUseCases.test.ts`)**:
  - Validação de criação de sessão (`ValidationError` com < 2 equipes, 0 pacotes, tempo/passagens inválidos).
  - Sorteio sem repetição respeitando os pacotes selecionados.
  - Normalização de resposta ignorando acentos e maiúsculas/minúsculas.
  - Cálculo de pontuação (`+10` sem dica, `+5` com dica, `0` errada/vazia) e reavaliação com *"Aceitar mesmo assim"*.
  - Registro dos pontos no `MemoryTeamDataSource` ao encerrar a partida.
- **Testes de Hook (`tests/hooks/useVersiculoViewModel.test.ts`)**:
  - Transições `[state, actions]` (`setup` -> `handoff` -> `playing` -> `review` -> `finished`), temporizador, dica, conferência, aceite do líder e navegação.
- **Testes de Tela com Mocks (`tests/mocks/versiculoScreen.mock.test.tsx`)**:
  - Renderização de estados (`loading`, `error`, `setup`, `handoff`, `playing`, `review`, `finished`) e interações acessíveis.
