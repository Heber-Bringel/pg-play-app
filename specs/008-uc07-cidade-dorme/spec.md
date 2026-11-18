# 📋 Especificação de Funcionalidade (`spec.md`): UC07 — Cidade Dorme em Sala Multiplayer com Narrador por Áudio

- **Branch da Feature:** `feat/008-uc07-cidade-dorme`
- **Criado em:** 2026-11-18
- **Status:** Em Revisão
- **Caso(s) de Uso / Requisito(s):** `UC07` (`RF09`, `RF10`, `RF11`, `RF18`, `RF19`, `RF20`, `RNF03`, `RNF05`, `RNF06`, `RNF07`, `RNF08`, `RNF09`, `RNF10`, `RNF11`) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md`, `docs/jogos/cidade-dorme.md` e `docs/harness/05-infraestrutura-e-supabase.md`
- **Milestone / Issue vinculada:** `v1.0.0 — Jogos em Sala Multiplayer (UC07–UC08)` / Issue `#9`

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Identificação, Lobby da Sala, Configurações do Moderador e Sorteio Secreto de Papéis (Prioridade: P1)

Como **Moderador ou Participante do PG**, quero criar ou entrar em uma sala multiplayer do **Cidade Dorme** via código PIN (ou Sala Demo offline), configurar os parâmetros da partida (perfil de voz do Narrador **Masculina** ou **Feminina**, quantidade de Assassinos, tempos de noite/debate e revelação de papel ao morrer) e revelar secretamente meu papel (**Cidadão**, **Assassino**, **Anjo** ou **Detetive**) confirmando que estou pronto para a noite.

**Por que esta prioridade:** Permite que 100% dos presentes joguem (inclusive o líder) com distribuição secreta e isolada de papéis sem excluir ninguém para narrar (`RF18`, `RF19`, `RNF03`, `RNF11`).

**Como testar independentemente:** Abrir `/cidade-dorme`, criar sala ou entrar na sala demo com ao menos 5 jogadores, ajustar configurações no Lobby, iniciar a partida, tocar em *"Revelar Meu Papel"* e depois em *"Esconder e Estou Pronto"*.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o usuário acessou o Cidade Dorme, **Quando** informa um apelido válido (`>= 2` caracteres) e cria uma sala (ou entra com código PIN / Sala Demo com 5+ jogadores), **Então** ingressa no Lobby visualizando o código PIN, a lista de participantes e as configurações da partida (`RNF03`).
2. **Dado** que o Moderador está no Lobby com pelo menos 5 jogadores, **Quando** escolhe a voz do Narrador (**Masculina** ou **Feminina**) e toca em *"Distribuir Papéis e Iniciar"*, **Então** o sistema sorteia secretamente os papéis (**Assassino**, **Anjo**, **Detetive** e **Cidadãos**) respeitando a quantidade configurada e avança para a fase `role_reveal` (`RF18`, `RF19`).
3. **Dado** que a sala está na fase `role_reveal`, **Quando** o jogador toca em *"Revelar Meu Papel"* e em seguida em *"Esconder e Estou Pronto"*, **Então** o card secreto volta a ficar oculto, o jogador é marcado como pronto e, assim que todos confirmam, a partida avança para a primeira Noite (`RF18`, `RNF11`).

---

### História de Usuário 2 — A Noite (Tema Escuro, Narrador por Áudio + Legendas e Turnos de Assassino, Anjo e Detetive) (Prioridade: P1)

Como **Jogador da Sala durante A Noite**, quero que a tela adote automaticamente o **Modo Escuro (`darkTokens`)**, exiba as legendas sincronizadas com a voz do Narrador e libere os controles apenas no turno do meu papel secreto (**Assassino** escolhe vítima, **Anjo** escolhe protegido, **Detetive** investiga suspeito e recebe veredito visual silencioso).

**Por que esta prioridade:** É o coração da mecânica noturna do Cidade Dorme, combinando imersão, acessibilidade sensorial (áudio + legenda + cor + forma + ícone) e anti-trapaça (`RF19`, `RNF06`, `RNF08`, `RNF11`).

**Como testar independentemente:** Iniciar a fase da Noite, verificar a aplicação de `darkTokens`, a legenda do Narrador e executar sequencialmente as ações de Assassino, Anjo e Detetive.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que a partida entrou em uma fase noturna (`night_assassin`, `night_angel`, `night_detective`), **Quando** a tela é renderizada, **Então** utiliza `darkTokens` de `@/view/theme`, exibe a legenda expressiva do Narrador no topo (`RNF08`) e reproduz a fala pelo `INarratorAudioService` no dispositivo do Anfitrião (`RF19`).
2. **Dado** que é o turno do **Assassino** (`night_assassin`), **Quando** o Assassino seleciona um jogador vivo como alvo e confirma em *"Confirmar Alvo"*, **Então** o alvo noturno é registrado e a noite avança para o turno do **Anjo** (`night_angel`) (`RF19`).
3. **Dado** que é o turno do **Anjo** (`night_angel`), **Quando** o Anjo seleciona um jogador vivo e confirma em *"Proteger Jogador"*, **Então** a proteção noturna é registrada e a noite avança para o turno do **Detetive** (`night_detective`) (`RF19`).
4. **Dado** que é o turno do **Detetive** (`night_detective`), **Quando** o Detetive seleciona um jogador vivo para investigar, **Então** apenas o Detetive visualiza o veredito imediato com independência de cor (**Suspeito Confirmado / Assassino** com `color.errorContainer`, raio `radius.sm` e ícone `alert-circle`; ou **Cidadão Inocente** com `color.success`, raio `radius.md` e ícone `check-circle`) antes de avançar para o Amanhecer (`RF19`, `RNF06`, `RNF11`).

---

### História de Usuário 3 — O Dia (Tema Claro, Boletim do Amanhecer, Debate Cronometrado, Votação Secreta e Fim de Jogo) (Prioridade: P1)

Como **Jogador Vivo durante O Dia**, quero que a tela retorne ao **Modo Claro (`tokens`)**, apresente o **Boletim do Amanhecer** (revelando se houve eliminação ou salvamento pelo Anjo), execute o cronômetro de debate presencial e conduza a **Votação Secreta** até que a **Cidade** ou os **Assassinos** vençam.

**Por que esta prioridade:** Fecha o ciclo de dedução social e deliberação coletiva do grupo com verificação automática das condições de vitória (`RF10`, `RF19`, `RF20`).

**Como testar independentemente:** Concluir uma noite (com ataque salvo pelo Anjo e com ataque bem-sucedido), verificar o Boletim da Manhã, iniciar e encerrar a votação com maioria simples e com empate/abstenção, e validar as condições de vitória da Cidade e dos Assassinos.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que a noite terminou e o Anjo protegeu o mesmo jogador atacado pelo Assassino, **Quando** o Dia inicia (`day_debate`), **Então** a tela usa `tokens` (Modo Claro) e o Boletim do Amanhecer anuncia que o Anjo salvou a vítima e ninguém foi eliminado (`RF19`).
2. **Dado** que o Assassino atacou um jogador não protegido pelo Anjo, **Quando** o Dia inicia, **Então** o jogador atacado passa para `isAlive: false` (Modo Espectador *"Fantasma"*) e o sistema verifica imediatamente se os Assassinos atingiram paridade numérica com os inocentes vivos (`RF19`, `RF20`).
3. **Dado** que o tempo de debate encerrou e a sala entrou em `day_voting`, **Quando** os jogadores vivos registram seu voto secreto (em um suspeito vivo ou em *"Abster-se / Pular Voto"*) e a votação é apurada, **Então** o mais votado por maioria simples é eliminado (ou ninguém é eliminado em caso de empate/maioria de abstenções) (`RF20`).
4. **Dado** que após o amanhecer ou votação todos os Assassinos foram eliminados, **Quando** o sistema verifica condições de fim de jogo, **Então** encerra a partida (`finished`) declarando **Vitória da Cidade**, revela todos os papéis e oferece **"Jogar Novamente (Revanche)"** ou **"Trocar de Jogo"** (`RF20`).
5. **Dado** que o número de Assassinos vivos igualou ou superou o número de inocentes vivos, **Quando** o sistema verifica condições de fim de jogo, **Então** encerra a partida (`finished`) declarando **Vitória dos Assassinos** (`RF20`).

---

### Casos de Borda (Edge Cases)

- **Apelido curto (`< 2` letras) ou Código PIN inválido (`< 4` caracteres / inexistente):** Lança `ValidationError` ou `DataSourceError` com feedback semântico na tela de entrada.
- **Tentativa de iniciar partida com menos de 5 jogadores (ou mais de 16):** Lança `ValidationError` exigindo entre 5 e 16 jogadores na sala.
- **Personagem especial (Anjo ou Detetive) já eliminado:** Durante a noite, se o Anjo ou Detetive estiver morto (`isAlive: false`), o sistema mantém a cadência narrativa simulada para não entregar aos demais que o papel morreu (`RNF11`).
- **Jogador eliminado (Modo Espectador / "Fantasma"):** Continua visualizando o andamento da partida e legendas com o selo *"Você foi eliminado — Acompanhe em silêncio"*, mas não pode executar ações noturnas nem votar (`ValidationError` caso tente no UseCase).
- **Empate na votação diurna ou maioria em "Abster-se / Pular Voto":** Ninguém é eliminado naquele ciclo e uma nova noite se inicia.
- **Modo Offline / Demonstração (`MemoryMultiplayerRoomService` + `MemoryNarratorAudioService`):** Permite jogar e testar 100% do fluxo de ponta a ponta (com jogadores simulados da sala) sem depender de rede ou áudio externo.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF01` (Ativação no Catálogo)**: Ativar o card do **Cidade Dorme** em `MemoryGameCatalogDataSource` (`available: true`, `playersTag: 'Multi-Celular · 5–16 jogadores'`).
- **`RF09` / `RF10` / `RF11`**: Exibir claramente a fase/turno ativo no topo, controlar o tempo dos turnos noturnos (`15s` / `20s`) e do debate diurno (`60s` / `120s` / `180s`) com `ExpressiveTimer` (modo crítico `<= 10s`), e permitir saída segura com modal de confirmação (`ConfirmModal`).
- **`RF18`**: Sortear e distribuir secretamente os papéis de **Cidadão**, **Assassino**, **Anjo** e **Detetive**, exigindo confirmação de visualização e ocultação antes do início da primeira noite.
- **`RF19`**: Permitir ao Moderador escolher a voz do Narrador (**Masculina** ou **Feminina**) e conduzir automaticamente **A Noite** (`darkTokens`, turnos de Assassino, Anjo e Detetive com veredito silencioso) e **O Dia** (`tokens` claro, Boletim do Amanhecer e debate), exibindo sempre legendas sincronizadas (`RNF08`).
- **`RF20`**: Coletar votos secretos dos jogadores vivos (incluindo opção *"Abster-se / Pular Voto"*), apurar maioria simples/empate, eliminar suspeito quando aplicável e verificar vitória da **Cidade** (`assassinosVivos === 0`) ou dos **Assassinos** (`assassinosVivos >= inocentesVivos`), permitindo **Revanche** na mesma sala.

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

- **`CS-01` (IHC / Acessibilidade)**: Transição automática entre `darkTokens` (Noite) e `tokens` (Dia), legendas visuais para todas as falas do Narrador (`RNF08`), alvos mínimos de `48 dp × 48 dp` (`64 dp` nos botões Jumbo) e independência de cor (`Cor + Forma + Ícone + Rótulo`) no veredito do Detetive e nos estados de votação.
- **`CS-02` (Arquitetura MVVM)**: `npm run check` (`check-arquitetura.mjs` + `tsc --noEmit` + `jest`) executa com **0 violações** e todos os testes passando.
