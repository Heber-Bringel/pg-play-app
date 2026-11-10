# 📋 Especificação de Funcionalidade (`spec.md`): 006-uc05-arena-forca

- **Branch da Feature:** `feat/006-uc05-arena-forca`
- **Criado em:** 2026-11-10
- **Status:** Aprovado
- **Autor / Perfil:** Roger Pierre (`RogerPierre`)
- **Milestone:** `v0.2.0 — Núcleo & Jogos em 1 Celular (UC01–UC06)`
- **Caso(s) de Uso / Requisito(s):** `UC05` (`RF09`, `RF11`, `RF12`, `RF15`, `RF24`, `RF27`, `RF28`, `RF29`, `RF30`, `RF31`) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md` e `docs/jogos/jogo-da-forca.md`
- **Issue vinculada:** `#7` (`[UC05] Implementar Arena do Jogo da Forca (RF13–RF15)`)

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Passagem de Turno, Dica Temática e Máscara de Palavra Oculta (Prioridade: P1)

Como representante da Equipe da Vez em um encontro de Pequeno Grupo, desejo visualizar primeiro a tela de passagem de turno com o botão *"Estou Pronto!"* e, em seguida, uma arena contendo a dica temática (ex.: *"DICA: Propósito essencial de um Pequeno Grupo (PG)"*), as lacunas da palavra secreta e o contador de tentativas restantes, para que a dinâmica seja justa e todos possam participar sem que a palavra seja revelada previamente.

**Por que esta prioridade:** O modo *1 Celular Compartilhado* exige a transição limpa entre equipes para garantir que a equipe anterior não veja a nova palavra nem responda fora de sua vez.

**Como testar independentemente:** Iniciar a Arena da Forca, verificar que a fase inicial é `pass-turn` identificando a equipe ativa; acionar `handleStartTurn` e verificar que a fase transita para `playing`, exibindo a dica temática, as lacunas correspondentes à palavra secreta e o badge de tentativas restantes (padrão de 5 ou 6).

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que a Arena da Forca foi iniciada com ao menos 2 equipes cadastradas, **Quando** a tela carrega, **Então** o sistema exibe a fase de Passagem de Turno (`pass-turn`) identificando a equipe da vez (**RF09**, **RF24**) e o botão Jumbo *"Estou Pronto!"*, mantendo a palavra oculta.
2. **Dado** que a equipe da vez está na tela de passagem, **Quando** o jogador toca em *"Estou Pronto!"*, **Então** o sistema exibe a dica temática em um `GameCard`, as lacunas das letras com fundo e borda inferior destacada, o badge superior com as tentativas restantes (`❤️ N tentativas`) e a grade do teclado de `A` a `Z` (**RF15**).
3. **Dado** uma palavra com acentos (ex.: `COMUNHÃO`), **Quando** a tela da arena carrega, **Então** as posições das letras são ocultadas com traços/lacunas vazias, enquanto espaços e hífens já aparecem visíveis.

---

### História de Usuário 2 — Adivinhação de Letras com LetterKey, Hit/Miss, Normalização e Pontuação (Prioridade: P1)

Como equipe da vez na arena do Jogo da Forca, desejo tocar em letras de `A` a `Z` no teclado virtual, visualizando feedback imediato de Acerto (*Hit* em verde circular) ou Erro (*Miss* em vermelho riscado com desconto de 1 tentativa), acumulando `+30 pts` mais bônus de eficiência ao vencer, ou vendo a palavra revelada sem pontuar ao perder.

**Por que esta prioridade:** É a mecânica central do minigame da Forca descrita no documento de jogo e nos critérios de avaliação de IHC/PDM.

**Como testar independentemente:** Executar testes unitários e de ViewModel testando o palpite de letras certas e erradas, verificação de normalização de acentos (digitar `A` revela `Á`/`Ã`, digitar `C` revela `Ç`), esgotamento de tentativas levando a derrota com `0 pts`, e revelação total levando a vitória com `+30 pts` mais `+2 pts` por tentativa não utilizada (**RF27**).

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** uma palavra ativa (ex.: `COMUNHÃO`) e a letra `C`, **Quando** o jogador toca na tecla `C`, **Então** o componente `LetterKey` assume estado `hit` (verde circular `9999 dp`), fica desabilitado e a letra `C` aparece revelada na lacuna correspondente (**RF15**).
2. **Dado** a mesma palavra e a letra `A`, **Quando** o jogador toca em `A`, **Então** a ocorrência acentuada `Ã` é revelada na lacuna correspondente (normalização semântica) e a tecla `A` assume estado `hit`.
3. **Dado** a letra `Z` inexistente na palavra, **Quando** o jogador toca em `Z`, **Então** a tecla assume estado `miss` (vermelho riscado `8 dp`), fica desabilitada e o contador de tentativas é decrementado em `1` (**RF15**).
4. **Dado** que todas as letras da palavra foram reveladas antes das tentativas acabarem, **Quando** o último acerto ocorre, **Então** o sistema declara vitória da rodada, soma `+30 pts` mais `+2 pts` por tentativa restante ao placar da equipe (**RF27**), e exibe o card de resultado com o botão *"Próxima Palavra"*.
5. **Dado** que o contador de tentativas chega a `0`, **Quando** o erro fatal ocorre, **Então** o sistema declara derrota, revela a palavra completa na tela, atribui `0 pts` à equipe (**RF27**) e oferece o botão *"Próxima Palavra"*.

---

### História de Usuário 3 — Reinício de Palavra, Próxima Palavra, Encerramento e Saída Segura (Prioridade: P2)

Como jogador ou moderador da rodada, desejo poder reiniciar a adivinhação da palavra atual caso a equipe queira recomeçar a dedução do zero, alternar para a próxima equipe/palavra após a conclusão de uma rodada, e encerrar a partida com envio ao placar ou sair com segurança a qualquer momento.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** uma palavra em andamento com palpites efetuados e erros descontados, **Quando** o jogador toca no botão *"Reiniciar Palavra"*, **Então** o sistema restaura as tentativas restantes para o valor máximo da partida, limpa o histórico de letras palpitadas e oculta as lacunas novamente, mantendo a mesma palavra e dica temática.
2. **Dado** a conclusão de uma palavra (vitória ou derrota), **Quando** o jogador toca em *"Próxima Palavra"*, **Então** a vez avança para a próxima equipe da lista e a fase retorna para `pass-turn`.
3. **Dado** que todas as palavras configuradas por equipe foram concluídas, **Quando** a última rodada termina, **Então** o sistema transita para a fase `finished`, exibindo o card de encerramento com o botão *"Ir para o Placar Final"* (**RF12**, **RF31**) que navega para `/scoreboard`.
4. **Dado** a tela da arena em qualquer momento, **Quando** o jogador toca no botão superior *"Sair"*, **Então** um diálogo ou banner de confirmação é exibido antes de retornar ao Hub (**RF11**).

---

### Casos de Borda (Edge Cases)

- **Acentuação e caracteres compostos**: Caracteres especiais como espaços e hífens já iniciam revelados; palpites em letras não acentuadas (`A`, `E`, `I`, `O`, `U`, `C`) revelam todas as variantes acentuadas correspondentes (`Á`, `Ã`, `Â`, `É`, `Ê`, `Í`, `Ó`, `Ô`, `Õ`, `Ú`, `Ç`).
- **Tecla repetida**: Teclas com `status="hit"` ou `status="miss"` estão desabilitadas (`disabled={true}`) e cliques subsequentes são ignorados.
- **Equipes insuficientes**: Se houver menos de 2 equipes cadastradas, a tela exibe o estado semântico de erro/equipes insuficientes com botão de redirecionamento.
- **Esgotamento do banco de palavras**: Palavras acertadas não se repetem na mesma partida; caso o banco se esgote, o jogo encerra graciosamente levando ao placar final.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF09` & `RF24`**: Exibir tela de passagem de turno com a equipe da vez e o botão *"Estou Pronto!"*.
- **`RF11`**: Botão *"Sair"* com confirmação de segurança.
- **`RF12` & `RF31`**: Encerramento de partida navegando para o Placar Final (`/scoreboard`).
- **`RF15`**: Grade do teclado com `LetterKey` (`48 dp × 48 dp`), máscara de lacunas com feedback visual e badge de tentativas restantes.
- **`RF27`**: Pontuação de `+30 pts` por acerto + `+2 pts` por tentativa não utilizada, ou `0 pts` e revelação da palavra se as tentativas zerarem.
- **`RF28`, `RF29` & `RF30`**: Parâmetros de tentativas (`5`, `6` ou `8`), palavras por equipe (`1` a `5`), temas variados e não repetição de palavras na mesma partida.

### Entidades de Domínio Envolvidas (`src/model/entities/`)
- **`ForcaCategory` (`src/model/entities/arenaChallenge.ts`)**: Categorias de temas.
- **`ForcaPuzzle` (`src/model/entities/arenaChallenge.ts`)**: `id`, `word`, `hint`, `category`.
- **`Team` (`src/model/entities/team.ts`)**: `id`, `name`, `score`.

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (IHC / Acessibilidade)**: Componentes `LetterKey` com contraste WCAG 2.1, feedback com dupla codificação (cor + forma + ícone), `accessibilityLabel` descritivo das lacunas e live region para atualização de tentativas.
- **`CS-02` (Arquitetura MVVM)**: `npm run check` com **0 violações** e suíte de testes unitários, testes de ViewModel e mocks de tela passando com cobertura `>= 80%`.
