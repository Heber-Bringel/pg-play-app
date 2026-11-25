# 🎨 Especificação de Jogo: Desenho Relâmpago (Sala Multiplayer)

> **Modalidade:** Sala Multiplayer (1 Celular por Jogador via PIN · Realtime + Fallback `Memory*`)  
> **Caso de Uso:** `UC12` · **Requisitos:** `RF41`, `RF42`, `RF43`, `RF44`, `RF09`–`RF12`, `RF28`–`RF30`, `RNF01`–`RNF11`  
> **Sistema de Design:** [`PG Play Expressive`](../../design-system/README.md) (`DrawingCanvas`, `ExpressiveTimer`, `ExpressiveTextField`, `GameCard`, `ExpressiveButton`, `ExpressiveChip`, `ExpressiveTag`, `ConfirmModal`)

---

## 1. Visão Geral

O **Desenho Relâmpago** é uma dinâmica visual em **Sala Multiplayer** (estilo *Gartic*, adaptada ao PG presencial), onde cada participante joga no próprio celular entrando via código PIN sem cadastro (**RNF03**). A cada turno, um jogador assume o papel de **Desenhista**: a palavra secreta aparece em destaque no início do turno por **5 segundos** e depois desaparece automaticamente para o **canvas se expandir e ocupar a área do tema**, permitindo desenhar com pincel livre ou formas geométricas (linha, retângulo, círculo e triângulo — contorno ou preenchido). Os demais jogadores acompanham o desenho **em tempo real** no próprio aparelho e digitam palpites com validação automática e pontuação por rapidez.

- **Participantes:** `2` a `16` jogadores na mesma sala (o próprio Anfitrião/Moderador joga normalmente).
- **Duração padrão de um turno:** `90s` por desenhista (ajustável entre `60s`, `90s` e `120s`).
- **Conteúdo:** banco próprio de palavras concretas e "desenháveis", organizado em 5 pacotes selecionáveis por chips no Lobby: **Bíblico** (ex.: *Arca de Noé*, *Tábua dos Dez Mandamentos*, *Cova dos Leões*), **Animais** (ex.: *Girafa*, *Polvo*, *Borboleta*), **Objetos** (ex.: *Guarda-chuva*, *Violão*, *Lanterna*), **Comidas** (ex.: *Melancia*, *Pipoca*, *Sorvete*) e **Lugares e Natureza** (ex.: *Vulcão*, *Farol*, *Ilha Deserta*).
- **Isolamento do segredo (`RNF11`):** apenas o Desenhista da vez recebe a palavra secreta; os adivinhadores recebem somente a categoria e os traços/formas sincronizados em tempo real.
- **Regra de honra (`RF42`):** é proibido desenhar letras, sílabas ou números; o aviso *"Sem letras nem números"* permanece indicado na folha de desenho.

---

## 2. Parâmetros da Sala (`RF28`, `RF29`, `RF44`)

Configurados pelo **Anfitrião** no Lobby antes de iniciar a partida:

| Parâmetro | Padrão | Opções |
| :--- | :---: | :--- |
| Jogadores na sala | `2+` | `2` a `16` participantes (entrada por código PIN + apelido, sem login) |
| Tempo por turno | `90s` | `60s`, `90s`, `120s` |
| Número de rodadas | `2` | `1` a `5` (cada rodada = todos os jogadores da sala desenham 1 vez) |
| Pacotes desenháveis (`RF44`) | Todos selecionados | seleção múltipla por `ExpressiveChip` (*Bíblico*, *Animais*, *Objetos*, *Comidas*, *Lugares e Natureza*); ao menos 1 ativo |
| Exibição inicial do tema (`RF42`) | `5s` | fixo (`5s` no início do turno; botão discreto **"Espiar palavra"** exibe novamente por `3s` para o desenhista) |

---

## 3. Fluxo Completo da Partida

### 🚪 Fase 1 — Lobby da Sala (`lobby`)
1. O participante escolhe **Criar Sala** (como Anfitrião) ou **Entrar na Sala** informando um apelido (`2` a `20` caracteres) e o código PIN curto (**RNF03**).
2. A sala exibe o código PIN para compartilhar, a lista de jogadores conectados em tempo real e (para o Anfitrião) os controles de **Pacotes Desenháveis**, **Tempo por turno** (`60s` / `90s` / `120s`) e **Rodadas** (`1` a `5`).
3. Com pelo menos `2` jogadores na sala, o Anfitrião toca no botão `Primário Jumbo` **"Começar Partida!"** (`64 dp`), iniciando o 1º turno.

### 🎨 Fase 2 — Turno de Desenho e Adivinhação (`drawing`)
1. **Cronômetro e Feedback Tátil (`RF10`):** o `ExpressiveTimer` sincronizado (`phaseEndsAt`) conta regressivamente em todos os celulares, entra em **Modo Crítico** nos últimos `10s` (cor `error`, raio `16 dp`, ícone `alert`) e dispara pulsos táteis via `IGameFeedbackUseCases` respeitando `useReduceMotion`.
2. **Visão do Desenhista — Tema Temporário de 5s e Canvas Expandido (`RF42`):**
   - No instante em que o turno começa, um card/faixa de destaque exibe a **palavra secreta** (em `font.display`, `30 dp`), a categoria e a regra *"Sem letras nem números"* com contagem regressiva de **`5 segundos`**.
   - Ao concluir os **`5 segundos`**, o bloco do tema **desaparece automaticamente**, e o **`DrawingCanvas` se expande ocupando toda a área que era do tema** (`canvas.expandedMinHeight` / `flex: 1`), maximizando o espaço útil de desenho na tela.
   - Um botão discreto **"Espiar palavra"** no cabeçalho permite ao desenhista rever a palavra secreta em um banner sobreposto por **`3 segundos`** caso esqueça, sem interromper o cronômetro nem apagar os traços.
3. **Tela de Desenho com Formas Geométricas (`DrawingCanvas` — `RF41`):**
   - Folha de papel clara fixa (`canvas.paperBg` = `#FDF8FF`) ocupando a área principal da tela (`canvas.expandedMinHeight`), com `react-native-svg` + `PanResponder` e trava de rolagem vertical durante o gesto.
   - **Ferramentas de Desenho:**
     - **Pincel Livre (`freehand`)**: traço contínuo acompanhando o movimento do dedo.
     - **4 Formas Geométricas (`line`, `rectangle`, `circle`, `triangle`)**: arraste o dedo do ponto inicial ao ponto final para dimensionar **Linha**, **Retângulo**, **Círculo** ou **Triângulo** com pré-visualização em tempo real antes de soltar.
     - **Modo de Preenchimento (`stroke` | `fill`)**: alterna entre **Contorno** e **Preenchido** para *Retângulo*, *Círculo* e *Triângulo* (na ferramenta *Linha*, o modo permanece sempre contorno/traço).
   - **Cores, Espessuras e Edição:**
     - **4 cores acessíveis** (*Grafite*, *Roxo*, *Coral* e *Verde*);
     - **2 espessuras** (*Fina 4 dp* e *Grossa 8 dp*);
     - **"Desfazer"** (remove o último traço/forma sincronizado) e **"Limpar"** (apaga todos os elementos da folha atual).
   - Cada elemento finalizado (traço ou forma), bem como *"Desfazer"* e *"Limpar"*, é sincronizado em tempo real para todos os jogadores da sala.
4. **Visão dos Adivinhadores — Acompanhamento em Tempo Real e Palpites (`RF43`):**
   - Exibem o `DrawingCanvas` expandido em modo **somente leitura** (`readOnly={true}`, sem barra de ferramentas e sem opacidade reduzida), renderizando traços e formas conforme o desenhista cria.
   - Acima/abaixo da folha veem a **categoria da palavra** (nunca o texto secreto — `RNF11`), o histórico recente de palpites da sala e um campo `ExpressiveTextField` + botão **"Enviar"** para chutar a palavra.
   - **Validação automática:** o sistema normaliza o palpite (ignora maiúsculas/minúsculas, acentos, cedilha e espaços extras).
     - Se o palpite **acertar**, o texto exato **não é exibido no chat público** (exibe o selo *"✅ [Jogador] acertou!"*), o jogador recebe os pontos imediatamente e o campo de palpite é bloqueado para ele até o próximo turno.
     - Se **errar**, o palpite aparece no feed de tentativas da sala para ajudar ou divertir o grupo.
   - **Fim do Turno:** encerra automaticamente quando o cronômetro chega a `00:00` **ou** assim que **todos os adivinhadores da sala acertam a palavra**.
5. **Saída Segura (`RF11`):** botão **"Sair"** (delineado) no canto superior esquerdo abre `ConfirmModal` antes de desconectar o jogador da sala.

### 🔔 Fase 3 — Resumo do Turno (`turn_summary`)
1. Ao encerrar o turno, o `DrawingCanvas` é bloqueado para edição e a **palavra secreta é revelada** para toda a sala junto ao desenho final.
2. Exibe quem acertou na ordem de chegada, os pontos ganhos por cada jogador (incluindo o desenhista) e o placar atualizado da sala.
3. O Anfitrião toca em **"Próximo Desenhista"** (ou **"Ver Pódio Final"** no último turno) para avançar a fila de desenhistas.

### 🏆 Fase 4 — Pódio Final (`finished`)
- Quando todos os jogadores completam as rodadas configuradas **ou** o banco de palavras dos pacotes selecionados se esgota (**RF12**, **RF30**), o sistema exibe o **Pódio Final da Sala** com ranking ordenado e destaques:
  - 🥇 **Campeão Geral** (maior pontuação total na sala);
  - 🎨 **Melhor Artista** (mais pontos acumulados desenhando);
  - ⚡ **Olho de Águia** (mais acertos em 1º lugar).
- Oferece **"Jogar Novamente"** (reinicia no Lobby mantendo os participantes) ou **"Voltar ao Hub"**.

---

## 4. Regras de Pontuação e Banco de Palavras (`RF43`)

| Evento no Turno | Pontuação | Regra |
| :--- | :---: | :--- |
| **1º adivinhador a acertar** | `+20 pts` | Máxima pontuação pela rapidez |
| **2º adivinhador a acertar** | `+15 pts` | Bônus de vice-liderança no turno |
| **3º+ adivinhadores a acertar** | `+10 pts` | Incentiva todos a continuarem tentando |
| **Desenhista (1º acerto na sala)** | `+10 pts` | Recompensa quando o desenho é compreendido |
| **Desenhista (cada acerto extra)** | `+5 pts` | Incentiva clareza para o grupo inteiro acertar |
| **Ninguém acertou / Pular turno** | `0 pts` | Sem pontuação negativa; palavra revelada no resumo |

- **Sem repetição de palavras (`RF30`):** nenhuma palavra sorteada volta a aparecer na mesma partida.
- **Limpeza automática:** ao iniciar um novo turno, a lista de elementos do canvas (`elements`) e o feed de palpites são zerados automaticamente.
- **Proteção contra spoiler no chat (`RNF11`):** palpites corretos são interceptados na validação e substituídos por confirmação de acerto sem vazar a palavra para quem ainda não adivinhou.

---

## 5. Requisitos de IHC, Componentes e Acessibilidade

| Elemento da Tela | Componente / Token do Design System | Regra de Acessibilidade (WCAG 2.1 / M3 Expressive) |
| :--- | :--- | :--- |
| **Lobby, PIN e jogadores** | `GameCard` + `ExpressiveTextField` + `ExpressiveChip` + `ExpressiveButton` | Entrada rápida sem login (`RNF03`); alvos `>= 48 dp` e botão iniciar Jumbo `64 dp`. |
| **Contagem regressiva** | `ExpressiveTimer` (`reduceMotion`) | Modo crítico (`<= 10s`) combina cor + forma (`16 dp`) + ícone `alert`; pulsos táteis via `IGameFeedbackUseCases`. |
| **Tema temporário (5s) + Espiar (3s)** | Banner/Overlay temático (`card.*` / `banner.warning.*`) + `ExpressiveButton` (`variant="tonal"`) | Tipografia `font.display` (`30 dp`); anúncio via `accessibilityLiveRegion="polite"` ao exibir e ao recolher; botão *"Espiar palavra"* com `accessibilityLabel` explícito. |
| **Folha expandida + Formas + Preenchimento** | [`DrawingCanvas`](../../design-system/04-componentes/tela-de-desenho.md) (`component.canvas`) | Área ampliada (`canvas.expandedMinHeight`); alvos `>= 48 dp`; 4 cores `>= 4,88:1` sobre `canvas.paperBg`; seleção de ferramenta/forma/cor/preenchimento indicada por forma (`9999 dp` → `16 dp`) + borda + ícone + rótulo textual. |
| **Campo de palpite e feed** | `ExpressiveTextField` (`56 dp`) + `ExpressiveButton` + `ExpressiveTag` | Acerto comunicado por cor `success` + ícone `check-circle` + texto (`RNF06`); nunca vaza resposta correta aos demais. |
| **Saída Segura** | `ExpressiveButton` (`outlined`) + `ConfirmModal` | Isolado no topo esquerdo para evitar saída acidental durante o desenho (`RF11`). |

---

## 6. Critérios de Aceite (Dado / Quando / Então)

- **Dado** que `2` ou mais jogadores entraram na sala com código PIN e o Anfitrião tocou em **"Começar Partida!"**, **Quando** o 1º turno inicia, **Então** o Desenhista vê a palavra secreta em destaque por `5 segundos` enquanto os adivinhadores veem apenas a categoria e a folha em modo somente leitura.
- **Dado** que se passaram `5 segundos` desde o início do turno, **Quando** o temporizador do tema zera, **Então** o card do tema desaparece automaticamente, o `DrawingCanvas` se expande ocupando o espaço do tema e o botão discreto **"Espiar palavra"** permite rever o tema por `3 segundos`.
- **Dado** que o Desenhista seleciona **Retângulo**, **Círculo**, **Triângulo** ou **Linha** e alterna entre **Contorno** e **Preenchido**, **Quando** arrasta o dedo na folha, **Então** vê a pré-visualização da forma em tempo real e, ao soltar, a forma é sincronizada imediatamente na tela dos adivinhadores.
- **Dado** que um adivinhador digita a palavra correta (mesmo sem acento ou com diferença de maiúsculas), **Quando** envia o palpite, **Então** o sistema registra o acerto sem vazar a palavra no chat, soma pontos ao adivinhador e ao desenhista e bloqueia novos envios daquele jogador no turno.
- **Dado** que todos os adivinhadores acertaram ou o cronômetro chegou a `00:00`, **Então** o desenho é bloqueado, a palavra é revelada no `turn_summary` e o Anfitrião pode avançar para o próximo desenhista até o Pódio Final.
