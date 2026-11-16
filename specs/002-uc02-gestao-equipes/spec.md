# 📋 Especificação de Funcionalidade (`spec.md`): 002-uc02-gestao-equipes

- **Branch da Feature:** `feat/002-uc02-gestao-equipes`
- **Criado em:** 2026-11-11
- **Status:** Aprovado
- **Autor / Perfil:** Douglas Leone (`DouglasLeone`)
- **Milestone:** `v0.2.0 — Núcleo & Jogos em 1 Celular (UC01–UC06)`
- **Caso(s) de Uso / Requisito(s):** `UC01 / UC02` (`RF05`, `RF06`, `RF07`, `RF08`, `RNF02`, `RNF03`, `RNF05`, `RNF07`, `RNF08`) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md` e `design-system/05-padroes.md` (Padrão 1)
- **Issue vinculada:** `#10` (`[UC02] Implementar Configuração e Gestão de Equipes (RF04–RF06)`)

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Sugestão e Listagem de Equipes Padrão no Primeiro Uso (Prioridade: P1)

Como Líder ou Moderador de um Pequeno Grupo (PG), desejo que o aplicativo venha pré-carregado com 2 equipes sugeridas por padrão (*"Tribo de Judá"* e *"Leões da Fé"*), para que o grupo possa iniciar imediatamente uma rodada de minigames com apenas 1 toque caso estejamos com pressa, sem obrigatoriedade de cadastro prévio.

**Por que esta prioridade:** Permite o fluxo de valor imediato (*Zero-Setup Onboarding*), reduz o atrito e atende ao requisito **RF05** e ao Padrão 1 do Design System.

**Como testar independentemente:** Acessar a tela de Equipes (`/teams`); verificar que a lista inicial contém 2 equipes pré-carregadas e que o botão de ação principal *"Começar Rodada!"* está habilitado.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o aplicativo é aberto pela primeira vez na tela de Equipes, **Quando** a tela termina de carregar, **Então** o sistema exibe 2 equipes sugeridas por padrão (*"Tribo de Judá"* e *"Leões da Fé"*) (**RF05**).
2. **Dado** que há 2 equipes na lista, **Quando** o Líder observa a base da tela, **Então** o botão Primário Jumbo *"Começar Rodada!"* está habilitado (**RF08**).
3. **Dado** a lista de equipes exibida, **Quando** cada item é renderizado, **Então** apresenta o nome da equipe, a pontuação acumulada (iniciando em 0) e o botão com ícone de exclusão para remoção (**RF07**).

---

### História de Usuário 2 — Adicionar Nova Equipe com Validação Estrita (Prioridade: P1)

Como Líder do PG, desejo cadastrar novas equipes personalizadas informando um nome de até 20 caracteres, garantindo que nomes inválidos, muito curtos ou duplicados sejam rejeitados com feedback visual contextualizado, para que a dinâmica seja justa e organizada.

**Por que esta prioridade:** Garante a integridade dos dados de times para pontuação em todos os minigames subsequentes (**RF06**).

**Como testar independentemente:** Digitar nomes no campo de texto e acionar o botão *"Adicionar Equipe"*; testar strings vazias, com menos de 2 caracteres, nomes já existentes (inclusive variações com espaços ou maiúsculas/minúsculas) e o limite máximo de 6 equipes por sessão.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** o campo de texto de nova equipe, **Quando** o Líder digita um nome válido (ex.: *"Guerreiros da Fé"*) e toca em *"Adicionar Equipe"*, **Então** a equipe é inserida na lista com 0 pontos, o campo é limpo e a mensagem de erro é removida (**RF06**).
2. **Dado** um nome com menos de 2 caracteres ou apenas espaços, **Quando** o Líder tenta adicionar, **Então** o sistema rejeita a operação com `ValidationError`, destaca o campo no estado de erro e exibe a mensagem *"Digite um nome com pelo menos 2 letras para a equipe"* (**RF06**).
3. **Dado** que a equipe *"Tribo de Judá"* já existe na lista, **Quando** o Líder tenta adicionar *"tribo de judá "* (mesmo nome com variação de caixa ou espaços), **Então** o sistema rejeita com erro *"Já existe uma equipe com este nome"*.
4. **Dado** que a lista já possui 6 equipes cadastradas, **Quando** o Líder tenta adicionar uma 7ª equipe, **Então** o sistema bloqueia a adição com erro *"Limite máximo de 6 equipes atingido para a sessão"*.
5. **Dado** um nome com mais de 20 caracteres, **Quando** o Líder tenta digitar, **Então** o campo limita a entrada em 20 caracteres (`maxLength={20}`).

---

### História de Usuário 3 — Remover Equipes e Controle de Habilitação da Rodada (Prioridade: P1)

Como Líder do PG, desejo poder remover qualquer equipe cadastrada (inclusive as equipes sugeridas padrão) e ver o botão *"Começar Rodada!"* desabilitar-se automaticamente caso restem menos de 2 equipes na lista, exibindo um estado vazio amigável caso todas sejam removidas.

**Por que esta prioridade:** Garante a flexibilidade de ajuste da dinâmica (**RF07**) e previne o início de partidas sem o número mínimo de competidores (**RF08**).

**Como testar independentemente:** Tocar no botão de exclusão de cada equipe; verificar o decremento da lista, a desabilitação de *"Começar Rodada!"* quando houver apenas 1 equipe, e a exibição do estado vazio quando houver 0 equipes.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** uma lista com 2 equipes, **Quando** o Líder toca no ícone de exclusão de uma delas, **Então** a equipe é removida da lista (**RF07**) e o botão *"Começar Rodada!"* é desabilitado imediatamente (**RF08**).
2. **Dado** uma lista com apenas 1 equipe, **Quando** o Líder remove a última equipe restante, **Então** o sistema exibe o estado vazio com card de aviso (*"Nenhuma equipe cadastrada ainda"*) e instrução para adicionar ao menos 2 equipes.
3. **Dado** que há menos de 2 equipes cadastradas, **Quando** o Líder adiciona equipes até atingir 2, **Então** o botão *"Começar Rodada!"* é reabilitado instantaneamente.

---

### História de Usuário 4 — Iniciar Rodada e Navegação para o Hub ou Minigames (Prioridade: P2)

Como Líder do PG, após configurar as equipes com sucesso, desejo tocar em *"Começar Rodada!"* para avançar para a seleção de jogos ou arena correspondente, mantendo as equipes salvas para os minigames da sessão.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** ao menos 2 equipes válidas na lista, **Quando** o Líder toca em *"Começar Rodada!"*, **Então** o sistema navega para a rota de jogos (ou retorna com as equipes configuradas) e exibe feedback de sucesso.
2. **Dado** a navegação de retorno (botão Voltar), **Quando** acionado, **Então** o sistema retorna com segurança para a tela anterior sem perder as equipes cadastradas.

---

## 2. Casos de Borda (Edge Cases)

- **Espaços em branco acidentais**: Espaços no início e no fim do nome são limpos automaticamente (`trim()`).
- **Nomes com caracteres especiais e números**: Nomes como *"Equipe 10!"* ou *"Gideão & Amigos"* são válidos desde que tenham pelo menos 2 caracteres não vazios.
- **Persistência Offline**: As equipes permanecem salvas na memória/armazenamento local durante toda a sessão do grupo, sem necessidade de conexão com a internet.
- **Falha de armazenamento**: Se o DataSource lançar uma exceção de leitura ou escrita, ela é encapsulada em `DataSourceError` e apresentada como mensagem amigável no estado da ViewModel, sem quebrar a interface.

---

## 3. Matriz de Rastreabilidade

| Requisito | Descrição | Onde é atendido |
| :--- | :--- | :--- |
| **RF05** | Sugerir equipes padrão no primeiro uso | `DEFAULT_TEAMS` em `MemoryTeamDataSource` e carregamento inicial em `PgPlayUseCases` |
| **RF06** | Cadastrar novas equipes com validação | `PgPlayUseCases.addTeam(name)` com validação de 2 caracteres e unicidade |
| **RF07** | Remover equipes cadastradas | `PgPlayUseCases.removeTeam(id)` |
| **RF08** | Controlar habilitação do início de partida | `useTeamsViewModel` calcula `canStartRound = teams.length >= 2` |
| **RNF02** | Contraste de cores WCAG AA | Tokens semânticos de `@/view/theme` |
| **RNF03** | Tempo de resposta local < 150 ms | Operações em memória síncronas/assíncronas locais |
| **RNF05** | Feedback tátil e visual de toque | `ExpressiveButton` e `ExpressiveTextField` do Design System |
| **RNF07** | Alvo de toque >= 48 dp | Botões e campos com alturas mínimas de 48 dp a 64 dp |
| **RNF08** | Navegação determinística | Expo Router encapsulado na ViewModel |
