# 🎮 Catálogo de Jogos — PG PLAY

Esta pasta reúne as especificações completas de regras, fluxos de interação e integração com o sistema de design **PG Play Expressive (Material 3 Expressive)** para os jogos do **PG PLAY**.

---

## 1. Jogos em Sala Multiplayer (Cada jogador no próprio celular)

Modalidades em que os participantes entram na mesma sala via código curto ou QR Code para receber informações secretas ou digitar simultaneamente:

| Jogo | Jogadores | Especificação Detalhada | Destaques de Mecânica e IHC |
| :--- | :---: | :--- | :--- |
| 🌙 **Cidade Dorme** | 5 a 16 | [`cidade-dorme.md`](cidade-dorme.md) | Papéis de **Cidadão**, **Assassino**, **Anjo** e **Detetive**; **Narrador do próprio app por áudio** (voz masculina ou feminina clonada dos líderes) para que 100% da roda jogue; alternância automática entre Tema Escuro (Noite) e Tema Claro (Dia). |
| ✍️📖 **Adedonha Bíblica** | 2 a 16 | [`adedonha-biblica.md`](adedonha-biblica.md) | **Roleta Expressiva do Alfabeto** (física de mola M3 Expressive); colunas/categorias bíblicas criadas pelo **Moderador**; validação instantânea da letra inicial e apuração assistida com botão **"Levantar Dúvida ✋"**. |

---

## 2. Jogos em 1 Celular Compartilhado (Por Equipes / Offline)

Modalidades clássicas especificadas no documento de [Requisitos e Casos de Uso (`../requisitos/requisitos-e-casos-de-uso-pg-play.md`)](../requisitos/requisitos-e-casos-de-uso-pg-play.md) e nos padrões do [Sistema de Design (`../../design-system/05-padroes.md`)](../../design-system/05-padroes.md):

| Jogo | Formato | Caso de Uso / Referência | Componentes Principais |
| :--- | :---: | :--- | :--- |
| 🎭 **Mímica Expressiva** | Equipes (1 celular) | `UC03` em [`requisitos-e-casos-de-uso-pg-play.md`](../requisitos/requisitos-e-casos-de-uso-pg-play.md) | `ExpressiveTimer`, `GameCard`, `ExpressiveButton` |
| ⚡ **Quiz Relâmpago** | Equipes (1 celular) | `UC04` em [`requisitos-e-casos-de-uso-pg-play.md`](../requisitos/requisitos-e-casos-de-uso-pg-play.md) | `ExpressiveTimer`, `GameCard`, `QuizOption`, `ExpressiveButton` |
| 🔤 **Jogo da Forca** | Cooperativo / Equipes | `UC05` em [`requisitos-e-casos-de-uso-pg-play.md`](../requisitos/requisitos-e-casos-de-uso-pg-play.md) | `GameCard`, `LetterKey`, `ExpressiveButton` |
