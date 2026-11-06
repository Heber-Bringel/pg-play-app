# ⚡ Quiz Relâmpago — Especificação de Jogo (PG PLAY)

O **Quiz Relâmpago** é um jogo de perguntas de múltipla escolha (`A` a `D`) respondidas sob contagem regressiva curta. Funciona no formato **1 Celular Compartilhado**, com equipes alternando as perguntas.

Referências: `UC04` e `RF09`–`RF12`, `RF14` em [`requisitos-e-casos-de-uso-pg-play.md`](../requisitos/requisitos-e-casos-de-uso-pg-play.md).

---

## 1. Visão Geral no Domínio PG PLAY

- **Formato:** 1 celular compartilhado, por equipes (mínimo `2`, UC01).
- **Dinâmica:** equipes se alternam; a equipe da vez conversa e escolhe **uma** alternativa em até `20s`.
- **Conteúdo:** banco local de perguntas **misto** (bíblico e geral), em pacotes por tema: *Bíblico* (Antigo Testamento, Novo Testamento, Personagens), *Conhecimentos Gerais*, *Geografia*, *História*, *Ciência*, *Música e Cinema* e *Esportes* (ex.: *"Quem construiu a arca?"*, *"Qual é o maior planeta do Sistema Solar?"*). O grupo pode combinar vários pacotes.
- **Sem cadastro e offline** (**RNF02**, **RNF03**).

---

## 2. Parâmetros da Partida

| Parâmetro | Padrão | Opções |
| :--- | :---: | :--- |
| Tempo por pergunta | `20s` | `15s`, `20s`, `30s` |
| Número de perguntas | `10` | `5`, `10`, `15` |
| Pontos por acerto | `+10 pts` | fixo |
| Erro ou tempo esgotado | `0 pts` | fixo |
| Pacotes de perguntas | Todos (misto) | seleção múltipla por chips (Bíblico, Conhecimentos Gerais, Geografia, História, Ciência, Música e Cinema, Esportes) |

---

## 3. Fluxo Completo da Partida

### 🚪 Fase 1 — Vez da Equipe
O sistema exibe o card **"Vez da Equipe [Nome]"** e o contador **"Pergunta N de M"** (**RF09**).

### ❓ Fase 2 — Pergunta e Resposta
1. **Cronômetro:** `ExpressiveTimer` com Modo Crítico nos últimos `10s` (**RF10**).
2. **Enunciado:** `GameCard` com a pergunta em tipografia de alto impacto.
3. **Alternativas:** 4 componentes `QuizOption` identificados de `A` a `D` (`minHeight: 56 dp`) (**RF14**).
4. **Resposta:**
   - ✅ **Acerto:** `color.success`, raio `16 dp`, ícone `check-circle`, `+10 pts`.
   - ❌ **Erro:** `color.error`, raio `8 dp`, ícone `close-circle`; a alternativa **correta é revelada** simultaneamente.
   - Após a seleção, novos toques na mesma pergunta são **bloqueados**.
   - ⏱️ **Tempo esgotado:** nenhuma opção marcada, a correta é revelada e a pontuação não muda.
5. **Saída segura:** botão **"Sair"** (delineado) no canto superior esquerdo, com confirmação (**RF11**).

### ➡️ Fase 3 — Transição
Após revelar o resultado, o botão **"Próxima Pergunta"** passa a vez à equipe seguinte (transição de `300 ms`).

### 🏁 Fase 4 — Encerramento
Ao acabarem as perguntas ou o banco ser esgotado, o card de conclusão oferece **"Ir para o Placar Final"** (**RF12**), levando ao UC06.

---

## 4. Regras de Pontuação e Banco de Perguntas

- Cada pergunta tem exatamente **1** alternativa correta e **3** distratores.
- A ordem das alternativas é embaralhada a cada exibição.
- Perguntas não se repetem na mesma partida.
- Cada pergunta pode trazer uma **referência/curiosidade** opcional exibida após a resposta (ex.: *Gênesis 6* em perguntas bíblicas ou uma nota explicativa em perguntas gerais).

---

## 5. Requisitos de IHC, Componentes e Acessibilidade

| Elemento da Tela | Componente / Token do Design System | Regra de Acessibilidade (WCAG 2.1 / M3 Expressive) |
| --- | --- | --- |
| **Equipe e progresso** | `GameCard` | Anúncio por leitor de tela de "Pergunta N de M". |
| **Contagem de tempo** | `ExpressiveTimer` | Crítico por cor + forma + ícone + pulsação; respeita `Reduce Motion`. |
| **Alternativas A–D** | `QuizOption` (`56 dp`) | Estados acerto/erro com **cor + raio + ícone + texto** (**RNF06**), `accessibilityState` (`selected`, `disabled`). |
| **Próxima / Sair** | `ExpressiveButton` | Alvos `>= 56 dp`, espaçamento `>= 8 dp`; contraste `>= 4,5:1`. |

---

## 6. Critérios de Aceite (Dado/Quando/Então)

- **Dado** uma pergunta com 4 alternativas, **quando** a equipe toca em uma, **então** o sistema confirma acerto ou erro e bloqueia novos toques.
- **Dado** uma resposta errada, **então** a alternativa correta é revelada.
- **Dado** que o tempo zerou sem resposta, **então** a correta é revelada e a equipe não pontua.
- **Dado** que as perguntas acabaram, **então** é exibido o card com "Ir para o Placar Final".
