# 🧪 Estratégia de Testes Automatizados e Qualidade ISO/IEC 25010 — PG PLAY

**Projeto:** PG PLAY — Minigames para Pequenos Grupos  
**Disciplinas Integradas:**
- **Engenharia de Software III** (Prof. Jeferson Soares)
- **Programação para Dispositivos Móveis — PDM**
- **Interação Humano-Computador — IHC**  
**Curso:** Análise e Desenvolvimento de Sistemas — **IFPI Campus Piripiri**  
**Equipe:** Héber Bringel, Douglas Leone, Mikaelle Barroso e Roger Pierre  

---

## 1. Qualidade de Software baseada na ISO/IEC 25010

Em conformidade com a norma **ISO/IEC 25010** (Modelo de Qualidade de Produto de Software) e os requisitos do trabalho final de **Engenharia de Software III**, selecionamos **quatro características de qualidade** críticas para o contexto de uso do **PG PLAY** (dinâmicas presenciais em grupo sob contagem regressiva e salas multiplayer).

Para cada característica abaixo, respondemos aos **4 tópicos obrigatórios** da avaliação:

---

### 1.1. Adequação Funcional (*Functional Suitability* — Correção e Completude Funcional)

1. **Por que ela é importante para o aplicativo?**
   - Em dinâmicas competitivas de grupo, qualquer erro no cálculo de pontos (ex.: somar pontos errados na *Forca*, deixar a pontuação negativa ao pular palavra na *Mímica*, repetir a mesma pergunta na partida ou permitir iniciar uma rodada com apenas 1 equipe) destrói a justiça da competição e a confiança do grupo no aplicativo.
2. **Qual funcionalidade, tela ou fluxo está relacionado a ela?**
   - **Gestão de Equipes (`UC01` / `src/view/teams.tsx`)**: validação de nome mínimo (`>= 2` letras), bloqueio de nomes duplicados (`case-insensitive`) e exigência de no mínimo `2` equipes para liberar o botão *"Começar Rodada!"* (**RF06**, **RF08**).
   - **Arenas de Mímica, Quiz e Forca (`UC03–UC05`)**: cálculo de `+20 pts` por acerto e `-5 pts` por pulo (piso em `0 pts`) na *Mímica* (**RF13**, **RF25**); `+10 pts` no *Quiz* (**RF14**, **RF26**); `+30 pts + 2 pts × tentativas restantes` e comparação de letras ignorando acentos/cedilha (`A` revela `Á`, `Ã`, `Â`; `C` revela `Ç`) na *Forca* (**RF15**, **RF27**).
   - **Adedonha Bíblica (`UC08`)**: pré-classificação automática de respostas únicas (`+10 pts`), repetidas (`+5 pts`) e inválidas/vazias (`0 pts`) (**RF22**, **RF23**).
3. **Como a equipe buscou atendê-la?**
   - Isolando 100% das regras de negócio, cálculos e validações na camada pura `src/usecase/pgPlayUseCases.ts` e nas entidades de `src/model/`, lançando erros semânticos (`ValidationError`) antes de alterar qualquer estado.
4. **Qual teste, evidência ou demonstração comprova essa preocupação?**
   - **Testes Unitários (`tests/unit/pgPlayUseCases.test.ts`)**: validam cenários de sucesso, falha (`ValidationError` para nomes curtos/duplicados) e casos de borda (pulo na Mímica quando a equipe tem `0` ou `3` pontos para provar que o placar nunca fica negativo; revelação de letras acentuadas na Forca).
   - **Testes de Integração (`tests/integration/teamsFlow.integration.test.tsx`)**: comprovam o fluxo completo desde a digitação no formulário até a atualização do estado e bloqueio/liberação do botão de início de rodada.

---

### 1.2. Usabilidade e Acessibilidade (*Usability / Interaction Capability* — Operabilidade, Proteção contra Erro do Usuário e Acessibilidade)

1. **Por que ela é importante para o aplicativo?**
   - O **PG PLAY** é operado em ambientes dinâmicos, sob pressão de tempo (`ExpressiveTimer`), frequentemente com o celular passando de mão em mão ou sendo visto à distância. A interface precisa prevenir toques acidentais, comunicar estados sem depender exclusivamente de cor e ser acessível a leitores de tela.
2. **Qual funcionalidade, tela ou fluxo está relacionado a ela?**
   - **Todos os 6 componentes do Design System (`src/view/components/`)** e telas de Arena (`src/view/mimica.tsx`, `quiz.tsx`, `forca.tsx`, `cidade-dorme.tsx`).
   - **Proteção contra erro de uso (**RF11**, **RF24**, **RF08**)**: tela de passagem de turno (*"Estou Pronto!"*) antes de revelar a palavra secreta; botão *"Sair"* isolado no topo esquerdo longe dos botões Jumbo de pontuação; botão *"ADEDONHA!"* desabilitado enquanto houver colunas vazias ou com letra inicial errada (**RF22**).
   - **Independência de cor e contraste WCAG 2.1 (**RNF05–RNF08**)**: estado crítico do cronômetro (`<= 10s`), alternativas do Quiz e teclas da Forca combinam **cor + mudança de forma (`borderRadius`) + ícone + rótulo acessível**.
3. **Como a equipe buscou atendê-la?**
   - Implementando o sistema de design **PG Play Expressive** (`src/view/theme.ts`) com `accessibilityRole`, `accessibilityLabel`, `accessibilityState` (`disabled`, `selected`, `busy`) e alvos mínimos de toque de `48 dp × 48 dp` (`64 dp` nos botões Jumbo).
4. **Qual teste, evidência ou demonstração comprova essa preocupação?**
   - **Testes de Componentes com React Native Testing Library (`tests/components/*.test.tsx`)**: utilizam consultas semânticas (`getByRole`, `getByLabelText`) para comprovar que botões desabilitados (`accessibilityState={{ disabled: true }}`) não disparam ações ao receber `fireEvent.press`, que o `ExpressiveTextField` exibe a mensagem de erro semântica e que o `ExpressiveTimer` anuncia o modo crítico quando `remainingSeconds <= 10`.

---

### 1.3. Manutenibilidade e Testabilidade (*Maintainability* — Modularidade, Reusabilidade e Testabilidade)

1. **Por que ela é importante para o aplicativo?**
   - Um aplicativo com 5 jogos distintos (3 offline em 1 celular e 2 multiplayer em tempo real com áudio) torna-se impossível de testar e evoluir se regras de negócio, chamadas de banco/Supabase, navegação (`expo-router`) e componentes visuais estiverem misturados no mesmo arquivo.
2. **Qual funcionalidade, tela ou fluxo está relacionado a ela?**
   - **Toda a arquitetura em 7 camadas (`src/app`, `src/view`, `src/viewmodel`, `src/usecase`, `src/model`, `src/infra`, `src/di`)** e o container de injeção de dependências (`src/di/container.ts`).
3. **Como a equipe buscou atendê-la?**
   - Adotando o padrão **MVVM Sofisticado** com **Injeção de Dependências**:
     - As **Views (`src/view/`)** são componentes puros de apresentação que apenas consomem `[state, actions] = useXViewModel()`.
     - As **ViewModels (`src/viewmodel/useXViewModel.ts`)** são Custom Hooks que recebem `useCases: IXUseCases = defaultUseCases` por parâmetro.
     - Os **UseCases (`src/usecase/`)** dependem apenas de contratos (`ITeamDataSource`, `IGameCatalogDataSource`, `IMultiplayerRoomService`), tendo implementações `Memory*` em `src/infra/` para execução determinística e instantânea nos testes.
     - O linter determinístico [`scripts/check-arquitetura.mjs`](../../scripts/check-arquitetura.mjs) bloqueia qualquer violação arquitetural automaticamente via `npm run check`.
4. **Qual teste, evidência ou demonstração comprova essa preocupação?**
   - **Testes de Hooks (`tests/hooks/use*ViewModel.test.ts`)**: testam cada ViewModel isoladamente via `renderHook` injetando dublês/instâncias controladas de `IPgPlayUseCases`.
   - **Testes de Componentes com Mocks (`tests/mocks/*.mock.test.tsx`)**: provam que qualquer tela (`src/view/`) ou serviço (`IMultiplayerRoomService` / `INarratorAudioService`) pode ser testado em estados extremos (carregando, erro de rede, banco esgotado) sem depender de internet ou servidor externo.
   - **Verificador Arquitetural (`npm run arquitetura`)**: execução com `0` violações.

---

### 1.4. Confiabilidade e Segurança (*Reliability & Security* — Tolerância a Falhas e Confidencialidade)

1. **Por que ela é importante para o aplicativo?**
   - No modo *Sala Multiplayer* (**Cidade Dorme**), o papel secreto de cada jogador (**Assassino**, **Anjo**, **Detetive**, **Cidadão**) e o veredito da investigação do Detetive são dados sensíveis da partida (**RNF11**): se vazarem para outros aparelhos, o jogo de dedução social é inviabilizado. Além disso, falhas de armazenamento ou conexão não podem derrubar o app (*crash*), devendo ser convertidas em mensagens amigáveis na tela.
2. **Qual funcionalidade, tela ou fluxo está relacionado a ela?**
   - **Camada de Infraestrutura (`src/infra/`)**, **Erros de Domínio (`src/model/errors.ts`)**, **Arena de Cidade Dorme (`UC07`)** e **Persistência de Equipes (`UC01`/`UC02`)**.
3. **Como a equipe buscou atendê-la?**
   - Toda classe em `src/infra/` captura erros técnicos com `catch (err: unknown)` e os converte em subclasses de `DomainError` (`ValidationError`, `AuthError`, `DataSourceError`), que a ViewModel transforma em `state.error` legível para o usuário.
   - No **Cidade Dorme**, a revelação de papel e a passagem de turno (**RF18**, **RF24**) exigem confirmação explícita (*"Revelar Meu Papel"* / *"Esconder e Estou Pronto"*), e no Supabase a tabela `cidade_dorme_secrets` aplica política **Row Level Security (`auth.uid() = user_id`)**.
4. **Qual teste, evidência ou demonstração comprova essa preocupação?**
   - **Testes de Hooks e Mocks com Simulação de Falha (`tests/hooks/` e `tests/mocks/`)**: simulam rejeição de `DataSourceError` / `AuthError` nos contratos `ITeamDataSource` e `IMultiplayerRoomService`, verificando que a ViewModel captura o erro, desativa `state.loading` e popula `state.error` sem quebrar a aplicação.

---

## 2. Arquitetura da Suíte de Testes (Os 7 Requisitos Obrigatórios)

Para atender com clareza à vistoria do repositório de **Engenharia de Software III**, os testes são organizados por responsabilidade dentro de `tests/` e `e2e/`:

```text
tests/
├─ unit/                                    # Critério 1: Testes Unitários (0,5 pt)
│  ├─ pgPlayUseCases.teams.test.ts          # Validações de equipes (sucesso, falha, borda)
│  ├─ pgPlayUseCases.arenas.test.ts         # Regras e cálculos de Mímica, Quiz, Forca e Adedonha
│  └─ tokens.test.ts                        # Integridade dos tokens semânticos/componentes (Claro/Escuro)
├─ components/                              # Critério 2: Testes de Componentes com RNTL (0,5 pt)
│  ├─ expressiveButton.test.tsx             # Variantes, disabled, loading, acessibilidade e toque
│  ├─ expressiveTextField.test.tsx          # Digitação, contador de caracteres e estado de erro
│  ├─ expressiveTimer.test.tsx              # Formatação MM:SS e transição para modo crítico (<= 10s)
│  ├─ quizOption.test.tsx                   # Estados default, correct, wrong, dimmed e bloqueio
│  ├─ letterKey.test.tsx                    # Estados available, hit, miss e acessibilidade
│  └─ gameCard.test.tsx                     # Renderização de título, descrição, tags e ação
├─ mocks/                                   # Critério 3: Testes de Componentes com Mocks (1,0 pt)
│  ├─ teamsScreen.mock.test.tsx             # Tela de Equipes isolando useTeamsViewModel (loading/error/empty)
│  └─ cidadeDormeScreen.mock.test.tsx       # Arena Cidade Dorme mockando serviço multiplayer e áudio
├─ hooks/                                   # Critério 4: Testes de Hooks / ViewModels (1,0 pt)
│  ├─ useHubViewModel.test.ts               # Estado inicial, busca em tempo real, limpar filtro e navegação
│  ├─ useTeamsViewModel.test.ts             # Adicionar/remover equipe, canStartRound e tratamento de erro
│  └─ useArenasViewModel.test.ts            # Hooks de Mímica, Quiz e Forca (turnos, acertos, erros e fim)
└─ integration/                             # Critério 6: Testes de Integração Real (1,0 pt)
   ├─ hubSearch.integration.test.tsx        # View + ViewModel + UseCase + MemoryGameCatalogDataSource
   ├─ teamsManagement.integration.test.tsx  # Formulário + Validação + Estado + Lista real sem mockar UseCase
   └─ quizRound.integration.test.tsx        # Fluxo integrado de pergunta, resposta, pontuação e placar

e2e/                                        # Critério 7: Pelo menos 3 Fluxos E2E com Maestro (1,0 pt)
├─ 01-hub-e-cadastro-equipes.yaml           # Fluxo E2E 1: Busca no Hub + validação e cadastro de equipes
├─ 02-partida-quiz-ate-placar.yaml          # Fluxo E2E 2: Partida completa de Quiz Relâmpago até o Placar
└─ 03-partida-forca-e-reinicio.yaml         # Fluxo E2E 3: Partida do Jogo da Forca e zerar Placar do PG
```

### Resumo de Cobertura Exigida (Critério 5 — `1,0 pt`)
O comando `npm test -- --coverage` (ou `npm run test:coverage`) valida a meta mínima obrigatória no `jest.config`:
- **Statements:** `>= 80%`
- **Branches:** `>= 80%`
- **Functions:** `>= 80%`
- **Lines:** `>= 80%`

---

## 3. Governança do Histórico Git para Vistoria dos Testes (`0,5 pt`)

Conforme a **Seção 4 do Edital de Engenharia de Software III**:
> *"Não é permitido concentrar todos os testes em um único commit final. No mínimo cinco commits relacionados aos testes, distribuídos entre categorias diferentes."*

### Sequência Obrigatória de Commits de Teste no Projeto

Cada categoria de teste deve ser registrada em commits atômicos e semânticos (`test(<escopo>): <descrição>`) ao longo das branches de desenvolvimento:

1. **Commit de Testes de Componentes (Design System)**:
   - `test(view): adicionar testes de componentes do design system com rntl`
2. **Commit de Testes Unitários (Domínio e Casos de Uso)**:
   - `test(usecase): adicionar testes unitarios de validacao de equipes e arenas`
3. **Commit de Testes de Hooks (ViewModels)**:
   - `test(viewmodel): adicionar testes dos hooks de hub, equipes e arenas`
4. **Commit de Testes com Mocks (Isolamento de Dependências)**:
   - `test(view): adicionar testes de telas com mocks de viewmodel e servicos`
5. **Commit de Testes de Integração (Camadas Reais Integradas)**:
   - `test(tests): adicionar testes de integracao de formulario, validacao e estado`
6. **Commit de Cobertura e Fluxos E2E (Maestro)**:
   - `test(tests): configurar meta de cobertura 80% e adicionar 3 fluxos e2e maestro`

---

## 4. Guia Completo para a Defesa Oral (Respostas às 18 Perguntas do Professor)

Abaixo estão as respostas diretas, fundamentadas na arquitetura do **PG PLAY**, para todas as **18 perguntas da Seção 5** do documento da disciplina:

#### 1. Qual comportamento de negócio seu teste unitário protege e por que ele não deveria ser testado pela interface?
- **Resposta:** O teste unitário em `tests/unit/` protege regras puras do `PgPlayUseCases`, como: impedir nomes de equipes com menos de 2 letras ou duplicados (`RF06`), garantir que a penalidade de `-5 pts` ao pular palavra na *Mímica* nunca deixe o placar negativo (`RF25`), calcular o bônus da *Forca* (`+30 + 2 × tentativas restantes`, `RF27`) e comparar letras ignorando acentos (`A` revela `Á`, `Ã`, `Â`). Essas variações combinatórias e casos de borda não devem depender da interface porque renderizar componentes React Native para cada combinação matemática torna a suíte lenta e frágil a mudanças meramente visuais.

#### 2. Qual a diferença entre teste de componente, integração e E2E no seu projeto?
- **Resposta:**
  - **Teste de Componente (`tests/components/`)**: renderiza um único componente de `src/view/components/` (ex.: `ExpressiveButton` ou `LetterKey`) isoladamente via RNTL, verificando props, acessibilidade e disparo de callbacks.
  - **Teste de Integração (`tests/integration/`)**: renderiza uma tela completa (`src/view/teams.tsx`) conectada à sua `ViewModel` real (`useTeamsViewModel`), ao `UseCase` real (`PgPlayUseCases`) e ao `MemoryTeamDataSource` real, validando que digitar no formulário, validar a regra, atualizar o estado e exibir o resultado na lista funcionam juntos em memória.
  - **Teste E2E (`e2e/*.yaml`)**: executa o aplicativo completo compilado no emulador/dispositivo (via Maestro), navegando entre múltiplas rotas reais do `expo-router` (Hub → Equipes → Arena → Placar) exatamente como a pessoa usuária toca na tela.

#### 3. Por que você criou este mock? O que aconteceria se ele fosse removido?
- **Resposta:** Nos testes de `tests/mocks/`, criamos mocks para:
  1. `expo-router` (`router.push`, `router.back`), pois nos testes de componente/hook não há árvore nativa do navegador aberta; sem o mock, a chamada de navegação falharia por falta de contexto de rota.
  2. `useTeamsViewModel` / `IMultiplayerRoomService` / `INarratorAudioService`, para forçar estados específicos e determinísticos (como `loading: true`, falha de rede no Supabase `DataSourceError` ou reprodução de áudio `expo-av`). Se o mock fosse removido, o teste dependeria de rede externa, hardware de áudio ou não conseguiria simular de forma determinística uma falha de infraestrutura.

#### 4. Como você garante que o teste de hook cobre uma mudança de estado importante?
- **Resposta:** Em `tests/hooks/`, usamos `renderHook(() => useTeamsViewModel(useCases))` do `@testing-library/react-native`. Primeiro verificamos o estado inicial (`result.current[0].teams` e `loading`), depois executamos uma ação assíncrona dentro de `await act(async () => { await result.current[1].handleAddTeam("Nova Tribo"); })` e em seguida fazemos a asserção sobre a transição observável do estado (`expect(result.current[0].teams).toHaveLength(3)` e `expect(result.current[0].error).toBeNull()`).

#### 5. Quando usar `getBy`, `queryBy` e `findBy` em React Native Testing Library?
- **Resposta:**
  - **`getBy*`**: quando o elemento **já deve estar presente** na tela de forma síncrona (lança erro imediatamente se não existir).
  - **`queryBy*`**: quando queremos provar que um elemento **não está visível** na tela (retorna `null` sem lançar erro — ex.: `expect(queryByText("Digite um nome com pelo menos 2 letras")).toBeNull()` antes de um erro ou ao ocultar a palavra secreta da Mímica).
  - **`findBy*`**: quando o elemento **aparecerá de forma assíncrona** após uma Promise ou efeito (`useEffect` / carregamento do `DataSource`), pois aguarda (`waitFor`) até o elemento surgir.

#### 6. Por que preferir uma consulta semântica a `testID` quando ela está disponível?
- **Resposta:** Consultas semânticas como `getByRole("button", { name: "Começar Rodada!" })` ou `getByLabelText("Nome da equipe")` testam o componente exatamente como a pessoa usuária e os leitores de tela (TalkBack/VoiceOver) o enxergam, validando simultaneamente o requisito funcional e a acessibilidade (**RNF08**). Já o `testID` é invisível ao usuário: um botão sem texto visível ou sem `accessibilityLabel` passaria num teste com `getByTestId`, mas estaria quebrado para o usuário real.

#### 7. Qual ramo ou cenário de erro a cobertura revelou como não testado?
- **Resposta:** Durante a análise da coluna `Uncovered Line #s` do relatório `npm test -- --coverage`, o relatório evidencia ramos `if/else` e blocos `catch (err: unknown)` das ViewModels e UseCases — como a tentativa de remover equipes até restar menos de 2 equipes (`canStartRound = false`), o esgotamento completo do banco de palavras na partida (**RF12**) e a captura de `DataSourceError` quando o armazenamento falha. Esses cenários foram adicionados para superar os `80%` em *branches*.

#### 8. Por que 100% de cobertura não significa necessariamente que o aplicativo está bem testado?
- **Resposta:** Porque cobertura de código mede apenas quais linhas/ramos foram **executados** durante o teste, e não a qualidade das **asserções**. Um teste sem `expect()` significativos pode executar 100% das linhas e ainda assim deixar passar um cálculo errado ou um botão que não exibe feedback visual. Além disso, cobertura não detecta requisitos ausentes (regras que sequer foram escritas no código).

#### 9. Qual integração real seu teste mantém e qual dependência você decidiu não mockar?
- **Resposta:** Nos testes de `tests/integration/`, decidimos **não mockar** a `ViewModel` (`useTeamsViewModel`), **não mockar** o `UseCase` (`PgPlayUseCases`) e **não mockar** o `DataSource` (`MemoryTeamDataSource`). Mantemos a integração real entre `View → ViewModel → UseCase → DataSource`: quando o teste digita no `ExpressiveTextField` e pressiona o `ExpressiveButton`, a validação real de negócio roda no `PgPlayUseCases`, grava no `MemoryTeamDataSource` e re-renderiza a `View` com o novo estado. Mockamos apenas o `expo-router` na fronteira de navegação.

#### 10. Como seu E2E evita instabilidade causada por espera, dados variáveis ou estado anterior?
- **Resposta:**
  1. **Estado inicial limpo**: cada fluxo Maestro em `e2e/` inicia com `launchApp: { clearState: true }`, garantindo as mesmas 2 equipes padrão (**RF05**) sem lixo de execuções anteriores.
  2. **Dados determinísticos locais**: nos fluxos E2E usamos o banco local determinístico (`Memory*DataSource`).
  3. **Sincronização por asserção visual (`assertVisible`) em vez de `sleep` fixo**: o Maestro aguarda automaticamente os elementos semânticos (como `"Estou Pronto!"` ou `"Começar Rodada!"`) estarem visíveis e estáveis antes de tocar.

#### 11. Mostre um commit e explique qual comportamento foi adicionado ou protegido nele.
- **Resposta:** Ao executar `git log --oneline`, cada commit `test(...)` tem escopo da camada MVVM e descrição no imperativo (ex.: `test(usecase): adicionar testes unitarios de validacao de equipes e arenas`), permitindo rodar `git show <hash>` e ver exatamente os casos de sucesso, falha e borda adicionados naquela etapa.

#### 12. Se uma regra mudar agora, qual teste falhará primeiro e como você o ajustaria?
- **Resposta:** *(Consulte a Tabela de Mutação Ao Vivo na Seção 5 abaixo para resposta imediata de acordo com a regra que o professor escolher).*

#### 13. Quais características da ISO/IEC 25010 vocês escolheram e por quê?
- **Resposta:** Escolhemos **Adequação Funcional** (precisão das regras e pontuações dos 5 jogos), **Usabilidade/Acessibilidade** (ergonomia coletiva, prevenção de toques acidentais e WCAG 2.1 AA), **Manutenibilidade/Testabilidade** (isolamento em 7 camadas MVVM com DI) e **Confiabilidade/Segurança** (tratamento de `DomainError` e sigilo dos papéis secretos no *Cidade Dorme*).

#### 14. Qual teste comprova a adequação funcional ou a confiabilidade do aplicativo?
- **Resposta:**
  - **Adequação Funcional**: `tests/unit/pgPlayUseCases.teams.test.ts` e `tests/unit/pgPlayUseCases.arenas.test.ts` (comprovam os cálculos exatos de pontos, limites de equipes e filtros).
  - **Confiabilidade**: os testes de erro em `tests/hooks/useTeamsViewModel.test.ts` e `tests/mocks/teamsScreen.mock.test.tsx`, que injetam falhas (`DataSourceError`) e comprovam que o app exibe a mensagem de erro sem sofrer *crash*.

#### 15. Como a estrutura do projeto favorece a manutenibilidade e a testabilidade?
- **Resposta:** A separação estrita nas 7 pastas (`app`, `view`, `viewmodel`, `usecase`, `model`, `infra`, `di`) fiscalizada por `scripts/check-arquitetura.mjs` garante que: (1) `model` e `usecase` não dependem de React nem de bibliotecas externas (testáveis em milissegundos); (2) `viewmodel` recebe `IPgPlayUseCases` por parâmetro default (facilitando injeção em `renderHook`); (3) `view` não contém lógica de negócio nem `fetch`/`try-catch`; e (4) `di/container.ts` é o único lugar que conhece `@/infra/`.

#### 16. Que erro de uso a interface procura prevenir?
- **Resposta:**
  1. **Ver a palavra/pergunta secreta antes da hora**: prevenido pela tela de passagem de turno (*"Estou Pronto!"*, **RF24**).
  2. **Toque acidental em "Sair" durante a euforia da partida**: prevenido ao posicionar o botão delineado *"Sair"* no topo esquerdo, distante dos botões Jumbo (`64 dp`) de pontuação na base (**RF11**).
  3. **Iniciar partida sem equipes suficientes ou parar Adedonha incompleta**: prevenido desabilitando (`disabled: true`) o botão *"Começar Rodada!"* quando há `< 2` equipes (**RF08**) e o botão *"ADEDONHA!"* quando há colunas vazias ou com inicial inválida (**RF22**).

#### 17. Que dado sensível o aplicativo protege e como essa proteção foi validada?
- **Resposta:** Protege o **conteúdo secreto das rodadas** (palavra da Mímica com botão *"Esconder do Grupo"*, palavra oculta da Forca) e, no modo Multiplayer (**Cidade Dorme**), o **papel secreto de cada jogador** (`Assassino`, `Anjo`, `Detetive`, `Cidadão`) e o **veredito do Detetive** (**RNF11**). Na interface, isso é validado pelos testes que verificam que o papel e a palavra secreta ficam ocultos no estado `hidden` (`queryByText` retorna `null` até o toque de revelação) e, no backend Supabase, pela política RLS `auth.uid() = user_id` na tabela `cidade_dorme_secrets`.

#### 18. Que alteração futura seria mais simples de implementar por causa da organização atual do código?
- **Resposta:** Trocar a persistência em memória (`MemoryTeamDataSource` / `MemoryMultiplayerRoomService`) por `AsyncStorage`, `SQLite` ou `SupabaseMultiplayerRoomService`, ou alterar toda a paleta de cores do aplicativo. Graças ao `src/di/container.ts` e ao `src/view/theme.ts`, a troca de banco de dados exige alterar **apenas 1 linha no `container.ts`** sem tocar em nenhuma `View`, `ViewModel` ou `UseCase`, e mudanças visuais são feitas apenas em `theme.ts`.

---

## 5. Mapa Rápido de Mutação Ao Vivo (Para a Apresentação Prática)

O edital destaca:
> *"O professor poderá solicitar uma pequena mudança no comportamento do aplicativo e pedir que a equipe indique qual teste deve falhar ou ser atualizado."*

Use esta tabela de consulta rápida durante a apresentação:

| Se o professor pedir para mudar... | Onde fica no código (`src/`) | Qual teste falhará imediatamente ao rodar `npm test` |
| :--- | :--- | :--- |
| **Tamanho mínimo do nome da equipe** (ex.: de `2` para `3` letras) | `src/usecase/pgPlayUseCases.ts` (validação em `addTeam`) | `tests/unit/pgPlayUseCases.teams.test.ts` e `tests/integration/teamsManagement.integration.test.tsx` |
| **Mínimo de equipes para iniciar partida** (ex.: de `2` para `3` equipes) | `src/usecase/pgPlayUseCases.ts` / `src/viewmodel/useTeamsViewModel.ts` (`canStartRound`) | `tests/hooks/useTeamsViewModel.test.ts` e `tests/integration/teamsManagement.integration.test.tsx` |
| **Pontos por acerto ou penalidade de pulo na Mímica** (ex.: de `+20` para `+15` ou `-5` para `-10`) | `src/usecase/pgPlayUseCases.ts` (`scoreMimicaHit` / `skipMimicaWord`) | `tests/unit/pgPlayUseCases.arenas.test.ts` e `tests/hooks/useArenasViewModel.test.ts` |
| **Limiar do Modo Crítico do Cronômetro** (ex.: de `<= 10s` para `<= 5s`) | `src/view/components/expressiveTimer.tsx` (`isCritical = remainingSeconds <= 10`) | `tests/components/expressiveTimer.test.tsx` |
| **Limite de tentativas do Jogo da Forca** (ex.: de `6` para `5` erros) ou fórmula de bônus (`+30 + 2*restantes`) | `src/usecase/pgPlayUseCases.ts` (`guessForcaLetter` / `calculateForcaScore`) | `tests/unit/pgPlayUseCases.arenas.test.ts` e `tests/hooks/useArenasViewModel.test.ts` |
| **Texto ou desabilitação do botão quando `loading` ou `disabled`** | `src/view/components/expressiveButton.tsx` | `tests/components/expressiveButton.test.tsx` |
