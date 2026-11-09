# 06 · Testes Automatizados, Cobertura (>= 80%) e Fluxos E2E (Eng. de Software III)

Este documento integra os requisitos práticos da disciplina de **Engenharia de Software III** (Prof. Jeferson Soares) ao **Harness MVVM Sofisticado** do **PG PLAY**.

> 📄 **Documento de Referência Completo (ISO/IEC 25010 + Defesa Oral):** [`docs/qualidade-e-testes/estrategia-testes-e-iso25010.md`](../qualidade-e-testes/estrategia-testes-e-iso25010.md)

---

## 1. As 7 Categorias Obrigatórias e Onde Vivem

Todos os testes devem validar **comportamentos reais do PG PLAY** (proibido criar testes triviais, exemplos genéricos fora do domínio ou usar `.only` / `.skip`):

| # | Categoria Exigida | Pasta / Localização | O que testar na Arquitetura MVVM Sofisticada |
| :-: | :--- | :--- | :--- |
| **1** | **Testes Unitários** | `tests/unit/*.test.ts` | Regras de negócio, validações e cálculos em `src/usecase/pgPlayUseCases.ts`, `src/model/errors.ts` e tokens de `src/view/theme.ts`. Deve cobrir **sucesso**, **falha (`ValidationError`)** e **casos de borda**. |
| **2** | **Testes de Componentes** | `tests/components/*.test.tsx` | Os 6 componentes de `src/view/components/` renderizados com **React Native Testing Library (`@testing-library/react-native`)**, validando texto visível, `accessibilityRole`, `accessibilityLabel`, `accessibilityState` e eventos (`fireEvent.press`, `fireEvent.changeText`). |
| **3** | **Componentes com Mocks** | `tests/mocks/*.mock.test.tsx` | Telas de `src/view/` isolando a `ViewModel` (`jest.spyOn`) ou serviços externos (`IMultiplayerRoomService`, `INarratorAudioService`, `expo-router`) para testar deterministicamente os 4 estados visuais: **carregando**, **erro**, **vazio** e **conteúdo**. |
| **4** | **Testes de Hooks** | `tests/hooks/use*ViewModel.test.ts` | Nossas **ViewModels (`src/viewmodel/use*ViewModel.ts`)** testadas com `renderHook` e `act`, verificando: **estado inicial**, **atualização de estado** após ação e **tratamento de erro (`DomainError`)** ou retorno alternativo. |
| **5** | **Cobertura de Código** | `npm run test:coverage` | Meta mínima obrigatória de **80% em `statements`, `branches`, `functions` e `lines`** configurada em `coverageThreshold` no Jest. |
| **6** | **Testes de Integração** | `tests/integration/*.integration.test.tsx` | Integração real entre `View + ViewModel + UseCase + MemoryDataSource` (sem mockar o UseCase nem o DataSource em memória), comprovando o ciclo **formulário → validação → atualização de estado → exibição na tela**. |
| **7** | **Pelo menos 3 Fluxos E2E** | `e2e/*.yaml` (Maestro) | Execução automatizada em emulador/dispositivo cobrindo 3 jornadas completas do usuário (`01-hub-e-cadastro-equipes.yaml`, `02-partida-quiz-ate-placar.yaml`, `03-partida-forca-e-reinicio.yaml`). |

---

## 2. Regras de Ouro na Escrita dos Testes

1. **Padrão AAA (*Arrange, Act, Assert*)**:
   - **Preparar (*Arrange*)**: instanciar `Memory*DataSource`, `PgPlayUseCases` ou renderizar o componente/hook com estado inicial limpo.
   - **Agir (*Act*)**: chamar o método do UseCase, executar `act(() => actions.handle...)` ou disparar `fireEvent.press` / `fireEvent.changeText`.
   - **Verificar (*Assert*)**: validar a consequência observável pela pessoa usuária (texto exibido, estado de acessibilidade, mudança na lista ou erro semântico).
2. **Nomes Descritivos de Comportamento (em Português)**:
   - Nunca use nomes genéricos como `test("teste 1")` ou `it("funciona")`.
   - Use frases que descrevam a regra de negócio:
     - `it("não deve adicionar equipe quando o nome tiver menos de 2 letras")`
     - `it("deve impedir o início da rodada quando restar apenas 1 equipe cadastrada")`
     - `it("não deve permitir pontuação negativa ao pular palavra na Mímica com placar zero")`
3. **Consultas Semânticas Primeiro (RNTL)**:
   - Priorize `getByRole`, `getByLabelText`, `getByText` e `getByPlaceholderText`.
   - Use `queryBy*` apenas para asserções de ausência (`expect(queryByText(...)).toBeNull()`).
   - Use `findBy*` para aguardar elementos assíncronos.
4. **Proibição de `.only` e `.skip`**:
   - Nenhum arquivo em `tests/` pode ser commitado com `describe.only`, `it.only`, `test.only`, `it.skip` ou `test.skip`.

---

## 3. Regra de Histórico Git para Testes (Vistoria Obrigatória)

A avaliação de **Engenharia de Software III** audita o histórico de commits (`git log --oneline` e `git show`):
- **É terminantemente proibido** concentrar todos os testes em um único commit final.
- Realize **no mínimo 5 commits separados de testes** usando o tipo `test(<escopo>): <descrição no imperativo>`, distribuídos entre as categorias:
  1. `test(view): adicionar testes de componentes do design system com rntl`
  2. `test(usecase): adicionar testes unitarios de regras de equipes e arenas`
  3. `test(viewmodel): adicionar testes dos hooks de viewmodel com renderhook`
  4. `test(view): adicionar testes de telas com mocks de viewmodel e servicos`
  5. `test(tests): adicionar testes de integracao real entre view, viewmodel e usecase`
  6. `test(tests): configurar cobertura minima de 80% e adicionar 3 fluxos e2e maestro`
