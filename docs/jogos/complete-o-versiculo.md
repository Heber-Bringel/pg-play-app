# 📖 Complete o Versículo — Especificação de Jogo (PG PLAY)

O **Complete o Versículo** é um jogo de memória bíblica: o app mostra uma **passagem famosa com palavras faltando** e a equipe da vez precisa completar as lacunas dentro do tempo. Ao final, a referência (livro, capítulo e versículo) é revelada. Funciona no formato **1 Celular Compartilhado**, com equipes se alternando.

Referências: `UC10` e `RF35`–`RF37` em [`requisitos-e-casos-de-uso-pg-play.md`](../requisitos/requisitos-e-casos-de-uso-pg-play.md). Issue: #34.

---

## 1. Visão Geral no Domínio PG PLAY

- **Formato:** 1 celular compartilhado, por equipes (mínimo `2`, UC01).
- **Dinâmica:** a equipe da vez lê a passagem em voz alta, discute e digita a(s) palavra(s) que faltam. Exemplo:
  > *"Porque Deus amou o mundo de tal maneira que deu o seu Filho ______, para que todo aquele que nele crê não ______, mas tenha a vida eterna."*
  > Respostas: **unigênito**, **pereça** · Referência: **João 3:16**
- **Conteúdo:** banco local de passagens famosas em pacotes (**RF28**): *Salmos e Provérbios*, *Evangelhos*, *Cartas de Paulo*, *Antigo Testamento*.
- **Versão do texto:** cada passagem registra a tradução usada (ex.: *Almeida Revista e Corrigida*), exibida junto da referência. As respostas são validadas contra essa tradução.
- **Sem cadastro e offline** (**RNF02**, **RNF03**).

---

## 2. Parâmetros da Partida (RF29)

| Parâmetro | Padrão | Opções |
| :--- | :---: | :--- |
| Tempo por passagem | `45s` | `30s`, `45s`, `60s` |
| Passagens por equipe | `3` | `1` a `5` |
| Lacunas por passagem | `1` a `2` | definidas no banco, conforme o tamanho do versículo |
| Pontos por lacuna correta | `+10 pts` | fixo |
| Pontos com dica | `+5 pts` | fixo |
| Pacotes | Todos | seleção múltipla por `ExpressiveChip` |

---

## 3. Fluxo Completo da Partida

### 🚪 Fase 1 — Passagem de Turno (RF24)
O sistema exibe **"Vez da Equipe [Nome]"**, **"Passagem N de M"** e o botão **"Estou Pronto!"** (**RF09**).

### 📜 Fase 2 — Passagem com Lacunas (RF35)
1. O `GameCard` mostra o texto da passagem em tipografia de leitura confortável, com as lacunas destacadas por sublinhado e numeradas (`1`, `2`).
2. A **referência fica oculta** até o fim da passagem, para não entregar a resposta.
3. Um `ExpressiveTextField` (`56 dp`) por lacuna recebe a resposta da equipe.
4. O `ExpressiveTimer` corre e entra no Modo Crítico nos últimos `10s` (**RF10**).
5. **Dica (opcional):** o botão **"Ver Dica"** mostra a primeira letra e o número de letras de cada lacuna (ex.: `U _ _ _ _ _ _ _ _ _`). Usar a dica reduz o valor da lacuna para `+5 pts`.

### ✅ Fase 3 — Conferência e Revelação (RF36)
1. Ao tocar em **"Conferir"**, ou quando o tempo acaba, o app valida cada lacuna:
   - comparação **sem diferenciar maiúsculas e minúsculas e ignorando acentos** (*pereca* = *pereça*), igual à Forca;
   - lacuna correta: `color.success`, raio `16 dp`, ícone `check-circle`;
   - lacuna errada ou vazia: `color.error`, raio `8 dp`, ícone `close-circle`, com a **palavra correta revelada** ao lado.
2. O versículo completo aparece com a **referência e a tradução**.

### ➡️ Fase 4 — Próxima Equipe e Encerramento (RF37)
1. **"Próxima Passagem"** passa a vez à equipe seguinte.
2. Concluídas as passagens configuradas, ou se o banco acabar (**RF12**, **RF30**), o card de conclusão oferece **"Ir para o Placar Final"** e os pontos são enviados ao placar (**RF31**).

---

## 4. Regras de Pontuação e Banco de Passagens

- Cada passagem tem: texto, lacunas (posição e resposta), referência, tradução e pacote.
- As lacunas escolhem **palavras-chave** do versículo (substantivos e verbos marcantes), nunca artigos ou preposições.
- `+10 pts` por lacuna correta, `+5 pts` se a dica foi usada, `0 pts` se errada ou vazia.
- Passagens não se repetem na mesma partida (**RF30**).

---

## 5. Requisitos de IHC, Componentes e Acessibilidade

| Elemento da Tela | Componente / Token do Design System | Regra de Acessibilidade (WCAG 2.1 / M3 Expressive) |
| --- | --- | --- |
| **Passagem** | `GameCard` | Lacunas anunciadas pelo leitor de tela como *"lacuna 1"*, *"lacuna 2"*; suporta escala de fonte (**RNF09**). |
| **Resposta** | `ExpressiveTextField` (`56 dp`) | Rótulo *"Resposta da lacuna N"*; erro com borda, ícone e texto (**RNF06**). |
| **Contagem de tempo** | `ExpressiveTimer` | Crítico por cor + forma + ícone (**RNF06**). |
| **Conferir / Dica / Próxima** | `ExpressiveButton` | Alvos `>= 48 dp`, espaçamento `>= 8 dp` (**RNF07**). |
| **Referência revelada** | `GameCard` com destaque | Anunciada pelo leitor de tela ao aparecer. |
| **Sair** | `ExpressiveButton` delineado | Canto superior esquerdo, com confirmação e cronômetro pausado (**RF11**). |

---

## 6. Critérios de Aceite (Dado/Quando/Então)

- **Dado** uma passagem com lacunas, **quando** a equipe digita as palavras corretas e toca em "Conferir", **então** cada lacuna fica verde com check e a equipe soma `+10 pts` por lacuna.
- **Dado** uma resposta com acento ou maiúscula diferente, **então** ela é aceita como correta.
- **Dado** que a equipe usou "Ver Dica", **então** cada lacuna correta vale `+5 pts`.
- **Dado** que o tempo zerou, **então** as respostas são conferidas como estão e as corretas são reveladas.
- **Dado** o fim da passagem, **então** o versículo completo aparece com a referência e a tradução.
