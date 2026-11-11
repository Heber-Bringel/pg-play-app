# 🏗️ Plano de Implementação Técnica (`plan.md`): 006-uc05-arena-forca

- **Branch:** `feat/006-uc05-arena-forca`
- **Data:** 2026-11-10
- **Especificação de Origem:** `specs/006-uc05-arena-forca/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`
- **Autor / Perfil:** Roger Pierre (`RogerPierre`)
- **Issue Vinculada:** `#7` (`[UC05] Implementar Arena do Jogo da Forca (RF13–RF15)`)

---

## 1. Resumo Técnico

Implementação da **Arena do Jogo da Forca (`UC05`)** de dentro para fora seguindo as 7 camadas do **MVVM Sofisticado**:
1. Domínio puro em `src/model/`:
   - Adicionar tipos `ForcaCategory` e `ForcaPuzzle` em `src/model/entities/arenaChallenge.ts`.
   - Adicionar método `listForcaPuzzles(categories?: ForcaCategory[]): Promise<ForcaPuzzle[]>` em `src/model/datasources/iGameCatalogDataSource.ts`.
2. Infraestrutura em `src/infra/`:
   - Implementar `listForcaPuzzles` em `src/infra/datasources/memoryGameCatalogDataSource.ts` com banco diversificado de palavras com dicas (incluindo `COMUNHÃO` com dica *"Propósito essencial de um Pequeno Grupo (PG)"*, alinhada à tela de referência).
3. Regras de Negócio em `src/usecase/` e `src/di/`:
   - Atualizar contrato `IPgPlayUseCases` e classe `PgPlayUseCases` com `listForcaPuzzles` e `scoreForcaWord(teamId, remainingAttempts)` calculando `+30 pts` mais bônus de `+2 pts` por tentativa não utilizada (**RF27**).
   - Injetar no container `src/di/container.ts`.
4. Apresentação em `src/viewmodel/`, `src/view/` e `src/app/`:
   - Criar `useForcaViewModel` em `src/viewmodel/useForcaViewModel.ts` gerenciando o ciclo de vida da partida da forca, fases (`pass-turn`, `playing`, `word-result`, `finished`), normalização de acentos, palpites com `LetterKey`, reinício de palavra e navegação (`expo-router`).
   - Criar a tela `src/view/forca.tsx` espelhando a referência visual com tokens do Design System (`GameCard`, `LetterKey`, `ExpressiveButton`, badge de tentativas).
   - Criar a rota fina de 2 linhas em `src/app/forca.tsx`.
5. Testes:
   - Testes unitários do UseCase em `tests/unit/pgPlayUseCases.forca.test.ts`.
   - Testes do hook `useForcaViewModel` em `tests/hooks/useForcaViewModel.test.ts`.
   - Testes de tela com mocks em `tests/mocks/forcaScreen.mock.test.tsx`.

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Validação dos Pilares do Harness:*

- [x] **Artigo I (SDD)**: A especificação `spec.md` detalha as Histórias de Usuário, critérios de aceitação e referências a `UC05`.
- [x] **Artigo II (MVVM 7 Pastas)**: Todos os novos arquivos e modificações residem exclusivamente nas 7 pastas permitidas (`model`, `infra`, `usecase`, `di`, `viewmodel`, `view`, `app`).
- [x] **Artigo II (Rotas Finas e View Burra)**: A rota `src/app/forca.tsx` contém apenas 2 linhas e toda a navegação (`expo-router`) reside em `src/viewmodel/useForcaViewModel.ts`.
- [x] **Artigo II (Vocabulário)**: Contratos utilizam apenas `interface` e `DataSource` (nunca `Repository`).
- [x] **Artigo III (Design System)**: Uso restrito aos tokens semânticos de `@/view/theme` e componentes oficiais de `@/view/components/`.
- [x] **Artigo IV (Testabilidade Offline)**: Infraestrutura baseada em `MemoryGameCatalogDataSource` e `MemoryTeamDataSource` permitindo execução 100% offline.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

```text
src/
├─ model/
│  ├─ entities/arenaChallenge.ts              # ForcaCategory, ForcaPuzzle
│  └─ datasources/iGameCatalogDataSource.ts   # listForcaPuzzles
├─ infra/
│  └─ datasources/memoryGameCatalogDataSource.ts # Implementação com banco de palavras e dicas
├─ usecase/
│  ├─ iPgPlayUseCases.ts                      # Contrato com listForcaPuzzles e scoreForcaWord
│  └─ pgPlayUseCases.ts                       # Regra de +30 pts + bônus de +2 pts por tentativa
├─ di/
│  └─ container.ts                            # Reutiliza pgPlayUseCases atualizado
├─ viewmodel/
│  └─ useForcaViewModel.ts                    # Hook de estado e ações da forca
├─ view/
│  └─ forca.tsx                               # View da Arena da Forca
└─ app/
   └─ forca.tsx                               # Rota fina reexportando @/view/forca
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento da Tela | Componente (`@/view/components/`) | Tokens Semânticos (`@/view/theme`) |
| :--- | :--- | :--- |
| Cabeçalho / Botão Sair | `ExpressiveButton` (`variant="outlined"`, `icon="chevron-left"`) | `space.md`, `color.surface`, `color.onSurface` |
| Badge Tentativas Restantes | `View` + `Text` com ícone de coração | `color.primaryContainer`, `color.onPrimaryContainer`, `radius.full`, `space.xs` |
| Card de Dica Temática | `GameCard` (`icon="lightbulb-on"` / `"cross"`) | `card.bg`, `card.radius`, `card.padding`, `font.title` |
| Lacunas da Palavra Oculta | Grade de caixas com letras | `color.primary`, `color.outline`, `radius.sm`, `font.title`, `font.display` |
| Teclado da Forca (A-Z) | `LetterKey` (`status="available" \| "hit" \| "miss"`) | `component.key.size` (`48 dp`), `color.success`, `color.error` |
| Botão Reiniciar Palavra | `ExpressiveButton` (`variant="tonal"`, `icon="refresh"`) | `color.secondaryContainer`, `color.onSecondaryContainer`, `radius.full` |
| Botão Estou Pronto! / Próxima Palavra | `ExpressiveButton` (`variant="primaryJumbo"`, `icon="play"`) | `button.bg`, `button.label`, `button.jumboHeight` (`64 dp`) |
| Botão Ir para o Placar Final | `ExpressiveButton` (`variant="successJumbo"`, `icon="trophy"`) | `color.success`, `button.jumboHeight` (`64 dp`) |

---

## 5. Estratégia de Testes (`tests/`)

1. **Testes Unitários (`tests/unit/pgPlayUseCases.forca.test.ts`)**:
   - Listagem de puzzles da forca (todas as categorias e filtradas por categoria).
   - Pontuação por vitória: `scoreForcaWord` somando 30 pontos base + 2 pontos por tentativa restante.
   - Validação de erro quando `teamId` inexistente é informado.
2. **Testes de Hook / ViewModel (`tests/hooks/useForcaViewModel.test.ts`)**:
   - Inicialização em fase `pass-turn`.
   - Transição para `playing` ao acionar `handleStartTurn`.
   - Palpites com acerto (`hit`), normalização de acentos (`A` descobrindo `Ã`, etc.) e erro (`miss`) decrementando tentativas.
   - Ação `handleResetWord` restaurando tentativas e palpites da palavra atual.
   - Condição de vitória revelando todas as letras e transição de rodada/finalização.
   - Condição de derrota com tentativas zeradas revelando a palavra sem pontuação.
   - Navegação para `/scoreboard` ao finalizar.
3. **Testes de Componente / Mock Screen (`tests/mocks/forcaScreen.mock.test.tsx`)**:
   - Renderização dos estados `loading`, `error`, equipes insuficientes e arena de jogo com teclado e lacunas.
