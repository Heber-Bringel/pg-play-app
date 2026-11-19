# 🏗️ Plano de Implementação Técnica (`plan.md`): Suíte Completa de Testes Automatizados, Cobertura >= 80% e 3 Fluxos E2E (ES3)

- **Branch:** `feat/011-es3-testes-cobertura-e2e`
- **Data:** 2026-11-19
- **Especificação de Origem:** `specs/011-es3-testes-cobertura-e2e/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

Consolidar a estratégia de qualidade e testes automatizados de **Engenharia de Software III** (ISO/IEC 25010) sobre a arquitetura **MVVM Sofisticado**:
1. Instalar `@testing-library/react-native` compatível com Expo/React 19 e estruturar testes semânticos em `tests/components/` para todos os componentes de `src/view/components/`;
2. Expandir a cobertura de `branches` (atualmente `67,11%`) com foco em `asyncStorageTeamDataSource.ts`, `supabaseMultiplayerRoomService.ts`, ramos de erro `catch (err: unknown)` em ViewModels/UseCases e seções visuais de `Adedonha`/`CidadeDorme`;
3. Implementar as 3 suítes de integração real (`View + ViewModel + UseCase + MemoryDataSource`) em `tests/integration/`;
4. Impor `coverageThreshold` global de `80%` em `jest.config.js` e adicionar os 3 fluxos Maestro em `e2e/`, registrando commits atômicos separados por categoria (`test(...)`).

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo devem estar marcados antes de gerar o `tasks.md` ou iniciar código.*

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada contra `docs/qualidade-e-testes/estrategia-testes-e-iso25010.md` e `docs/harness/06-testes-e-qualidade-es3.md`.
- [x] **Artigo II (MVVM 7 Pastas)**: Nenhuma pasta extra será criada dentro de `src/`; os artefatos de teste residem exclusivamente em `tests/` e `e2e/`.
- [x] **Artigo II (Rotas Finas e View Burra)**: Testes de integração mockam apenas `expo-router` na fronteira de navegação; nenhuma regra de negócio será movida para `src/view/`.
- [x] **Artigo II (Vocabulário)**: Todos os dublês, fábricas e asserções preservam exclusivamente os contratos `DataSource` e `Service`.
- [x] **Artigo III (Design System)**: `tests/tokens.test.ts` e `tests/components/` validam tokens semânticos/de componente de `@/view/theme` e acessibilidade (`48 dp` / `64 dp`, cor + forma + ícone).
- [x] **Artigo IV (Testabilidade Offline)**: Os testes de integração utilizam exclusivamente implementações `Memory*DataSource` injetadas nos UseCases e ViewModels sem dependência de rede.

---

## 3. Mapeamento de Arquivos nas Camadas do Projeto

```text
jest.config.js                                         # Adiciona coverageThreshold global >= 80% (statements, branches, functions, lines)
package.json                                           # Adiciona devDependency @testing-library/react-native (compatível com React 19)
tests/
├─ setup.ts                                            # Mantém IS_REACT_ACT_ENVIRONMENT e configuração RNTL se necessário
├─ __mocks__/
│  ├─ react-native.tsx                                 # Garante compatibilidade com consultas semânticas do RNTL (Pressable, TextInput, Modal)
│  └─ async-storage.ts                                 # Mock determinístico para testar AsyncStorageTeamDataSource (se aplicável)
├─ unit/
│  ├─ asyncStorageTeamDataSource.test.ts               # Novo: cobre listTeams, addTeam, removeTeam, addScore, resetScores e DataSourceError
│  ├─ supabaseMultiplayerRoomService.test.ts           # Expandido: cobre branches de erro, fallback e métodos de Adedonha/Cidade Dorme
│  ├─ pgPlayUseCases.*.test.ts                         # Revisado: fecha 100% dos branches de erro e casos de borda
│  └─ cidadeDormeUseCases.test.ts                      # Expandido: fecha branches de validação e erro
├─ components/
│  ├─ expressiveButton.test.tsx                        # Testes RNTL com getByRole, accessibilityState e fireEvent.press
│  ├─ expressiveTextField.test.tsx                     # Testes RNTL com getByLabelText, fireEvent.changeText e erro semântico
│  ├─ expressiveTimer.test.tsx                         # Testes RNTL validando MM:SS e transição <= 10s
│  ├─ quizOption.test.tsx                              # Testes RNTL validando estados default/selected/correct/wrong e bloqueio
│  ├─ letterKey.test.tsx                               # Testes RNTL validando available/hit/miss e alvo 48dp
│  └─ gameCard.test.tsx                                # Testes RNTL validando card clicável, highlightLeader e disabled
├─ mocks/
│  ├─ teamsScreen.mock.test.tsx                        # Garante cobertura dos 4 estados (loading, error, empty, content)
│  ├─ hubScreen.mock.test.tsx                          # Garante cobertura de erro/retry, filtro e estados visuais
│  └─ *Screen.mock.test.tsx                            # Amplia cobertura de branches das telas restantes
├─ hooks/
│  └─ use*ViewModel.test.ts                            # Amplia testes de catch(DomainError), retry e fluxos alternativos
└─ integration/
   ├─ hubFlow.integration.test.tsx                     # View + useHubViewModel + PgPlayUseCases + Memory*DataSource
   ├─ teamsManagement.integration.test.tsx             # View + useTeamsViewModel + PgPlayUseCases + MemoryTeamDataSource
   └─ quizRound.integration.test.tsx                   # View + useQuizViewModel + PgPlayUseCases + Memory*DataSource
e2e/
├─ 01-hub-e-cadastro-equipes.yaml                      # Fluxo Maestro 1 (appId: br.edu.ifpi.pgplay, clearState: true)
├─ 02-partida-quiz-ate-placar.yaml                     # Fluxo Maestro 2 (Quiz Relâmpago completo até o Placar)
└─ 03-partida-forca-e-reinicio.yaml                    # Fluxo Maestro 3 (Jogo da Forca até Zerar Placar)
```

*(Observação: apenas caso algum componente em `src/view/` impeça consulta semântica por ausência de `accessibilityRole`/`accessibilityLabel`, serão feitos ajustes mínimos mantendo 100% de conformidade com `scripts/check-arquitetura.mjs`.)*

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento Validado | Componente (`@/view/components/`) | Tokens Semânticos (`@/view/theme`) |
| :--- | :--- | :--- |
| Botões de ação e Jumbo | `ExpressiveButton` | `tokens.component.button.*`, `tokens.semantic.color.*`, `tokens.semantic.radius.*` |
| Entrada de texto validada | `ExpressiveTextField` | `tokens.component.input.*`, `tokens.semantic.color.error`, `tokens.semantic.color.onSurfaceMuted` |
| Card de jogo e destaque de líder | `GameCard` | `tokens.component.card.*`, `tokens.semantic.color.highlight`, `tokens.semantic.elevation.*` |
| Cronômetro de rodada e modo crítico | `ExpressiveTimer` | `tokens.component.timer.*`, `tokens.semantic.motion.spring.spatial` |
| Alternativas `A–D` do Quiz | `QuizOption` | `tokens.component.quiz.*`, `tokens.semantic.color.success`, `tokens.semantic.color.error` |
| Teclado alfabético `A–Z` da Forca | `LetterKey` | `tokens.component.key.*`, `tokens.semantic.radius.full` |
| Filtros e opções de modalidade | `ExpressiveChip` | `tokens.semantic.color.actionContainer`, `tokens.semantic.color.focus` |
| Diálogo de confirmação de saída | `ConfirmModal` | `tokens.semantic.color.scrim`, `tokens.component.card.*` |

---

## 5. Estratégia de Testes e Commits (`tests/` e `e2e/`)

- **Commits obrigatórios separados por categoria (Mínimo 5 commits `test(...)`):**
  1. `test(view): migrar testes dos componentes do design system para rntl`
  2. `test(infra): adicionar testes unitarios do asyncstorage e ampliar supabase`
  3. `test(usecase): ampliar cobertura de branches nos casos de uso`
  4. `test(viewmodel): cobrir ramos de erro e transicoes nos hooks de viewmodel`
  5. `test(view): cobrir estados de tela com mocks em tests/mocks`
  6. `test(tests): adicionar testes de integracao real entre view e dominio`
  7. `test(tests): configurar cobertura minima de 80% e fluxos e2e maestro`
- **Validação final:** `npm run check`, `npm run test:coverage` e inspeção estática contra `.only` / `.skip`.
