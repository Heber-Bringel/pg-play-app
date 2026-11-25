# 📋 Especificação de Funcionalidade (`spec.md`): UC12 — Desenho Relâmpago

- **Branch da Feature:** `feat/028-uc12-desenho-relampago`
- **Criado em:** 2026-11-25
- **Status:** Aprovado
- **Caso(s) de Uso / Requisito(s):** `UC12` (`RF41`–`RF44`, `RF09`–`RF12`, `RF24`, `RF28`–`RF31`, `RNF01`, `RNF02`, `RNF04`–`RNF10`) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md` e `docs/jogos/desenho-relampago.md`
- **Issue vinculada:** `#83`

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Desenhar palavra secreta na tela para a equipe adivinhar (Prioridade: P1)

Como **Representante da Equipe da Vez**, quero ver uma palavra secreta concreta, escondê-la do grupo e desenhá-la com o dedo na tela do celular usando cores e espessuras expressivas, para que minha equipe tente adivinhar o máximo de desenhos antes que o tempo acabe.

**Por que esta prioridade:** Entrega o núcleo da mecânica visual do *Desenho Relâmpago* (`UC12`), incluindo no encontro pessoas que preferem desenhar em vez de falar ou fazer mímica na frente do Pequeno Grupo.

**Como testar independentemente:** Com ao menos 2 equipes cadastradas, abrir o card *Desenho Relâmpago* no Hub, tocar em *"Estou Pronto!"*, conferir e esconder a palavra secreta, desenhar traços no `DrawingCanvas`, alternar cores/espessuras, usar *"Desfazer"* e *"Limpar"*, registrar acertos (`+20 pts`) e pulos (`-5 pts`) e aguardar o cronômetro chegar a `00:00`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o jogo foi aberto no Hub com pelo menos `2` equipes cadastradas, **Quando** a tela carrega na fase `pass-turn`, **Então** o sistema exibe a equipe da vez (`RF09`) e o botão Jumbo **"Estou Pronto!"** (`variant="primaryJumbo"`) sem revelar nenhuma palavra secreta (`RF24`).
2. **Dado** que o representante tocou em **"Estou Pronto!"**, **Quando** a fase `drawing` inicia, **Então** o `ExpressiveTimer` começa a contagem regressiva (`90s` por padrão), a palavra secreta aparece em destaque (`font.display`, `30 dp`) com o botão **"Esconder do Grupo"**, o aviso de regra de honra *"Sem letras nem números"* fica visível (`RF42`) e a folha de desenho aparece limpa (`RF41`).
3. **Dado** que a palavra secreta está visível, **Quando** o representante toca em **"Esconder do Grupo"**, **Então** a palavra é ocultada na tela (substituída por *"Palavra oculta — só o desenhista sabe"*) e o botão passa a oferecer **"Mostrar Palavra"**, permitindo que o grupo olhe para o celular enquanto o desenho é feito (`RF42`).
4. **Dado** que a fase `drawing` está ativa, **Quando** o representante arrasta o dedo na folha, troca entre as `4` cores (*Grafite*, *Roxo*, *Coral*, *Verde*) ou `2` espessuras (*Fina 4 dp*, *Grossa 8 dp*), **Então** novos traços refletem a cor e espessura selecionadas sem alterar os traços já desenhados, a rolagem da tela permanece travada durante o traço, **"Desfazer"** remove apenas o último traço e **"Limpar"** remove todos os traços atuais (`RF41`).
5. **Dado** um desenho em andamento, **Quando** o representante toca em **"Acertaram! (+20 pts)"** (`variant="successJumbo"`), **Então** o `PgPlayUseCases` soma `+20 pts` à equipe da vez, a folha de desenho é limpa automaticamente e uma nova palavra inédita é sorteada (`RF43`, `RF30`).
6. **Dado** uma palavra difícil em andamento, **Quando** o representante toca em **"Pular (-5 pts)"** (`variant="secondary"`), **Então** o `PgPlayUseCases` desconta até `5 pts` da equipe da vez (respeitando o piso `0`), limpa a folha de desenho e sorteia a próxima palavra (`RF43`).
7. **Dado** que o cronômetro chegou a `00:00`, **Quando** o tempo do turno se esgota, **Então** o `DrawingCanvas` e os botões de pontuação são bloqueados imediatamente (descartando eventual traço em andamento) e a tela transita para `turn-summary` exibindo acertos, pulos, a última palavra em andamento (sem pontuar) e o saldo de pontos do turno, oferecendo **"Próxima Equipe"** (ou **"Ver Resumo Final"** no último turno) (`RF10`).

---

### História de Usuário 2 — Configurar tempo, rodadas e pacotes desenháveis (Prioridade: P1)

Como **Líder do PG**, quero ajustar o tempo por turno (`60s`, `90s` ou `120s`), a quantidade de rodadas por equipe (`1` a `5`) e os pacotes próprios de palavras desenháveis (*Bíblico*, *Animais*, *Objetos*, *Comidas*, *Lugares e Natureza*) antes do início da partida, com os ajustes de tempo e rodadas salvos automaticamente para próximos encontros.

**Por que esta prioridade:** Garante flexibilidade de duração e temática conforme o tamanho e perfil do Pequeno Grupo, mantendo início rápido com 1 toque nos valores padrão (`RF28`, `RF29`, `RF44`).

**Como testar independentemente:** Na fase `pass-turn` da primeira rodada, alterar os chips de duração (`60s`/`90s`/`120s`), rodadas (`1`–`5`) e pacotes de palavras; recarregar a tela para confirmar persistência via `IMatchSettingsDataSource` e tentar desmarcar o último pacote ativo para verificar o bloqueio/aviso de validação.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o Líder está na tela inicial de passagem do 1º turno, **Quando** seleciona `120s` de duração e `2` rodadas, **Então** o `PgPlayUseCases.updateDesenhoSettings` valida e persiste a configuração e o cronômetro passa a iniciar em `02:00` (`RF44`).
2. **Dado** que apenas `1` pacote desenhável está ativo, **Quando** o Líder tenta desmarcá-lo (ou uma chamada passa lista vazia de categorias ao `UseCase`), **Então** o `UseCase` lança `ValidationError` (e a `ViewModel` mantém ao menos um pacote selecionado exibindo aviso semântico) (`RF28`, `RF44`).
3. **Dado** que parâmetros inválidos (ex.: duração `45s` ou `0` rodadas) são enviados a `updateDesenhoSettings`, **Quando** o `UseCase` valida os dados, **Então** lança `ValidationError` sem sobrescrever as configurações salvas.

---

### História de Usuário 3 — Alternar equipes, consolidar Placar Geral, estados de tela e sair com segurança (Prioridade: P2)

Como **Líder do PG**, quero que os turnos alternem entre todas as equipes cadastradas sem repetir palavras acertadas, que o fim das rodadas (ou do banco de palavras) leve ao Placar Geral (`UC06`) com os pontos já somados, que a tela trate carregamento/falhas de forma clara e que o botão **"Sair"** peça confirmação antes de encerrar a partida.

**Por que esta prioridade:** Assegura continuidade competitiva justa no encontro presencial, feedback claro nos 4 estados de tela e prevenção de perda acidental do turno por esbarrão enquanto o grupo desenha (`RF11`, `RF12`, `RF30`, `RF31`).

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que todas as equipes jogaram todas as rodadas configuradas (ou todas as palavras disponíveis foram acertadas), **Quando** o último turno se encerra, **Então** a tela exibe o card `finished` com o resumo da partida e o botão **"Ir para o Placar Final"** (`variant="primaryJumbo"`) navega para `/scoreboard` com as pontuações atualizadas (`RF12`, `RF31`).
2. **Dado** que um turno está em andamento na fase `drawing`, **Quando** alguém toca em **"Sair"** no canto superior esquerdo, **Então** o cronômetro pausa, a folha de desenho fica bloqueada e um `ConfirmModal` pergunta se deseja encerrar a partida ou cancelar e continuar desenhando (`RF11`).
3. **Dado** que a arena está carregando dados iniciais ou ocorre um `DomainError` no carregamento, **Quando** a tela renderiza esses estados, **Então** exibe feedback acessível de carregamento (`accessibilityRole="progressbar"`) ou card de erro semântico com o botão **"Tentar Novamente"** (`actions.handleRetry`).

---

### Casos de Borda (Edge Cases)

- **Pulo com pontuação zerada ou menor que 5 (`RF43`):** Se a equipe tiver `0 pts` (ou `3 pts`), tocar em *"Pular (-5 pts)"* reduz o placar apenas até `0 pts` — a pontuação acumulada nunca fica negativa.
- **Reciclagem de palavras puladas vs. esgotamento do banco (`RF12`, `RF30`):** Palavras acertadas são removidas definitivamente da partida; palavras puladas vão para uma fila secundária (`skippedDeck`) e só voltam ao sorteio se o `freshDeck` acabar. Quando restar apenas `1` palavra em `skippedDeck` (e `freshDeck` vazio), pular ainda aplica a penalidade e limpa a folha mantendo a única palavra restante disponível; se ambas as filas ficarem vazias no meio de um turno, a partida encerra graciosamente na fase `finished`.
- **Bloqueio de rolagem durante o traço (`PanResponder` × `ScrollView`):** Ao iniciar um gesto na folha (`onDrawingStart`), o `ScrollView` da tela desabilita a rolagem (`scrollEnabled={false}`) e só a reabilita ao finalizar/cancelar o gesto (`onDrawingEnd`), evitando que traços verticais rolem a tela no mobile ou Web.
- **Toque curto (ponto único) e interrupção no meio do traço:** Um toque sem arrastar gera um ponto visível no `<Path>` SVG (`M x y L x y` com `strokeLinecap="round"`). Caso o tempo chegue a `00:00` ou o modal de saída abra enquanto o dedo está pressionado, o traço ativo é cancelado/descartado com segurança e o `scrollEnabled` é restaurado.
- **Desfazer/Limpar sem traços:** Quando `strokes.length === 0`, os botões *"Desfazer"* e *"Limpar"* permanecem desabilitados (`accessibilityState={{ disabled: true }}`) e chamadas às ações não causam erro.
- **Últimos 10 segundos, Feedback Tátil e Redução de Movimento (`RF10`, `RNF09`):** Entre `10s` e `1s` restantes, o `ExpressiveTimer` entra em modo crítico (`timer.bg.critical`, raio `16 dp`, ícone `alert`) e a `useDesenhoViewModel` notifica `IGameFeedbackUseCases.notifyTimerTick(prev, curr, { reduceMotion })`, respeitando `Reduce Motion` (sem vibrar em acerto/pulo manual, seguindo o padrão da Mímica).
- **Menos de 2 equipes cadastradas:** Caso o usuário acesse `/desenho` diretamente com `< 2` equipes, a tela exibe estado orientativo seguro com botão para voltar ao início.
- **Armazenamento antigo ou corrompido (`Offline-First`):** Se o JSON salvo em `AsyncStorage` vier de versão anterior (sem a chave `desenho`) ou estiver corrompido, `AsyncStorageMatchSettingsDataSource` e `sanitizeMatchSettings` restauram `DEFAULT_MATCH_SETTINGS.desenho` (`90s`, `3` rodadas) automaticamente.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF41` (Tela de Desenho Expressiva):** O componente `DrawingCanvas` deve capturar gestos contínuos via `PanResponder` (com callbacks `onDrawingStart`/`onDrawingEnd` para travar rolagem) e renderizar traços suaves em `react-native-svg` sobre superfície de papel clara fixa (`canvas.paperBg`), disponibilizando `4` cores (`ink`, `purple`, `coral`, `green`), `2` espessuras (`thin` = `4 dp`, `thick` = `8 dp`), *"Desfazer"* e *"Limpar"*.
- **`RF42` (Palavra Secreta e Regra de Honra):** A arena deve exibir a palavra secreta em `font.display` (`30 dp`) com botão de alternância *"Esconder do Grupo"* / *"Mostrar Palavra"* e manter visível o aviso de regra de honra (*"Sem letras nem números"*).
- **`RF43` (Pontuação de Acerto e Pulo):** O `PgPlayUseCases` deve somar `+20 pts` em `scoreDesenhoHit` e descontar até `5 pts` (piso `0`) em `scoreDesenhoSkip`, lançando `ValidationError` para `teamId` vazio/inexistente ou valores inválidos, enquanto a `ViewModel` limpa os traços a cada troca de carta.
- **`RF44` (Parâmetros e Pacotes Desenháveis):** O sistema deve suportar durações `60 | 90 | 120` segundos (padrão `90`), `1` a `5` rodadas por equipe (padrão `3`) persistidas em `MatchSettings.desenho`, e `5` pacotes próprios de palavras concretas desenháveis (`Bíblico`, `Animais`, `Objetos`, `Comidas`, `Lugares e Natureza`) via `IGameCatalogDataSource`.
- **`RF09`–`RF12`, `RF24`, `RF28`–`RF31` (Regras Gerais de Arena 1 Celular):** Identificação da equipe da vez, passagem de turno com *"Estou Pronto!"*, cronômetro com modo crítico `<= 10s` e feedback háptico, saída segura com `ConfirmModal`, não repetição de acertos e integração com o Placar Geral (`UC06`).

### Entidades de Domínio Envolvidas (`src/model/entities/`)
- **`DrawingPenColorId`** (`src/model/entities/drawingChallenge.ts`): `'ink' | 'purple' | 'coral' | 'green'` (identificadores semânticos de cor; zero `#hex` no domínio).
- **`DrawingStrokeWidthId`** (`src/model/entities/drawingChallenge.ts`): `'thin' | 'thick'`.
- **`DrawingPoint`** (`src/model/entities/drawingChallenge.ts`): `{ x: number; y: number }`.
- **`DrawingStroke`** (`src/model/entities/drawingChallenge.ts`): `{ id: string; points: DrawingPoint[]; colorId: DrawingPenColorId; widthId: DrawingStrokeWidthId }`.
- **`DesenhoCategory`** (`src/model/entities/drawingChallenge.ts`): `'Bíblico' | 'Animais' | 'Objetos' | 'Comidas' | 'Lugares e Natureza'`.
- **`DesenhoCard`** (`src/model/entities/drawingChallenge.ts`): `{ id: string; word: string; category: DesenhoCategory; points: number }`.
- **`DesenhoDurationOption` / `DesenhoSettings`** (`src/model/entities/matchSettings.ts`): `60 | 90 | 120` e `{ durationSeconds: DesenhoDurationOption; totalRounds: number }` integrados a `MatchSettings`.

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (IHC / Acessibilidade Motora e Visual — `RNF05`, `RNF06`, `RNF07`, `RNF08`)**: Todos os controles da barra do `DrawingCanvas` possuem alvo mínimo `48 dp × 48 dp` (`64 dp` nos botões Jumbo *"Estou Pronto!"*, *"Acertaram! (+20 pts)"* e *"Ir para o Placar Final"*), `accessibilityRole` + `accessibilityLabel` + `accessibilityState`, contraste `>= 4,88:1` das 4 canetas sobre o papel (`canvas.paperBg`) e do ícone `check` (`canvas.pen.onPen`) sobre todas as 4 canetas nos dois temas, e seleção de cor comunicada por forma (`9999 dp` → `16 dp`) + borda + ícone `check` + rótulo textual.
- **`CS-02` (Movimento e Feedback Tátil — `RNF09`)**: O cronômetro e os seletores respeitam `useReduceMotion` e notificam `IGameFeedbackUseCases.notifyTimerTick` nos segundos críticos.
- **`CS-03` (Design Tokens Puros — `RNF10`)**: Zero valores literais de cor ou dimensão em `src/view/components/drawingCanvas.tsx` e `src/view/desenho.tsx`; `node scripts/check-design-system.mjs` aprovado sem erros.
- **`CS-04` (Portabilidade — `RNF01`)**: Desenho fluido via `react-native-svg` + `PanResponder` compatível com Expo Go (Android e iOS) e Web.
- **`CS-05` (Arquitetura MVVM e Qualidade)**: `npm run check` (`check-arquitetura.mjs` + `check-design-system.mjs` + `tsc --noEmit` + `jest`) executando com **0 violações e 0 falhas**.
