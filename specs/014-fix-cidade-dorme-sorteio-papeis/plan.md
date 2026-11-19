# 🏗️ Plano de Implementação Técnica (`plan.md`): Sorteio Aleatório de Papéis (Fisher-Yates) no Cidade Dorme

- **Branch:** `fix/014-cidade-dorme-sorteio-papeis`
- **Data:** 2026-11-19
- **Especificação de Origem:** `specs/014-fix-cidade-dorme-sorteio-papeis/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

Corrigir o sorteio previsível de papéis do **Cidade Dorme (`Issue #39`)** na camada de regra de negócio (`src/usecase/cidadeDormeUseCases.ts`):
1. Implementar a função pura `shuffleRoles(roles, random)` com o algoritmo **Fisher-Yates** sobre uma cópia do array;
2. Substituir o deslocamento fixo por `roundSeed` em `buildRolePool` pelo embaralhamento Fisher-Yates usando a fonte `random` injetada no construtor de `CidadeDormeUseCases` (padrão `Math.random`);
3. Garantir que tanto `startMatch` quanto `restartMatch` executem novo embaralhamento e manter `src/di/container.ts`, `ViewModel` e `View` totalmente compatíveis;
4. Adicionar testes de regressão determinísticos em `tests/unit/cidadeDormeUseCases.test.ts` (e alinhar a RPC de `#40` quando implementada).

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo devem estar marcados antes de gerar o `tasks.md` ou iniciar código.*

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada com os requisitos `UC07` / `RF18`.
- [x] **Artigo II (MVVM 7 Pastas)**: A alteração concentra-se exclusivamente em `src/usecase/cidadeDormeUseCases.ts` e `tests/unit/cidadeDormeUseCases.test.ts`.
- [x] **Artigo II (Rotas Finas e View Burra)**: Nenhuma regra de sorteio vai para `src/view/` ou `src/viewmodel/`.
- [x] **Artigo II (Vocabulário)**: Nenhum arquivo, interface ou classe usa termos proibidos (apenas `UseCases`, `DataSource` e `Service`).
- [x] **Artigo III (Design System)**: Não há impacto visual na interface; os cards de revelação exibem o papel sorteado normalmente.
- [x] **Artigo IV (Testabilidade Offline)**: A injeção opcional `random: () => number = Math.random` torna os testes unitários 100% determinísticos em memória.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

```text
src/
├─ model/                                             # Sem alteração (usa CidadeDormeRole e CidadeDormePlayer existentes)
├─ infra/                                             # Sem alteração local (em conjunto com #40, RPC Supabase também embaralha via ORDER BY random())
├─ usecase/
│  └─ cidadeDormeUseCases.ts                          # Adiciona shuffleRoles (Fisher-Yates), injeta random no construtor e corrige buildRolePool
├─ di/
│  └─ container.ts                                    # Inalterado (usa default Math.random)
├─ viewmodel/                                         # Inalterado
├─ view/                                              # Inalterado
└─ app/                                               # Inalterado
tests/
└─ unit/
   └─ cidadeDormeUseCases.test.ts                     # Adiciona testes de regressão do sorteio Fisher-Yates e revanche
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento da Tela | Componente (`@/view/components/`) | Tokens Semânticos (`@/view/theme`) |
| :--- | :--- | :--- |
| Card de revelação do papel sorteado | `CidadeDormeRoleSection` (`ExpressiveButton`, `GameCard`) | `tokens.component.card.*`, `tokens.semantic.color.success`, `tokens.semantic.color.errorContainer` |

---

## 5. Estratégia de Testes (`tests/`)

- **Testes Unitários (`tests/unit/cidadeDormeUseCases.test.ts`):**
  - **Variação entre partidas e fim da ordem fixa:** instanciar `CidadeDormeUseCases` com sequências `random` determinísticas e verificar que o jogador na posição `0` (Anfitrião) não recebe `detetive` em todas as combinações.
  - **Invariante de quantidades:** testar salas com 5, 8, 12 e 16 jogadores e `assassinCount` igual a `1`, `2` e `3`, confirmando sempre `1 detetive`, `1 anjo`, `assassinCount` assassinos e o restante `cidadao`.
  - **Revanche (`restartMatch`):** confirmar que `restartMatch` invoca novamente o embaralhamento gerando distribuição distinta da primeira partida quando `random` avança.
  - **Extremos de `random()` (`0` e `0.999999`):** garantir que nenhum papel sai `undefined`.
