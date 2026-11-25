# Changelog

Versões no formato `MAIOR.MENOR.CORREÇÃO` (Semantic Versioning). Mudanças que quebram compatibilidade de tokens ou componentes incrementam a versão `MAIOR`.

---

## 1.3.0 · 25/11/2026

- Evolução do componente `DrawingCanvas` e dos tokens `canvas.*` para a refatoração multiplayer do **Desenho Relâmpago** (`UC12`, Issue `#83`):
  - **Canvas expandido (`02-tokens.md`):** atualização de `canvas.minHeight` para `320 dp` (`space.3xl * 5`) e criação do token `canvas.expandedMinHeight` (`384 dp` = `space.3xl * 6`) para ocupar a área liberada quando o tema temporário de `5s` desaparece.
  - **Formas geométricas e preenchimento (`04-componentes/tela-de-desenho.md`):** adição das ferramentas `Pincel Livre`, `Linha`, `Retângulo`, `Círculo` e `Triângulo` com alternador `Contorno` / `Preenchido` e pré-visualização em tempo real durante o gesto.
  - **Modo somente leitura (`readOnly`):** suporte à visualização em tempo real pelos adivinhadores da sala multiplayer sem exibir barra de ferramentas nem opacidade de bloqueio.

---

## 1.2.0 · 25/11/2026

- Adição do componente `DrawingCanvas` e dos tokens de desenho para o minigame **Desenho Relâmpago** (`UC12`, Issue `#83`).
- **Mudanças incluídas nesta versão:**
  - **Superfície de papel e 4 canetas acessíveis (`02-tokens.md`):** criação dos tokens semânticos `color.canvas-paper` (`neutral-50` `#FDF8FF`, fixo nos dois temas) e `color.canvas-ink` (`#1D1B20`, **16,42:1**), `color.canvas-purple` (`#5B21B6`, **8,84:1**), `color.canvas-coral` (`#C2410C`, **4,90:1**) e `color.canvas-green` (`#15803D`, **4,88:1**), reaproveitando 100% os primitivos existentes.
  - **Tokens de componente `canvas.*`:** definição de `canvas.paperBg`, `canvas.border`, `canvas.radius`, `canvas.minHeight`, `canvas.pen.*`, `canvas.stroke.{thin,thick}` (`4 dp` / `8 dp`) e `canvas.tool.*` (`48 dp`, *shape morphing* `radius.full` → `radius.md`).
  - **Novo componente `DrawingCanvas` ([04-componentes/tela-de-desenho.md](04-componentes/tela-de-desenho.md)):** especificação da área `Svg` + `PanResponder` e barra de ferramentas acessível com confirmação múltipla (cor + forma + ícone `check` + borda ativa).

---

## 1.1.0 · 21/11/2026

- Revisão abrangente de acessibilidade, foco, contraste de componentes, consistência de tags/bordas, tema escuro automático e tipografia (Issue `#55`, relacionadas `#50`, `#51`, `#53`, `#54`).
- **Mudanças incluídas nesta versão:**
  - **Foco exclusivo para teclado/switch (`:focus-visible`):** introdução do hook `useKeyboardFocus` em todos os controles interativos, eliminando a exibição de borda de foco em cliques do mouse e toques na tela.
  - **Anel duplo M3 de foco:** substituição de `color.focus` coral (`#C2410C`, confundido com erro) por anel duplo `onSurface` (`#1D1B20` claro / `#E6E0E9` escuro) + `color.focus-offset` (`surface`), atingindo **16,30:1** (claro) e **14,35:1** (escuro) sobre qualquer botão.
  - **Contraste WCAG 1.4.11 (≥ 3,0:1) em componentes:**
    - `color.outline` ajustado para `neutral-500` (`#79747E`, **4,35:1** sobre `surface`) no claro e `neutral-400` (`#938F99`, **5,87:1**) no escuro.
    - Criação de `color.highlight-border` (`gold-700` `#A16207`, **4,70:1** no claro; `gold-400` `#FACC15`, **12,14:1** no escuro) e `card.borderLeader` para o card líder.
    - `color.disabled-text` no escuro ajustado para `neutral-400` (`#938F99`, **4,53:1** sobre `disabled-bg`).
    - Novo token `timer.bg.calm` (`color.action`, **7,81:1** claro / **8,12:1** escuro sobre `surface-variant`) para a variante termômetro (#50).
    - Adicionada tabela completa de **Contraste de Componentes Não Textuais (WCAG 1.4.11)** em [06-acessibilidade.md](06-acessibilidade.md).
  - **Novo componente `ExpressiveTag` (`tag.md`):** 6 tons (`neutral`, `action`, `secondary`, `success`, `error`, `highlight`), tipografia legível `font.tag` (`14 dp`, peso `700`, `RNF04`) e borda `>= 4,55:1`, substituindo mais de 20 estilos locais de badges e a tag interna do `GameCard`.
  - **Tokens de borda por estado:** adicionados `component.chip`, `component.option`, `component.tag`, `component.banner` e `component.card.borderLeader/borderPressed/borderFocus`, eliminando `borderColor` semânticos diretos nas telas.
  - **Novas variantes e documentação de componentes:** adicionadas variantes `text` e `icon` ao `ExpressiveButton` (`botao.md`, #51), suporte a 1 botão no `ConfirmModal` (`modal-confirmacao.md`, #54), e documentação oficial de `ExpressiveChip` (`chip.md`), `ExpressiveTag` (`tag.md`) e `SelectableOptionItem` (`item-selecionavel.md`).
  - **Tema escuro real e limpeza de `theme.ts`:** remoção de todos os 17 aliases duplicados (`xxl`/`xxxl`, `jumboHeight`, `timer.*Normal/Critical`, `quiz.optionBg*`, `key.hitBg/missBg`), inclusão de `ThemeProvider` + `useTheme()` conectados ao `useColorScheme()` (com override local na fase Noite do Cidade Dorme) e mapeamento explícito dos pesos de **Plus Jakarta Sans** em todas as escalas tipográficas.

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
