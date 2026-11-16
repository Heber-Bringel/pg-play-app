# 📋 Especificação de Funcionalidade (`spec.md`): 003-uc04-quiz-relampago

- **Branch da Feature:** `feat/003-uc04-quiz-relampago`
- **Criado em:** 2026-11-11
- **Status:** Aprovado
- **Autor / Perfil:** Douglas Leone (`DouglasLeone`)
- **Milestone:** `v0.2.0 — Núcleo & Jogos em 1 Celular (UC01–UC06)`
- **Caso(s) de Uso / Requisito(s):** `UC04` (`RF09`, `RF10`, `RF11`, `RF12`, `RF14`, `RF24`, `RF26`, `RF28`, `RF29`, `RF30`, `RF31`) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md` e `docs/jogos/quiz-relampago.md`
- **Issue vinculada:** `#12` (`[UC04] Implementar Arena de Quiz Relâmpago (RF10–RF12)`)

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Passagem de Turno e Início da Rodada de Quiz (Prioridade: P1)

Como representante da Equipe da Vez no Pequeno Grupo, desejo ver primeiro a tela de passagem de turno com a identificação da minha equipe e o botão *"Estou Pronto!"*, para que o aparelho seja passado com segurança entre os grupos sem revelar antecipadamente a pergunta nem disparar o cronômetro.

**Por que esta prioridade:** Essencial para a dinâmica de 1 celular compartilhado (**RF09**, **RF24**), evitando que equipes anteriores vejam ou respondam à pergunta fora de sua vez.

**Como testar independentemente:** Iniciar a Arena de Quiz com ao menos 2 equipes cadastradas; verificar que a fase inicial é `pass-turn` identificando a equipe ativa; acionar `handleStartTurn` e verificar a transição para `playing`, iniciando o cronômetro (padrão de 20s) e exibindo a pergunta.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que a Arena de Quiz foi aberta com ao menos 2 equipes cadastradas, **Quando** a tela carrega, **Então** o sistema exibe a fase `pass-turn` com o nome da equipe da vez e o botão Jumbo *"Estou Pronto!"*, mantendo a pergunta e alternativas ocultas (**RF09**).
2. **Dado** que o representante toca em *"Estou Pronto!"*, **Quando** a ação é disparada, **Então** o sistema exibe a pergunta atual em um `GameCard`, o contador de pergunta (`Pergunta N de M`), o `ExpressiveTimer` rodando e as 4 alternativas `QuizOption` (`A` a `D`) (**RF14**).

---

### História de Usuário 2 — Responder Pergunta com Feedback Duplo Imediato e Pontuação (Prioridade: P1)

Como equipe da vez na arena do Quiz Relâmpago, desejo selecionar uma das 4 alternativas (`A` a `D`) dentro do tempo estipulado, recebendo confirmação visual imediata por cor, raio e ícone (acerto em verde com `check-circle` e `+10 pts`; erro em vermelho com `close-circle` e revelação da correta simultaneamente), bloqueando novos toques.

**Por que esta prioridade:** É a regra central do jogo do Quiz Relâmpago (**RF14**, **RF26**).

**Como testar independentemente:** Executar testes unitários e de ViewModel selecionando alternativa correta e incorreta, verificando a revelação da alternativa certa, bloqueio de seleções subsequentes e atribuição de `+10 pts` para acerto e `0 pts` para erro.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** uma pergunta ativa e a alternativa correta `B`, **Quando** o jogador toca em `B`, **Então** o componente `QuizOption` de `B` assume status `correct`, soma `+10 pts` ao placar da equipe, para o cronômetro e bloqueia novos toques (**RF14**, **RF26**).
2. **Dado** a mesma pergunta e a alternativa errada `C`, **Quando** o jogador toca em `C`, **Então** `C` assume status `wrong`, a alternativa correta `B` é destacada simultaneamente com status `correct`, a equipe recebe `0 pts` e novos toques são bloqueados.
3. **Dado** que o tempo de 20s se esgota sem resposta, **Quando** o cronômetro zera (`secondsRemaining === 0`), **Então** a alternativa correta é revelada automaticamente, a equipe não pontua e o botão *"Próxima Pergunta"* é liberado.
4. **Dado** que faltam 10 segundos no cronômetro, **Quando** o tempo atinge `<= 10s`, **Então** o `ExpressiveTimer` entra no estado `Crítico` (fundo vermelho, ícone de alerta e transição de raio).

---

### História de Usuário 3 — Explicação, Próxima Pergunta e Encerramento com Placar (Prioridade: P2)

Como jogador ou moderador, após responder a pergunta e ver o resultado, desejo visualizar a explicação/referência (ex.: *"Gênesis 6"*), avançar para a próxima equipe/pergunta e, ao concluir todas as perguntas configuradas, ser direcionado para o Placar Geral.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o resultado da pergunta foi revelado, **Quando** a pergunta possui uma explicação/referência, **Então** o sistema exibe o texto explicativo contextualizado logo abaixo das alternativas.
2. **Dado** a conclusão de uma pergunta, **Quando** o jogador toca em *"Próxima Pergunta"*, **Então** o sistema passa a vez para a próxima equipe da lista e retorna à fase `pass-turn`.
3. **Dado** que todas as perguntas da partida foram respondidas, **Quando** a última rodada termina, **Então** o sistema exibe o card de conclusão com o botão *"Ir para o Placar Final"* (**RF12**, **RF30**) que navega para `/scoreboard`.
4. **Dado** a qualquer momento durante a arena, **Quando** o jogador toca no botão superior *"Sair"*, **Então** um diálogo de confirmação é exibido para evitar saídas acidentais (**RF11**).

---

## 2. Casos de Borda (Edge Cases)

- **Toque duplo/múltiplo**: Uma vez que uma opção é tocada ou o tempo esgota, o estado `answered` fica `true` e qualquer novo toque é ignorado (`disabled={true}`).
- **Equipes insuficientes**: Se a arena for aberta sem pelo menos 2 equipes, exibe aviso e botão de redirecionamento para `/teams`.
- **Banco de perguntas esgotado**: Caso todas as perguntas das categorias selecionadas tenham sido usadas na partida, encerra a partida antecipadamente exibindo o botão para o placar.
- **Categorias mistas**: Suporta filtros múltiplos de categorias (Bíblico, Conhecimentos Gerais, etc.) via pacotes selecionáveis.
