# PRD — PG PLAY · Product Requirements Document

> **Versão:** 0.1.0 (Draft)
> **Data:** 21/10/2026
> **Autor(es):** Heber Bringel e equipe
> **Repositório:** [Heber-Bringel/pg-play-app](https://github.com/Heber-Bringel/pg-play-app.git)
> **Status:** 🟡 Aguardando validação

---

## 1. Visão do Produto

O **PG PLAY** é um aplicativo móvel de minigames presenciais — **Mímica**, **Quiz Bíblico/Temático** e **Jogo da Forca** — projetado para animar encontros de Pequenos Grupos (PGs) com jovens e adultos em igrejas e residências.

### 1.1 Proposta de Valor

- **Diversão imediata:** dinâmicas rápidas que eliminam a necessidade de preparação manual de cartões, perguntas ou cronômetros físicos.
- **Engajamento comunitário:** mecânicas por equipe que incentivam cooperação e competição saudável entre os participantes do PG.
- **Acessibilidade inclusiva:** interface legível à distância, com feedback multissensorial (cor + forma + ícone), alvos de toque generosos e suporte a leitor de tela.

### 1.2 Problema que Resolve

Líderes de PG frequentemente gastam tempo improvisando dinâmicas em papel ou buscando apps genéricos que não atendem ao contexto de reuniões presenciais com celulares passados de mão em mão. O PG PLAY entrega uma experiência dedicada, pronta para uso, sem necessidade de cadastro ou login individual.

---

## 2. Público-Alvo

| Segmento | Descrição |
| --- | --- |
| **Primário** | Jovens e adultos (16–40 anos) participantes de Pequenos Grupos em igrejas e comunidades |
| **Secundário** | Líderes de PG que organizam e conduzem as dinâmicas do encontro |
| **Contexto de uso** | Reuniões presenciais em salas de estar, salões de igreja — celular segurado à distância, passado entre membros, ambiente com conversa alta e iluminação variável (clara ou noturna) |

---

## 3. Plataformas e Stack Tecnológico

| Item | Especificação |
| --- | --- |
| **Plataformas** | Android e iOS |
| **Framework** | React Native + Expo (TypeScript) |
| **Design System** | PG Play Expressive v1.0.0 (baseado em Google Material 3 Expressive 2025) |
| **Animações** | `react-native-reanimated` (física de mola — spring physics) |
| **Ícones** | Material Symbols Rounded (FILL=1, peso 600) via `@expo/vector-icons` |

---

## 4. Funcionalidades (Features)

### 4.1 Hub de Jogos (Home)

- Tela inicial com lista de cards de minigames disponíveis.
- Campo de busca com filtro em tempo real (local, sem latência de rede).
- Banner da equipe líder no topo (quando houver partida em andamento).
- Navegação para Equipes, Arena de Jogo e Placar via barra inferior.

### 4.2 Configuração de Equipes

- Cadastro rápido de nomes de equipes (limite de 20 caracteres por nome).
- Validação: mínimo 2 letras, sem duplicatas.
- Mínimo de 2 equipes para iniciar uma partida.
- Sugestão de 2 equipes pré-cadastradas no primeiro uso para início com 1 toque.
- Sem exigência de e-mail, senha ou login individual.

### 4.3 Arena de Mímica

- Exibição da palavra secreta em destaque (`font.display`, 30 dp, peso 800).
- Opção de esconder a palavra do grupo (botão Tonal).
- Cronômetro Expressivo com contagem regressiva.
- Botões de ação: "Acertaram! (+20 pts)" (Sucesso Jumbo), "Pular" (Secundário).
- Avanço automático para próxima palavra após acerto.

### 4.4 Arena de Quiz Relâmpago

- Card com pergunta + 4 alternativas de múltipla escolha (A, B, C, D).
- Alternativas com feedback visual duplo: cor semântica + ícone (`check_circle` / `cancel`).
- Cronômetro Expressivo com estado crítico nos últimos 10 segundos.
- Pontuação automática por acerto dentro do tempo.

### 4.5 Arena do Jogo da Forca

- Card com dica textual e lacunas da palavra (slots de letras).
- Teclado alfabético (A–Z) com alvo mínimo de 48 dp × 48 dp por tecla.
- Feedback por tecla: letra certa (círculo + `color.success`), letra errada (riscado + `color.error-container`).
- Contagem de vidas/erros.

### 4.6 Placar e Ranking do PG

- Pódio de equipes com pontuação acumulada.
- Card de destaque para equipe campeã (medalha, `color.highlight`).
- Botões: "Nova Partida" (Primário Jumbo) e "Voltar ao Hub" (Delineado).

---

## 5. Inventário de Telas × Componentes

| Tela | Componentes |
| --- | --- |
| Hub de Jogos (Home) | Campo de Texto (busca), Card de Minigame, Botão |
| Configuração de Equipes | Campo de Texto (cadastro), Botão (Tonal + Primário Jumbo) |
| Arena de Mímica | Cronômetro Expressivo, Card de Minigame (palavra secreta), Botão (Acerto, Pular, Revelar) |
| Arena de Quiz Relâmpago | Cronômetro Expressivo, Card de Minigame (pergunta), Alternativa de Quiz, Botão |
| Arena do Jogo da Forca | Card de Minigame (dica + lacunas), Teclado da Forca, Botão |
| Placar e Ranking do PG | Card de Minigame (pódio), Botão (Primário Jumbo + Delineado) |

---

## 6. Componentes do Design System

Os 6 componentes documentados no [design-system/](../design-system/) são a base visual e interativa de todas as telas:

| Componente | Tipo | Arquivo de Referência |
| --- | --- | --- |
| **Botão Expressivo** (`ExpressiveButton`) | Adaptado | [botao.md](../design-system/04-componentes/botao.md) |
| **Campo de Texto** (`ExpressiveTextField`) | Adaptado | [campo-de-texto.md](../design-system/04-componentes/campo-de-texto.md) |
| **Card de Minigame** (`GameCard`) | Adaptado | [card-de-jogo.md](../design-system/04-componentes/card-de-jogo.md) |
| **Cronômetro Expressivo** (`ExpressiveTimer`) | Novo | [cronometro-expressivo.md](../design-system/04-componentes/cronometro-expressivo.md) |
| **Alternativa de Quiz** (`QuizOption`) | Adaptado | [alternativa-quiz.md](../design-system/04-componentes/alternativa-quiz.md) |
| **Teclado da Forca** (`LetterKey`) | Novo | [teclado-forca.md](../design-system/04-componentes/teclado-forca.md) |

### 6.1 Decisões de Design Críticas

1. **Botão Jumbo com Shape Morphing (Adaptado):** altura de 64 dp para ações de jogo rápidas. Transformação de pílula (9999 dp) para retângulo arredondado (16 dp) no toque.
2. **Cronômetro Expressivo (Novo):** mudança simultânea de cor, forma e ícone nos últimos 10 segundos. Pulsação com física de mola.
3. **Teclado da Forca (Novo):** teclas de 48 dp × 48 dp com distinção por cor, forma e estilo tipográfico (sublinhado/riscado).
4. **Alternativa de Quiz Acessível (Adaptado):** prefixo alfabético (A, B, C, D) + confirmação visual dupla (cor + ícone).

---

## 7. Princípios de Design

Os 4 princípios fundamentais do sistema (detalhados em [01-principios.md](../design-system/01-principios.md)):

1. **Expressivo e legível na roda do grupo** — Cores vibrantes, formas distintas e tipografia pesada para leitura à distância.
2. **Física de mola e formas que respondem ao toque** — Feedback elástico e tátil via shape morphing e spring physics.
3. **Feedback instantâneo e multissensorial sob pressão** — Nunca apenas cor; sempre cor + forma + ícone.
4. **Simplicidade inclusiva com alvos generosos** — Mínimo 48 dp × 48 dp, ações Jumbo de 64 dp, máximo 1 botão primário por tela.

---

## 8. Requisitos de Acessibilidade

> Baseados em [06-acessibilidade.md](../design-system/06-acessibilidade.md).

| Requisito | Especificação |
| --- | --- |
| **Contraste mínimo (WCAG 2.1 AA)** | ≥ 4,5:1 para todos os pares de texto/fundo (a maioria atinge AAA ≥ 7,0:1) |
| **Alvos de toque** | Mínimo 48 dp × 48 dp (padrão), 64 dp para ações Jumbo |
| **Espaçamento entre alvos** | Mínimo 8 dp (`space.sm`) entre elementos tocáveis adjacentes |
| **Foco visível** | Anel de foco de 3 dp com `color.focus` em todos os componentes interativos |
| **Leitor de tela** | `accessibilityRole`, `accessibilityLabel`, `accessibilityLiveRegion` obrigatórios |
| **Independência de cor (WCAG 1.4.1)** | Nenhum estado comunicado apenas por cor — sempre cor + forma + ícone |
| **Texto ampliado** | `allowFontScaling={true}`, `maxFontSizeMultiplier={1.5}` em botões/cronômetro |
| **Redução de movimento** | Consulta `AccessibilityInfo.isReduceMotionEnabled()`, desativa animações de escala/pulsação |

---

## 9. Tokens de Design

> Detalhados em [02-tokens.md](../design-system/02-tokens.md).

### 9.1 Paleta de Cores (Semânticos)

| Token | Modo Claro | Modo Escuro | Uso |
| --- | --- | --- | --- |
| `color.action` | `#5B21B6` (Roxo) | `#D8B4FE` | Ação principal |
| `color.secondary` | `#C2410C` (Coral) | `#FDBA74` | Ações secundárias |
| `color.highlight` | `#FACC15` (Amarelo Ouro) | `#FACC15` | Placar, pódio, cronômetro normal |
| `color.success` | `#15803D` (Verde) | `#86EFAC` | Acerto |
| `color.error` | `#B91C1C` (Vermelho) | `#FCA5A5` | Erro, timer crítico |

### 9.2 Tipografia

| Token | Tamanho | Peso | Uso |
| --- | --- | --- | --- |
| `font.display` | 30 dp | 800 | Palavra secreta, placar destaque |
| `font.title` | 24 dp | 800 | Títulos de tela, cronômetro |
| `font.subtitle` | 18 dp | 700 | Títulos de cards, perguntas |
| `font.body` | 16 dp | 400 | Texto corrido, inputs |
| `font.label` | 16 dp | 700 | Rótulos de botões, alternativas |
| `font.caption` | 12 dp | 700 | Tags, textos auxiliares |

### 9.3 Espaçamento e Forma

- **Grade base:** múltiplos de 8 dp (ajuste fino com 4 dp)
- **Raios:** `radius.sm` (8 dp), `radius.md` (16 dp), `radius.lg` (20 dp), `radius.xl` (28 dp), `radius.full` (9999 dp)
- **Elevação:** `elevation.none` (0 dp), `elevation.card` (4 dp), `elevation.floating` (12 dp)

### 9.4 Movimento

| Token | Valor | Uso |
| --- | --- | --- |
| `motion.duration.short` | 150 ms | Feedback de toque, shape morphing |
| `motion.duration.medium` | 300 ms | Transições entre estados |
| `motion.duration.long` | 600 ms | Pulsação do cronômetro (10s finais) |
| `motion.spring.spatial` | damping: 14, stiffness: 280 | Forma, escala, posição (com overshoot) |
| `motion.spring.effects` | damping: 22, stiffness: 300 | Cor, opacidade (sem overshoot) |

---

## 10. Fluxos de Interação (Padrões)

> Detalhados em [05-padroes.md](../design-system/05-padroes.md).

### 10.1 Configuração de Equipes e Início de Partida

1. Líder acessa a aba Equipes → digita nome → toca "Adicionar Equipe" (Tonal).
2. Validação: ≥ 2 letras, sem duplicata.
3. Com ≥ 2 equipes → botão "Começar Rodada!" (Primário Jumbo, 64 dp) habilitado.

**Estados:** Carregando (spinner no botão, < 150 ms) · Erro (campo com fundo vermelho + ícone + mensagem) · Vazio (card tracejado + botão desabilitado) · Sucesso (animação de mola + campo limpo).

### 10.2 Rodada de Minigame sob Contagem Regressiva

1. Arena exibe equipe da vez + Cronômetro Expressivo (estado normal: amarelo, pílula).
2. Jogador interage (mímica / quiz / forca).
3. 10 segundos restantes → cronômetro entra no estado Crítico (vermelho, retângulo, ícone alert, pulsação).
4. Feedback imediato por cor + forma + ícone no acerto/erro.

**Estados:** Carregando (transição elástica entre cards) · Erro (alternativa/tecla em vermelho + ícone) · Vazio (banco concluído → card de celebração) · Sucesso (cor verde + ícone check).

### 10.3 Busca e Seleção de Minigames no Hub

1. Tela inicial com banner + lista de cards.
2. Filtro em tempo real ao digitar (local, 0 ms).
3. Toque no card → shape morphing (28 dp → 16 dp) → abre arena.

**Estados:** Carregando (instantâneo) · Erro (N/A) · Vazio (card tracejado + "Limpar busca") · Sucesso (cards filtrados).

---

## 11. Requisitos Não Funcionais

| Categoria | Requisito |
| --- | --- |
| **Performance** | Filtragem de minigames em < 16 ms (local). Transições de tela < 300 ms. Banco de palavras local (sem dependência de rede durante partida). |
| **Offline** | O app deve funcionar integralmente sem conexão à internet durante a partida. |
| **Responsividade** | Suporte a Dynamic Type / Font Scale do SO (até 200%). Layout adaptável com `minHeight` (nunca `height` fixa). |
| **Modo Escuro** | Suporte completo via troca de tokens semânticos. Todos os contrastes validados em ambos os modos. |
| **Governança do Design System** | Modelo híbrido: Heber Bringel mantém tokens e acessibilidade; PRs de toda a equipe para novos componentes/variantes. |

---

## 12. Fora de Escopo (v1.0)

- Login/autenticação de usuários individuais.
- Backend remoto ou sincronização de dados em nuvem.
- Minigames adicionais além de Mímica, Quiz e Forca.
- Funcionalidades de rede social ou chat.
- Monetização ou compras in-app.

---

## 13. Métricas de Sucesso

| Métrica | Meta |
| --- | --- |
| Tempo para primeira partida (desde abertura do app) | ≤ 30 segundos (com equipes sugeridas) |
| Taxa de erro motor (cliques acidentais em alvo errado) | < 5% das interações |
| Cobertura de acessibilidade (WCAG 2.1 AA) | 100% dos pares de cor aprovados |
| Satisfação em teste com usuários | ≥ 4/5 em usabilidade percebida |

---

## 14. Glossário

| Termo | Significado |
| --- | --- |
| **PG (Pequeno Grupo)** | Reunião presencial de jovens e adultos em casas ou igrejas |
| **Token** | Decisão de design com nome e valor explícito |
| **Shape Morphing** | Transformação suave do raio de borda ao mudar de estado |
| **Spatial Spring** | Curva de animação com leve overshoot (posição, escala, forma) |
| **Effects Spring** | Curva de animação sem overshoot (cor, opacidade) |
| **Modo Crítico** | Estado do cronômetro com ≤ 10 segundos restantes |
| **Jumbo** | Variante de botão com 64 dp de altura para ações de jogo |

---

## 15. Referências

- [Design System — README](../design-system/README.md)
- [01 — Princípios](../design-system/01-principios.md)
- [02 — Tokens](../design-system/02-tokens.md)
- [03 — Fundamentos](../design-system/03-fundamentos.md)
- [04 — Componentes](../design-system/04-componentes/)
- [05 — Padrões](../design-system/05-padroes.md)
- [06 — Acessibilidade](../design-system/06-acessibilidade.md)
- [07 — Teste com IA](../design-system/07-teste-com-ia.md)
- [CHANGELOG](../design-system/CHANGELOG.md)

---

> **⚠️ Este documento é um draft inicial (v0.1.0) gerado a partir do design-system existente e aguarda validação do responsável antes de ser considerado oficial.**
