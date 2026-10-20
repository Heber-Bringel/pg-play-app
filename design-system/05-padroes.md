# Padrões

Este documento descreve os fluxos completos de interação do **PG PLAY**, conectando os componentes de [04-componentes/](04-componentes/) e definindo o comportamento para os estados **Carregando**, **Erro**, **Vazio** e **Sucesso**.

---

## Padrão 1: Configuração de Equipes e Início de Partida (Formulário)

- **Objetivo do usuário:** cadastrar rapidamente os nomes das equipes do Pequeno Grupo (ex.: *"Tribo de Judá"*, *"Leões da Fé"*) e iniciar a primeira rodada de minigames.
- **Componentes usados:** [Campo de Texto](04-componentes/campo-de-texto.md), [Botão](04-componentes/botao.md) (variantes `Tonal`, `Delineado` e `Primário Jumbo`), [Card de Minigame](04-componentes/card-de-jogo.md).
- **Passos:**
  1. O líder do PG acessa a aba **Equipes** na barra de navegação inferior.
  2. Digita o nome da equipe no [Campo de Texto](04-componentes/campo-de-texto.md) (`input.min-height` = `56 dp`, limite de `20` caracteres) e toca no [Botão](04-componentes/botao.md) `Tonal` (*"Adicionar Equipe"*).
  3. O sistema valida se o nome possui pelo menos `2` letras e se não é duplicado, adicionando a equipe à lista numerada.
  4. Quando há pelo menos `2` equipes cadastradas, o botão `Primário Jumbo` (*"Começar Rodada!"*, `64 dp` de altura) fica habilitado na base da tela.
- **Estados que precisam de tela:**

| Situação | O que o usuário vê | Componentes e tokens |
| --- | --- | --- |
| Carregando | Indicador circular em `color.action` dentro do botão `Primário Jumbo` enquanto sorteia o banco de palavras local (`< 150 ms`) | [Botão](04-componentes/botao.md) com `button.bg-disabled` e `motion.duration.short` |
| Erro | Campo de texto com fundo `input.bg-error` (`color.error-container`), borda `input.border-error` (`color.error`), ícone `alert-circle` e texto *"Digite um nome com pelo menos 2 letras para a equipe"* | [Campo de Texto](04-componentes/campo-de-texto.md) no estado `Erro` |
| Vazio | Card tracejado em `color.outline` com ícone `account-group-outline`, mensagem *"Nenhuma equipe cadastrada ainda"* e botão `Primário Jumbo` desabilitado | [Card de Minigame](04-componentes/card-de-jogo.md), [Botão](04-componentes/botao.md) no estado `Desabilitado` (`button.bg-disabled`) |
| Sucesso | Nova equipe entra na lista com animação de mola `motion.spring.spatial`, o campo é limpo e o botão *"Começar Rodada!"* fica ativo em `button.bg` | [Campo de Texto](04-componentes/campo-de-texto.md) + [Botão](04-componentes/botao.md) `Primário Jumbo` |

- **Faça:** venha com 2 equipes sugeridas por padrão no primeiro uso para que o grupo possa começar a jogar com 1 toque se estiver com pressa.
- **Evite:** exigir cadastro de e-mail, senha ou login individual de cada participante do PG antes de liberar a partida.

---

## Padrão 2: Rodada de Minigame sob Contagem Regressiva (Mímica, Quiz e Forca)

- **Objetivo do usuário:** jogar uma rodada cronometrada, adivinhando palavras ou respondendo perguntas antes que o tempo acabe para somar pontos para sua equipe.
- **Componentes usados:** [Cronômetro Expressivo](04-componentes/cronometro-expressivo.md), [Card de Minigame](04-componentes/card-de-jogo.md), [Botão](04-componentes/botao.md), [Alternativa de Quiz](04-componentes/alternativa-quiz.md), [Teclado da Forca](04-componentes/teclado-forca.md).
- **Passos:**
  1. Ao entrar na arena do jogo escolhido, o topo exibe a equipe da vez e o [Cronômetro Expressivo](04-componentes/cronometro-expressivo.md) em estado normal (`timer.bg.normal` = `color.highlight`, pílula `9999 dp`).
  2. Na **Mímica**, o representante vê a palavra secreta em `font.display` (`30 dp`) no [Card de Minigame](04-componentes/card-de-jogo.md), pode escondê-la com o botão `Tonal` (*"Esconder do Grupo"*) e faz os gestos.
  3. Quando faltam `10 segundos`, o [Cronômetro Expressivo](04-componentes/cronometro-expressivo.md) entra no estado `Crítico`: muda para `timer.bg.critical` (`color.error`), transforma o raio para `16 dp`, troca o ícone para `alert` e pulsa com `motion.spring.spatial`.
  4. O jogador toca em *"Acertaram! (+20 pts)"* (`Sucesso Jumbo`), em uma [Alternativa de Quiz](04-componentes/alternativa-quiz.md) ou em uma tecla do [Teclado da Forca](04-componentes/teclado-forca.md), recebendo confirmação imediata por cor, forma e ícone.
- **Estados que precisam de tela:**

| Situação | O que o usuário vê | Componentes e tokens |
| --- | --- | --- |
| Carregando | Transição elástica (`300 ms`, `motion.spring.spatial`) do card de uma palavra/pergunta para a próxima sem sair da tela | [Card de Minigame](04-componentes/card-de-jogo.md), `motion.duration.medium` |
| Erro (Palpite Errado / Tempo Esgotado) | No Quiz: alternativa escolhida fica em `color.error` com ícone `close-circle` e raio `8 dp`. Na Forca: tecla recebe fundo `key.miss.bg` e texto riscado. No fim do tempo: cronômetro exibe `"00:00"` em `color.error` | [Alternativa de Quiz](04-componentes/alternativa-quiz.md), [Teclado da Forca](04-componentes/teclado-forca.md), [Cronômetro Expressivo](04-componentes/cronometro-expressivo.md) |
| Vazio (Banco de Palavras Concluído) | Quando todas as palavras do pacote atual já foram sorteadas, exibe card com ícone `party-popper` e botão `Primário Jumbo` *"Ir para o Placar Final"* | [Card de Minigame](04-componentes/card-de-jogo.md), [Botão](04-componentes/botao.md) |
| Sucesso (Acerto na Rodada) | Botão ou alternativa assume `color.success` com ícone `check-circle`, soma os pontos ao placar da equipe e avança para o próximo desafio | [Botão](04-componentes/botao.md) `Sucesso Jumbo`, [Alternativa de Quiz](04-componentes/alternativa-quiz.md) `Correta` |

- **Faça:** mantenha os botões de decisão da rodada (`Sucesso Jumbo` e `Secundário`) fixos na parte inferior da tela, ao alcance imediato do polegar, com altura mínima de `48 dp` a `64 dp`.
- **Evite:** colocar o botão *"Sair"* próximo aos botões de pontuar; posicione *"Sair"* sempre no canto superior esquerdo com variante `Delineado`.

---

## Padrão 3: Busca e Seleção de Minigames no Hub (Busca com Filtro)

- **Objetivo do usuário:** encontrar rapidamente a dinâmica desejada para o momento do encontro (ex.: buscar por *"Mímica"* ou *"Forca"*).
- **Componentes usados:** [Campo de Texto](04-componentes/campo-de-texto.md) (variante `Busca`), [Card de Minigame](04-componentes/card-de-jogo.md), [Botão](04-componentes/botao.md) (`Tonal`).
- **Passos:**
  1. Na tela inicial (**Hub de Jogos**), o usuário visualiza o banner da equipe líder no topo e a lista de cards de minigames.
  2. Ao digitar no [Campo de Texto](04-componentes/campo-de-texto.md) de busca, a lista de [Card de Minigame](04-componentes/card-de-jogo.md) é filtrada em tempo real a cada letra digitada.
  3. Ao tocar em qualquer card, o card executa *shape morphing* (`28 dp` para `16 dp`) e abre a arena do jogo correspondente.
- **Estados que precisam de tela:**

| Situação | O que o usuário vê | Componentes e tokens |
| --- | --- | --- |
| Carregando | Filtro instantâneo em memória local (`0 ms`); não exibe *spinner* bloqueante | [Campo de Texto](04-componentes/campo-de-texto.md) |
| Erro | Não há estado de erro destrutivo na busca; caracteres especiais são ignorados silenciosamente | [Campo de Texto](04-componentes/campo-de-texto.md) |
| Vazio | Container com borda tracejada em `color.outline`, ícone `magnify-close`, título *"Nenhum minigame encontrado"* e botão `Tonal` *"Limpar busca"* | [Botão](04-componentes/botao.md) `Tonal`, `color.on-surface-muted` |
| Sucesso | Exibe os [Card de Minigame](04-componentes/card-de-jogo.md) correspondentes com emblema geométrico expressivo e tag de jogadores | [Card de Minigame](04-componentes/card-de-jogo.md) |

- **Faça:** inclua sempre um botão *"Limpar busca"* visível no estado vazio para restaurar a lista completa com um único toque.
- **Evite:** exigir que o usuário pressione *"Enter"* no teclado para filtrar uma lista curta de minigames.
