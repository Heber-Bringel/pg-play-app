# 🔤 Jogo da Forca — Especificação de Jogo (PG PLAY)

O **Jogo da Forca** desafia o grupo a descobrir uma palavra secreta escolhendo letras de `A` a `Z`, antes que as tentativas da equipe acabem. No PG PLAY é **cooperativo por equipes**, em **1 Celular Compartilhado**, com as equipes alternando turnos de palavra e acumulando pontos no placar.

Referências: `UC05` e `RF09`, `RF11`, `RF12`, `RF15` em [`requisitos-e-casos-de-uso-pg-play.md`](../requisitos/requisitos-e-casos-de-uso-pg-play.md).

---

## 1. Visão Geral no Domínio PG PLAY

- **Formato:** 1 celular compartilhado; a **equipe da vez** discute e escolhe as letras de sua palavra.
- **Conteúdo:** banco local de palavras com **dica/tema** **misto** (bíblico e geral), organizado em pacotes de temas: *Bíblico* (ex.: tema *Personagem*, palavra `ESTER`; tema *Livro da Bíblia*, palavra `SALMOS`), *Animais*, *Países e Cidades*, *Frutas e Comidas*, *Filmes*, *Profissões* e *Esportes*. O grupo pode combinar vários pacotes.
- **Sem cadastro e offline** (**RNF02**, **RNF03**).

---

## 2. Parâmetros da Partida

| Parâmetro | Padrão | Opções |
| :--- | :---: | :--- |
| Tentativas (erros permitidos) | `6` | `5`, `6`, `8` |
| Pontos por palavra descoberta | `+30 pts` | fixo |
| Bônus por tentativas restantes | `+2 pts` por tentativa não usada | fixo |
| Palavras por equipe | `3` | `1` a `5` |
| Pacotes de temas | Todos (misto) | seleção múltipla por chips (Bíblico, Animais, Países e Cidades, Frutas e Comidas, Filmes, Profissões, Esportes) |

---

## 3. Fluxo Completo da Partida

### 🚪 Fase 1 — Vez da Equipe
O sistema exibe **"Vez da Equipe [Nome]"** e o progresso **"Palavra N de M"** (**RF09**).

### 🔠 Fase 2 — Arena da Forca
1. **Dica/Tema:** exibida em um `GameCard`.
2. **Lacunas:** a palavra oculta aparece como espaços em branco; letras acertadas são reveladas em todas as posições.
3. **Teclado da Forca:** grade de `A` a `Z` com componentes `LetterKey` (`48 dp × 48 dp`) (**RF15**):
   - 🟢 **Acerto (*Hit*):** a letra é revelada nas lacunas em verde circular (`9999 dp`) com ícone de check; a tecla fica desabilitada.
   - 🔴 **Erro (*Miss*):** a tecla é riscada em vermelho (raio `8 dp`, ícone `close`), desabilitada, e **desconta 1 tentativa**.
4. **Indicador de tentativas:** contador `❤️ N` / barra de progresso do boneco (com texto "Tentativas restantes: N") sempre visível.
5. **Saída segura:** botão **"Sair"** (delineado) no canto superior esquerdo, com confirmação (**RF11**).

### 🎯 Fase 3 — Resultado da Palavra
- **Vitória:** todas as letras reveladas → card de sucesso, `+30 pts` mais bônus por tentativas restantes.
- **Derrota:** tentativas esgotadas → card de falha revelando a palavra, `0 pts`.
- Em ambos os casos, o botão **"Próxima Palavra"** passa a vez à equipe seguinte.

### 🏁 Fase 4 — Encerramento
Ao cumprir o número de palavras por equipe ou esgotar o banco, o card de conclusão oferece **"Ir para o Placar Final"** (**RF12**), levando ao UC06.

---

## 4. Regras

- Acentos e cedilha são normalizados: digitar `A` revela `Á`, `Ã`, `Â`; `C` revela `Ç`. A palavra é exibida com a grafia correta ao final.
- Espaços e hífens em expressões compostas aparecem já revelados.
- Cada letra só pode ser escolhida uma vez por palavra.
- Palavras não se repetem na mesma partida.

---

## 5. Requisitos de IHC, Componentes e Acessibilidade

| Elemento da Tela | Componente / Token do Design System | Regra de Acessibilidade (WCAG 2.1 / M3 Expressive) |
| --- | --- | --- |
| **Dica e equipe** | `GameCard` | Anunciado por leitor de tela ao iniciar cada palavra. |
| **Lacunas da palavra** | Tipografia de alto impacto (`font.weight.black`) | `accessibilityLabel` dinâmico (ex.: *"E, lacuna, T, lacuna, R"*). |
| **Teclado A–Z** | `LetterKey` (`48 dp × 48 dp`, espaçamento `>= 8 dp`) | Hit/Miss por **cor + forma (`9999 dp` vs `8 dp`) + ícone** (**RNF06**); `accessibilityState={{ disabled }}`. |
| **Tentativas restantes** | Texto + ícone | Nunca comunicado só por cor; atualização via `accessibilityLiveRegion="polite"`. |
| **Próxima palavra / Sair** | `ExpressiveButton` | Alvos `>= 56 dp`; contraste `>= 4,5:1`. |

---

## 6. Critérios de Aceite (Dado/Quando/Então)

- **Dado** uma palavra oculta, **quando** a equipe toca numa letra presente, **então** todas as ocorrências são reveladas e a tecla fica desabilitada.
- **Dado** uma letra ausente, **quando** tocada, **então** a tecla é riscada e as tentativas diminuem em `1`.
- **Dado** que as tentativas chegaram a `0`, **então** a palavra é revelada e a equipe não pontua.
- **Dado** todas as letras reveladas, **então** a equipe ganha `+30 pts` mais o bônus de tentativas restantes.
