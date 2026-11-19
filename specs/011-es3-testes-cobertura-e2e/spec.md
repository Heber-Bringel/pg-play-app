# 📋 Especificação de Funcionalidade (`spec.md`): Suíte Completa de Testes Automatizados, Cobertura >= 80% e 3 Fluxos E2E (ES3)

- **Branch da Feature:** `feat/011-es3-testes-cobertura-e2e`
- **Criado em:** 2026-11-19
- **Status:** Em Revisão
- **Caso(s) de Uso / Requisito(s):** `UC01–UC08` (`RF01–RF23`, `RF24–RF31`, `RNF02`, `RNF05–RNF11`) — Ref.: `docs/qualidade-e-testes/estrategia-testes-e-iso25010.md`, `docs/harness/06-testes-e-qualidade-es3.md`, `CONTRIBUTING.md` (Seção 4) e `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md` (v1.2.0)
- **Issue vinculada:** `#17` (`v0.2.0 — Núcleo & Jogos em 1 Celular (UC01–UC06)`)

---

## 1. Diagnóstico Atual do Repositório & Cenários de Usuário *(Obrigatório)*

### Panorama Atual Verificado (Linha de Base `develop`)
- **Já existente:**
  - `tests/tokens.test.ts` e `tests/unit/*.test.ts` (cobrem `PgPlayUseCases` por modalidade, `AdedonhaUseCases`, `CidadeDormeUseCases`, `ExpoSpeechNarratorAudioService` e `SupabaseMultiplayerRoomService` com mock);
  - `tests/components.test.tsx` (renderiza os componentes do Design System via `react-test-renderer` com asserções por tipo/props);
  - `tests/hooks/use*ViewModel.test.ts` (8 arquivos cobrindo ViewModels);
  - `tests/mocks/*Screen.mock.test.tsx` (8 arquivos cobrindo telas com mock de ViewModel);
  - **Baseline de cobertura (`npx jest --coverage`):** `80,15% Statements`, `67,11% Branches`, `84,75% Functions`, `80,46% Lines` (28 suítes, 183 testes passando).
- **Lacunas reais para atender à Issue `#17` (ES3):**
  1. **Cobertura de `Branches` abaixo de 80% (`67,11%`)** e ausência de `coverageThreshold` global de `80%` nas 4 métricas em `jest.config.js`;
  2. **Testes de Componentes sem consultas semânticas RNTL (`@testing-library/react-native`):** a dependência `@testing-library/react-native` ainda não está instalada/configurada e `tests/components.test.tsx` ainda usa `react-test-renderer` com busca por string de tipo em vez de `getByRole`, `getByLabelText`, `fireEvent.press` e `accessibilityState`;
  3. **Testes de Integração Real inexistentes:** não existe nenhum arquivo em `tests/integration/`;
  4. **Fluxos E2E com Maestro inexistentes:** não existe a pasta `e2e/` com os 3 fluxos obrigatórios (`01-hub-e-cadastro-equipes.yaml`, `02-partida-quiz-ate-placar.yaml`, `03-partida-forca-e-reinicio.yaml`);
  5. **Governança Git da suíte:** é obrigatório distribuir os novos testes e ajustes em pelo menos 5 commits separados por categoria (`test(view)`, `test(usecase)`, `test(viewmodel)`, `test(tests)`), nunca concentrados em um único commit.

---

### História de Usuário 1 — Cobertura >= 80% nas 4 Métricas e Suíte Consolidada das Categorias 1 a 4 (Prioridade: P1)

Como **Desenvolvedor(a) e Avaliador(a) de Engenharia de Software III**, quero que os testes unitários (`tests/unit/`), testes de componentes com consultas semânticas RNTL (`tests/components/`), testes de telas com mocks (`tests/mocks/`) e testes de hooks (`tests/hooks/`) atinjam e imponham `>= 80%` de cobertura em `statements`, `branches`, `functions` e `lines` no `jest.config.js`.

**Por que esta prioridade:** Sem `coverageThreshold >= 80%` passando em `branches`, a meta da disciplina (Critério 5) falha e ramos críticos de erro (`catch`, estados vazios e validações) permanecem desprotegidos.

**Como testar independentemente:** Executar `npm run test:coverage` e validar que todas as suítes passam e as 4 métricas globais em `All files` atingem `>= 80%`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** o relatório de cobertura atual com `67,11%` em *branches*, **Quando** novos cenários de erro (`DomainError`), estados `loading`/`error`/`empty`/`content` e ramos condicionais de ViewModels, UseCases, Infra e Componentes são adicionados, **Então** `npm run test:coverage` atinge `>= 80%` em `statements`, `branches`, `functions` e `lines` e aplica `coverageThreshold` no `jest.config.js`.
2. **Dado** os componentes visuais de `src/view/components/`, **Quando** os testes em `tests/components/` utilizam `@testing-library/react-native` (`render`, `screen.getByRole`, `screen.getByLabelText`, `fireEvent`), **Então** validam comportamento real, acessibilidade (`accessibilityRole`, `accessibilityLabel`, `accessibilityState`) e prevenção de acionamento quando `disabled={true}` (`ExpressiveButton`, `ExpressiveTextField`, `ExpressiveTimer`, `QuizOption`, `LetterKey`, `GameCard`, `ExpressiveChip`, `ConfirmModal`).
3. **Dado** as telas em `src/view/`, **Quando** os testes em `tests/mocks/*.mock.test.tsx` isolam a ViewModel, **Então** validam deterministicamente os 4 estados visuais (`loading`, `error`, `empty` quando aplicável e `content`).

---

### História de Usuário 2 — Testes de Integração Real sem Mockar o Domínio (Prioridade: P1)

Como **Líder do PG / Engenheiro(a) de Qualidade**, quero executar testes de integração em `tests/integration/` conectando `View + ViewModel + UseCase + MemoryDataSource` reais (mockando apenas `expo-router` na fronteira de navegação), comprovando que formulário, validação, atualização de estado e renderização funcionam em conjunto.

**Por que esta prioridade:** Atende ao Critério 6 de ES3 e garante que a integração entre as camadas do MVVM Sofisticado funcione sem desvios de contrato.

**Como testar independentemente:** Executar `npx jest tests/integration` com banco 100% em memória (`MemoryGameCatalogDataSource` e `MemoryTeamDataSource`).

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** a tela `HubScreen` integrada a `useHubViewModel`, `PgPlayUseCases` e `Memory*DataSource` (`tests/integration/hubFlow.integration.test.tsx`), **Quando** o usuário visualiza o destaque da equipe líder, alterna o filtro de modalidade (`Todos`, `1 Celular`, `Multi-Celular`) e seleciona um minigame disponível, **Então** o catálogo é filtrado com latência `0 ms` sem necessidade de busca textual (`RF03/RF04` adiados na v1.2.0) e aciona a navegação da rota esperada no `expo-router`.
2. **Dado** a tela `TeamsScreen` integrada ao domínio real (`tests/integration/teamsManagement.integration.test.tsx`), **Quando** o usuário digita um nome inválido (`"A"` ou duplicado) e confirma, **Então** o `PgPlayUseCases` lança `ValidationError` e a tela exibe a mensagem de erro sem adicionar à lista; **Quando** digita `"Águias do Vale"` e confirma, **Então** a equipe aparece na lista; **Quando** remove equipes até restar `< 2`, **Então** o botão `"Começar Rodada!"` fica `disabled: true` (e exibe estado vazio em `0` equipes), voltando a habilitar ao atingir `>= 2` equipes.
3. **Dado** a tela `QuizScreen` integrada ao domínio real (`tests/integration/quizRound.integration.test.tsx`), **Quando** a equipe toca em `"Estou Pronto!"`, seleciona uma alternativa correta ou incorreta e avança até o fim das perguntas configuradas, **Então** a pontuação é gravada no `MemoryTeamDataSource` real e a navegação para `/scoreboard` exibe o ranking atualizado.

---

### História de Usuário 3 — 3 Fluxos E2E Automatizados com Maestro (Prioridade: P1)

Como **Avaliador(a) do Aplicativo**, quero executar 3 fluxos E2E completos com Maestro em `e2e/` simulando jornadas reais no emulador/dispositivo (`br.edu.ifpi.pgplay`) do início ao fim.

**Por que esta prioridade:** Atende ao Critério 7 de ES3, validando navegação real entre rotas do Expo Router sem mocks de tela.

**Como testar independentemente:** Validar a sintaxe YAML e executar `maestro test e2e/` em emulador Android/iOS com estado inicial limpo (`launchApp: { clearState: true }`).

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** o fluxo `e2e/01-hub-e-cadastro-equipes.yaml`, **Quando** o app inicia com estado limpo (`launchApp: { clearState: true }`), **Então** o fluxo verifica o Hub de Jogos, testa o filtro por modalidade (`1 Celular` / `Todos`), navega para `Equipes`, valida erro em nome inválido/cadastro válido de nova equipe e garante o botão `"Começar Rodada!"` habilitado.
2. **Dado** o fluxo `e2e/02-partida-quiz-ate-placar.yaml`, **Quando** inicia uma partida de Quiz Relâmpago a partir do Hub/Equipes, **Então** percorre a passagem de turno (`"Estou Pronto!"`), responde perguntas selecionando alternativas `A–D`, avança até o resumo final e navega para o Placar Geral verificando o ranking exibido.
3. **Dado** o fluxo `e2e/03-partida-forca-e-reinicio.yaml`, **Quando** inicia o Jogo da Forca, **Então** confirma a passagem de turno, interage com o teclado alfabético (`A–Z`), conclui/navega até o Placar e executa `"Zerar Placar do PG"` confirmando a limpeza das pontuações.

---

### História de Usuário 4 — Vistoria do Histórico Git e Qualidade ISO/IEC 25010 (Prioridade: P2)

Como **Docente / Revisor(a) Técnico(a)**, quero auditar o histórico de commits e os arquivos de teste verificando ausência de `.only`/`.skip`, aderência ao padrão AAA com nomes descritivos em português e commits incrementais por categoria.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** o diretório `tests/` e `e2e/`, **Quando** executada inspeção estática por `.only` e `.skip`, **Então** zero ocorrências são encontradas.
2. **Dado** o histórico `git log --oneline`, **Quando** filtrados os commits da entrega da Issue `#17`, **Então** há no mínimo 5 commits `test(<escopo>): ...` distintos por categoria (`unit`, `components`, `hooks`, `mocks`, `integration`, `coverage/e2e`).

---

### Casos de Borda (Edge Cases)

- **Alinhamento à v1.2.0 (`RF03`/`RF04` adiados no Hub):** a versão atual `src/view/index.tsx` removeu o campo de busca textual mantendo o filtro por modalidade (`Todos`, `1 Celular`, `Multi-Celular`). Testes de integração e E2E devem validar o filtro por modalidade real existente na tela sem depender de campo de busca ausente.
- **Compatibilidade RNTL + React 19 / RN 0.88:** `@testing-library/react-native` deve ser instalado/configurado em versão compatível com `react@19.3.0` e mocks de `tests/__mocks__/react-native.tsx` (incluindo `Modal`, `Pressable`, `TextInput` e `accessibilityRole`).
- **Estabilidade de testes E2E (anti-flakiness):** usar `launchApp: { clearState: true }` e sincronização por `assertVisible` em rótulos semânticos reais; nunca usar esperas fixas (`sleep`) nem depender de rede externa (usar fluxo 1 Celular determinístico).
- **Cobertura de `supabaseMultiplayerRoomService.ts` e `asyncStorageTeamDataSource.ts`:** arquivos com cobertura atual baixa (`55,75%` e `11,11%`) reduzem fortemente a métrica global de `Branches` (`67,11%`). Devem receber testes unitários dedicados com cliente/storage mockados.
- **Preservação do Harness:** nenhum ajuste em `src/` (caso necessário para expor `accessibilityRole` ou `testID` faltante) pode violar `scripts/check-arquitetura.mjs`.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-ES3-01` (Testes Unitários):** Cobrir casos de sucesso, `ValidationError`/`DataSourceError` e borda para UseCases, tokens de tema, `AsyncStorageTeamDataSource` e `SupabaseMultiplayerRoomService`.
- **`RF-ES3-02` (Testes de Componentes RNTL):** Migrar/estruturar `tests/components/` com `@testing-library/react-native` usando consultas semânticas (`getByRole`, `getByLabelText`, `accessibilityState`, `fireEvent`).
- **`RF-ES3-03` (Testes com Mocks):** Garantir cobertura dos 4 estados (`loading`, `error`, `empty`, `content`) em `tests/mocks/*.mock.test.tsx`.
- **`RF-ES3-04` (Testes de Hooks):** Validar estado inicial, transição via `act()` e tratamento de `DomainError` em `tests/hooks/use*ViewModel.test.ts`.
- **`RF-ES3-05` (Cobertura `>= 80%`):** Configurar `coverageThreshold` global de `80%` (`statements`, `branches`, `functions`, `lines`) no `jest.config.js` e garantir aprovação em `npm run test:coverage`.
- **`RF-ES3-06` (Integração Real):** Implementar 3 suítes em `tests/integration/` (`hubFlow`, `teamsManagement`, `quizRound`) sem mockar `ViewModel`, `UseCase` ou `MemoryDataSource`.
- **`RF-ES3-07` (3 Fluxos E2E Maestro):** Criar os 3 fluxos em `e2e/` vinculados ao `appId: br.edu.ifpi.pgplay`.

### Entidades de Domínio Envolvidas (`src/model/entities/`)
- **`Minigame`**, **`GameModalityFilter`**, **`Team`**, **`MimicaCard`**, **`QuizQuestion`**, **`ForcaPuzzle`**: exercitadas integralmente nos testes unitários, hooks e integração sem alteração estrutural no domínio.

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (Cobertura Global):** `npm run test:coverage` aprovado com `>= 80%` em `statements`, `branches`, `functions` e `lines`.
- **`CS-02` (Qualidade e Acessibilidade RNTL):** Consultas semânticas validam `accessibilityRole`, `accessibilityLabel` e `accessibilityState` nos componentes (`48 dp` / `64 dp`, `RNF07`, `RNF08`), sem uso de `.only` ou `.skip`.
- **`CS-03` (Arquitetura MVVM e Git):** `npm run check` passa com **0 violações** e o histórico apresenta `>= 5` commits `test(...)` separados por categoria.
