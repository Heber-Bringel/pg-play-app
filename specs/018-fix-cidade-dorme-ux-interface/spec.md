# 📋 Especificação de Funcionalidade (`spec.md`): Ajustes de Interface e Experiência (IHC) no Cidade Dorme

- **Branch da Feature:** `fix/018-cidade-dorme-ux-interface`
- **Criado em:** 2026-11-19
- **Status:** Em Revisão
- **Caso(s) de Uso / Requisito(s):** `UC07` (`RF09`, `RF10`, `RF18`, `RF19`, `RF20`, `RNF05`, `RNF06`, `RNF07`, `RNF08`, `RNF10`) — Ref.: `design-system/02-tokens.md`, `design-system/06-acessibilidade.md`, `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md`, `src/view/cidade-dorme.tsx`, `src/view/components/cidadeDorme*.tsx` e `src/viewmodel/useCidadeDormeViewModel.ts`
- **Issue vinculada:** `#43` (`v1.0.0 — Jogos em Sala Multiplayer (UC07–UC08)`)

---

## 1. Descrição dos Problemas & Cenários de Usuário *(Obrigatório)*

### Achados da Simulação com 5 Jogadores em Viewport 390 px
1. **Cabeçalho confuso pré-jogo (`src/view/cidade-dorme.tsx`):** exibe `"PIN XXXX · O Dia 1"` no Lobby e na Revelação de Papéis, antes de a 1ª noite começar.
2. **Repetição de letras `A–D` nas opções de jogadores (`cidadeDormeNightSection.tsx` e `cidadeDormeDaySection.tsx`):** por reutilizar `QuizOption` (limitado a `A, B, C, D`), listas com 5+ jogadores repetem `A, B, C, D, A, B…` e *"Abster-se / Pular Voto"* recebe a letra fixa `D`.
3. **Cronômetros dessincronizados entre celulares (`useCidadeDormeViewModel.ts`):** no mesmo instante cada aparelho exibe um tempo diferente (`00:09`, `00:08`, `00:07`), pois cada cliente conta a partir do instante em que recebeu o evento localmente.
4. **Aba `"Parâmetros"` obscura para convidados (`cidadeDormeLobbySection.tsx`):** os chips aparecem desabilitados em cinza sem explicação de que apenas o moderador pode alterá-los.
5. **Criação de sala demorada sem retorno visual (`cidadeDormeEntrySection.tsx` e `useCidadeDormeViewModel.ts`):** quando o servidor demora (`~13 s`), aparece apenas o texto estático `"Conectando..."` sem indicador de progresso nem timeout/erro recuperável após `10 s`.
6. **Veredito do Detetive convivendo com a lista de suspeitos ativa (`cidadeDormeNightSection.tsx`):** após investigar, o card de veredito aparece acima da lista ainda selecionável.
7. **Ícone noturno em fases do Dia (`cidadeDormeDaySection.tsx`):** o card `"Fase 3 · Votação Secreta da Cidade"` (e o Boletim do Amanhecer em `day_debate`) usa `icon="weather-night"` em vez de ícone diurno/votação.

### Pontos Positivos a Preservar Obrigatoriamente
- Tela escura (`darkTokens`) com *"A Cidade Dorme... Mantenha os olhos fechados"* para quem não age;
- Banner de eliminado em Modo Espectador (*"Você foi eliminado — Acompanhe em silêncio"*);
- Revelação final completa de papéis em `finished`;
- `ConfirmModal` ao sair da partida;
- Layout responsivo sem vazamento horizontal em largura `390 px`.

---

### História de Usuário 1 — Cabeçalho Contextual, Ícones Diurnos e Aviso Claro para Convidados (Prioridade: P1)

Como **Jogador da Sala no Lobby, Revelação ou Dia**, quero visualizar no cabeçalho o nome correto da etapa atual, ver ícones condizentes com o Dia/Votação e entender claramente na aba `"Parâmetros"` por que as opções estão travadas para convidados.

**Por que esta prioridade:** Elimina ruído cognitivo imediato logo nos primeiros segundos de uso em grupo (`RNF08`, `design-system/01-principios.md`).

**Como testar independentemente:** Navegar pelas fases `lobby`, `role_reveal`, `day_debate`, `day_voting`, `vote_result` e `finished` verificando rótulo do cabeçalho, ícones dos `GameCard`s e banner explicativo na aba Parâmetros como convidado.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** a sala nas fases iniciais ou finais, **Quando** `src/view/cidade-dorme.tsx` renderiza a barra superior, **Então** exibe `"PIN XXXX · Lobby"` em `lobby`, `"PIN XXXX · Revelação"` em `role_reveal`, `"PIN XXXX · A Noite N"` em `night_*`, `"PIN XXXX · O Dia N"` em `day_debate`/`day_voting`/`vote_result` e `"PIN XXXX · Fim de Jogo"` em `finished`, com ícone e `accessibilityLabel` coerentes.
2. **Dado** um convidado (`isCurrentPlayerHost === false`) abrindo a aba `"Parâmetros"` em `cidadeDormeLobbySection.tsx`, **Quando** a aba renderiza, **Então** exibe um aviso claro no topo (`"Somente o moderador altera os parâmetros da sala."` com ícone `information-outline`) junto ao resumo legível das configurações atuais.
3. **Dado** a sala nas fases `day_debate` e `day_voting`, **Quando** `cidadeDormeDaySection.tsx` renderiza os cabeçalhos, **Então** o Boletim do Amanhecer usa `icon="weather-sunny"` e o card `"Fase 3 · Votação Secreta da Cidade"` usa `icon="vote-outline"` (nunca `weather-night`).

---

### História de Usuário 2 — Opções de Jogadores Sem Repetição A–D e Veredito Substituindo Lista do Detetive (Prioridade: P1)

Como **Jogador escolhendo alvo à noite ou votando de dia**, quero que cada participante apareça com numeração sequencial clara (`1..N`) ou sem prefixo de quiz repetido, que *"Abster-se / Pular Voto"* tenha ícone próprio, e que o veredito do Detetive substitua a lista de suspeitos.

**Por que esta prioridade:** Evita confusão ao ler opções em voz baixa/tela escura e corrige o fluxo visual do Detetive (em sinergia com `#42`) (`RNF06`, `RNF07`).

**Como testar independentemente:** Renderizar listas com 6+ jogadores na Noite e na Votação, verificar `SelectableOptionItem` com índice numérico/`hand-back-left-outline` e renderizar turno do Detetive antes/depois do veredito.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** uma lista de `5` a `16` jogadores vivos na Noite ou Votação, **Quando** `SelectableOptionItem` renderiza as opções, **Então** exibe numeração sequencial única (`1`, `2`, `3`, ..., `16`) sem repetir letras `A–D`, respeitando alvo `>= 56 dp`, *shape morphing* e alternância `tokens` (Dia) / `darkTokens` (Noite) sem alterar o `QuizOption` usado no `UC04` (`RNF06`, `RNF07`).
2. **Dado** a opção *"Abster-se / Pular Voto"* na Votação Secreta, **Quando** é renderizada, **Então** exibe o ícone semântico próprio (`hand-back-left-outline`) em vez da letra `"D"`.
3. **Dado** que o Detetive recebeu `room.detectiveVerdict` na rodada atual, **Quando** `cidadeDormeNightSection.tsx` renderiza `night_detective`, **Então** exibe apenas o card de veredito e oculta completamente a lista de suspeitos e o botão de investigar (coordenado com `#42`).

---

### História de Usuário 3 — Feedback de Progresso com Timeout de 10s e Cronômetro Sincronizado (Prioridade: P1)

Como **Moderador criando sala ou Jogador em fase cronometrada**, quero ver um indicador de progresso animado ao conectar e receber erro recuperável se exceder `10 segundos`, além de visualizar exatamente o mesmo tempo restante nos cronômetros de todos os celulares.

**Por que esta prioridade:** Impede sensação de travamento em conexões lentas e elimina discrepâncias visuais nos segundos finais da rodada (`RF10`, `RNF08`).

**Como testar independentemente:** Simular promessa pendente por `10 s` em `handleCreateRoom` / `handleJoinRoom` (com `jest.useFakeTimers()`) e verificar exibição de `ActivityIndicator`, timeout após `10 s` e liberação dos botões; testar cálculo de `secondsRemaining` via `room.phaseEndsAt`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o usuário tocou em *"Criar Sala (Moderador)"* ou *"Entrar na Sala"*, **Quando** `loading === true`, **Então** `cidadeDormeEntrySection.tsx` exibe `ActivityIndicator` (usando `tokens.semantic.color.action`) e texto de progresso claro; se a requisição demorar mais de `10 s`, o timeout encerra a espera, reabilita o formulário e exibe mensagem amigável permitindo tentar novamente.
2. **Dado** `room.phaseEndsAt` vindo do servidor (`#41`), **Quando** múltiplos aparelhos exibem o `ExpressiveTimer` no mesmo instante, **Então** todos calculam `secondsRemaining` pela diferença entre `room.phaseEndsAt` e o relógio atual, evitando desvios entre dispositivos (`RF10`).

---

### Casos de Borda (Edge Cases)

- **Limpeza do timeout ao desmontar ou concluir rápido:** se a criação/entrada responder em `2 s` ou o usuário sair da tela antes de `10 s`, o timer de timeout deve ser cancelado (`clearTimeout`) para evitar estado órfão após unmount.
- **Compatibilidade com `QuizOption` no `UC04`:** o componente `QuizOption` (`src/view/components/quizOption.tsx`) não deve ter seu contrato `letter: 'A' | 'B' | 'C' | 'D'` quebrado; por isso a nova opção genérica de seleção deve viver em `src/view/components/selectableOptionItem.tsx`.
- **Modo Escuro (`darkTokens`) e Claro (`tokens`) em `SelectableOptionItem`:** o componente deve aceitar propriedade de tema (`themeMode?: 'light' | 'dark'`) usando `createTokens` / `tokens` / `darkTokens` sem nenhuma cor literal fora de `src/view/theme.ts` (`RNF10`).
- **Acessibilidade de leitores de tela:** botões com numeração ou ícone devem anunciar claramente o nome do jogador / ação (`"Selecionar jogador 5: Pedro"`, `"Abster-se / Pular Voto"`) e estado selecionado (`accessibilityState={{ selected }}`).

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-43-01` (`RF09`)**: Ajustar o badge do cabeçalho em `src/view/cidade-dorme.tsx` para refletir `"Lobby"`, `"Revelação"`, `"A Noite N"`, `"O Dia N"` e `"Fim de Jogo"`.
- **`RF-43-02` (`RNF06` / `RNF07` / `RNF10`)**: Criar `SelectableOptionItem` (`>= 56 dp`, `tokens`/`darkTokens`, numeração `1..16` ou ícone próprio) para listas da Noite e Votação, reservando ícone `hand-back-left-outline` para *"Abster-se / Pular Voto"*.
- **`RF-43-03` (`RF10`)**: Sincronizar cronômetro de `useCidadeDormeViewModel` a partir de `room.phaseEndsAt` (integrado à `#41`).
- **`RF-43-04` (`RNF08`)**: Exibir aviso explícito e resumo de configuração para convidados na aba `"Parâmetros"` de `cidadeDormeLobbySection.tsx`.
- **`RF-43-05`**: Exibir `ActivityIndicator` de carregamento e aplicar timeout de `10 s` com mensagem de erro amigável em `handleCreateRoom` / `handleJoinRoom`.
- **`RF-43-06`**: Substituir a lista de suspeitos pelo card de veredito do Detetive em `cidadeDormeNightSection.tsx` (integrado à `#42`).
- **`RF-43-07`**: Corrigir ícones de `day_debate` (`weather-sunny`) e `day_voting` (`vote-outline`) em `cidadeDormeDaySection.tsx`.

### Entidades e Componentes Envolvidos
- **`SelectableOptionItem`** (`src/view/components/selectableOptionItem.tsx`): novo componente visual puro (sem ViewModel/Router, `export const SelectableOptionItem`).
- **`CidadeDormeRoom.phaseEndsAt`**: consumido por `useCidadeDormeViewModel` (definido na Issue `#41`).

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (Design System & Zero Literais)**: 100% dos estilos e do `ActivityIndicator` usam tokens de `@/view/theme`; zero cores `#hex` ou `rgb()` fora de `src/view/theme.ts`.
- **`CS-02` (Acessibilidade & Ergonomia 390 px)**: Alvos `>= 56 dp` nas opções, contraste WCAG AA em Claro e Escuro, nenhum vazamento horizontal em `390 px` e manutenção de todos os pontos positivos existentes.
- **`CS-03` (Arquitetura MVVM)**: `npm run check` (`check-arquitetura.mjs` + `tsc --noEmit` + `jest`) executa com **0 violações** e todos os testes atualizados passando.
