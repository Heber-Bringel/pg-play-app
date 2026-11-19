# 📋 Especificação de Funcionalidade (`spec.md`): UC07 — Cidade Dorme em Sala Multiplayer com Narrador por Áudio

- **Branch da Feature:** `feat/008-uc07-cidade-dorme`
- **Criado em:** 2026-11-18
- **Status:** Atualizado (v1.2.0 · `expo-speech` e `RNF11`)
- **Caso(s) de Uso / Requisito(s):** `UC07` (`RF09`, `RF10`, `RF11`, `RF18`, `RF19`, `RF20`, `RNF03`, `RNF05`, `RNF06`, `RNF07`, `RNF08`, `RNF09`, `RNF10`, `RNF11`) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md`, `docs/jogos/cidade-dorme.md` e `docs/harness/05-infraestrutura-e-supabase.md`
- **Milestone / Issue vinculada:** `v1.0.0 — Jogos em Sala Multiplayer (UC07–UC08)` / Issues `#9`, `#32`

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Identificação, Lobby da Sala, Configurações do Moderador e Sorteio Secreto de Papéis (Prioridade: P1)

Como **Moderador ou Participante do PG**, quero criar ou entrar em uma sala multiplayer do **Cidade Dorme** exclusivamente pelo próprio celular via código PIN, configurar os parâmetros da partida no Lobby (perfil de voz do Narrador **Masculina** ou **Feminina**, quantidade de Assassinos, tempos de noite/debate e revelação de papel ao morrer) e revelar secretamente apenas o meu papel (**Cidadão**, **Assassino**, **Anjo** ou **Detetive**) confirmando que estou pronto para a noite.

**Por que esta prioridade:** Permite que 100% dos presentes joguem (inclusive o líder) com distribuição secreta e isolada de papéis sem excluir ninguém para narrar (`RF18`, `RF19`, `RNF03`, `RNF11`).

**Como testar independentemente:** Abrir `/cidade-dorme`, criar sala como Moderador, ingressar com pelo menos 5 jogadores via código PIN em aparelhos distintos, ajustar configurações no Lobby, iniciar a partida, tocar em *"Revelar Meu Papel"* e depois em *"Esconder e Estou Pronto"* em cada dispositivo.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o usuário acessou o Cidade Dorme, **Quando** informa um apelido válido (`>= 2` caracteres) e cria uma sala ou entra com código PIN válido, **Então** ingressa no Lobby visualizando o código PIN, a lista de participantes conectados e as configurações da partida (`RNF03`), sem opção de sala demo offline nem adição manual de participantes locais.
2. **Dado** que o Moderador está no Lobby com 5 a 16 jogadores conectados, **Quando** escolhe a voz do Narrador (**Masculina** ou **Feminina**) e toca em *"Distribuir Papéis e Iniciar"*, **Então** o sistema sorteia secretamente os papéis (**Assassino**, **Anjo**, **Detetive** e **Cidadãos**) respeitando a quantidade configurada e avança para a fase `role_reveal` (`RF18`, `RF19`).
3. **Dado** que a sala está na fase `role_reveal`, **Quando** cada jogador toca em *"Revelar Meu Papel"* e em seguida em *"Esconder e Estou Pronto"*, **Então** o card secreto volta a ficar oculto, o jogador é marcado como pronto e, assim que todos os jogadores da sala confirmam no próprio celular, a partida avança para a primeira Noite (`RF18`, `RNF11`).
4. **Dado** que um participante saiu do Lobby antes da partida iniciar (`leaveRoom`), **Quando** tenta entrar novamente na mesma sala com o mesmo apelido, **Então** consegue reingressar normalmente sem erro nem bloqueio do formulário (`RNF03`).

---

### História de Usuário 2 — A Noite (Tema Escuro, Narrador por Áudio `expo-speech` + Legendas e Turnos Secretos) (Prioridade: P1)

Como **Jogador da Sala durante A Noite**, quero que a tela adote automaticamente o **Modo Escuro (`darkTokens`)**, exiba as legendas sincronizadas com a voz do Narrador sintetizada com `expo-speech` (reproduzida apenas no aparelho do Anfitrião) e libere os controles exclusivamente para o titular vivo do papel da vez (**Assassino** escolhe vítima, **Anjo** escolhe protegido, **Detetive** investiga suspeito e recebe o veredito visual silencioso).

**Por que esta prioridade:** É o coração da mecânica noturna do Cidade Dorme, combinando imersão, acessibilidade sensorial (áudio centralizado no Anfitrião + legendas sincronizadas + cor + forma + ícone) e estrito isolamento de papéis (`RF19`, `RNF06`, `RNF08`, `RNF11`).

**Como testar independentemente:** Iniciar a fase da Noite, verificar a aplicação de `darkTokens`, confirmar que apenas o dispositivo do Anfitrião dispara a síntese de voz `expo-speech` em `pt-BR` com a legenda correspondente, e executar sequencialmente as ações apenas nos dispositivos de Assassino, Anjo e Detetive.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que a partida entrou em uma fase noturna (`night_assassin`, `night_angel`, `night_detective`), **Quando** a tela é renderizada, **Então** utiliza `darkTokens` de `@/view/theme`, exibe a legenda expressiva do Narrador no topo em todos os celulares (`RNF08`) e reproduz a fala via `expo-speech` (`ExpoSpeechNarratorAudioService`) **exclusivamente no dispositivo do Anfitrião** (`RF19`, Issue `#32`).
2. **Dado** que é o turno do **Assassino** (`night_assassin`), **Quando** o Assassino vivo seleciona uma vítima viva e confirma em *"Confirmar Alvo"*, **Então** o alvo noturno é registrado e a noite avança para o turno do **Anjo** (`night_angel`); outros jogadores (inclusive o Anfitrião, se não for Assassino) permanecem na tela de sono (`RNF11`).
3. **Dado** que é o turno do **Anjo** (`night_angel`), **Quando** o Anjo vivo seleciona um jogador vivo e confirma em *"Proteger Jogador"*, **Então** a proteção noturna é registrada e a noite avança para o turno do **Detetive** (`night_detective`) (`RF19`, `RNF11`).
4. **Dado** que é o turno do **Detetive** (`night_detective`), **Quando** o Detetive vivo seleciona um suspeito para investigar, **Então** **apenas a tela do Detetive** exibe o veredito imediato com independência de cor (**Suspeito Confirmado / Assassino** com `color.errorContainer`, raio `radius.sm` e ícone `alert-circle`; ou **Cidadão Inocente** com `color.success`, raio `radius.md` e ícone `check-circle`) e o botão *"Concluir Noite e Amanhecer"* — nem o Anfitrião visualiza esse veredito caso possua outro papel (`RF19`, `RNF06`, `RNF11`).

---

### História de Usuário 3 — O Dia (Tema Claro, Boletim do Amanhecer, Debate Cronometrado, Votação Secreta e Fim de Jogo) (Prioridade: P1)

Como **Jogador Vivo durante O Dia**, quero que a tela retorne ao **Modo Claro (`tokens`)**, apresente o **Boletim do Amanhecer** (revelando se houve eliminação ou salvamento pelo Anjo), execute o cronômetro de debate presencial, conduza a **Votação Secreta** e limite os controles de condução pública da partida ao Anfitrião até que a **Cidade** ou os **Assassinos** vençam.

**Por que esta prioridade:** Fecha o ciclo de dedução social e deliberação coletiva do grupo com verificação automática das condições de vitória e respeito às permissões do Anfitrião (`RF10`, `RF19`, `RF20`, `RNF11`).

**Como testar independentemente:** Concluir uma noite (com ataque salvo pelo Anjo e com ataque bem-sucedido), verificar o Boletim da Manhã, validar que apenas o Anfitrião vê os botões *"Iniciar Votação Secreta"*, *"Encerrar e Apurar Votos da Cidade"*, *"Iniciar Próxima Noite"* e *"Jogar Novamente (Revanche)"*, testar votação com maioria simples e empate/abstenção, e validar as condições de vitória.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que a noite terminou e o Anjo protegeu o mesmo jogador atacado pelo Assassino, **Quando** o Dia inicia (`day_debate`), **Então** a tela usa `tokens` (Modo Claro), o Boletim do Amanhecer anuncia que o Anjo salvou a vítima e apenas o Anfitrião visualiza o botão *"Iniciar Votação Secreta"* enquanto os demais aguardam (`RF19`, `RNF11`).
2. **Dado** que o Assassino atacou um jogador não protegido pelo Anjo, **Quando** o Dia inicia, **Então** o jogador atacado passa para `isAlive: false` (Modo Espectador *"Fantasma"*) e o sistema verifica imediatamente se os Assassinos atingiram paridade numérica com os inocentes vivos (`RF19`, `RF20`).
3. **Dado** que a sala entrou em `day_voting`, **Quando** os jogadores vivos registram seu voto secreto (em um suspeito vivo ou em *"Abster-se / Pular Voto"*) e o Anfitrião aciona *"Encerrar e Apurar Votos da Cidade"*, **Então** o mais votado por maioria simples é eliminado (ou ninguém é eliminado em caso de empate/maioria de abstenções) (`RF20`, `RNF11`).
4. **Dado** que após a apuração restam vivos jogadores de ambos os lados (`vote_result`), **Quando** o resultado é exibido, **Então** apenas o Anfitrião visualiza *"Iniciar Próxima Noite"* e os demais exibem estado de espera (`RNF11`).
5. **Dado** que todos os Assassinos foram eliminados ou atingiram paridade numérica (`finished`), **Quando** a tela de resultado final é exibida, **Então** revela todos os papéis, declara o vencedor (**Vitória da Cidade** ou **Vitória dos Assassinos**), exibe *"Jogar Novamente (Revanche)"* exclusivamente para o Anfitrião e *"Trocar de Jogo"* para todos (`RF20`, `RNF11`).

---

### Casos de Borda (Edge Cases)

- **Apelido curto (`< 2` letras), duplicado por outro usuário ou Código PIN inválido (`< 4` caracteres / inexistente):** Lança `ValidationError` ou `DataSourceError` com feedback semântico na tela de entrada, preservando os campos preenchidos durante o carregamento.
- **Tentativa de iniciar partida com menos de 5 jogadores (ou mais de 16):** Lança `ValidationError` exigindo entre 5 e 16 jogadores conectados na sala.
- **Permissões estritas do Anfitrião pós-distribuição (`RNF11`):** Após distribuir os papéis, o Anfitrião atua como jogador comum: não pode ver papéis alheios, agir em turnos noturnos de outros papéis nem ver o veredito do Detetive caso não seja o Detetive. Seus privilégios restringem-se a controles públicos sem segredo (áudio do Narrador, iniciar votação, apurar votos, iniciar próxima noite e revanche).
- **Jogador eliminado (Modo Espectador / "Fantasma"):** Continua visualizando o andamento da partida e legendas com o selo *"Você foi eliminado — Acompanhe em silêncio"*, mas não pode executar ações noturnas nem votar (`ValidationError` caso tente no UseCase).
- **Empate na votação diurna ou maioria em "Abster-se / Pular Voto":** Ninguém é eliminado naquele ciclo e uma nova noite se inicia.
- **Testabilidade Automatizada na Infraestrutura:** `MemoryMultiplayerRoomService` e `MemoryNarratorAudioService` permanecem exclusivamente na camada `src/infra/` como implementações determinísticas para testes unitários (`npm test`), sem exposição de modo offline ou bots na interface do Cidade Dorme.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF01` (Ativação no Catálogo)**: Ativar o card do **Cidade Dorme** em `MemoryGameCatalogDataSource` (`available: true`, `playersTag: 'Multi-Celular · 5–16 jogadores'`).
- **`RF09` / `RF10` / `RF11`**: Exibir claramente a fase/turno ativo no topo, controlar o tempo dos turnos noturnos (`15s` / `20s`) e do debate diurno (`60s` / `120s` / `180s`) com `ExpressiveTimer` (modo crítico `<= 10s`), e permitir saída segura com modal de confirmação (`ConfirmModal`) e remoção limpa da sala no Lobby (`leaveRoom`).
- **`RF18`**: Sortear e distribuir secretamente os papéis de **Cidadão**, **Assassino**, **Anjo** e **Detetive**, exigindo confirmação individual de visualização e ocultação no aparelho de cada jogador antes do início da primeira noite.
- **`RF19` / `RNF08` (Issue `#32`)**: Permitir ao Moderador escolher a voz do Narrador (**Masculina** ou **Feminina**) e conduzir **A Noite** (`darkTokens`) e **O Dia** (`tokens`) usando síntese de voz `expo-speech` em `pt-BR` **apenas no aparelho do Anfitrião**, exibindo legendas sincronizadas em todos os celulares.
- **`RF20`**: Coletar votos secretos dos jogadores vivos (incluindo opção *"Abster-se / Pular Voto"*), apurar maioria simples/empate, eliminar suspeito quando aplicável e verificar vitória da **Cidade** (`assassinosVivos === 0`) ou dos **Assassinos** (`assassinosVivos >= inocentesVivos`), permitindo **Revanche** pelo Anfitrião na mesma sala.
- **`RNF11`**: Garantir isolamento de papéis, turnos noturnos e veredito do Detetive na interface de todos os jogadores (inclusive do Anfitrião). *(Nota: o isolamento completo na camada de banco de dados via `cidade_dorme_secrets` + RLS/RPCs no Supabase permanece mapeado como evolução de backend em `docs/harness/05-infraestrutura-e-supabase.md`.)*

### Entidades de Domínio Envolvidas (`src/model/entities/multiplayerSession.ts`)
- **`CidadeDormeRole`**: `'cidadao' | 'assassino' | 'anjo' | 'detetive'`
- **`CidadeDormeAlignment`**: `'cidade' | 'infiltrados'`
- **`CidadeDormeVoiceProfile`**: `'masculina' | 'feminina'`
- **`CidadeDormePhase`**: `'lobby' | 'role_reveal' | 'night_assassin' | 'night_angel' | 'night_detective' | 'day_debate' | 'day_voting' | 'vote_result' | 'finished'`
- **`CidadeDormeConfig`**: `{ narratorVoice: CidadeDormeVoiceProfile; assassinCount: 1 | 2 | 3; dayDebateSeconds: 60 | 120 | 180; nightTurnSeconds: 15 | 20; revealRoleOnDeath: boolean }`
- **`CidadeDormeDetectiveVerdict`**: `{ targetPlayerId: string; targetNickname: string; isAssassin: boolean; roundNumber: number }`
- **`CidadeDormeDawnReport`**: `{ roundNumber: number; attackedPlayerId: string | null; attackedNickname: string | null; savedByAngel: boolean; eliminatedPlayerId: string | null; eliminatedNickname: string | null; eliminatedRole: CidadeDormeRole | null }`
- **`CidadeDormeVoteReport`**: `{ roundNumber: number; eliminatedPlayerId: string | null; eliminatedNickname: string | null; eliminatedRole: CidadeDormeRole | null; tieOrSkipped: boolean; voteCounts: Record<string, number>; skipCount: number }`
- **`CidadeDormePlayer`**: `{ id: string; nickname: string; isHost: boolean; isAlive: boolean; isReady: boolean; role: CidadeDormeRole; hasVoted: boolean }`
- **`CidadeDormeRoom`**: Estado completo da sala contendo `id`, `code`, `gameType: 'cidade-dorme'`, `hostId`, `phase`, `config`, `currentRound`, `narratorCaption`, `players`, `nightTargetId`, `nightProtectedId`, `detectiveVerdict`, `votesByPlayerId`, `dawnReport`, `voteReport` e `winner: CidadeDormeAlignment | null`.

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (IHC / Acessibilidade)**: Transição automática entre `darkTokens` (Noite) e `tokens` (Dia), legendas visuais para todas as falas do Narrador (`RNF08`) com síntese `expo-speech` exclusiva no aparelho do Anfitrião, alvos mínimos de `48 dp × 48 dp` (`64 dp` nos botões Jumbo) e independência de cor (`Cor + Forma + Ícone + Rótulo`) no veredito do Detetive e nos estados de votação.
- **`CS-02` (Segurança e Papéis `RNF11`)**: O Anfitrião não visualiza o veredito do Detetive (a menos que seja o Detetive), não atua em turnos de papéis alheios e os demais jogadores não visualizam controles de condução do Anfitrião.
- **`CS-03` (Arquitetura MVVM)**: `npm run check` (`check-arquitetura.mjs` + `tsc --noEmit` + `jest`) executa com **0 violações** e todos os testes passando.
