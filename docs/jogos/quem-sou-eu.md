# 🤔 Quem Sou Eu? — Especificação de Jogo (PG PLAY)

O **Quem Sou Eu?** é um jogo de adivinhação em que um participante segura o celular na testa, **sem ver a tela**, enquanto a própria equipe dá dicas sobre a carta que aparece nela. Funciona no formato **1 Celular Compartilhado**, com equipes se alternando.

> [!IMPORTANT]
> **O Quem Sou Eu? não é um jogo bíblico.** O conteúdo é **genérico, organizado por temas** (famosos, animais, filmes, profissões etc.), para funcionar com qualquer grupo e variar das outras dinâmicas do PG, que já têm conteúdo bíblico (Complete o Versículo, Adedonha Bíblica e os pacotes bíblicos do Quiz).

Referências: `UC09` e `RF32`–`RF34` em [`requisitos-e-casos-de-uso-pg-play.md`](../requisitos/requisitos-e-casos-de-uso-pg-play.md). Issue: #33.

---

## 1. Visão Geral no Domínio PG PLAY

- **Formato:** 1 celular compartilhado, por equipes (mínimo `2`, UC01).
- **Dinâmica:** um representante da equipe da vez segura o celular na testa, com a tela virada para o grupo. A equipe dá dicas **sem dizer o nome** e o representante tenta adivinhar quantas cartas conseguir antes de o tempo acabar.
- **Gesto principal:** inclinar o celular **para baixo** (olhando para o chão) marca **acerto**; inclinar **para cima** (olhando para o teto) marca **passe**. Os botões na tela fazem o mesmo, para quem não puder ou não quiser usar o gesto.
- **Conteúdo:** banco local de cartas **genéricas por tema**, em pacotes (**RF28**): *Famosos*, *Animais*, *Filmes e Séries*, *Desenhos e Animações*, *Profissões*, *Comidas*, *Objetos do Dia a Dia* e *Lugares do Mundo* (ex.: *Leão*, *Bombeiro*, *Pizza*, *Torre Eiffel*). O grupo combina os temas que quiser.
- **Sem cadastro e offline** (**RNF02**, **RNF03**).

---

## 2. Parâmetros da Partida (RF29)

| Parâmetro | Padrão | Opções |
| :--- | :---: | :--- |
| Tempo por turno | `60s` | `45s`, `60s`, `90s` |
| Rodadas por equipe | `2` | `1` a `5` |
| Pontos por acerto | `+10 pts` | fixo |
| Passe | `0 pts` | fixo, sem penalidade |
| Gesto de inclinação | Ativado | Ativado ou Desativado (só botões) |
| Pacotes | Todos | seleção múltipla por `ExpressiveChip` |

---

## 3. Fluxo Completo da Partida

### 🚪 Fase 1 — Passagem de Turno (RF24)
1. O sistema exibe **"Vez da Equipe [Nome]"** e orienta: *"Representante, segure o celular na testa com a tela virada para a equipe"*.
2. O representante toca em **"Estou Pronto!"** e o app mostra uma contagem de `3` segundos para dar tempo de posicionar o celular.

### 🃏 Fase 2 — Cartas em Jogo (RF32, RF33)
1. A carta aparece em **tipografia Display de alto impacto**, centralizada, para ser lida à distância pela equipe (**RNF04**).
2. O `ExpressiveTimer` fica visível e entra no Modo Crítico nos últimos `10s` (**RF10**).
3. A cada gesto ou toque:
   - ✅ **Acerto:** a tela pisca em `color.success` com ícone `check-circle` e texto *"Acertou!"*; soma `+10 pts` e sorteia a próxima carta.
   - ⏭️ **Passe:** a tela pisca em `color.surfaceVariant` com ícone `skip-next` e texto *"Passou"*; sorteia a próxima carta sem pontuar.
4. Depois de cada gesto, o app ignora novos gestos por `1 s`, para que o movimento de voltar o celular à testa não conte duas vezes.

### ⏱️ Fase 3 — Fim do Turno (RF34)
1. Ao zerar o cronômetro, a carta atual é descartada sem pontuar.
2. O app mostra o **resumo do turno**: lista das cartas acertadas e passadas e os pontos ganhos.
3. **"Próxima Equipe"** passa a vez (volta à Fase 1).

### 🏁 Fase 4 — Encerramento
Concluídas as rodadas configuradas, ou se o banco acabar (**RF12**, **RF30**), o card de conclusão oferece **"Ir para o Placar Final"** e os pontos são enviados ao placar (**RF31**).

---

## 4. Regras de Pontuação e Banco de Cartas

- Cada carta tem: nome, pacote e uma **dica opcional** que só a equipe vê no resumo (útil para ensinar quem não conhecia o personagem).
- Cartas não se repetem na mesma partida (**RF30**).
- Passar não desconta pontos: o objetivo é manter o ritmo, não punir.
- O resumo do turno é a única tela em que o representante vê as cartas que passaram por ele.

---

## 5. Requisitos de IHC, Componentes e Acessibilidade

| Elemento da Tela | Componente / Token do Design System | Regra de Acessibilidade (WCAG 2.1 / M3 Expressive) |
| --- | --- | --- |
| **Carta** | `GameCard` com `font.display` | Legível à distância (**RNF04**); suporta escala de fonte (**RNF09**). |
| **Contagem de tempo** | `ExpressiveTimer` | Crítico por cor + forma + ícone (**RNF06**). |
| **Acerto / Passe** | `ExpressiveButton` Jumbo (`64 dp`) | Botões sempre disponíveis como alternativa ao gesto; espaçamento `>= 8 dp` (**RNF07**). |
| **Feedback do gesto** | Tokens `color.success` / `color.surfaceVariant` + ícone + texto | Nunca só por cor (**RNF06**); com `Reduce Motion` ativo, sem piscar a tela inteira, apenas ícone e texto. |
| **Sair** | `ExpressiveButton` delineado | Canto superior esquerdo, com confirmação e cronômetro pausado (**RF11**). |

**Implementação do gesto:** leitura do acelerômetro com `expo-sensors`, atrás de um contrato `ITiltSensorService` em `src/model/services/` e com versão `Memory` para testes, seguindo o harness MVVM.

---

## 6. Critérios de Aceite (Dado/Quando/Então)

- **Dado** que a carta está na tela, **quando** o representante inclina o celular para baixo, **então** o app registra acerto, soma `+10 pts` e mostra a próxima carta.
- **Dado** que a carta está na tela, **quando** o representante inclina para cima ou toca em "Passar", **então** a próxima carta aparece sem alterar a pontuação.
- **Dado** que o gesto está desativado, **quando** o celular é inclinado, **então** nada acontece e só os botões funcionam.
- **Dado** que o tempo zerou, **então** o app mostra o resumo do turno com as cartas acertadas e passadas.
- **Dado** que as rodadas terminaram, **então** os pontos são enviados ao placar e aparece "Ir para o Placar Final".
