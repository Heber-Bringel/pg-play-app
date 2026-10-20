# PG Play Expressive · Sistema de design do app PG PLAY

> Versão: 1.0.0 · Grupo: Heber Bringel e equipe ([pg-play-app](https://github.com/Heber-Bringel/pg-play-app.git)) · Disciplinas: IHC e PDM · IFPI Piripiri

## 1. Visão geral

O **PG PLAY** é um aplicativo móvel de minigames presenciais (Mímica, Quiz Bíblico/Temático e Jogo da Forca) projetado para animar encontros de Pequenos Grupos (PGs) com jovens e adultos. O sistema de design **PG Play Expressive** transmite energia comunitária, acolhimento e diversão imediata, priorizando leitura rápida à distância, alvos de toque generosos e feedback visual instantâneo sob pressão de tempo.

- **App:** PG PLAY ([Repositório Oficial no GitHub](https://github.com/Heber-Bringel/pg-play-app.git))
- **Plataforma e stack:** Android e iOS com **React Native + Expo** (TypeScript)
- **Sistema base:** Google **Material 3 Expressive (2025)**

## 2. Por que este sistema base (as cinco forças)

| Força | Justificativa em uma linha |
| --- | --- |
| Usuários | Jovens e adultos em dinâmicas de grupo precisam de hierarquia visual enfática, formas reconhecíveis e feedback imediato sem curva de aprendizado. |
| Acessibilidade | O Material 3 garante alvos mínimos de `48 dp × 48 dp` e contraste WCAG AA; acrescentamos botões Jumbo (`64 dp`) e estados de jogo que combinam cor, forma e ícone. |
| Marca | O Material 3 Expressive (2025) oferece formas geométricas variadas, física de mola (*spring physics*) e paleta vibrante (Roxo, Coral e Amarelo Ouro) ideais para jogos sociais. |
| Plataforma | Nativo na linguagem visual do Android e amplamente familiar no iOS, garantindo experiência fluida em celulares passados de mão em mão durante o PG. |
| Tecnologia | Os tokens em três níveis mapeiam diretamente para objetos de tema no React Native + Expo e animações de mola nativas com `react-native-reanimated`. |

## 3. Inventário: telas × componentes

| Tela | Componentes necessários |
| --- | --- |
| 1. Hub de Jogos (Home) | [Campo de Texto](04-componentes/campo-de-texto.md) (busca), [Card de Minigame](04-componentes/card-de-jogo.md), [Botão](04-componentes/botao.md) |
| 2. Configuração de Equipes | [Campo de Texto](04-componentes/campo-de-texto.md) (cadastro com validação), [Botão](04-componentes/botao.md) (Tonal e Primário Jumbo) |
| 3. Arena de Mímica | [Cronômetro Expressivo](04-componentes/cronometro-expressivo.md), [Card de Minigame](04-componentes/card-de-jogo.md) (palavra secreta), [Botão](04-componentes/botao.md) (Acerto, Pular e Revelar) |
| 4. Arena de Quiz Relâmpago | [Cronômetro Expressivo](04-componentes/cronometro-expressivo.md), [Card de Minigame](04-componentes/card-de-jogo.md) (pergunta), [Alternativa de Quiz](04-componentes/alternativa-quiz.md), [Botão](04-componentes/botao.md) |
| 5. Arena do Jogo da Forca | [Card de Minigame](04-componentes/card-de-jogo.md) (dica e lacunas), [Teclado da Forca](04-componentes/teclado-forca.md), [Botão](04-componentes/botao.md) |
| 6. Placar e Ranking do PG | [Card de Minigame](04-componentes/card-de-jogo.md) (pódio de equipes), [Botão](04-componentes/botao.md) (Primário Jumbo e Delineado) |

## 4. Mapa dos arquivos

| Arquivo | Conteúdo |
| --- | --- |
| [01-principios.md](01-principios.md) | Valores que guiam as decisões do sistema |
| [02-tokens.md](02-tokens.md) | Tokens primitivos, semânticos e de componente (claro, escuro e JSON W3C) |
| [03-fundamentos.md](03-fundamentos.md) | Regras de cor, tipografia, espaço (grade de 8 pontos), ícones, elevação e movimento |
| [04-componentes/botao.md](04-componentes/botao.md) | Botão Expressivo com *shape morphing* e variante Jumbo |
| [04-componentes/campo-de-texto.md](04-componentes/campo-de-texto.md) | Campo de entrada para busca e cadastro de equipes |
| [04-componentes/card-de-jogo.md](04-componentes/card-de-jogo.md) | Container expressivo para minigames, palavras secretas e ranking |
| [04-componentes/cronometro-expressivo.md](04-componentes/cronometro-expressivo.md) | Temporizador de rodada com alerta elástico nos segundos finais |
| [04-componentes/alternativa-quiz.md](04-componentes/alternativa-quiz.md) | Botão de opção múltipla com estados de seleção, acerto e erro |
| [04-componentes/teclado-forca.md](04-componentes/teclado-forca.md) | Grade de teclas alfabéticas com estados de tentativa |
| [05-padroes.md](05-padroes.md) | Fluxos completos: Configuração de Equipes, Rodada com Tempo e Busca no Hub |
| [06-acessibilidade.md](06-acessibilidade.md) | Contraste calculado, alvos de toque, foco, leitor de tela e movimento reduzido |
| [07-teste-com-ia.md](07-teste-com-ia.md) | Validação do sistema em duas rodadas com assistente de IA |
| [CHANGELOG.md](CHANGELOG.md) | Histórico de versões e governança da versão `1.0.0` |

## 5. Etiquetas de origem

Cada token, componente e regra traz uma etiqueta explícita:

- **Herdado:** veio do Material 3 / Material 3 Expressive sem mudança (cita a diretriz ou o token de origem).
- **Adaptado:** veio do Material 3 com mudança justificada por marca, público, acessibilidade ou tecnologia.
- **Novo:** criado especificamente para as mecânicas de minigames em grupo do PG PLAY.

### Resumo das principais decisões Adaptadas e Novas do PG Play Expressive

1. **Botão Jumbo com *Shape Morphing* (`Adaptado`):** ampliamos a altura do botão principal de jogo para `64 dp` (`button.jumbo.height`) e aplicamos transformação de raio de pílula (`9999 dp`) para retângulo arredondado (`16 dp`) no toque, facilitando cliques rápidos sem olhar fixamente para a tela.
2. **Cronômetro Expressivo (`Novo`):** componente inédito para dinâmicas de tempo que combina mudança de cor semântica (`color.highlight` para `color.error`), mudança de forma (`radius.full` para `radius.md`), troca de ícone (`timer` para `warning`) e pulsação com física de mola nos últimos 10 segundos.
3. **Teclado da Forca (`Novo`):** grade de teclas alfabéticas com alvo mínimo garantido de `48 dp × 48 dp` (`key.size`), que altera cor, forma e estilo tipográfico (sublinhado/riscado) para distinguir letras certas e erradas sem depender apenas de cor.
4. **Alternativa de Quiz Acessível (`Adaptado`):** adaptação do card interativo do M3 para opções de múltipla escolha com prefixo alfabético (`A`, `B`, `C`, `D`) e confirmação visual dupla (cor semântica + ícone `check_circle` ou `cancel`).

## 6. Glossário

| Termo | Significado |
| --- | --- |
| Token | Decisão de design com nome e valor explícito (ex.: `color.action` → `#5B21B6`). |
| PG (Pequeno Grupo) | Reunião presencial de jovens e adultos em casas ou igrejas para comunhão e dinâmicas. |
| Shape Morphing | Transformação suave do raio de borda de um componente ao mudar de estado (ex.: de `9999 dp` para `16 dp`). |
| Spatial Spring | Curva de animação baseada em física de mola do Material 3 Expressive para posição, escala e forma, permitindo leve *overshoot*. |
| Effects Spring | Curva de animação baseada em física de mola sem *overshoot*, usada para transições de cor e opacidade. |
| Alvo de toque | Área mínima interativa de um elemento tocável (`48 dp × 48 dp` no padrão ou `64 dp` de altura no botão Jumbo). |
| Modo crítico | Estado do `Cronômetro Expressivo` quando restam `10 segundos` ou menos na rodada. |

## 7. Quem mantém

- **Modelo de governança:** **Híbrido**. O arquiteto de design do grupo (Heber Bringel) mantém o núcleo de tokens (`02-tokens.md`) e acessibilidade (`06-acessibilidade.md`), enquanto todos os desenvolvedores do grupo podem propor novos componentes ou variantes conforme desenvolvem novos minigames em PDM.
- **Responsável por revisar mudanças:** Heber Bringel e equipe do projeto final de IHC/PDM.
- **Como propor uma mudança:** abrir um Pull Request no repositório [Heber-Bringel/pg-play-app](https://github.com/Heber-Bringel/pg-play-app.git) atualizando o arquivo correspondente em `design-system/`, validando a tabela de contraste em `06-acessibilidade.md` e registrando a nova versão no `CHANGELOG.md`.

## 8. Uso de IA na redação

O assistente de IA **Antigravity (Gemini)** foi utilizado para estruturar as tabelas markdown, calcular as razões matemáticas de luminância/contraste WCAG 2.1 e executar o protocolo de validação em `07-teste-com-ia.md`. Todas as decisões de identidade visual, paleta, componentes e fluxos do app foram revisadas e aprovadas pelo grupo.

## 9. Instruções para assistentes de IA

Ao gerar ou alterar qualquer interface do aplicativo **PG PLAY**:

1. Leia obrigatoriamente [01-principios.md](01-principios.md), [02-tokens.md](02-tokens.md) e [03-fundamentos.md](03-fundamentos.md) antes de escrever código.
2. Use **somente tokens** importados do objeto `tokens`. Nunca escreva cores hexadecimais (`#...`), tamanhos numéricos soltos ou raios literais no `StyleSheet`.
3. Para cada elemento da tela, siga estritamente a anatomia, as variantes e todos os estados descritos em [04-componentes/](04-componentes/).
4. Respeite [06-acessibilidade.md](06-acessibilidade.md): razão de contraste mínima de `4,5:1`, alvo de toque mínimo de `48 dp × 48 dp`, foco visível e propriedades de leitor de tela (`accessibilityRole`, `accessibilityLabel`, `accessibilityState`).
5. Nunca use apenas cor para indicar acerto, erro ou tempo esgotando; combine sempre cor, forma e ícone.
6. Se faltar um token, componente ou regra, **pergunte ou registre a lacuna**. Não invente valores.
7. Ao final da resposta, liste em uma tabela todos os tokens e componentes que você utilizou.
