# 🌙 Cidade Dorme — Especificação de Jogo (PG PLAY)

O **Cidade Dorme** (também conhecido como *Máfia* ou *Werewolf*) é um clássico jogo de dedução social, blefe e mistério para grupos presenciais. No **PG PLAY**, ele é adaptado para o formato **Sala Multiplayer** com **Narrador Automatizado por Áudio**, permitindo que **100% dos presentes joguem** (inclusive o líder/anfitrião da sala) usando seus próprios celulares.

---

## 1. Visão Geral no Domínio PG PLAY

- **Formato:** Sala Multiplayer presencial (cada participante entra pelo próprio celular via código curto ou QR Code).
- **Número de participantes:** 5 a 16 jogadores.
- **Diferencial — Narrador do Próprio App com Voz Clonada:**
  - Não é necessário excluir uma pessoa da roda para narrar a partida.
  - O aplicativo conduz todas as fases por **áudio com vozes clonadas dos líderes do PG**.
  - Nas configurações da sala (Lobby), o **Moderador/Anfitrião** escolhe entre **Voz Masculina** ou **Voz Feminina** para o Narrador.
  - **Áudio centralizada:** A narração em voz alta é reproduzida apenas no dispositivo do **Anfitrião** (evitando eco entre múltiplos celulares na mesma sala), enquanto as telas de todos os participantes são sincronizadas em tempo real.

---

## 2. Personagens e Papéis do MVP

No início da partida, o servidor sorteia e distribui secretamente um dos quatro papéis abaixo para cada jogador:

| Personagem | Alinhamento | Quantidade Sugerida | Função na Partida |
| --- | --- | --- | --- |
| 🧑‍🤝‍🧑 **Cidadão** | Cidade (Bem) | Maioria do grupo | Não realiza ações especiais à noite. Durante o dia, analisa comportamentos, argumenta e vota para descobrir e eliminar o Assassino. |
| 🗡️ **Assassino** | Infiltrados | 1 (5 a 8 jogadores) ou 2 (9+ jogadores) | Acorda durante a noite para escolher uma vítima. Durante o dia, blefa e se passa por Cidadão para não ser descoberto. |
| 🛡️ **Anjo** | Cidade (Bem) | 1 por sala | Acorda durante a noite para escolher um jogador e protegê-lo. Se proteger o mesmo alvo escolhido pelo Assassino, ninguém é eliminado naquela noite. |
| 🔍 **Detetive** | Cidade (Bem) | 1 por sala | Acorda durante a noite e escolhe um jogador para investigar. O aplicativo revela silenciosamente na tela do Detetive se o investigado é **Assassino** ou **Inocente**. |

---

## 3. Configurações da Sala (Moderador/Anfitrião)

Antes de iniciar a partida no Lobby, o Moderador pode configurar:

1. **Voz do Narrador:** Masculina ou Feminina.
2. **Quantidade de Assassinos:** Automática pelo tamanho da sala ou manual (1 a 3).
3. **Tempo de Debate do Dia:** `60s`, `120s` (padrão) ou `180s`.
4. **Tempo por Turno da Noite:** `15s` (padrão) ou `20s`.
5. **Revelar Papel ao Morrer:** Ativado (padrão) ou Desativado (modo difícil).

---

## 4. Fluxo Completo da Partida

### Fase 0 — Sorteio e Revelação Secreta de Papel

1. O servidor sorteia os papéis e envia cada um apenas para o respectivo aparelho.
2. Cada jogador vê na tela um [`GameCard`](../../src/components/GameCard.tsx) fechado de segurança (*"Apenas você deve olhar para a tela agora"*).
3. O jogador toca no [`ExpressiveButton`](../../src/components/ExpressiveButton.tsx) **"Revelar Meu Papel"**, visualiza seu personagem e descrição, e toca em **"Esconder e Estou Pronto"**.
4. Quando todos confirmam, o Narrador inicia a primeira noite.

---

### 🌙 Fase 1 — A Noite (A Cidade Dorme)

Durante a noite, a interface de todos os aparelhos transiciona automaticamente para os tokens do **Modo Escuro (`#11131C`)** do sistema de design **PG Play Expressive**, reduzindo o brilho da tela para não iluminar o rosto dos jogadores no ambiente.

1. **Adormecer da Cidade:**
   - **Áudio do Narrador:** *"A cidade dorme... Todos fecham os olhos."*
   - Todos os jogadores fecham os olhos. As telas permanecem em estado neutro escuro.

2. **Turno do Assassino:**
   - **Áudio do Narrador:** *"Assassino, acorde e escolha sua vítima."*
   - Apenas o celular do(s) **Assassino(s)** desbloqueia a lista de jogadores vivos (usando opções selecionáveis no padrão de [`QuizOption`](../../src/components/QuizOption.tsx)) acompanhada de um [`ExpressiveTimer`](../../src/components/ExpressiveTimer.tsx) silencioso.
   - O Assassino seleciona o alvo e confirma em **"Confirmar Alvo"**.
   - **Áudio do Narrador:** *"Assassino, volte a dormir e feche os olhos."*

3. **Turno do Anjo:**
   - **Áudio do Narrador:** *"Anjo, acorde e escolha quem você deseja proteger esta noite."*
   - Apenas o celular do **Anjo** libera a seleção de jogadores vivos.
   - O Anjo seleciona o protegido e confirma em **"Proteger Jogador"**.
   - **Áudio do Narrador:** *"Anjo, volte a dormir e feche os olhos."*

4. **Turno do Detetive:**
   - **Áudio do Narrador:** *"Detetive, acorde e aponte um suspeito para investigar."*
   - Apenas o celular do **Detetive** libera a seleção de jogadores vivos.
   - Ao confirmar o jogador investigado, **apenas a tela do Detetive** exibe um card silencioso com o veredito imediato (com cor, forma e ícone do Material 3 Expressive):
     - 🚨 **Suspeito Confirmado (Assassino)** — contêiner de alerta (`color.error-container`, canto `8 dp`, ícone `alert-circle`).
     - ✅ **Cidadão Inocente** — contêiner de sucesso (`color.success-container`, canto `16 dp`, ícone `check-circle`).
   - **Áudio do Narrador:** *"Detetive, guarde seu segredo, volte a dormir e feche os olhos."*

> **Mecanismo Anti-Dedução por Tempo (Cadência Fixa):** Se um personagem especial realizar sua ação muito rápido (ex.: em 2 segundos), o aplicativo aguarda uma janela mínima aleatória (`8s` a `12s`) antes de o Narrador mandar dormir, evitando que os outros participantes deduzam quem jogou pela velocidade ou pelo silêncio.

---

### ☀️ Fase 2 — O Dia (A Cidade Acorda e Debate)

Ao amanhecer, a interface de todos os aparelhos transiciona com física de mola (`motion.spring.spatial`) para os tokens do **Modo Claro (`#FFF8F5`)**.

1. **Boletim do Amanhecer:**
   - **Áudio do Narrador:** *"A cidade acorda! Todos podem abrir os olhos."*
   - O servidor cruza o ataque do Assassino com a proteção do Anjo e exibe o [`GameCard`](../../src/components/GameCard.tsx) do Boletim da Manhã em todos os celulares:
     - **Se o Anjo salvou o alvo:** O Narrador anuncia *"A madrugada foi tensa, mas o Anjo protegeu a vítima a tempo! Ninguém foi eliminado!"*
     - **Se houve eliminação:** O Narrador anuncia *"Triste notícia na cidade: [Nome do Jogador] foi eliminado durante a noite."*
2. **Debate Presencial Cronometrado:**
   - O [`ExpressiveTimer`](../../src/components/ExpressiveTimer.tsx) inicia a contagem regressiva do debate (`120s` por padrão).
   - Os jogadores conversam presencialmente, apresentam argumentos, defesas ou blefes.
   - Quando restam `10 segundos`, o cronômetro entra no estado **Crítico** (`timer.bg.critical`, pulso expressivo e ícone `alert`).

---

### 🗳️ Fase 3 — Votação Secreta da Cidade

1. **Áudio do Narrador:** *"O tempo de discussão acabou! Agora, votem pelo celular em quem vocês acreditam ser o Assassino."*
2. Todos os jogadores vivos veem no próprio celular a lista de participantes vivos + a opção **"Abster-se / Pular Voto"**.
3. Cada jogador seleciona sua opção ([`QuizOption`](../../src/components/QuizOption.tsx)) e confirma no botão [`ExpressiveButton`](../../src/components/ExpressiveButton.tsx) (`Primário Jumbo`).
4. **Apuração e Resultado da Votação:**
   - **Maioria simples:** O jogador mais votado é eliminado da partida, e o Narrador anuncia o resultado.
   - **Empate ou maioria em "Pular Voto":** Ninguém é eliminado naquele dia, e o Narrador anuncia que a cidade não chegou a um consenso.

---

### 🏆 Fase 4 — Condições de Vitória e Fim de Jogo

Após cada amanhecer e após cada votação diurna, o servidor verifica automaticamente se a partida terminou:

- **🎉 Vitória da Cidade (Cidadãos, Anjo e Detetive):** Todos os **Assassinos** foram eliminados na votação.
- **🕶️ Vitória dos Assassinos:** O número de **Assassinos vivos** é igual ou maior que o número de inocentes vivos (paridade numérica, tornando impossível eliminá-los no voto).

Na tela de **Resultado Final**:
- O Narrador anuncia o grupo vencedor.
- Todos os papéis secretos da partida são revelados em um resumo completo.
- O Anfitrião pode tocar em **"Jogar Novamente (Revanche)"** — mantendo os mesmos jogadores na sala e sorteando novos papéis — ou **"Trocar de Jogo"**.

---

## 5. Estados Especiais e Requisitos de IHC / Acessibilidade

- **Modo Espectador ("Fantasma"):** Jogadores eliminados à noite ou na votação continuam conectados à sala acompanhando os eventos na tela com o selo *"Você foi eliminado — Acompanhe em silêncio"*, mas com os botões de ação e votação desabilitados.
- **Acessibilidade Sensorial (Sem depender só de cor ou só de áudio):**
  - Todas as falas do Narrador aparecem simultaneamente como **legendas expressivas em destaque** no topo da tela para jogadores com deficiência auditiva ou ambientes barulhentos.
  - Os estados de investigação do Detetive, seleção de alvo e votação combinam **Cor + Forma (raio da borda) + Ícone + Rótulo textual**, respeitando 100% do [`design-system/06-acessibilidade.md`](../../design-system/06-acessibilidade.md).
- **Reconexão Transparente:** Caso o celular de um jogador bloqueie a tela ou perca conexão momentaneamente, ao reconectar ele recupera imediatamente seu papel e a fase atual da sala.
