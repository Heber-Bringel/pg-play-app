# Changelog

Versões no formato `MAIOR.MENOR.CORREÇÃO` (Semantic Versioning). Mudanças que quebram compatibilidade de tokens ou componentes incrementam a versão `MAIOR`.

---

## 1.0.0 · 20/10/2026

- Primeira versão estável do sistema de design **PG Play Expressive**, marcada com a tag `ds-v1.0.0` e preparada para apresentação na aula de 21/10/2026.
- **Responsáveis:** Heber Bringel e equipe do projeto final de IHC e PDM ([Heber-Bringel/pg-play-app](https://github.com/Heber-Bringel/pg-play-app.git)).
- **Mudanças incluídas nesta versão:**
  - Definição do **Google Material 3 Expressive (2025)** como sistema base e justificativa pelas cinco forças (usuários, acessibilidade, marca, plataforma e tecnologia) em [README.md](README.md).
  - Mapeamento do inventário de 6 telas do app **PG PLAY** (Hub de Jogos, Configuração de Equipes, Arena de Mímica, Arena de Quiz, Jogo da Forca e Placar do PG).
  - Estabelecimento dos 4 princípios orientadores em [01-principios.md](01-principios.md).
  - Criação da arquitetura de tokens em 3 níveis (Primitivo, Semântico Claro/Escuro e Componente) + exportação W3C Design Tokens JSON em [02-tokens.md](02-tokens.md).
  - Especificação das regras imperativas de Cor, Tipografia, Grade de 8 pontos, Ícones, Elevação e Movimento (física de mola) em [03-fundamentos.md](03-fundamentos.md).
  - Documentação completa e implementação em React Native (Expo) dos 6 componentes em [04-componentes/](04-componentes/):
    1. [botao.md](04-componentes/botao.md) (`ExpressiveButton` — *Adaptado*)
    2. [campo-de-texto.md](04-componentes/campo-de-texto.md) (`ExpressiveTextField` — *Adaptado*)
    3. [card-de-jogo.md](04-componentes/card-de-jogo.md) (`GameCard` — *Adaptado*)
    4. [cronometro-expressivo.md](04-componentes/cronometro-expressivo.md) (`ExpressiveTimer` — *Novo*)
    5. [alternativa-quiz.md](04-componentes/alternativa-quiz.md) (`QuizOption` — *Adaptado*)
    6. [teclado-forca.md](04-componentes/teclado-forca.md) (`LetterKey` — *Novo*)
  - Especificação de 3 fluxos completos de interação em [05-padroes.md](05-padroes.md).
  - Auditoria matemática de contraste WCAG 2.1 (todos os pares aprovados entre `5,02:1` e `17,10:1`) em [06-acessibilidade.md](06-acessibilidade.md).
- **Ajustes feitos após o teste com IA ([07-teste-com-ia.md](07-teste-com-ia.md)):**
  - Inclusão dos tokens semânticos de espessura de borda (`border.thin` = `2 dp`, `border.focus` = `3 dp`), tamanho de ícone (`icon.sm` = `16 dp`, `icon.md` = `24 dp`, `icon.lg` = `28 dp`) e multiplicador máximo de escala tipográfica (`typography.maxScale` = `1.5`) em [02-tokens.md](02-tokens.md) para eliminar qualquer necessidade de valores numéricos literais nos componentes React Native.
