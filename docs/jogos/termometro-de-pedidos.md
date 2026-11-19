# 🙏 Termômetro de Pedidos — Especificação de Dinâmica (PG PLAY)

O **Termômetro de Pedidos** é o **momento de pedidos de oração** que fecha o encontro. Cada participante tem um **tempo de fala** para compartilhar seu pedido, e o app organiza a vez de cada um com um cronômetro em forma de termômetro. **Não é um jogo:** não tem pontos, vencedores nem placar.

Referências: `UC11`, `RF38`–`RF40` e `RNF12` em [`requisitos-e-casos-de-uso-pg-play.md`](../requisitos/requisitos-e-casos-de-uso-pg-play.md). Issue: #35.

---

## 1. Visão Geral no Domínio PG PLAY

- **Formato:** 1 celular, conduzido pelo Líder. O celular pode ficar com o Líder ou passar de mão em mão.
- **Quando usar:** no fim do encontro, depois dos jogos.
- **No Hub:** aparece no catálogo com a tag **"1 Celular · Encerramento"**, para diferenciar dos jogos competitivos.
- **Por que um termômetro:** o tempo de fala de cada pessoa é mostrado como um termômetro que **vai enchendo** do frio ao quente. É uma forma visual e tranquila de mostrar o tempo, sem a pressão de um cronômetro de jogo.
- **Privacidade em primeiro lugar (RNF12):** o app **não grava áudio, não registra texto dos pedidos e não envia nada para a rede**. Ele só controla a vez e o tempo.

---

## 2. Configuração do Momento (RF38)

| Parâmetro | Padrão | Opções |
| :--- | :---: | :--- |
| Quem participa | Equipes cadastradas | Lista de nomes digitada na hora **ou** modo livre (sem nomes, apenas "Próxima pessoa") |
| Tempo de fala por pessoa | `1 min` | `1 min`, `2 min`, `3 min` |
| Ordem | Na ordem da lista | Na ordem da lista ou sorteada |
| Aviso de tempo esgotado | Suave | Suave (só visual) ou com som discreto |

---

## 3. Fluxo do Momento de Pedidos

### 🕯️ Fase 1 — Abertura
1. O Líder escolhe os participantes e o tempo de fala.
2. A tela de abertura mostra uma mensagem acolhedora (ex.: *"Momento de pedidos. Cada um tem até 1 minuto para compartilhar."*) e o botão **"Começar"**.

### 🗣️ Fase 2 — A Vez de Cada Pessoa (RF39)
1. A tela mostra **"Vez de [Nome]"** (ou *"Próxima pessoa"* no modo livre) e o **termômetro** começando vazio.
2. A pessoa toca em **"Começar a falar"** quando estiver pronta. Ninguém começa a ser cronometrado sem querer.
3. O termômetro enche conforme o tempo passa:
   - até `70%` do tempo: tons frios (`color.actionContainer`);
   - de `70%` a `100%`: tons quentes (`color.highlight`), com o texto *"Pode ir concluindo"*.
4. **Tempo esgotado:** o termômetro fica cheio com o ícone `heart` e o texto *"Tempo concluído"*. **A fala não é interrompida:** o app só sinaliza, e a pessoa termina o pensamento.
5. Ações sempre disponíveis:
   - **"Próximo"**: encerra a vez e chama a próxima pessoa;
   - **"Pular minha vez"**: ninguém é obrigado a falar;
   - **"Pausar"**: para quando o grupo quiser orar ou comentar no meio.

### 🙌 Fase 3 — Encerramento (RF40)
1. Quando todos tiverem passado, o app mostra **"Todos compartilharam"** com o resumo: quantas pessoas falaram e quantas preferiram não falar, **sem nomes**.
2. O Líder pode tocar em **"Momento de Oração"**, que mostra uma tela calma sem cronômetro para a oração final do grupo.
3. **"Encerrar Encontro"** volta ao Hub. Nada fica salvo.

---

## 4. Regras da Dinâmica

- **Não altera o placar** do encontro (**RF40**).
- **Não armazena conteúdo:** só existem na memória, durante o momento, a lista de nomes e a ordem; tudo é descartado ao encerrar (**RNF12**).
- **Sem pressão:** o fim do tempo é um aviso, nunca um corte. Não há som alto, vibração forte nem cor de erro.
- **Fora do escopo desta versão:** anotar os pedidos por escrito. Se um dia for feito, deve ser opcional, ficar só no aparelho e poder ser apagado (**RNF12**).

---

## 5. Requisitos de IHC, Componentes e Acessibilidade

| Elemento da Tela | Componente / Token do Design System | Regra de Acessibilidade (WCAG 2.1 / M3 Expressive) |
| --- | --- | --- |
| **Nome da vez** | `GameCard` com `font.title` | Legível à distância (**RNF04**). |
| **Termômetro de tempo** | Variante de tempo do `ExpressiveTimer` (barra vertical de preenchimento) | Também mostra o tempo restante em texto `MM:SS` e anuncia *"30 segundos restantes"* e *"Tempo concluído"* ao leitor de tela; a mudança de faixa usa cor + texto (**RNF06**). |
| **Começar / Próximo / Pular / Pausar** | `ExpressiveButton` | Alvos `>= 48 dp`, espaçamento `>= 8 dp` (**RNF07**); "Próximo" como botão principal. |
| **Configuração** | `ExpressiveChip` e `ExpressiveTextField` | Rótulos claros para leitor de tela (**RNF08**). |
| **Animações** | Preenchimento suave do termômetro | Com `Reduce Motion` ativo, o preenchimento muda em passos, sem animação contínua (**RNF09**). |

**Observação de design system:** o termômetro é uma variação visual de cronômetro. Antes de implementar, confirmar com o `design-system/` se entra como variante do `ExpressiveTimer` ou como componente novo, seguindo a regra de parar e perguntar quando faltar componente.

---

## 6. Critérios de Aceite (Dado/Quando/Então)

- **Dado** o momento configurado, **quando** a pessoa toca em "Começar a falar", **então** o termômetro começa a encher com o tempo escolhido.
- **Dado** que o tempo acabou, **então** o app mostra "Tempo concluído" **sem bloquear nem cortar** e espera o toque em "Próximo".
- **Dado** a vez de uma pessoa, **quando** ela toca em "Pular minha vez", **então** a vez passa sem registrar nada além da contagem anônima.
- **Dado** o fim da roda, **então** o resumo mostra apenas números, sem nomes.
- **Dado** qualquer momento da dinâmica, **então** o placar do encontro não muda e nenhum dado é enviado para a rede.
- **Dado** "Encerrar Encontro", **então** a lista de nomes é descartada e o app volta ao Hub.
