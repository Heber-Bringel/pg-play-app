# PG Play Expressive · Sistema de design do app PG PLAY

> Versão: 1.1.0 · Grupo: Heber Bringel e equipe ([pg-play-app](https://github.com/Heber-Bringel/pg-play-app.git)) · Disciplinas: IHC e PDM · IFPI Piripiri

## 1. Visão geral

O **PG PLAY** é um aplicativo móvel de minigames presenciais (Mímica, Quiz, Forca, Cidade Dorme, Adedonha Bíblica, Complete o Versículo e dinâmicas de encerramento) projetado para animar encontros de Pequenos Grupos (PGs) com jovens e adultos. O sistema de design **PG Play Expressive** transmite energia comunitária, acolhimento e diversão imediata, priorizando leitura rápida à distância (`RNF04`), alvos de toque generosos (`RNF07`) e feedback visual acessível (`RNF06`, `RNF08`).

- **App:** PG PLAY ([Repositório Oficial no GitHub](https://github.com/Heber-Bringel/pg-play-app.git))
- **Plataforma e stack:** Android, iOS e Web com **React Native + Expo** (TypeScript)
- **Sistema base:** Google **Material 3 Expressive (2025)**

## 2. Por que este sistema base (as cinco forças)

| Força | Justificativa em uma linha |
| --- | --- |
| Usuários | Jovens e adultos em dinâmicas de grupo precisam de hierarquia visual enfática, formas reconhecíveis e feedback imediato sem curva de aprendizado. |
| Acessibilidade | O Material 3 garante alvos mínimos de `48 dp × 48 dp` e contraste WCAG AA (textos ≥ 4,5:1 e componentes ≥ 3:1); acrescentamos botões Jumbo (`64 dp`), foco `:focus-visible` com anel duplo e estados que combinam cor, forma e ícone. |
| Marca | O Material 3 Expressive (2025) oferece formas geométricas variadas, física de mola (*spring physics*) e paleta vibrante (Roxo, Coral e Amarelo Ouro) ideais para jogos sociais. |
| Plataforma | Nativo na linguagem visual do Android, familiar no iOS e responsivo na Web com tema claro/escuro automático via `useColorScheme()`. |
| Tecnologia | Os tokens em três níveis mapeiam diretamente para `src/view/theme.ts` (`ThemeProvider` + `useTheme()`) sem duplicatas nem valores literais. |

## 3. Mapa dos arquivos (10 componentes documentados na v1.1.0)

| Arquivo | Conteúdo |
| --- | --- |
| [01-principios.md](01-principios.md) | Valores que guiam as decisões do sistema |
| [02-tokens.md](02-tokens.md) | Tokens primitivos, semânticos e de componente (claro, escuro e JSON W3C — v1.1.0) |
| [03-fundamentos.md](03-fundamentos.md) | Regras de cor, bordas por estado, tipografia (`Plus Jakarta Sans`), espaço, ícones, elevação e movimento |
| [04-componentes/botao.md](04-componentes/botao.md) | `ExpressiveButton` com *shape morphing*, Jumbo e variantes `text` e `icon` |
| [04-componentes/campo-de-texto.md](04-componentes/campo-de-texto.md) | `ExpressiveTextField` para busca, cadastro de equipes e entradas de jogo |
| [04-componentes/card-de-jogo.md](04-componentes/card-de-jogo.md) | `GameCard` com `ExpressiveTag` e borda de líder `card.borderLeader` |
| [04-componentes/cronometro-expressivo.md](04-componentes/cronometro-expressivo.md) | `ExpressiveTimer` com alerta elástico nos segundos finais |
| [04-componentes/alternativa-quiz.md](04-componentes/alternativa-quiz.md) | `QuizOption` de múltipla escolha com seleção, acerto e erro |
| [04-componentes/teclado-forca.md](04-componentes/teclado-forca.md) | `LetterKey` com alvo mínimo `48 dp × 48 dp` e estados de tentativa |
| [04-componentes/chip.md](04-componentes/chip.md) | `ExpressiveChip` para filtros, parâmetros e marcações de estado |
| [04-componentes/tag.md](04-componentes/tag.md) | `ExpressiveTag` para metadados e badges em 6 tons legíveis (`14 dp`, ≥ 3:1) |
| [04-componentes/modal-confirmacao.md](04-componentes/modal-confirmacao.md) | `ConfirmModal` com suporte a 1 botão (encerramento) ou 2 botões (confirmação) |
| [04-componentes/item-selecionavel.md](04-componentes/item-selecionavel.md) | `SelectableOptionItem` para listas de seleção exclusiva (Noite/Dia) |
| [04-componentes/tela-de-desenho.md](04-componentes/tela-de-desenho.md) | `DrawingCanvas` para desenho à mão livre com 4 cores, 2 espessuras e barra acessível (`UC12`) |
| [05-padroes.md](05-padroes.md) | Fluxos completos: Configuração de Equipes, Rodada com Tempo e Busca no Hub |
| [06-acessibilidade.md](06-acessibilidade.md) | Contraste de textos (≥ 4,5:1) e componentes (≥ 3:1), alvos, foco `:focus-visible`, leitor de tela e movimento reduzido |
| [07-teste-com-ia.md](07-teste-com-ia.md) | Validação do sistema com assistente de IA |
| [CHANGELOG.md](CHANGELOG.md) | Histórico de versões (`1.0.0` → `1.1.0`) |

## 4. Instruções para assistentes de IA

Ao gerar ou alterar qualquer interface do aplicativo **PG PLAY**:

1. Leia obrigatoriamente [01-principios.md](01-principios.md), [02-tokens.md](02-tokens.md) e [03-fundamentos.md](03-fundamentos.md) antes de escrever código.
2. Consuma os tokens via `useTheme()` de `@/view/theme`. Nunca escreva cores hexadecimais (`#...`) fora de `src/view/theme.ts`.
3. Nunca defina `borderColor` de estado diretamente com `color.success`, `color.error`, `color.secondary` ou `color.focus` em telas; utilize os tokens de componente (`chip`, `option`, `card`, `tag`, `banner`).
4. Utilize `ExpressiveTag` para qualquer tag/badge textual, `ExpressiveChip` para filtros/seletores compactos e `ExpressiveButton` (`text`/`icon`) para ações discretas ou só com ícone.
5. Garanta foco exclusivo para teclado/switch (`useKeyboardFocus`) com anel duplo M3 e respeite [06-acessibilidade.md](06-acessibilidade.md).
