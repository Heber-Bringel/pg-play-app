# 📋 Especificação de Funcionalidade (`spec.md`): UC12 — Desenho Relâmpago (Multiplayer)

- **Branch da Feature:** `feat/028-uc12-desenho-relampago`
- **Criado em:** 2026-11-25 (Refatorado para Sala Multiplayer + Formas Geométricas + Canvas Expandido + Tema 5s)
- **Status:** Aprovado e Implementado
- **Caso(s) de Uso / Requisito(s):** `UC12` (`RF41`–`RF44`, `RF09`–`RF12`, `RF28`–`RF30`, `RNF01`–`RNF11`) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md` e `docs/jogos/desenho-relampago.md`
- **Issue vinculada:** `#83`

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Criar ou entrar em sala multiplayer de Desenho Relâmpago (Prioridade: P1)

Como **Participante ou Líder do PG**, quero criar ou entrar em uma sala multiplayer de *Desenho Relâmpago* usando apenas meu apelido e um código PIN curto (sem cadastro), para que cada pessoa do grupo jogue no próprio celular e o Anfitrião configure tempo, rodadas e pacotes desenháveis antes de iniciar.

**Por que esta prioridade:** Estabelece a modalidade exclusiva de **Sala Multiplayer** (`2` a `16` jogadores, como *Cidade Dorme* e *Adedonha Bíblica*), suportando tanto sincronização via **Supabase Realtime** quanto execução offline/testes via `MemoryMultiplayerRoomService`.

**Como testar independentemente:** Criar uma sala com apelido válido, entrar com um 2º jogador usando o código PIN, alterar duração (`60s`/`90s`/`120s`), rodadas (`1`–`5`) e pacotes desenháveis no Lobby (validando que não é possível desmarcar o último pacote) e iniciar a partida com `>= 2` jogadores.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o usuário acessou `/desenho` a partir do Hub (na modalidade **Sala Multiplayer**), **Quando** informa um apelido de `2` a `20` caracteres e toca em **"Criar Sala"**, **Então** uma sala na fase `lobby` é criada com código PIN curto, o usuário é marcado como Anfitrião e os pacotes padrão (*Bíblico*, *Animais*, *Objetos*, *Comidas*, *Lugares e Natureza*), duração (`90s`) e rodadas (`2`) ficam selecionados (`RF44`, `RNF03`).
2. **Dado** um código PIN válido de uma sala no `lobby`, **Quando** outro participante informa seu apelido e toca em **"Entrar na Sala"**, **Então** ele aparece na lista de jogadores em tempo real para todos os conectados.
3. **Dado** que há menos de `2` jogadores na sala ou o Anfitrião tenta desmarcar o último pacote desenhável, **Quando** tenta iniciar ou atualizar a configuração, **Então** o `DesenhoUseCases` bloqueia a ação lançando `ValidationError` (`RF44`).

---

### História de Usuário 2 — Ver o tema por 5s, expandir o canvas e desenhar com pincel e formas geométricas (Prioridade: P1)

Como **Desenhista da Vez**, quero ver a palavra secreta apenas na minha tela durante os primeiros `5 segundos` do turno, vê-la desaparecer automaticamente para o canvas ficar maior ocupando o espaço do tema (com opção discreta de espiar por `3s` se eu esquecer), e desenhar usando pincel livre ou formas geométricas (*Linha*, *Retângulo*, *Círculo*, *Triângulo* — contorno ou preenchido) sincronizadas em tempo real com a sala.

**Por que esta prioridade:** Entrega as mudanças centrais solicitadas na refatoração: canvas maior e dominante na tela, exibição temporária de `5s` do tema e biblioteca expressiva de formas geométricas com preenchimento.

**Como testar independentemente:** Iniciar um turno, observar o tema visível para o Desenhista por `5s`, confirmar seu desaparecimento automático e a expansão do `DrawingCanvas` (`expanded={true}`), tocar em **"Espiar palavra"** e confirmar reexibição por `3s`; alternar entre `Pincel`, `Linha`, `Retângulo`, `Círculo` e `Triângulo`, alternar `Contorno`/`Preenchido`, cores e espessuras, arrastar para desenhar e verificar pré-visualização, `Desfazer` e `Limpar`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que um turno iniciou na fase `drawing`, **Quando** a tela do **Desenhista** abre, **Então** a palavra secreta e o aviso *"Sem letras nem números"* aparecem em destaque por **`5 segundos`**; para os demais jogadores (**Adivinhadores**), a palavra secreta **nunca** é enviada nem exibida (`RF42`, `RNF11`).
2. **Dado** que se passaram `5 segundos` desde o início do turno, **Quando** o temporizador do tema chega a `0`, **Então** o bloco do tema desaparece automaticamente e o `DrawingCanvas` expande (`canvas.expandedMinHeight`) ocupando o espaço que era do tema (`RF41`, `RF42`).
3. **Dado** que o tema desapareceu após `5s`, **Quando** o Desenhista toca no botão discreto **"Espiar palavra"**, **Então** o tema reaparece sobreposto por **`3 segundos`** e desaparece novamente sem pausar o cronômetro nem apagar os traços (`RF42`).
4. **Dado** que o Desenhista seleciona **Pincel Livre** ou qualquer uma das **4 formas geométricas** (*Linha*, *Retângulo*, *Círculo*, *Triângulo*) e escolhe **Contorno** (`stroke`) ou **Preenchido** (`fill`) junto a uma das `4` cores e `2` espessuras, **Quando** arrasta o dedo na folha, **Então** vê a pré-visualização da forma em tempo real, o scroll vertical permanece travado durante o gesto e, ao soltar, o elemento é enviado à sala e exibido imediatamente nos celulares dos adivinhadores (`RF41`).
5. **Dado** que há elementos desenhados na folha, **Quando** o Desenhista toca em **"Desfazer"** ou **"Limpar"**, **Então** o último elemento (ou toda a folha) é removido localmente e sincronizado com a sala (`RF41`).

---

### História de Usuário 3 — Acompanhar o desenho em tempo real, digitar palpites e consolidar o pódio da sala (Prioridade: P1)

Como **Adivinhador na Sala**, quero acompanhar o desenho em tempo real no meu celular (canvas ampliado em modo somente leitura) e digitar palpites com validação automática que proteja a palavra secreta no chat e pontue por rapidez, avançando até o resumo do turno e o Pódio Final da sala.

**Por que esta prioridade:** Fecha o ciclo multiplayer competitivo estilo *Gartic*, garantindo justiça (sem spoiler no chat), feedback claro e alternância automática de desenhistas até o fim das rodadas.

**Como testar independentemente:** Com 2+ jogadores na sala, enquanto o Desenhista cria traços e formas, verificar a renderização em tempo real na visão do Adivinhador (`readOnly={true}`); enviar um palpite errado (visível no feed), depois enviar a palavra correta (ignorando acentos/maiúsculas), verificar que a resposta não vaza no chat, os pontos são somados ao adivinhador e ao desenhista, o turno encerra quando todos acertam (ou em `00:00`) revelando a palavra em `turn_summary`, e após todas as rodadas o `finished` exibe o pódio com prêmios.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que sou um **Adivinhador** na fase `drawing`, **Quando** o Desenhista cria traços/formas, **Então** visualizo o `DrawingCanvas` em modo `readOnly` (sem barra de ferramentas e em 100% de opacidade) atualizado em tempo real, a categoria da palavra, o feed de palpites e o campo para enviar palpites (`RF41`, `RF43`).
2. **Dado** um palpite digitado por um adivinhador, **Quando** enviado ao `DesenhoUseCases.submitGuess`, **Então** o texto é normalizado (sem acentos, cedilha ou diferença de maiúsculas); se **incorreto**, aparece no feed da sala; se **correto**, registra *"✅ [Jogador] acertou!"* sem revelar a palavra, soma `+20 pts` (1º), `+15 pts` (2º) ou `+10 pts` (3º+) ao adivinhador e `+10 pts` (1º acerto) / `+5 pts` (acertos extras) ao Desenhista, bloqueando novos palpites daquele jogador no turno (`RF43`, `RNF11`).
3. **Dado** que todos os adivinhadores acertaram ou o cronômetro chegou a `00:00`, **Quando** o turno encerra, **Então** a sala transita para `turn_summary`, bloqueia o canvas, revela a palavra secreta e os pontos do turno, e o Anfitrião pode avançar para o próximo desenhista até o Pódio Final (`finished`) com *Campeão Geral*, *Melhor Artista* e *Olho de Águia* (`RF10`, `RF12`).
4. **Dado** qualquer fase ativa da sala, **Quando** o jogador toca em **"Sair"** no canto superior esquerdo e confirma no `ConfirmModal`, **Então** desconecta-se com segurança e retorna ao Hub (`RF11`).

---

### Casos de Borda (Edge Cases)

- **Desenhista tentando enviar palpite:** O `DesenhoUseCases` rejeita com `ValidationError` qualquer palpite enviado pelo próprio desenhista da vez ou por quem já acertou no turno.
- **Modo `fill` na ferramenta `line` ou `freehand`:** Para `freehand` e `line`, o preenchimento não se aplica; o seletor `Contorno`/`Preenchido` desabilita-se com feedback claro e o elemento é sempre renderizado em `stroke`.
- **Toque curto sem arrastar (ponto único / forma mínima):** No modo `freehand`, gera ponto único (`M x y L x y`); em formas geométricas (`line`, `rectangle`, `circle`, `triangle`), gestos com deslocamento desprezível (`< 2 dp`) são ignorados para evitar artefatos invisíveis.
- **Sobreposição de temporizadores (`5s` inicial vs `3s` espiar vs fim do turno):** Se o turno encerrar (por tempo `00:00` ou todos acertarem) durante os `5s` iniciais ou durante uma espiada de `3s`, os timers são limpos no `useEffect` cleanup sem vazamento de memória nem atualização em componente desmontado.
- **Desconexão / saída do desenhista ou anfitrião:** Se o desenhista sair no meio do turno, a sala pode avançar o turno de forma segura; se restar menos de `2` jogadores em partida ativa, a sala encerra graciosamente no `finished`.
- **Modo Offline / Testes sem Supabase (`MemoryMultiplayerRoomService`):** Quando `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` não estão configurados (ou nos testes Jest), toda a mecânica multiplayer funciona localmente em memória com o mesmo contrato `IMultiplayerRoomService`.
- **Feedback Tátil e Movimento Reduzido (`RF10`, `RNF09`):** Entre `10s` e `1s` restantes, `useDesenhoViewModel` notifica `IGameFeedbackUseCases.notifyTimerTick(prev, curr, { reduceMotion })`.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF41` (Canvas Expandido com Pincel + 4 Formas Geométricas + Preenchimento):** `DrawingCanvas` renderiza `freehand`, `line`, `rectangle`, `circle` e `triangle` em `react-native-svg` (`Path`, `Line`, `Rect`, `Ellipse`, `Polygon`) com alternância `stroke` / `fill`, 4 cores acessíveis, 2 espessuras, `Desfazer`, `Limpar`, modo `expanded` (`canvas.expandedMinHeight`) e modo `readOnly` para adivinhadores.
- **`RF42` (Tema Temporário 5s + Expansão + Espiar 3s + Regra de Honra):** No início de cada turno, o tema aparece apenas para o Desenhista por `5s`, desaparece automaticamente liberando o canvas expandido e oferece o botão discreto **"Espiar palavra"** (`3s`), mantendo a regra *"Sem letras nem números"*.
- **`RF43` (Sincronização em Tempo Real, Palpites e Pontuação):** Elementos desenhados e palpites sincronizam em tempo real na sala (`IMultiplayerRoomService`); validação automática ignora acentos/maiúsculas, oculta respostas corretas do chat e aplica pontuação `+20`/`+15`/`+10` (adivinhadores) e `+10`/`+5` (desenhista).
- **`RF44` (Lobby Multiplayer e Parâmetros da Sala):** Criação/entrada por PIN + apelido (`2`–`16` jogadores, sem login), configuração de duração (`60 | 90 | 120s`), rodadas (`1`–`5`, padrão `2`) e seleção dos 5 pacotes próprios de palavras desenháveis (`IGameCatalogDataSource`).
- **`RF09`–`RF12`, `RF28`–`RF30`, `RNF11`:** Identificação da vez/fase, cronômetro crítico `<= 10s` com háptico, saída segura com `ConfirmModal`, não repetição de palavras e isolamento do segredo do desenhista.

### Entidades de Domínio Envolvidas (`src/model/entities/`)
- **`src/model/entities/drawingChallenge.ts`**:
  - `DrawingPenColorId`: `'ink' | 'purple' | 'coral' | 'green'`
  - `DrawingStrokeWidthId`: `'thin' | 'thick'`
  - `DrawingToolId`: `'freehand' | 'line' | 'rectangle' | 'circle' | 'triangle'`
  - `DrawingFillMode`: `'stroke' | 'fill'`
  - `DrawingPoint`: `{ x: number; y: number }`
  - `DrawingElement` (união discriminada por `tool`):
    - traço livre (`tool: 'freehand'`, `points: DrawingPoint[]`, `colorId`, `widthId`)
    - forma geométrica (`tool: 'line' | 'rectangle' | 'circle' | 'triangle'`, `start: DrawingPoint`, `end: DrawingPoint`, `fillMode: DrawingFillMode`, `colorId`, `widthId`)
  - `DesenhoCategory`, `DesenhoCard`
- **`src/model/entities/multiplayerSession.ts`**:
  - `DesenhoPhase`: `'lobby' | 'drawing' | 'turn_summary' | 'finished'`
  - `DesenhoDurationOption`: `60 | 90 | 120`
  - `DesenhoConfig`: `{ turnDurationSeconds: DesenhoDurationOption; totalRounds: number; categories: DesenhoCategory[] }`
  - `DesenhoPlayer`: `{ id: string; nickname: string; isHost: boolean; score: number; drawingScore: number; firstGuessCount: number; hasGuessedCurrentTurn: boolean }`
  - `DesenhoGuess`: `{ id: string; playerId: string; playerNickname: string; text: string; isCorrect: boolean; pointsAwarded: number; createdAt: string }`
  - `DesenhoAwards`: `{ generalChampion: DesenhoPlayer | null; bestArtist: DesenhoPlayer | null; eagleEye: DesenhoPlayer | null }`
  - `DesenhoRoom`: `{ id, code, gameType: 'desenho', hostId, phase, version, phaseEndsAt, config, currentRound, drawerOrder, currentDrawerIndex, currentDrawerId, currentCardCategory, currentSecretWord (apenas para o desenhista ou após turn_summary), usedCardIds, elements: DrawingElement[], guesses: DesenhoGuess[], players: DesenhoPlayer[] }`

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (IHC / Acessibilidade Motora e Visual — `RNF05`–`RNF08`)**: Todos os controles da barra (5 ferramentas/formas, 2 estilos de preenchimento, 4 cores, 2 espessuras, *Desfazer*, *Limpar*, *Espiar palavra*) têm alvo mínimo `48 dp × 48 dp` (`64 dp` nos botões Jumbo), contraste `>= 4,88:1`, seleção comunicada por forma + borda + ícone + rótulo textual e `accessibilityLiveRegion` nos anúncios de tema/acerto.
- **`CS-02` (Tema 5s e Canvas Expandido — `RF41`, `RF42`)**: O tema inicial some automaticamente após `5000 ms`, expandindo o `DrawingCanvas` para `canvas.expandedMinHeight`, e o botão *"Espiar palavra"* reexibe por `3000 ms`.
- **`CS-03` (Segredo Isolado no Multiplayer — `RNF11`)**: Adivinhadores nunca recebem `currentSecretWord` durante `drawing` nem veem o texto de um palpite correto no feed público.
- **`CS-04` (Design Tokens Puros e Arquitetura MVVM — `RNF10`)**: Zero valores literais de cor/dimensão fora de `src/view/theme.ts`; `npm run check` (`check-arquitetura.mjs`, `check-design-system.mjs`, `tsc --noEmit` e `jest`) com **0 violações e 0 falhas**.
