# Especificação de Requisitos e Casos de Uso — PG PLAY

**Projeto:** PG PLAY — Minigames para Pequenos Grupos  
**Disciplinas:** Interação Humano-Computador (IHC) e Programação para Dispositivos Móveis (PDM)  
**Instituição:** IFPI Campus Piripiri  
**Equipe:** Héber Bringel, Douglas Leone, Mikaelle Barroso e Roger Pierre  
**Versão do Documento:** 1.1.0  

---

## 1. Introdução e Escopo

Este documento formaliza os **Requisitos Funcionais (RF)**, os **Requisitos Não Funcionais (RNF)** e os **Casos de Uso (UC)** do aplicativo móvel **PG PLAY**, alinhados com a arquitetura de componentes (`src/`), o sistema de design **PG Play Expressive** (`design-system/`) e as especificações dos jogos (`docs/jogos/`).

O **PG PLAY** é um aplicativo voltado para dinâmicas presenciais em Pequenos Grupos (PGs) de jovens e adultos, oferecendo tanto jogos rápidos em **1 celular compartilhado** (**Mímica Expressiva**, **Quiz Relâmpago** e **Jogo da Forca**) quanto jogos em **Sala Multiplayer** cada participante no próprio aparelho ([**Cidade Dorme**](../jogos/cidade-dorme.md) e [**Adedonha Bíblica**](../jogos/adedonha-biblica.md)).

---

## 2. Atores do Sistema

| Ator | Descrição e Responsabilidades |
| :--- | :--- |
| **Líder / Moderador (Anfitrião)** | Participante responsável por conduzir o momento de dinâmica no encontro: configura equipes ou cria a Sala Multiplayer, define parâmetros da partida (voz do narrador no *Cidade Dorme*, colunas bíblicas na *Adedonha Bíblica*), valida dúvidas de apuração e gerencia o placar geral — podendo também jogar ativamente nas modalidades multiplayer. |
| **Jogador / Equipe da Vez** | Participante individual (no modo Sala Multiplayer) ou representante de equipe (no modo 1 Celular) que interage diretamente com a arena do jogo sob contagem regressiva, turnos noturnos/diurnos ou controle de tentativas. |
| **Narrador do App (Sistema)** | Agente automatizado de áudio (com opção de voz masculina ou feminina clonada dos líderes) que conduz as fases de *A Noite* e *O Dia* no jogo [**Cidade Dorme**](../jogos/cidade-dorme.md) para que todos os humanos possam jogar. |

---

## 3. Requisitos Funcionais (RF)

### 3.1. Hub de Jogos e Navegação

| Código | Requisito | Descrição Detalhada | Prioridade | Origem no Projeto |
| :--- | :--- | :--- | :---: | :--- |
| **RF01** | Exibir catálogo de minigames no Hub | O sistema deve apresentar na tela inicial (*Hub de Jogos*) os cards interativos dos minigames disponíveis (*Mímica Expressiva*, *Quiz Relâmpago*, *Jogo da Forca*, *Cidade Dorme* e *Adedonha Bíblica*), contendo ícone expressivo, título, descrição curta e tag com número recomendado de jogadores. | Alta | `design-system/README.md`, `GameCard.tsx` |
| **RF02** | Exibir destaque da equipe líder no Hub | O sistema deve exibir no topo do Hub de Jogos um banner ou card destacando a equipe ou jogador que está liderando a pontuação do encontro atual. | Média | `design-system/05-padroes.md` (Padrão 3) |
| **RF03** | Filtrar minigames em tempo real | O sistema deve permitir buscar minigames pelo nome ou tema por meio de um campo de busca, filtrando a lista em tempo real a cada caractere digitado, sem necessidade de confirmar com a tecla *Enter*. | Média | `design-system/05-padroes.md`, `ExpressiveTextField.tsx` |
| **RF04** | Tratar busca vazia e limpar filtro | Quando nenhum minigame corresponder ao termo pesquisado, o sistema deve exibir o estado vazio (*"Nenhum minigame encontrado"*) acompanhado de um botão *"Limpar busca"* que restaura a lista completa com um único toque. | Média | `design-system/05-padroes.md` (Padrão 3) |

### 3.2. Configuração de Equipes e Salas Multiplayer

| Código | Requisito | Descrição Detalhada | Prioridade | Origem no Projeto |
| :--- | :--- | :--- | :---: | :--- |
| **RF05** | Sugerir equipes padrão no primeiro uso | O sistema deve vir pré-carregado com `2` equipes sugeridas por padrão no primeiro uso (iniciando com o botão *"Começar Rodada!"* habilitado), permitindo começar uma partida imediatamente com 1 toque caso o grupo esteja com pressa. | Média | `design-system/05-padroes.md` (Padrão 1) |
| **RF06** | Cadastrar novas equipes com validação | O sistema deve permitir adicionar equipes informando um nome de até `20` caracteres, validando se possui pelo menos `2` letras e se não é duplicado. Em caso de falha, deve exibir mensagem de erro contextualizada. | Alta | `design-system/05-padroes.md`, `campo-de-texto.md` |
| **RF07** | Remover equipes cadastradas | O sistema deve permitir remover qualquer equipe da lista (inclusive as equipes padrão sugeridas) antes do início da partida. | Média | `design-system/06-acessibilidade.md` |
| **RF08** | Controlar habilitação do início de partida | O sistema deve manter o botão principal *"Começar Rodada!"* habilitado enquanto houver pelo menos `2` equipes válidas na lista e desabilitá-lo automaticamente caso o líder remova equipes (**RF07**) deixando menos de `2` equipes cadastradas (exibindo o estado vazio quando houver `0` equipes). | Alta | `design-system/05-padroes.md` (Padrão 1) |

### 3.3. Mecânicas Gerais de Rodada e Tempo

| Código | Requisito | Descrição Detalhada | Prioridade | Origem no Projeto |
| :--- | :--- | :--- | :---: | :--- |
| **RF09** | Identificar a equipe ou fase da vez | Ao entrar na arena de qualquer minigame, o sistema deve exibir claramente no topo da tela qual equipe ou fase está ativa na rodada. | Alta | `design-system/05-padroes.md` (Padrão 2) |
| **RF10** | Executar contagem regressiva com modo crítico | Nas modalidades cronometradas, o sistema deve controlar o tempo da rodada por um cronômetro regressivo (`MM:SS`) que entra automaticamente em *Modo Crítico* quando restam `10 segundos` ou menos, alterando cor, forma (`16 dp`), ícone (`alert`) e pulsação, até encerrar em `00:00` (`bell-ring`). | Alta | `cronometro-expressivo.md`, `ExpressiveTimer.tsx` |
| **RF11** | Permitir saída segura da partida | O sistema deve disponibilizar um botão *"Sair"* no canto superior esquerdo (variante delineada), separado fisicamente dos botões de pontuação na base da tela para evitar toques acidentais. | Média | `design-system/01-principios.md`, `05-padroes.md` |
| **RF12** | Notificar conclusão do banco de palavras | Quando todas as palavras ou perguntas do pacote atual tiverem sido sorteadas, o sistema deve exibir um card de conclusão com o botão *"Ir para o Placar Final"*. | Média | `design-system/05-padroes.md` (Padrão 2) |

### 3.4. Arenas Modo 1 Celular (Mímica, Quiz e Forca)

| Código | Requisito | Descrição Detalhada | Prioridade | Origem no Projeto |
| :--- | :--- | :--- | :---: | :--- |
| **RF13** | Sortear, ocultar e pontuar na Arena de Mímica | Na *Mímica Expressiva*, o sistema deve exibir a palavra secreta em destaque para o representante da equipe, permitir ocultá-la/revelá-la (*"Esconder do Grupo"*), pular a palavra ou registrar o acerto (*"Acertaram! (+20 pts)"*), somando pontos e avançando para o próximo desafio. | Alta | `design-system/README.md`, `05-padroes.md` |
| **RF14** | Apresentar e validar questões no Quiz Relâmpago | No *Quiz Relâmpago*, o sistema deve apresentar o enunciado da pergunta e 4 alternativas identificadas de `A` a `D`. Ao selecionar uma opção, deve confirmar acerto ou erro, bloquear novos toques na mesma pergunta, revelar a alternativa correta (mesmo se a equipe errar) e atualizar a pontuação. | Alta | `alternativa-quiz.md`, `QuizOption.tsx` |
| **RF15** | Processar tentativas de letras no Jogo da Forca | No *Jogo da Forca*, o sistema deve exibir a dica/tema, as lacunas da palavra secreta e um teclado próprio de `A` a `Z`. A cada letra tocada, deve desabilitar a tecla, revelar a letra nas lacunas em caso de acerto (*Hit*) ou riscar a tecla e descontar 1 tentativa da equipe em caso de erro (*Miss*). | Alta | `teclado-forca.md`, `LetterKey.tsx` |

### 3.5. Placar e Ranking do PG

| Código | Requisito | Descrição Detalhada | Prioridade | Origem no Projeto |
| :--- | :--- | :--- | :---: | :--- |
| **RF16** | Exibir pódio e ranking ordenado | O sistema deve exibir a lista de equipes/jogadores ordenada de forma decrescente pela pontuação acumulada, aplicando destaque visual e ícone de coroa/troféu ao 1º lugar. | Alta | `design-system/07-teste-com-ia.md`, `card-de-jogo.md` |
| **RF17** | Alternar jogo ou zerar placar do encontro | Na tela de Placar e Ranking, o sistema deve permitir retornar ao catálogo para escolher outro minigame mantendo os pontos acumulados (*"Escolher Outro Jogo"*) ou reiniciar as pontuações (*"Zerar Placar do PG"*). | Média | `design-system/07-teste-com-ia.md` |

### 3.6. Arenas Multiplayer: Cidade Dorme e Adedonha Bíblica

| Código | Requisito | Descrição Detalhada | Prioridade | Origem no Projeto |
| :--- | :--- | :--- | :---: | :--- |
| **RF18** | Distribuir papéis secretos no Cidade Dorme | No *Cidade Dorme*, o sistema deve sortear e distribuir individualmente nos aparelhos os papéis de **Cidadão**, **Assassino**, **Anjo** e **Detetive**, exigindo confirmação de visualização e ocultação do card antes do início da noite. | Alta | [`docs/jogos/cidade-dorme.md`](../jogos/cidade-dorme.md) |
| **RF19** | Conduzir Noite e Dia com Narrador por Áudio | O sistema deve permitir ao Moderador escolher a voz do Narrador (**Masculina** ou **Feminina**, clonada dos líderes) e conduzir sequencialmente a fase da Noite (tema escuro, liberando a ação apenas para Assassino, Anjo e Detetive em seus turnos) e a fase do Dia (tema claro, anunciando eliminados ou salvamento pelo Anjo). | Alta | [`docs/jogos/cidade-dorme.md`](../jogos/cidade-dorme.md) |
| **RF20** | Realizar votação secreta e verificar vitória no Cidade Dorme | Ao fim do debate diurno, o sistema deve coletar o voto secreto de cada jogador vivo (ou abstenção), eliminar o mais votado por maioria simples e encerrar a partida quando todos os Assassinos forem eliminados (vitória da Cidade) ou quando o número de Assassinos igualar/superar o de inocentes vivos. | Alta | [`docs/jogos/cidade-dorme.md`](../jogos/cidade-dorme.md) |
| **RF21** | Configurar colunas e girar Roleta Expressiva na Adedonha Bíblica | Na *Adedonha Bíblica*, o sistema deve permitir ao Moderador criar/editar as colunas bíblicas da partida e sortear a letra da rodada por meio da **Roleta Expressiva do Alfabeto** (com física de mola M3 Expressive e exclusão de letras já usadas). | Alta | [`docs/jogos/adedonha-biblica.md`](../jogos/adedonha-biblica.md) |
| **RF22** | Validar letra inicial e acionar "ADEDONHA!" | O sistema deve validar em tempo real se as respostas digitadas por cada jogador começam com a letra sorteada e habilitar o botão Jumbo *"ADEDONHA!"* assim que o jogador preencher todas as colunas, disparando a contagem final de encerramento para toda a sala. | Alta | [`docs/jogos/adedonha-biblica.md`](../jogos/adedonha-biblica.md) |
| **RF23** | Apurar respostas pelo Moderador com botão "Levantar Dúvida ✋" | Na apuração da *Adedonha Bíblica*, o sistema deve pré-classificar respostas únicas (`+10 pts`), repetidas (`+5 pts`) e vazias/inválidas (`0 pts`), permitindo aos jogadores acionar *"Levantar Dúvida ✋"* e ao Moderador validar, unificar repetidas ou invalidar respostas coluna por coluna. | Alta | [`docs/jogos/adedonha-biblica.md`](../jogos/adedonha-biblica.md) |

---

## 4. Requisitos Não Funcionais (RNF)

| Código | Categoria | Requisito | Critério de Aceitação / Métrica Verificável | Origem no Projeto |
| :--- | :--- | :--- | :--- | :--- |
| **RNF01** | Portabilidade e Stack | Execução multiplataforma mobile | O aplicativo deve ser desenvolvido em **React Native + Expo** utilizando **TypeScript**, compatível com **Android e iOS**. | `design-system/README.md`, `package.json` |
| **RNF02** | Desempenho e Offline | Resposta instantânea e operação local | O sorteio do banco de palavras local deve ocorrer em `< 150 ms`, a busca no Hub em `0 ms` (memória local) e as transições entre palavras em `300 ms`. | `01-principios.md`, `05-padroes.md` |
| **RNF03** | Usabilidade | Acesso imediato sem cadastro individual | O aplicativo não deve exigir criação de conta, login, e-mail ou senha dos participantes para configurar equipes ou entrar em salas multiplayer (basta apelido/código). | `05-padroes.md` (Padrão 1) |
| **RNF04** | Usabilidade e Ergonomia | Legibilidade coletiva à distância | Títulos e palavras secretas devem utilizar tipografia de alto impacto (`24 dp` a `40 dp`, peso `800–900`), permitindo leitura rápida durante a dinâmica. | `01-principios.md`, `03-fundamentos.md` |
| **RNF05** | Acessibilidade Visual | Conformidade de contraste WCAG 2.1 (AA/AAA) | Todos os pares de texto/fundo devem possuir razão de contraste mínima de `4,5:1` (com pares principais atingindo `> 5,0:1` a `17,10:1`) tanto no tema Claro quanto no Escuro. | `06-acessibilidade.md` |
| **RNF06** | Acessibilidade Visual | Independência de cor (WCAG 1.4.1) | Nenhum estado de acerto, erro, investigação ou alerta de tempo pode ser comunicado apenas por cor; deve combinar obrigatoriamente **cor semântica + mudança de forma (raio) + ícone ou estilo tipográfico**. | `01-principios.md`, `06-acessibilidade.md` |
| **RNF07** | Acessibilidade Motora | Dimensões mínimas de alvos de toque | Todo elemento interativo deve ter no mínimo `48 dp × 48 dp` (campos e alternativas com `56 dp`, botões Jumbo de ação decisiva com `64 dp` de altura) e espaçamento mínimo de `8 dp` entre alvos vizinhos. | `03-fundamentos.md`, `06-acessibilidade.md` |
| **RNF08** | Acessibilidade Assistiva | Suporte a leitores de tela, legendas e foco | Todos os componentes devem implementar `accessibilityRole`, `accessibilityLabel`, `accessibilityState`, anel de foco de `3 dp` (`color.focus`) e legendas visuais sincronizadas para todas as falas do Narrador do *Cidade Dorme*. | `06-acessibilidade.md`, [`cidade-dorme.md`](../jogos/cidade-dorme.md) |
| **RNF09** | Acessibilidade Visual e Vestibular | Escala dinâmica de fonte e redução de movimento | Textos devem suportar `allowFontScaling` até `200%` (com `maxFontSizeMultiplier={1.5}` em botões/cronômetro) e respeitar `prefers-reduced-motion`, desativando pulsações e giros longos da roleta quando ativo. | `06-acessibilidade.md`, [`adedonha-biblica.md`](../jogos/adedonha-biblica.md) |
| **RNF10** | Manutenibilidade | Arquitetura estrita baseada em Design Tokens | Nenhum componente ou tela pode conter valores hexadecimais, tamanhos ou raios literais (*magic numbers*) no `StyleSheet`; 100% das propriedades visuais devem referenciar `src/theme/tokens.ts`. | `design-system/README.md`, `07-teste-com-ia.md` |
| **RNF11** | Segurança e Anti-Trapaça (Multiplayer) | Isolamento de estado secreto e cadência da noite | No *Cidade Dorme*, cada aparelho deve receber apenas seu próprio papel secreto (e veredito do Detetive), e os turnos noturnos devem respeitar janela mínima de tempo para impedir dedução pela velocidade do toque. | [`docs/jogos/cidade-dorme.md`](../jogos/cidade-dorme.md) |

---

## 5. Modelo de Casos de Uso

### 5.1. Diagrama Geral de Casos de Uso

Fluxo de relacionamento entre os atores e os casos de uso do **PG PLAY**:

```
+-----------------------------------------------------------------------------------+
|                                  Sistema PG PLAY                                  |
|                                                                                   |
|  [Líder / Moderador do PG]                                                        |
|         |---> (UC01: Configurar Equipes ou Sala do Encontro)                      |
|         |---> (UC02: Buscar e Selecionar Minigame no Hub)                         |
|         |---> (UC06: Consultar e Gerenciar Placar do PG)                          |
|         |---> (UC07: Jogar Partida de Cidade Dorme) <----- [Narrador por Áudio]   |
|         |---> (UC08: Configurar e Apurar Adedonha Bíblica)                        |
|                                                                                   |
|  [Jogador / Equipe da Vez]                                                        |
|         |---> (UC03: Jogar Rodada de Mímica Expressiva)                           |
|         |---> (UC04: Jogar Rodada de Quiz Relâmpago)                              |
|         |---> (UC05: Jogar Rodada do Jogo da Forca)                               |
|         |---> (UC07: Jogar Partida de Cidade Dorme)                               |
|         |---> (UC08: Jogar Rodada de Adedonha Bíblica)                            |
+-----------------------------------------------------------------------------------+
```

---

### 5.2. Especificação Detalhada dos Casos de Uso

#### UC01 — Configurar Equipes do Encontro
* **Ator Principal:** Líder / Moderador do PG
* **Objetivo:** Confirmar as equipes padrão sugeridas ou personalizar a lista de equipes antes de iniciar as rodadas de minigames.
* **Pré-condições:** Aplicativo aberto na aba/tela de *Configuração de Equipes*.
* **Pós-condições:** Lista contendo ao menos `2` equipes válidas e partida iniciada no minigame selecionado.
* **Fluxo Principal:**
    1. O Líder acessa a tela de *Equipes*, que no primeiro acesso já exibe `2` equipes sugeridas por padrão (**RF05**) e mantém o botão primário Jumbo *"Começar Rodada!"* habilitado (**RF08**).
    2. Para adicionar uma nova equipe personalizada, o Líder digita o nome no campo de texto (máximo de `20` caracteres) e toca no botão *"Adicionar Equipe"*.
    3. O sistema valida que o nome possui ao menos `2` letras e não é duplicado (**RF06**), insere a equipe na lista numerada com animação elástica e limpa o campo de texto.
    4. O Líder toca em *"Começar Rodada!"* e o sistema sorteia o banco local (`< 150 ms`), abrindo a arena do minigame selecionado.
* **Fluxos Alternativos:**
    * **FA01 — Início imediato com as equipes sugeridas por padrão:** O Líder mantém as `2` equipes pré-carregadas (**RF05**) e toca diretamente em *"Começar Rodada!"* com apenas 1 toque.
    * **FA02 — Remover equipe e controle de mínimo de equipes:** O Líder remove equipes (**RF07**); caso restem menos de `2` equipes, o botão *"Começar Rodada!"* é desabilitado automaticamente (**RF08**).
* **Fluxos de Exceção:**
    * **FE01 — Nome inválido, muito curto ou duplicado:** O sistema destaca o campo com borda e fundo de erro, exibe o ícone de alerta e anuncia a mensagem *"Digite um nome com pelo menos 2 letras para a equipe"*.

---

#### UC02 — Buscar e Selecionar Minigame no Hub
* **Ator Principal:** Líder / Moderador do PG
* **Objetivo:** Localizar rapidamente uma dinâmica no catálogo inicial e abrir sua arena ou lobby.
* **Pré-condições:** Aplicativo na tela inicial (*Hub de Jogos*).
* **Pós-condições:** Arena ou Lobby do minigame selecionado aberto.
* **Fluxo Principal:**
    1. O sistema exibe no Hub o destaque da equipe líder e a lista de cards dos minigames disponíveis (*Mímica Expressiva*, *Quiz Relâmpago*, *Jogo da Forca*, *Cidade Dorme* e *Adedonha Bíblica*).
    2. O Líder digita parte do nome ou tema do jogo no campo de busca e o sistema filtra instantaneamente (`0 ms`) os cards exibidos.
    3. O Líder toca no card do minigame desejado, que executa *shape morphing* (`28 dp` → `16 dp`) e abre o jogo escolhido.

---

#### UC03 — Jogar Rodada de Mímica Expressiva
* **Ator Principal:** Jogador / Equipe da Vez
* **Objetivo:** Fazer a equipe adivinhar o maior número de palavras secretas por meio de gestos antes que o cronômetro zere.
* **Fluxo Principal:**
    1. O sistema exibe a equipe da vez, inicia o *Cronômetro Expressivo* e apresenta a palavra secreta em tipografia *Display* (`30 dp`).
    2. O representante visualiza a palavra e toca em *"Esconder do Grupo"* enquanto realiza a mímica.
    3. Quando a equipe acerta, toca no botão Jumbo *"Acertaram! (+20 pts)"*, somando pontos e sorteando a próxima palavra.

---

#### UC04 — Jogar Rodada de Quiz Relâmpago
* **Ator Principal:** Jogador / Equipe da Vez
* **Objetivo:** Responder corretamente às perguntas de múltipla escolha (`A` a `D`) dentro do tempo estipulado.
* **Fluxo Principal:**
    1. O sistema exibe a equipe da vez, o *Cronômetro Expressivo*, o enunciado da pergunta e 4 opções de *Alternativa de Quiz* (`A` a `D`).
    2. O jogador toca na alternativa escolhida; o sistema confirma acerto (`color.success`, raio `16 dp`, `check-circle`) ou erro (`color.error`, raio `8 dp`, `close-circle`, revelando simultaneamente a correta) e atualiza o placar.

---

#### UC05 — Jogar Rodada do Jogo da Forca
* **Ator Principal:** Jogador / Equipe da Vez
* **Objetivo:** Descobrir a palavra secreta escolhendo letras de `A` a `Z` antes que acabem as tentativas da equipe.
* **Fluxo Principal:**
    1. O sistema exibe a dica/tema, as lacunas da palavra oculta e a grade do *Teclado da Forca* (`48 dp × 48 dp`).
    2. A cada letra tocada, o sistema revela as ocorrências em verde circular (`9999 dp`) em caso de acerto (*Hit*) ou risca a tecla em vermelho descontando `1` tentativa em caso de erro (*Miss*).

---

#### UC06 — Consultar e Gerenciar Placar do PG
* **Ator Principal:** Líder / Moderador do PG
* **Objetivo:** Visualizar a classificação geral ao final das rodadas e decidir o próximo passo do encontro.
* **Fluxo Principal:**
    1. O sistema ordena as equipes/jogadores em ordem decrescente de pontuação, destacando o 1º colocado com borda dourada (`color.highlight`) e ícone de coroa.
    2. O Líder pode escolher *"Escolher Outro Jogo"* (mantendo o placar) ou *"Zerar Placar do PG"*.

---

#### UC07 — Jogar Partida de Cidade Dorme (Multiplayer com Narrador por Áudio)
* **Atores:** Moderador/Anfitrião, Jogadores da Sala e Narrador do App (Áudio)
* **Referência Detalhada:** [`docs/jogos/cidade-dorme.md`](../jogos/cidade-dorme.md)
* **Objetivo:** Descobrir e eliminar os Assassinos infiltrados (objetivo da Cidade) ou eliminar cidadãos até atingir paridade numérica (objetivo dos Assassinos), com condução automática por voz clonada para que todos joguem.
* **Fluxo Principal:**
    1. No Lobby da sala, o Moderador escolhe o perfil de voz do Narrador (**Masculina** ou **Feminina**) e inicia a partida (**RF19**).
    2. Cada jogador revela secretamente seu papel (**Cidadão**, **Assassino**, **Anjo** ou **Detetive**) no próprio celular e confirma que está pronto (**RF18**).
    3. **A Noite (Tema Escuro `#11131C`):** O Narrador por áudio (no aparelho do Anfitrião) manda a cidade dormir e chama sequencialmente o **Assassino** (escolhe vítima), o **Anjo** (escolhe quem proteger) e o **Detetive** (investiga um jogador e vê silenciosamente na tela se é *Assassino* ou *Inocente*).
    4. **O Dia (Tema Claro `#FFF8F5`):** O Narrador acorda a cidade, anuncia se alguém foi eliminado ou salvo pelo Anjo e inicia o `ExpressiveTimer` de debate presencial.
    5. **Votação:** Os jogadores vivos votam secretamente pelo próprio celular em um suspeito ou em *"Pular Voto"* (**RF20**).
    6. Os passos 3 a 5 se repetem até que a Cidade elimine todos os Assassinos ou os Assassinos atinjam paridade com os inocentes vivos.

---

#### UC08 — Jogar e Apurar Rodada de Adedonha Bíblica (Multiplayer com Roleta M3)
* **Atores:** Moderador/Anfitrião e Jogadores da Sala
* **Referência Detalhada:** [`docs/jogos/adedonha-biblica.md`](../jogos/adedonha-biblica.md)
* **Objetivo:** Preencher palavras bíblicas iniciadas pela letra sorteada nas colunas criadas pelo Moderador no menor tempo possível.
* **Fluxo Principal:**
    1. No Lobby, o Moderador cria/personaliza as colunas bíblicas da partida (**RF21**).
    2. No início da rodada, a **Roleta Expressiva do Alfabeto** gira com física de mola (`motion.spring.spatial`) e trava na letra da rodada com *shape morphing* (**RF21**).
    3. Os jogadores preenchem os campos [`ExpressiveTextField`](../../src/components/ExpressiveTextField.tsx) de cada coluna; o app valida instantaneamente se cada resposta começa com a letra sorteada (**RF22**).
    4. O primeiro jogador a preencher todas as colunas válidas toca no botão Jumbo **"ADEDONHA!"**, disparando a contagem crítica final de `5 segundos` para toda a sala (**RF22**).
    5. Na **Apuração Assistida**, o app pré-classifica as respostas (`+10` única, `+5` repetida, `0` vazia/inválida); os jogadores podem tocar em **"Levantar Dúvida ✋"** em respostas suspeitas e o Moderador dá o veredito final coluna por coluna (**RF23**).

---

## 6. Matriz de Rastreabilidade (Requisitos × Componentes × Casos de Uso)

| Caso de Uso | Requisitos Funcionais Associados | Requisitos Não Funcionais Críticos | Componentes React Native Envolvidos (`src/components/`) |
| :--- | :--- | :--- | :--- |
| **UC01 — Configurar Equipes** | RF05, RF06, RF07, RF08 | RNF02, RNF03, RNF05, RNF07, RNF08 | `ExpressiveTextField`, `ExpressiveButton`, `GameCard` |
| **UC02 — Buscar e Selecionar Minigame** | RF01, RF02, RF03, RF04 | RNF02, RNF04, RNF07, RNF10 | `ExpressiveTextField`, `GameCard`, `ExpressiveButton` |
| **UC03 — Jogar Mímica Expressiva** | RF09, RF10, RF11, RF12, RF13 | RNF02, RNF04, RNF06, RNF07, RNF09 | `ExpressiveTimer`, `GameCard`, `ExpressiveButton` |
| **UC04 — Jogar Quiz Relâmpago** | RF09, RF10, RF11, RF12, RF14 | RNF05, RNF06, RNF07, RNF08, RNF09 | `ExpressiveTimer`, `GameCard`, `QuizOption`, `ExpressiveButton` |
| **UC05 — Jogar Jogo da Forca** | RF09, RF11, RF12, RF15 | RNF05, RNF06, RNF07, RNF08, RNF10 | `GameCard`, `LetterKey`, `ExpressiveButton` |
| **UC06 — Consultar e Gerenciar Placar** | RF16, RF17 | RNF04, RNF05, RNF07, RNF08, RNF10 | `GameCard`, `ExpressiveButton` |
| **UC07 — Jogar Cidade Dorme** | RF18, RF19, RF20 | RNF03, RNF05, RNF06, RNF08, RNF11 | `GameCard`, `ExpressiveButton`, `ExpressiveTimer`, `QuizOption` |
| **UC08 — Jogar Adedonha Bíblica** | RF21, RF22, RF23 | RNF03, RNF06, RNF07, RNF09, RNF10 | `LetterKey` / `AlphabetRoulette`, `ExpressiveTextField`, `ExpressiveTimer`, `ExpressiveButton`, `GameCard` |
