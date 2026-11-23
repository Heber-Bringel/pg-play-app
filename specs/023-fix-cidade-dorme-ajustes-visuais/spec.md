# 📋 Especificação de Funcionalidade (`spec.md`): Ajustes Visuais da Noite, Votação, Revelação e Linha do Tempo no Cidade Dorme

- **Branch da Feature:** `fix/023-cidade-dorme-ajustes-visuais`
- **Criado em:** 2026-11-22
- **Status:** Em Revisão
- **Caso(s) de Uso / Requisito(s):** `UC07` (`RF18`, `RF19`, `RF20`, `RNF06`, `RNF08`, `RNF10`) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md`, `docs/jogos/cidade-dorme.md`, `design-system/04-componentes/cidade-dorme-visual.md`
- **Issue vinculada:** `#67` (`v1.0.0 — Jogos em Sala Multiplayer (UC07–UC08)`)

---

## 1. Descrição dos Problemas & Cenários de Usuário *(Obrigatório)*

### Contexto Atual (Simulação do PR `#62`)
Durante simulações completas de partida do **Cidade Dorme** com 5 jogadores (`branch` do PR `#62`), foram levantados 5 ajustes visuais de leitura e coerência semântica (`IHC`, `RNF06`, `RNF08` e `RNF10`):

| # | Onde | O que acontece hoje | Comportamento esperado |
| :-: | :--- | :--- | :--- |
| **1** | Noite, cartão `"A Noite · Turno do…"` | O `GameCard` em `cidadeDormeNightSection.tsx` renderiza com fundo claro (`tokens`) sobre a superfície escura da noite (`darkTokens`), causando brilho excessivo e quebra de contraste visual | Usar `themeMode="dark"` no `GameCard` (`darkTokens.component.card.*`), mantendo o tema escuro coerente com os demais cartões noturnos |
| **2** | Resultado da votação (`vote_result`) | O `GameCard` `"Resultado da Votação"` em `cidadeDormeDaySection.tsx` usa `icon="weather-night"` | Usar ícone diurno/de votação coerente (`icon="vote-outline"`) |
| **3** | Linha do tempo (`CidadeDormePhaseTimeline`) | Em `day_debate`, `buildPhaseTimeline` marca `"Amanhecer"` direto como `isCompleted: true` e ativa `"Debate"`; o passo `"Amanhecer"` nunca fica ativo | Destacar `"Amanhecer"` como etapa ativa na abertura do dia enquanto o boletim do amanhecer é apresentado, avançando em seguida para `"Debate"` |
| **4** | Revelação de papéis (`role_reveal`) | `"Prontos 0/5"` aparece duas vezes: na barra do `CidadeDormeCityPanel` e na `playersTag` do `GameCard` de `cidadeDormeRoleSection.tsx` | Manter `"Prontos X/Y"` apenas no `CidadeDormeCityPanel` (com a barra de progresso) e usar rótulo contextual `"Sigilo Individual"` na tag do `GameCard` |
| **5** | Painel da cidade (`CidadeDormeCityPanel`) | Jogadores com mesma letra inicial (ex.: `"Diego"` e `"Douglas"`) exibem o mesmo avatar `"D"` | Exibir iniciais de 2 letras (`"DI"` e `"DO"`, ou iniciais de nome composto como `"AM"` para `"Ana Maria"`) |

---

### História de Usuário 1 — Coerência Visual de Tema Escuro à Noite e Ícone Diurno na Votação (Prioridade: P1)

Como **Jogador durante a Noite ou a Apuração de Votos**, quero que o cartão de cabeçalho do turno noturno siga o tema escuro sem ofuscar o ambiente e que o resultado da votação exiba um ícone de urna coerente com o Dia.

**Por que esta prioridade:** Reduz desconforto visual em ambientes com pouca luz (`RNF10`) e elimina contradição iconográfica entre Dia e Noite (`RNF06`, `RNF08`).

**Como testar independentemente:** Renderizar `CidadeDormeScreen` / `CidadeDormeNightSection` em `night_assassin` e `CidadeDormeDaySection` em `vote_result`, verificando as props de `themeMode="dark"` e `icon="vote-outline"`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** a fase noturna (`night_assassin`, `night_angel` ou `night_detective`), **Quando** `CidadeDormeNightSection` renderiza o `GameCard` `"A Noite · Turno do…"`, **Então** o cartão recebe `themeMode="dark"` e utiliza `darkTokens.component.card.*` (fundo e texto escuros, sem brilho branco no escuro).
2. **Dado** a fase `vote_result`, **Quando** `CidadeDormeDaySection` renderiza o `GameCard` `"Resultado da Votação"`, **Então** o ícone exibido é `"vote-outline"` (nunca `"weather-night"`).

---

### História de Usuário 2 — Linha do Tempo com `"Amanhecer"` Ativo e Fim da Duplicidade em `"Prontos"` (Prioridade: P1)

Como **Jogador acompanhando a transição da Noite para o Dia ou confirmando meu papel**, quero ver o passo `"Amanhecer"` destacado na linha do tempo quando o boletim da manhã surge e ver o contador `"Prontos X/Y"` exibido uma única vez no Painel da Cidade.

**Por que esta prioridade:** Dá feedback claro de transição do ciclo `Noite → Amanhecer → Debate → Votação` e remove redundância textual que polui a tela de revelação (`RNF08`).

**Como testar independentemente:** Renderizar `useCidadeDormeViewModel` na transição para `day_debate` (verificando o passo `dawn` com `isActive: true` na abertura do dia e transição para `debate` em seguida) e renderizar `CidadeDormeScreen` em `role_reveal` contando ocorrências de `"Prontos"`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** a entrada na fase `day_debate` com abertura do Boletim do Amanhecer, **Quando** a linha do tempo `CidadeDormePhaseTimeline` renderiza inicialmente, **Então** o passo `"Amanhecer"` (`id: 'dawn'`) aparece com `isActive: true` (e `"Noite"` com `isCompleted: true`); após a janela inicial de apresentação do boletim (`4 s`, ou imediatamente em modo determinístico após esse intervalo), `"Amanhecer"` passa a `isCompleted: true` e `"Debate"` (`id: 'debate'`) torna-se `isActive: true`.
2. **Dado** a fase `role_reveal` com `CidadeDormeCityPanel` visível exibindo `"Prontos X/Y"` na barra de progresso, **Quando** `CidadeDormeRoleSection` renderiza o `GameCard` `"Fase 0 · Revelação Secreta de Papel"`, **Então** a tag do cartão exibe `"Sigilo Individual"` (nunca repetindo `"Prontos: X/Y"`).

---

### História de Usuário 3 — Avatares com Duas Letras no Painel da Cidade (Prioridade: P2)

Como **Jogador observando o Painel da Cidade**, quero que participantes com a mesma inicial (como `"Diego"` e `"Douglas"`) sejam facilmente diferenciados pelos avatares na grade.

**Por que esta prioridade:** Facilita a identificação visual rápida dos jogadores vivos e eliminados em grupos com nomes parecidos (`RNF06`, `RNF08`).

**Como testar independentemente:** Renderizar `CidadeDormeCityPanel` com jogadores `"Diego"`, `"Douglas"` e `"Ana Maria"` e verificar os textos dos avatares gerados (`"DI"`, `"DO"`, `"AM"`).

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** jogadores vivos com apelidos `"Diego"`, `"Douglas"`, `"Ana Maria"` e `"B"`, **Quando** `CidadeDormeCityPanel` renderiza a grade de avatares, **Então** exibe `"DI"`, `"DO"`, `"AM"` e `"B"` respectivamente, sem criar cores literais fora de `src/view/theme.ts`.

---

### Casos de Borda (Edge Cases)

- **Apelidos curtos ou com espaços extras no avatar:** `" A "` → `"A"`; `""` → `"?"`; `"Ana   Clara"` → `"AC"`; `"Diego"` → `"DI"`.
- **Limpeza do timer de destaque do `"Amanhecer"`:** se o moderador clicar em `"Iniciar Votação Secreta"` antes dos `4 s` ou o jogador sair/desmontar a tela, o timer de transição `dawn → debate` deve ser cancelado no cleanup da ViewModel para evitar atualização de estado após unmount.
- **Compatibilidade com Design System v1.1.0 (`origin/develop` / Issue `#55`):** `GameCard` na `develop` (pós-PR `#64`) já possui suporte a `themeMode?: ThemeMode` e `ExpressiveTag`; nenhuma cor literal ou token fora de `src/view/theme.ts` deve ser introduzido.
- **Redução de movimento (`reduceMotion` / `RNF09`):** o destaque da etapa `"Amanhecer"` na timeline usa apenas troca de estado visual (cor + forma + ícone), funcionando normalmente com `reduceMotion: true`.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-67-01` (`RNF10`)**: Renderizar o `GameCard` noturno de `src/view/components/cidadeDormeNightSection.tsx` com `themeMode="dark"` (garantindo suporte a `themeMode?: ThemeMode` em `src/view/components/gameCard.tsx`).
- **`RF-67-02` (`RNF06` / `RNF08`)**: Alterar o ícone do `GameCard` de `vote_result` em `src/view/components/cidadeDormeDaySection.tsx` de `"weather-night"` para `"vote-outline"`.
- **`RF-67-03` (`RF19` / `RNF08`)**: Atualizar `useCidadeDormeViewModel.ts` (e `buildPhaseTimeline`) para destacar o passo `"Amanhecer"` (`dawn`) como ativo na abertura de `day_debate` e transitar para `"Debate"` (`debate`) após a janela de leitura do boletim (`4 s`).
- **`RF-67-04` (`RNF08`)**: Remover a contagem duplicada `"Prontos: X/Y"` da tag do `GameCard` em `src/view/components/cidadeDormeRoleSection.tsx` (substituindo por `"Sigilo Individual"`), mantendo `"Prontos X/Y"` exclusivamente no `CidadeDormeCityPanel`.
- **`RF-67-05` (`RNF06` / `RNF08`)**: Atualizar `src/view/components/cidadeDormeCityPanel.tsx` para gerar iniciais de 2 letras (`getAvatarInitials`) diferenciando nomes como `"Diego"` (`DI`) e `"Douglas"` (`DO`).

### Entidades e Estados Envolvidos
> Nenhuma alteração em `src/model/` ou `src/usecase/`.

- **`CidadeDormePhaseTimeline` / `buildPhaseTimeline` (`src/viewmodel/useCidadeDormeViewModel.ts`)**: controla o passo ativo inicial `'dawn'` antes de `'debate'` ao entrar em `day_debate`.

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (5 Itens da Issue `#67`):** Todos os 5 itens da tabela de ajustes visuais implementados e validados em `tests/components/cidadeDormeVisuals.test.tsx` e `tests/mocks/cidadeDormeScreen.mock.test.tsx`.
- **`CS-02` (Design System `RNF10`):** Zero cores literais (`#hex`, `rgb()`, `rgba()`) fora de `src/view/theme.ts`; total alinhamento com tokens da versão `1.1.0` (`useTheme` / `tokens` / `darkTokens`).
- **`CS-03` (Arquitetura MVVM):** `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest --passWithNoTests`) passa com **0 violações**.
