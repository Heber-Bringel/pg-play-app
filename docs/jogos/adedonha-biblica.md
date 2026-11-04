# ✍️📖 Adedonha Bíblica — Especificação de Jogo (PG PLAY)

A **Adedonha Bíblica** (também conhecida como *Stop! Bíblico*) é um jogo rápido de vocabulário, memória e agilidade mental adaptado para grupos presenciais. No **PG PLAY**, ele funciona no formato **Sala Multiplayer** (cada participante digita no próprio celular), contando com uma **Roleta Expressiva do Alfabeto (Material 3 Expressive)**, criação livre de colunas/categorias pelo **Moderador** e apuração dinâmica assistida.

---

## 1. Visão Geral no Domínio PG PLAY

- **Formato:** Sala Multiplayer presencial (entrada rápida via código curto ou QR Code, sem necessidade de cadastro).
- **Número de participantes:** 2 a 16 jogadores (o próprio Moderador/Anfitrião também joga normalmente).
- **Diferenciais no PG PLAY:**
  1. **Colunas/Categorias criadas pelo Moderador:** Liberdade total para o líder personalizar os temas da rodada de acordo com o estudo ou perfil do grupo.
  2. **Roleta Expressiva do Alfabeto (M3 Expressive):** Sorteio visual e tátil sincronizado em todos os aparelhos com física de mola espacial e transformação de forma (*shape morphing*).
  3. **Apuração Ágil ("Moderador Juiz + Botão Levantar Dúvida ✋"):** O sistema agrupa e pré-pontua automaticamente as respostas, os jogadores podem sinalizar dúvidas em tempo real e o Moderador dá a palavra final sem travar o ritmo da roda.

---

## 2. Configuração da Sala (Moderador/Anfitrião)

No Lobby da partida, o **Moderador** configura a estrutura do jogo:

### 2.1. Criação das Colunas (Categorias Bíblicas)
- Utilizando o componente [`ExpressiveTextField`](../../src/components/ExpressiveTextField.tsx) e botões tonais ([`ExpressiveButton`](../../src/components/ExpressiveButton.tsx)), o Moderador cria as colunas que todos deverão preencher (recomendado de **3 a 6 colunas** por rodada).
- **Exemplos de colunas que o Moderador pode criar (ou adicionar com 1 toque via chips de sugestão):**
  - *Personagem Bíblico*
  - *Livro da Bíblia*
  - *Cidade, Monte ou Rio Bíblico*
  - *Rei, Profeta ou Apóstolo*
  - *Objeto, Alimento ou Animal na Bíblia*
  - *Atributo de Deus / Palavra de Fé*
  - *Milagre ou Parábola*
- O Moderador pode adicionar, reordenar ou remover colunas entre uma rodada e outra.

### 2.2. Parâmetros da Rodada
- **Tempo Máximo por Rodada:** `60s`, `90s` (padrão) ou `120s`.
- **Quantidade de Rodadas (Letras):** `5` (padrão), `7` ou `10` rodadas.
- **Filtro de Letras Difíceis:** Por padrão, as letras `K`, `W` e `Y` (e opcionalmente `X` e `Z`) vêm desativadas do sorteio para evitar rodadas sem palavras bíblicas em português, podendo ser ativadas pelo Moderador.
- **Regra do Botão "ADEDONHA!":** Exigir `100%` das colunas preenchidas pelo jogador para liberar o botão de parar a rodada.

---

## 3. Fluxo Completo da Partida

### 🎡 Fase 1 — Sorteio na Roleta Expressiva do Alfabeto

No início de cada rodada, todos os celulares exibem a **Roleta Expressiva do Alfabeto** sincronizada:

1. **Acionamento:** O Moderador (ou o vencedor da rodada anterior) toca ou desliza para girar a roleta.
2. **Física de Mola e Feedback Tátil (Material 3 Expressive):**
   - A roleta gira utilizando a curva de mola espacial (`motion.spring.spatial`: `damping: 14`, `stiffness: 180`), desacelerando gradualmente.
   - Cada letra do anel segue a semântica visual do [`LetterKey`](../../src/components/LetterKey.tsx): letras disponíveis aparecem em pílula (`9999 dp`), enquanto letras já sorteadas em rodadas anteriores ficam no estado `used` (raio `8 dp`, opacidade reduzida e excluídas do sorteio).
   - A cada casa percorrida na desaceleração, o aparelho emite um pulso háptico curto.
3. **Revelação da Letra da Rodada (*Shape Morphing*):**
   - Quando a roleta trava na letra sorteada (ex.: **Letra `D`**), o elemento central se expande de círculo (`9999 dp`) para um [`GameCard`](../../src/components/GameCard.tsx) heroico (`28 dp`) em `color.action-primary` (`#FF5B37`) com tipografia `font.size.hero` (`40 sp` / `font.weight.black`).
   - Após `2 segundos` de destaque, a tela abre automaticamente o formulário de preenchimento.

---

### ✍️ Fase 2 — Preenchimento Rápido e Grito de "ADEDONHA!"

1. **Cabeçalho Fixo da Rodada:**
   - Exibe o selo da **Letra Sorteada** (ex.: **`D`**) ao lado do [`ExpressiveTimer`](../../src/components/ExpressiveTimer.tsx) em contagem regressiva.
2. **Campos de Resposta por Coluna:**
   - Cada coluna criada pelo Moderador é renderizada como um [`ExpressiveTextField`](../../src/components/ExpressiveTextField.tsx) (`minHeight: 56 dp`, raio `16 dp`).
   - **Validação Instantânea de Inicial:** Se o jogador digitar uma palavra que **não** começa com a letra da rodada (ignorando acentos e espaços iniciais), o campo entra imediatamente no estado `error` (fundo `color.error-container`, borda `color.error`, raio `12 dp`, ícone `alert-circle` e mensagem *"A resposta deve começar com a letra [X]"*).
3. **Botão "ADEDONHA!" (Stop!):**
   - Na base da tela fica o [`ExpressiveButton`](../../src/components/ExpressiveButton.tsx) na variante `Primário Jumbo` (`64 dp` de altura): **"ADEDONHA! (Parar Rodada)"**.
   - Enquanto o jogador ainda tiver colunas vazias ou com erro de inicial, o botão permanece `disabled`.
   - Assim que o primeiro jogador preencher todas as colunas com palavras iniciadas pela letra correta e tocar em **"ADEDONHA!"**:
     - Todos os celulares vibram e entram nos **5 segundos finais de alerta crítico** (*"Fulano pediu ADEDONHA! Últimos 5 segundos!"*) com o [`ExpressiveTimer`](../../src/components/ExpressiveTimer.tsx) pulsando em vermelho (`timer.bg.critical`).
     - Ao zerar, todos os campos são bloqueados e enviados automaticamente ao servidor.

---

### ⚖️ Fase 3 — Apuração Assistida (Moderador Juiz + Botão "Levantar Dúvida ✋")

Para manter o ritmo ágil e preservar a conversa divertida na roda presencial, a validação das respostas acontece **coluna por coluna**:

1. **Pré-Processamento Inteligente do Servidor:**
   - O aplicativo normaliza os textos (remove acentos, espaços extras e diferenças entre maiúsculas/minúsculas) e já classifica cada resposta automaticamente:
     - 🌟 **Resposta Única (`+10 pts`):** Apenas um jogador escreveu aquela palavra na coluna.
     - 🤝 **Resposta Repetida (`+5 pts`):** Dois ou mais jogadores escreveram exatamente a mesma palavra (ex.: três pessoas digitaram *"Davi"*).
     - ❌ **Vazia ou Letra Incorreta (`0 pts`):** Já marcada como inválida automaticamente.

2. **Visão dos Jogadores (Botão "Levantar Dúvida ✋"):**
   - Todos os jogadores veem no próprio celular o [`GameCard`](../../src/components/GameCard.tsx) da coluna atual (ex.: *"Coluna 1 de 5: Personagem Bíblico — Letra D"*) com a lista do que cada participante respondeu.
   - Ao lado de cada resposta aparece um botão tonal compacto **"Levantar Dúvida ✋"**.
   - Se um jogador achar que a resposta de alguém não existe ou não pertence à categoria, ele toca em **"Levantar Dúvida ✋"**.

3. **Visão e Decisão do Moderador (Juiz da Rodada):**
   - Quando algum jogador toca em **"Levantar Dúvida ✋"**, o card daquela resposta pisca em destaque com alerta na tela do **Moderador** (*"2 jogadores levantaram dúvida sobre esta resposta"*).
   - O grupo debate rapidamente ao vivo e o **Moderador** tem três ações rápidas de 1 toque sobre qualquer resposta:
     - ✅ **Validar (`+10` ou `+5` pts):** Mantém a resposta como aceita.
     - 🤝 **Marcar como Repetida (`+5 pts`):** Útil quando dois jogadores escrevem a mesma coisa com grafias diferentes (ex.: *"Davi"* e *"Rei Davi"*).
     - ❌ **Invalidar (`0 pts`):** Anula a resposta que não for aceita.
   - Ao finalizar a conferência da coluna, o Moderador toca no botão `Primário Jumbo` **"Confirmar e Próxima Coluna"**.

---

### 🏆 Fase 4 — Placar da Rodada e Pódio Final

1. **Tabela de Pontos:**
   - Ao fim da última coluna da rodada, o aplicativo exibe a soma de pontos ganhos na letra atual e o **Ranking Acumulado** da sala.
2. **Próxima Letra ou Encerramento:**
   - Se ainda houver rodadas restantes, o Moderador toca em **"Girar Próxima Letra"** (podendo inclusive adicionar ou ajustar uma coluna antes do próximo giro, se desejar).
   - Ao concluir todas as rodadas configuradas, o aplicativo exibe o **Pódio Final da Adedonha Bíblica**, destacando:
     - 🥇 **Campeão Geral de Pontos**
     - ⚡ **Mão Mais Rápida** (quem mais acionou o botão *"ADEDONHA!"*)
     - 🧠 **Vocabulário Raro** (quem teve mais respostas únicas de `+10 pts`)

---

## 4. Requisitos de IHC, Componentes e Acessibilidade

| Elemento da Tela | Componente / Token do Design System | Regra de Acessibilidade (WCAG 2.1 / M3 Expressive) |
| --- | --- | --- |
| **Roleta Expressiva do Alfabeto** | Inspirado em [`LetterKey`](../../src/components/LetterKey.tsx) + [`GameCard`](../../src/components/GameCard.tsx) + `motion.spring.spatial` | Anúncio via leitor de tela (`accessibilityLiveRegion="polite"`) da letra sorteada; botão alternativo *"Sortear Letra"* sem exigir gesto de arrasto; respeito a `Reduce Motion`. |
| **Criação e Preenchimento de Colunas** | [`ExpressiveTextField`](../../src/components/ExpressiveTextField.tsx) (`minHeight: 56 dp`) | Rótulo visível permanente com o nome da coluna e dica com a letra da rodada (ex.: *"Começa com D..."*); erro comunicado por cor + borda `2 dp` + ícone `alert-circle` + texto explicativo. |
| **Contagem de Tempo da Rodada** | [`ExpressiveTimer`](../../src/components/ExpressiveTimer.tsx) | Transição para estado crítico nos últimos `10s` (ou nos `5s` pós-Adedonha) mudando cor, formato (`9999 dp` → `16 dp`) e ícone (`timer-outline` → `alert`). |
| **Botão "ADEDONHA!" e Confirmações** | [`ExpressiveButton`](../../src/components/ExpressiveButton.tsx) (`Primário Jumbo` `64 dp` e `Tonal` `56 dp`) | Alvo de toque amplo (`>= 56 dp`), contraste mínimo `4.5:1` e estado `disabled` explícito enquanto houver colunas em branco. |
| **Cards de Apuração (+10, +5, 0 pts)** | [`QuizOption`](../../src/components/QuizOption.tsx) / [`GameCard`](../../src/components/GameCard.tsx) | Diferenciação tripla entre **Única (`+10`)**, **Repetida (`+5`)** e **Inválida (`0`)** usando **Cor + Forma do raio + Ícone + Selo de pontos**. |
