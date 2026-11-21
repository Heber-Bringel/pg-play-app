# 📋 Especificação de Funcionalidade (`spec.md`): Melhorias de UI/UX e Animações Expressivas no Cidade Dorme

- **Branch da Feature:** `feat/020-uc07-cidade-dorme-ui-ux-animacoes`
- **Criado em:** 2026-11-21
- **Status:** Em Revisão
- **Caso(s) de Uso / Requisito(s):** `UC07` (`RF18`, `RF19`, `RF20`, `RNF06`, `RNF08`, `RNF09`, `RNF10`, `RNF11`) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md`, `docs/jogos/cidade-dorme.md`, `design-system/02-tokens.md`, `design-system/03-fundamentos.md`, `design-system/06-acessibilidade.md`
- **Issue vinculada:** `#56` (`v1.0.0 — Jogos em Sala Multiplayer (UC07–UC08)`)

---

## 1. Descrição do Problema & Cenários de Usuário *(Obrigatório)*

### Contexto Atual (Pós-PR #44 / Spec `018`)
Os ajustes funcionais e estruturais das issues `#38` a `#43` (`specs/013` a `specs/018`, mergeados pelo PR `#44`) estabilizaram o fluxo de partida do **Cidade Dorme**. Entretanto, uma revisão de UI/UX contra [`docs/jogos/cidade-dorme.md`](../../docs/jogos/cidade-dorme.md) e [`design-system/`](../../design-system/README.md) evidenciou que a tela ainda é estática e pobre em feedback visual:
1. **Ausência de linha do tempo das fases:** apenas o badge de texto com o PIN e o título do card indicam o momento da partida; não há trilha visual `Noite → Amanhecer → Debate → Votação` com indicação da rodada.
2. **Ausência de painel da cidade (vivos/eliminados):** não há grade visual de avatares nem contador agrupado `"Vivos X · Eliminados Y"` para leitura rápida do estado da roda.
3. **Nenhuma animação com tokens `motion.*`:** não há uso de `Animated` ou `tokens.semantic.motion.*` em `src/view/cidade-dorme.tsx` nem em `src/view/components/cidadeDorme*.tsx` (a troca Noite ↔ Dia é brusca, a carta de papel troca de estado sem flip, o boletim do amanhecer entra sem movimento, a legenda do narrador não anima ao mudar e a apuração de votos não mostra barras progressivas).
4. **Progresso de prontos/votos e ícones por papel pouco expressivos:** `Prontos: X/Y` e `Votos registrados: X/Y` aparecem apenas como texto em tag; na revelação e no resumo final falta diferenciação de ícone por papel (`Assassino`, `Anjo`, `Detetive`, `Cidadão`), além de o veredito de inocente do Detetive usar `success` diretamente sem alinhamento completo de contêiner/forma e o modo espectador poder ganhar mais destaque visual.
5. **Ausência de leitura de `AccessibilityInfo.isReduceMotionEnabled()` (`RNF09`):** `useCidadeDormeViewModel` e as seções do Cidade Dorme ainda não expõem nem respeitam a preferência do sistema para redução de movimento.

> [!NOTE]
> **Alinhamento com Design System (`Issue #55`):** Caso algum novo componente visual reutilizável (como `CidadeDormePhaseTimeline`, `CidadeDormeCityPanel` ou barras de progresso/avatares) exija novos tokens de borda, contraste ou especificação formal em `design-system/04-componentes/`, a definição no `design-system/` deve preceder ou ser alinhada à Issue `#55` antes de criar variantes fora de `src/view/theme.ts`.

---

### História de Usuário 1 — Linha do Tempo das Fases e Painel da Cidade com Grade de Avatares (Prioridade: P1)

Como **Jogador da sala de Cidade Dorme**, quero enxergar rapidamente no topo em que etapa do ciclo estamos (`Noite → Amanhecer → Debate → Votação`) e visualizar o painel da cidade com o resumo de vivos e eliminados, sem que nada revele papéis secretos ou quem age à noite.

**Por que esta prioridade:** Dá orientação espacial e situacional imediata a todos os jogadores na roda sem exigir leitura densa de parágrafos (`RF19`, `RNF06`, `RNF11`).

**Como testar independentemente:** Renderizar `CidadeDormeScreen` nas fases `night_assassin`, `night_angel`, `night_detective`, `day_debate`, `day_voting`, `vote_result` e `finished`, verificando o passo ativo na linha do tempo, o contador `"Vivos X · Eliminados Y"`, a grade de avatares e a ausência total de vazamento de papel secreto dos jogadores eliminados ou ativos à noite.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que a partida está em qualquer fase ativa (`night_*`, `day_debate`, `day_voting`, `vote_result`), **Quando** o topo da partida renderiza a linha do tempo `CidadeDormePhaseTimeline`, **Então** exibe os 4 passos (`Noite`, `Amanhecer`, `Debate`, `Votação`) com a etapa atual destacada por cor + forma + ícone e o rótulo da rodada atual (ex.: `"Noite 2"` ou `"Dia 2"`).
2. **Dado** que a sala está em uma fase noturna (`night_assassin`, `night_angel` ou `night_detective`), **Quando** o mesmo estado da sala é renderizado no celular de um jogador cujo papel está agindo e no de um jogador que está dormindo ou eliminado, **Então** a linha do tempo, o painel da cidade, o cronômetro e o cabeçalho exibem exatamente a mesma etapa e o mesmo tempo restante, sem diferenciar o turno de quem dorme antes da interação (`#41`, `RNF11`).
3. **Dado** que a sala possui jogadores vivos e eliminados (ex.: 4 vivos e 1 eliminado), **Quando** `CidadeDormeCityPanel` renderiza o painel da cidade, **Então** exibe o contador `"Vivos 4 · Eliminados 1"` e uma grade de avatares onde jogadores eliminados aparecem esmaecidos com ícone (`ghost-outline`) e rótulo `"Eliminado"`, **sem revelar o papel secreto** até `finished` (`RNF11`, respeitando apenas o que já for público em `dawnReport`/`voteReport` quando `revealRoleOnDeath` estiver ativo, sem expor o papel nos avatares durante a partida).

---

### História de Usuário 2 — Animações Expressivas com Tokens `motion.*` e Respeito a `reduceMotion` (Prioridade: P1)

Como **Jogador participante da dinâmica presencial**, quero que as transições entre Noite e Dia, revelação de papel, seleção de alvo/voto, boletim do amanhecer, apuração de votos, fim de jogo e legendas do narrador tenham animações significativas usando os tokens `motion.*`, e que todas as animações sejam desativadas quando *"Reduzir movimento"* estiver ativo no aparelho.

**Por que esta prioridade:** Cumpre diretamente [`docs/jogos/cidade-dorme.md`](../../docs/jogos/cidade-dorme.md) (`motion.spring.spatial` na transição noite ↔ dia e pulso crítico), [`design-system/03-fundamentos.md`](../../design-system/03-fundamentos.md) e `RNF09` (acessibilidade vestibular), mantendo `RNF11` intacto.

**Como testar independentemente:** Exercitar transições de fase e interações com `reduceMotion: false` e `reduceMotion: true` em testes de hook e de tela, garantindo execução com tokens `tokens.semantic.motion.*`, ausência de animações de escala/mola/giro com `reduceMotion: true` e paridade visual noturna entre papéis (`RNF11`).

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** a transição de `night_*` para `day_debate` (ou de `day_*` para `night_*`) com `reduceMotion === false`, **Quando** a fase muda em `CidadeDormeScreen`, **Então** o fundo e os indicadores de fase animam via `Animated` utilizando `tokens.semantic.motion.spring.spatial` (`damping: 14, stiffness: 280`).
2. **Dado** a fase `role_reveal` com `reduceMotion === false`, **Quando** o jogador toca em `"Revelar Meu Papel"` e depois em `"Esconder e Estou Pronto"`, **Então** a carta secreta executa transição animada de virada (*flip* / escala horizontal com `motion.spring.spatial`) revelando ou ocultando o cartão.
3. **Dado** uma lista de `SelectableOptionItem` na Noite ou na Votação com `reduceMotion === false`, **Quando** uma opção é selecionada, **Então** além do *shape morphing* de raio (`radius.lg` ↔ `radius.md`), aplica escala suave com `tokens.semantic.motion.spring.effects` (`damping: 22, stiffness: 300`).
4. **Dado** a fase `day_debate` com `room.dawnReport` preenchido, **Quando** o boletim do amanhecer aparece, **Então** o card entra de cima (`translateY` + `opacity`), destacando o escudo do Anjo (`shield-check`) quando ninguém foi eliminado (`savedByAngel === true`) ou indicando o eliminado com avatar esmaecido quando houve eliminação.
5. **Dado** a fase `vote_result` com `room.voteReport`, **Quando** a apuração é exibida, **Então** mostra a contagem agregada de votos por candidato e abstenções (`voteReport.voteCounts` e `voteReport.skipCount`) em barras horizontais animadas em sequência, exibindo **apenas totais numéricos por pessoa** e **nunca** quem votou em quem (`RNF11`).
6. **Dado** a fase `finished` com `room.winner`, **Quando** a tela de resultado final abre, **Então** destaca o grupo vencedor e revela em sequência (*stagger*) os cartões de papéis de todos os jogadores com ícone próprio por papel (`Assassino`, `Anjo`, `Detetive`, `Cidadão`).
7. **Dado** uma mudança em `room.narratorCaption`, **Quando** o banner de legenda atualiza sua fala, **Então** aplica transição animada suave (*fade/slide* com `tokens.semantic.motion.duration.short` / `medium`).
8. **Dado** `reduceMotion === true` (lido via `AccessibilityInfo.isReduceMotionEnabled()` e atualizado pelo listener `reduceMotionChanged`), **Quando** qualquer transição, seleção, pulso do cronômetro crítico, virada de carta ou revelação ocorre, **Então** todas as animações contínuas, de mola, escala ou giro são ignoradas e o estado final é aplicado instantaneamente (`0 ms`, `RNF09`).
9. **Dado** uma fase noturna (`night_*`), **Quando** as animações da tela rodam, **Então** não há qualquer vibração, som local nem animação distinta entre o aparelho de quem age e o aparelho de quem dorme antes da seleção do jogador ativo (`RNF11`).

---

### História de Usuário 3 — Informação Visual Enriquecida: Progresso de Prontos/Votos, Veredito do Detetive e Modo Espectador (Prioridade: P2)

Como **Jogador no celular**, quero ver barras visuais de progresso para `"Prontos X/Y"` e `"Votos X/Y"`, ícones distintos por papel, o card de veredito do Detetive no padrão exato da especificação e o selo de eliminado bem visível no Modo Espectador.

**Por que esta prioridade:** Reforça a redundância visual exigida pela WCAG 1.4.1 (`RNF06` e `RNF08`), combinando sempre cor, forma, ícone e texto.

**Como testar independentemente:** Renderizar `role_reveal`, `day_voting`, `night_detective` (com `detectiveVerdict` Assassino e Inocente) e um jogador com `isAlive === false`, verificando barras de progresso, ícones e rótulos acessíveis.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** a fase `role_reveal` ou `day_voting`, **Quando** `CidadeDormeCityPanel` ou a seção correspondente renderiza o progresso coletivo, **Então** exibe `"Prontos X/Y"` (em `role_reveal`) ou `"Votos X/Y"` (em `day_voting`) acompanhado de barra visual preenchida proporcionalmente (ou marcadores visuais), sem revelar quem votou em quem (`RNF06`, `RNF11`).
2. **Dado** a revelação individual do papel (`role_reveal`) ou a lista de papéis em `finished`, **Quando** cada papel é exibido, **Então** apresenta ícone semântico específico ao lado do nome do papel (`Assassino`, `Anjo`, `Detetive`, `Cidadão`).
3. **Dado** a fase `night_detective` com `room.detectiveVerdict` preenchido, **Quando** o card de veredito renderiza, **Então** combina cor, raio de borda e ícone conforme a documentação (`errorContainer`, raio `radius.sm` `8 dp` e ícone `alert-circle` para Assassino; fundo de sucesso, raio `radius.md` `16 dp` e ícone `check-circle` para Inocente).
4. **Dado** um jogador eliminado (`currentPlayer.isAlive === false`) durante a partida, **Quando** a tela renderiza qualquer fase noturna ou diurna ativa, **Então** exibe em destaque visual o selo `"Você foi eliminado — Acompanhe em silêncio"` com ícone `ghost-outline` e `accessibilityRole="alert"`.

---

### Casos de Borda (Edge Cases)

- **Sigilo noturno (`RNF11`):** o painel da cidade (`CidadeDormeCityPanel`) nunca exibe ícones ou rótulos de papel secreto (`Assassino`, `Anjo`, `Detetive`, `Cidadão`) durante `role_reveal`, `night_*`, `day_*` ou `vote_result`; apenas status público (`Vivo` / `Eliminado`). Os papéis completos só aparecem na fase `finished`.
- **Modo `reduceMotion` alterado em tempo real:** se o usuário alternar *"Reduzir movimento"* nas configurações do aparelho durante a partida, o listener `reduceMotionChanged` atualiza `state.reduceMotion` na ViewModel e interrompe/ignora animações imediatamente.
- **Votação com zero votos ou empate (`vote_result`):** quando `voteReport.voteCounts` estiver vazio ou empatado e houver apenas `skipCount`, a barra de abstenções (`Abster-se / Pular Voto`) aparece normalmente sem divisão por zero no cálculo de largura proporcional (`Math.max(1, maxVotes)`).
- **Desmontagem e limpeza de timers/listeners:** animações (`Animated.Value` / `Animated.spring` / `Animated.timing`) e listeners do `AccessibilityInfo` são limpos no `useEffect` cleanup para evitar warnings em testes Jest e vazamento de memória.
- **Largura compacta (`390 px`) e fonte ampliada (`allowFontScaling`):** a grade de avatares e a linha do tempo de fases devem quebrar linha ou ajustar espaçamentos flexivelmente (`flexWrap: 'wrap'`) sem estourar horizontalmente.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-56-01` (`RF19` / `RNF06`)**: Exibir no topo das fases ativas da partida a linha do tempo visual `CidadeDormePhaseTimeline` (`Noite → Amanhecer → Debate → Votação`) com destaque para a etapa corrente e identificação do ciclo (`Noite N` / `Dia N`).
- **`RF-56-02` (`RNF06` / `RNF11`)**: Exibir o painel da cidade `CidadeDormeCityPanel` com contador `"Vivos X · Eliminados Y"`, grade de avatares (eliminados esmaecidos com ícone e rótulo, sem revelar papel até `finished`) e barra visual de progresso para `"Prontos X/Y"` (`role_reveal`) e `"Votos X/Y"` (`day_voting`).
- **`RF-56-03` (`RF19` / `RNF09`)**: Animar com `Animated` e os tokens `tokens.semantic.motion.*`: transição Noite ↔ Dia (`spring.spatial`), virada da carta de papel (`role_reveal`), seleção em `SelectableOptionItem` (`spring.effects`), entrada do Boletim do Amanhecer, barras progressivas de contagem no `vote_result`, pulso crítico no `ExpressiveTimer`, destaque/revelação em `finished` e troca de fala na legenda do Narrador (`duration.short`/`medium`).
- **`RF-56-04` (`RNF09`)**: Detectar `AccessibilityInfo.isReduceMotionEnabled()` (e alterações via `reduceMotionChanged`) na `View` sincronizando com `state.reduceMotion` da `useCidadeDormeViewModel`; quando ativo, executar todas as trocas instantaneamente sem flip, pulso, escala ou mola.
- **`RF-56-05` (`RNF11`)**: Garantir que durante a noite todos os celulares mostrem a mesma etapa visual e o mesmo movimento enquanto ninguém interage, sem vibração ou som diferenciando quem age à noite.
- **`RF-56-06` (`RNF06`)**: Exibir ícone específico por papel (`Assassino`, `Anjo`, `Detetive`, `Cidadão`) na revelação de papel e no resumo final, manter o card de veredito do Detetive com `alert-circle` (`radius.sm`) / `check-circle` (`radius.md`) e destacar o selo de Modo Espectador.
- **`RF-56-07` (`RNF10`)**: Construir toda a interface usando exclusivamente tokens de `src/view/theme.ts` (`tokens` / `darkTokens`) e componentes alinhados ao `design-system/`.

### Entidades e Estados Envolvidos (`src/viewmodel/` — sem mudanças em `src/model/`)
> Conforme planejado na Issue `#56`, nenhuma entidade de `src/model/entities/multiplayerSession.ts` precisa ser alterada, pois `phase`, `currentRound`, `players`, `votesByPlayerId` e `voteReport` já fornecem todos os dados públicos necessários.

- **`CidadeDormeTimelineStepId`**: `'night' | 'dawn' | 'debate' | 'voting'`
- **`CidadeDormeTimelineStep`**: `{ id: CidadeDormeTimelineStepId; label: string; isActive: boolean; isCompleted: boolean }`
- **`CidadeDormeState` (`src/viewmodel/useCidadeDormeViewModel.ts`)**: adiciona `reduceMotion: boolean`, `phaseTimeline: CidadeDormeTimelineStep[]`, `aliveCount: number` e `eliminatedCount: number`.
- **`CidadeDormeActions` (`src/viewmodel/useCidadeDormeViewModel.ts`)**: adiciona `handleSetReduceMotion: (enabled: boolean) => void`.

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (Movimento e Acessibilidade `RNF09`)**: Com `reduceMotion === true`, nenhuma animação de escala, pulso, giro ou mola é disparada (trocas instantâneas `0 ms`).
- **`CS-02` (Sigilo Noturno `RNF11`)**: Teste automatizado comprova que, em uma fase noturna (`night_assassin`, `night_angel`, `night_detective`), os elementos públicos da tela (linha do tempo, painel da cidade, cronômetro, legenda) são equivalentes e não revelam papéis secretos nos avatares até `finished`.
- **`CS-03` (Informação Visual `RNF06`)**: Linha do tempo, painel `"Vivos X · Eliminados Y"`, barras de progresso `"Prontos X/Y"` / `"Votos X/Y"`, barras de contagem no `vote_result`, ícones por papel e selo de eliminado combinam cor + forma + ícone + texto.
- **`CS-04` (Design System & Zero Literais `RNF10`)**: Nenhum valor literal (`#hex`, `rgb()`, `rgba()`) fora de `src/view/theme.ts`; novos componentes visuais alinhados ao `design-system/`.
- **`CS-05` (Arquitetura MVVM)**: `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest --passWithNoTests`) executa com **0 violações** e todos os testes aprovados.
