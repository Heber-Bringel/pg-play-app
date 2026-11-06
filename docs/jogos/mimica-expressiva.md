# 🎭 Mímica Expressiva — Especificação de Jogo (PG PLAY)

A **Mímica Expressiva** é o clássico jogo de gestos adaptado para o PG: um representante da equipe da vez encena uma palavra secreta, sem falar, para que o grupo adivinhe antes que o tempo acabe. Funciona no formato **1 Celular Compartilhado** (offline, sem cadastro).

Referências: `UC03` e `RF09`–`RF13` em [`requisitos-e-casos-de-uso-pg-play.md`](../requisitos/requisitos-e-casos-de-uso-pg-play.md).

---

## 1. Visão Geral no Domínio PG PLAY

- **Formato:** 1 celular compartilhado, por equipes (mínimo de `2` equipes, configuradas no UC01).
- **Participantes:** 2 ou mais equipes; um representante por turno, alternado a cada rodada.
- **Duração de uma rodada:** `60s` por equipe (padrão).
- **Conteúdo:** banco local de palavras/expressões **misto** (bíblico e geral), organizado por categorias/pacotes: *Bíblico* (ex.: *Davi e Golias*, *Arca de Noé*, *Jonas*), *Filmes e Séries*, *Animais*, *Profissões*, *Esportes*, *Ações do Dia a Dia* e *Cultura Pop*. O grupo pode combinar vários pacotes na mesma partida.
- **Regra de ouro:** o representante não pode falar, emitir sons nem apontar para objetos ou pessoas com a palavra escrita.

---

## 2. Parâmetros da Partida

| Parâmetro | Padrão | Opções |
| :--- | :---: | :--- |
| Tempo por turno | `60s` | `45s`, `60s`, `90s` |
| Pontos por acerto | `+20 pts` | fixo |
| Penalidade por pular palavra | `-5 pts` | fixo (a pontuação da equipe nunca fica negativa) |
| Número de rodadas | `3` | `1` a `5` (cada rodada = todas as equipes jogam uma vez) |
| Pacotes de conteúdo | Todos (misto) | seleção múltipla por chips (Bíblico, Filmes e Séries, Animais, Profissões, Esportes, Ações, Cultura Pop) |

---

## 3. Fluxo Completo da Partida

### 🚪 Fase 1 — Passagem de Turno
1. O sistema exibe um card (`GameCard`) com **"Vez da Equipe [Nome]"** (**RF09**) e o botão `Primário Jumbo` **"Estou Pronto!"**.
2. O aparelho é passado ao representante, que toca no botão para iniciar. A palavra **só aparece após esse toque**, evitando que o grupo a veja antes da hora.

### ⏱️ Fase 2 — Arena da Mímica
1. **Cronômetro:** o `ExpressiveTimer` inicia a contagem regressiva (`MM:SS`) e entra em **Modo Crítico** nos últimos `10s` (cor, forma `16 dp` e ícone `alert`) até `00:00` (`bell-ring`) (**RF10**).
2. **Palavra Secreta:** exibida em tipografia de alto impacto (`font.size.display`, `font.weight.black`) dentro de um `GameCard` (**RF13**).
3. **Esconder do Grupo:** botão tonal que oculta a palavra (substituída por um selo "🤫 Palavra escondida") e permite revelá-la de novo, para o representante conferir sem expor a tela.
4. **Ações de 1 toque:**
   - ✅ **"Acertaram! (+20 pts)"** (`Primário Jumbo`, `64 dp`): soma pontos e sorteia a próxima palavra em até `300 ms`.
   - ⏭️ **"Pular (-5 pts)"** (`Tonal`): descarta a palavra e sorteia outra.
5. **Saída segura:** botão **"Sair"** (delineado) no canto superior esquerdo, fisicamente separado dos botões de pontuação (**RF11**), com confirmação antes de encerrar a partida.

### 🔔 Fase 3 — Fim do Turno
1. Ao zerar o cronômetro, as ações são bloqueadas, o aparelho vibra e é exibido o resumo: palavras acertadas, puladas e pontos do turno.
2. O app avança para a próxima equipe (Fase 1).

### 🏁 Fase 4 — Encerramento
- Quando acabam as rodadas **ou** o banco de palavras selecionado se esgota, aparece o card de conclusão com **"Ir para o Placar Final"** (**RF12**), levando ao placar do PG (UC06).

---

## 4. Regras de Pontuação e Banco de Palavras

- Uma palavra não se repete dentro da mesma partida.
- Palavras puladas retornam ao banco apenas depois que todas as outras forem usadas.
- Empate no placar final é exibido como **1º lugar compartilhado** (sem desempate automático).

---

## 5. Requisitos de IHC, Componentes e Acessibilidade

| Elemento da Tela | Componente / Token do Design System | Regra de Acessibilidade (WCAG 2.1 / M3 Expressive) |
| --- | --- | --- |
| **Equipe da vez** | [`GameCard`](../../src/view/components/) | Texto grande e contrastante (`>= 4,5:1`); anunciado por leitor de tela ao iniciar o turno. |
| **Contagem de tempo** | `ExpressiveTimer` | Estado crítico comunicado por cor + forma + ícone + pulsação (desativada com `Reduce Motion`); `maxFontSizeMultiplier={1.5}`. |
| **Palavra secreta** | `GameCard` com tipografia Display (`30 dp`–`40 dp`, peso `800–900`) | Legível à distância (**RNF04**); estado "escondida" anunciado via `accessibilityLabel`. |
| **Acertaram / Pular / Esconder** | `ExpressiveButton` (`Primário Jumbo` `64 dp`, `Tonal` `56 dp`) | Alvos `>= 56 dp`, espaçamento `>= 8 dp` entre botões; botão de pontuar afastado de "Sair" para evitar toque acidental. |

---

## 6. Critérios de Aceite (Dado/Quando/Então)

- **Dado** que a equipe está pronta, **quando** o representante toca em "Estou Pronto!", **então** o cronômetro inicia e a palavra é exibida.
- **Dado** uma palavra visível, **quando** toca em "Esconder do Grupo", **então** a palavra é ocultada e o botão passa a oferecer "Mostrar palavra".
- **Dado** uma palavra em jogo, **quando** toca em "Acertaram!", **então** a equipe ganha `+20 pts` e uma nova palavra é sorteada.
- **Dado** que restam `10s` ou menos, **então** o cronômetro entra em Modo Crítico.
- **Dado** que o tempo zerou, **então** os botões de ação são bloqueados e o turno passa à próxima equipe.
