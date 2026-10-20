# Princípios

O sistema de design **PG Play Expressive** é guiado por quatro princípios fundamentais que conectam a base do **Google Material 3 Expressive (2025)** à realidade de dinâmicas presenciais em Pequenos Grupos (PGs).

---

## Princípio 1: Expressivo e legível na roda do grupo

- **Origem:** **Adaptado** do princípio *"Ousado, gráfico e intencional"* (*Bold, graphic, intentional*) do Material Design e da tipografia enfática do Material 3 Expressive (2025).
- **O porquê:** Em um Pequeno Grupo, o celular frequentemente é segurado à distância para que várias pessoas vejam a palavra da mímica, o placar ou o tempo restante. Cores vibrantes, formas geométricas distintas e tipografia pesada garantem leitura imediata por jovens e adultos.
- **Na prática:** Títulos de tela e palavras secretas de jogo utilizam os tokens `font.display` (`30 dp`, peso `800`) e `font.title` (`24 dp`, peso `800`), enquanto ações principais e placares usam `color.action` (Roxo Vibrante) e `color.highlight` (Amarelo Ouro) em containers com cantos amplos (`radius.xl` = `28 dp`).
- **Evite:** Textos pequenos abaixo de `12 dp`, pesos tipográficos finos (`300` ou `400`) em elementos de jogo ou telas inteiras monocromáticas sem ponto focal claro.

---

## Princípio 2: Física de mola e formas que respondem ao toque

- **Origem:** **Herdado** do sistema de *Motion Physics* e *Shape Morphing* do Material 3 Expressive (2025).
- **O porquê:** Minigames sociais precisam parecer vivos e táteis. Quando um jogador aperta um botão na correria de uma rodada, a mudança elástica de forma confirma fisicamente que a ação foi registrada, aumentando a diversão e a confiança na interface.
- **Na prática:** Todo [Botão](04-componentes/botao.md) inicia em formato de pílula (`button.radius` = `radius.full` = `9999 dp`) e, no estado pressionado (`onPressIn`), transforma sua geometria para `button.radius.pressed` (`radius.md` = `16 dp`) com escala `0.96` governada pela mola espacial `motion.spring.spatial`.
- **Evite:** Animações lineares e mecânicas, transições lentas acima de `500 ms` que atrasem o fluxo da partida ou ignorar a preferência de acessibilidade *"reduzir movimento"* do sistema operacional.

---

## Princípio 3: Feedback instantâneo e multissensorial sob pressão

- **Origem:** **Novo** (criado para a dinâmica de jogos cronometrados do PG PLAY).
- **O porquê:** Durante uma mímica ou quiz relâmpago, os jogadores estão sob contagem regressiva e conversando alto. O sistema nunca pode deixar dúvida sobre acerto, erro ou fim do tempo, nem depender exclusivamente de percepção de cor.
- **Na prática:** O [Cronômetro Expressivo](04-componentes/cronometro-expressivo.md) muda simultaneamente de cor (`timer.bg.normal` para `timer.bg.critical`), de forma (`radius.full` para `radius.md`) e de ícone (`timer` para `warning`) quando restam `10 segundos`. Da mesma forma, [Alternativa de Quiz](04-componentes/alternativa-quiz.md) e [Teclado da Forca](04-componentes/teclado-forca.md) combinam cor semântica (`color.success` / `color.error`), ícone de confirmação e forma.
- **Evite:** Comunicar estados de acerto, erro ou alerta usando apenas mudança de cor (como trocar borda cinza por vermelha sem ícone ou texto auxiliar) ou exibir telas de carregamento bloqueantes entre uma palavra e outra.

---

## Princípio 4: Simplicidade inclusiva com alvos generosos

- **Origem:** **Adaptado** do princípio *"O material é a metáfora"* e das diretrizes de acessibilidade do Material 3 (`48 dp × 48 dp`).
- **O porquê:** O público de um PG reúne desde adolescentes até adultos mais velhos, jogando em pé ou sentados no sofá, em salas claras ou com luz baixa à noite. A interface deve eliminar cliques acidentais e cansaço visual.
- **Na prática:** Nenhum elemento tocável tem menos de `48 dp × 48 dp` (`space.2xl`), ações decisivas de rodada usam a variante Jumbo de `64 dp` de altura (`button.jumbo.height`), existe no máximo um botão primário por tela e todos os pares de texto/fundo possuem razão de contraste maior que `5,0:1` tanto no modo claro quanto no escuro.
- **Evite:** Posicionar ações destrutivas (como *"Sair da partida"*) coladas ao botão de pontuar (*"Acertaram!"*), usar mais de um botão primário na mesma tela ou criar teclas de jogo menores que `48 dp`.
