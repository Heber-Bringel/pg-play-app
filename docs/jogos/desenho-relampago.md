# 🎨 Especificação de Jogo: Desenho Relâmpago (Modo 1 Celular)

> **Modalidade:** 1 Celular Compartilhado (Por Equipes / Offline)  
> **Caso de Uso:** `UC12` · **Requisitos:** `RF41`, `RF42`, `RF43`, `RF44`, `RF09`–`RF12`, `RF24`, `RF28`–`RF31`  
> **Sistema de Design:** [`PG Play Expressive`](../../design-system/README.md) (`DrawingCanvas`, `ExpressiveTimer`, `GameCard`, `ExpressiveButton`, `ExpressiveChip`, `ExpressiveTag`)

---

## 1. Visão Geral

O **Desenho Relâmpago** é uma dinâmica visual em **1 celular compartilhado** pensada para incluir participantes que preferem se expressar desenhando em vez de falar ou fazer mímica na frente do grupo. O representante da equipe da vez confere uma palavra secreta concreta, oculta a palavra da tela e a desenha com o dedo na folha digital enquanto sua equipe tenta adivinhar o máximo de desenhos antes de o cronômetro zerar.

- **Participantes:** `2` a `6` equipes; um representante desenhista por turno, alternado a cada equipe.
- **Duração padrão de um turno:** `90s` por equipe (ajustável entre `60s`, `90s` e `120s`).
- **Conteúdo:** banco local próprio de palavras concretas e "desenháveis", organizado em 5 pacotes selecionáveis por chips: **Bíblico** (ex.: *Arca de Noé*, *Tábua dos Dez Mandamentos*, *Cova dos Leões*), **Animais** (ex.: *Girafa*, *Polvo*, *Borboleta*), **Objetos** (ex.: *Guarda-chuva*, *Violão*, *Lanterna*), **Comidas** (ex.: *Melancia*, *Pipoca*, *Sorvete*) e **Lugares e Natureza** (ex.: *Vulcão*, *Farol*, *Ilha Deserta*).
- **Regra de honra (`RF42`):** é proibido escrever letras, sílabas, números ou falar/apontar dicas; o aviso *"Sem letras nem números"* permanece visível na arena durante todo o turno.

---

## 2. Parâmetros da Partida (`RF28`, `RF29`, `RF44`)

| Parâmetro | Padrão | Opções |
| :--- | :---: | :--- |
| Tempo por turno | `90s` | `60s`, `90s`, `120s` |
| Pontos por acerto (`RF43`) | `+20 pts` | fixo |
| Penalidade por pular palavra (`RF43`) | `-5 pts` | fixo (a pontuação acumulada da equipe nunca fica negativa; piso `0`) |
| Número de rodadas | `3` | `1` a `5` (cada rodada = todas as equipes jogam uma vez) |
| Pacotes desenháveis (`RF44`) | Todos selecionados | seleção múltipla por `ExpressiveChip` (*Bíblico*, *Animais*, *Objetos*, *Comidas*, *Lugares e Natureza*); ao menos 1 ativo |

---

## 3. Fluxo Completo da Partida

### 🚪 Fase 1 — Passagem de Turno (`pass-turn`)
1. O sistema exibe um card (`GameCard`) com **"Vez da Equipe [Nome]"** (**RF09**), os seletores rápidos de tempo, rodadas e pacotes de palavras (editáveis antes de iniciar a partida) e o botão `Primário Jumbo` **"Estou Pronto!"** (**RF24**).
2. O celular é entregue ao representante da equipe da vez. A palavra secreta e a tela de desenho **só aparecem após o toque em "Estou Pronto!"**, impedindo visualização acidental pelo grupo.

### 🎨 Fase 2 — Arena do Desenho (`drawing`)
1. **Cronômetro e Feedback Tátil:** o `ExpressiveTimer` inicia a contagem regressiva (`MM:SS`), entra em **Modo Crítico** nos últimos `10s` (cor `error`, forma `16 dp`, ícone `alert` e pulsação respeitando `useReduceMotion`) e dispara os pulsos táteis via `IGameFeedbackUseCases` até `00:00` (`bell-ring`) (**RF10**).
2. **Palavra Secreta e Regra de Honra (`RF42`):**
   - No início de cada nova carta, a palavra secreta aparece em destaque com o botão tonal **"Esconder do Grupo"** (ícone `eye-off-outline`).
   - Ao tocar em **"Esconder do Grupo"**, a palavra é substituída pelo selo seguro *"Palavra oculta — só o desenhista sabe"* (com opção **"Mostrar Palavra"** para espiar rapidamente), liberando o grupo para olhar diretamente para o celular enquanto o representante desenha!
   - Banner/aviso constante de regra de honra: *"Sem letras nem números"*.
3. **Tela de Desenho (`DrawingCanvas` — `RF41`):**
   - Folha de papel clara (`canvas.paperBg` = `#FDF8FF`) com traço contínuo ao arrastar o dedo (`react-native-svg` + `PanResponder`), bloqueando a rolagem vertical da tela durante o gesto de desenho.
   - Barra de ferramentas com **4 cores acessíveis** (*Grafite*, *Roxo*, *Coral* e *Verde*), **2 espessuras** (*Fina 4 dp* e *Grossa 8 dp*), **"Desfazer"** (remove o último traço) e **"Limpar"** (apaga todos os traços da palavra atual).
4. **Ações de Resultado (`RF43`):**
   - ✅ **"Acertaram! (+20 pts)"** (`ExpressiveButton` variante `successJumbo`, `64 dp`): soma `+20 pts` à equipe da vez, limpa os traços da tela, sorteia a próxima palavra (com palavra inicialmente visível para o desenhista conferir antes de esconder) e mantém o cronômetro correndo.
   - ⏭️ **"Pular (-5 pts)"** (`ExpressiveButton` variante `secondary`, `48 dp`): desconta `5` pontos da equipe (respeitando o piso `0`), limpa os traços da tela e sorteia outra palavra.
5. **Saída Segura (`RF11`):** botão **"Sair"** (delineado) no canto superior esquerdo, afastado dos botões de pontuação e da folha de desenho, pausando o cronômetro enquanto o `ConfirmModal` está aberto.

### 🔔 Fase 3 — Resumo do Turno (`turn-summary`)
1. Ao chegar a `00:00`, o `DrawingCanvas` e os botões de pontuação são bloqueados imediatamente.
2. O app exibe o resumo do turno: desenhos acertados, palavras puladas (revelando também a última palavra em andamento, sem pontuar) e o saldo de pontos conquistados pela equipe.
3. O toque em **"Próxima Equipe"** (ou **"Ver Resumo Final"** no último turno) limpa o estado do turno e avança a partida.

### 🏁 Fase 4 — Encerramento (`finished`)
- Quando todas as equipes completam as rodadas configuradas **ou** quando o banco de palavras selecionado se esgota (**RF12**, **RF30**), o sistema exibe o card de conclusão com o resumo da partida e o botão **"Ir para o Placar Final"** (**RF31**), levando ao Placar Geral (`UC06`).

---

## 4. Regras de Pontuação e Banco de Palavras

- **Sem repetição de acertos (`RF30`):** uma palavra acertada nunca volta a ser sorteada na mesma partida.
- **Reciclagem de puladas:** palavras puladas vão para o fim de uma fila secundária e só retornam ao sorteio caso todas as palavras inéditas dos pacotes selecionados se esgotem antes do término das rodadas.
- **Limpeza automática:** ao acertar, pular ou encerrar o turno, a lista de traços (`strokes`) é zerada automaticamente para a próxima palavra/equipe.
- **Piso zero (`RF43`):** se a equipe tiver `0` pontos (ou menos de `5`, ex.: `3 pts`), pular reduz a pontuação apenas até `0 pts`, nunca deixando saldo total negativo no placar.

---

## 5. Requisitos de IHC, Componentes e Acessibilidade

| Elemento da Tela | Componente / Token do Design System | Regra de Acessibilidade (WCAG 2.1 / M3 Expressive) |
| :--- | :--- | :--- |
| **Equipe da vez e rodada** | `GameCard` + `ExpressiveTag` | Contraste `>= 4,5:1`; anunciado via `accessibilityLiveRegion="polite"`. |
| **Contagem regressiva** | `ExpressiveTimer` (`reduceMotion`) | Modo crítico (`<= 10s`) combina cor + forma (`16 dp`) + ícone `alert`; vibração via `IGameFeedbackUseCases` respeitando `Reduce Motion`. |
| **Palavra secreta e regra** | `GameCard` / `ExpressiveTag` + `ExpressiveButton` | Tipografia `font.display` (`30 dp`); estado oculto anunciado claramente no `accessibilityLabel`. |
| **Folha e ferramentas** | [`DrawingCanvas`](../../design-system/04-componentes/tela-de-desenho.md) (`component.canvas`) | Alvos `>= 48 dp`; 4 cores com contraste `>= 4,88:1` sobre `canvas.paperBg`; seleção de cor indicada por forma (`9999 dp` → `16 dp`) + borda + ícone `check` + rótulo textual (`"Cor Grafite"`, etc.). |
| **Acertaram / Pular / Sair** | `ExpressiveButton` + `ConfirmModal` | Jumbo `64 dp` para acerto; `"Sair"` isolado no topo esquerdo com confirmação modal. |

---

## 6. Critérios de Aceite (Dado / Quando / Então)

- **Dado** que é a vez de uma equipe na passagem de turno, **Quando** o representante toca em **"Estou Pronto!"**, **Então** o cronômetro inicia, a palavra secreta aparece para o representante e o `DrawingCanvas` fica pronto em branco.
- **Dado** que a palavra secreta está visível, **Quando** o representante toca em **"Esconder do Grupo"**, **Então** a palavra é ocultada na tela para que a equipe possa acompanhar o celular sem ver a resposta.
- **Dado** que o turno está em andamento, **Quando** o representante arrasta o dedo na folha, troca de cor/espessura ou aciona **"Desfazer"** / **"Limpar"**, **Então** os traços respondem em tempo real sem afetar traços anteriores ao mudar a ferramenta.
- **Dado** um desenho em jogo, **Quando** o representante toca em **"Acertaram! (+20 pts)"**, **Então** a equipe recebe `+20 pts`, a folha é limpa e uma nova palavra inédita é sorteada.
- **Dado** uma palavra difícil, **Quando** o representante toca em **"Pular (-5 pts)"**, **Então** a equipe perde até `5 pts` (mínimo `0`), a folha é limpa e outra palavra é sorteada.
- **Dado** que o cronômetro chegou a `00:00`, **Então** o desenho é bloqueado imediatamente e o resumo do turno é exibido antes de passar à próxima equipe.
