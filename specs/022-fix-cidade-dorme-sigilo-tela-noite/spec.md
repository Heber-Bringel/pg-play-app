# 📋 Especificação de Funcionalidade (`spec.md`): Correção de Sigilo da Tela Noturna no Cidade Dorme (`RNF11`)

- **Branch da Feature:** `fix/022-cidade-dorme-sigilo-tela-noite`
- **Criado em:** 2026-11-22
- **Status:** Em Revisão
- **Caso(s) de Uso / Requisito(s):** `UC07` (`RF18`, `RF19`, `RNF06`, `RNF07`, `RNF08`, `RNF09`, `RNF11`) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md`, `docs/jogos/cidade-dorme.md`, `src/view/components/cidadeDormeNightSection.tsx`, `src/viewmodel/useCidadeDormeViewModel.ts`
- **Issue vinculada:** `#66` (`v1.0.0 — Jogos em Sala Multiplayer (UC07–UC08)`)

---

## 1. Descrição do Problema & Cenários de Usuário *(Obrigatório)*

### Contexto Atual e Violação de Sigilo (`RNF11`)
Nas simulações presenciais com 5 jogadores (branch do PR `#62`), identificou-se que **durante a noite a tela de quem age é visualmente diferente da tela de quem dorme**:
- No `night_assassin`, `night_angel` e `night_detective`, `CidadeDormeNightSection` renderiza imediatamente o card `"Escolha um Jogador Vivo"` com a lista de alvos apenas no celular de quem possui o papel do turno, enquanto os demais jogadores veem o card compacto `"A Cidade Dorme... Mantenha os olhos fechados"`.
- Após confirmar a ação, quem agiu continua vendo `"Escolha registrada — aguarde o fim do turno."` ou o card colorido de `detectiveVerdict` (`"Suspeito Confirmado"` / `"Cidadão Inocente"`), enquanto os demais veem o cartão de sono.
- Como os participantes jogam na mesma roda presencialmente, qualquer vizinho olhando de relance para o brilho, o volume ou o texto do celular ao lado descobre imediatamente quem é o Assassino, o Anjo ou o Detetive, violando o requisito `RNF11` e o critério original da Issue `#56` (*"Nada na noite permite deduzir o papel de alguém pela tela"*).

---

### História de Usuário 1 — Cartão Noturno Idêntico para Todos Antes da Interação (Prioridade: P1)

Como **Jogador vivo durante qualquer turno da noite (`night_assassin`, `night_angel`, `night_detective`)**, quero que a tela exibida no meu celular seja visualmente idêntica à dos demais jogadores vivos (mesmo cartão, mesma altura e mesma animação) enquanto ninguém tocar na tela, para que nenhum colega da roda deduza meu papel secreto pela aparência do meu aparelho.

**Por que esta prioridade:** Corrige uma falha crítica de sigilo (`RNF11`) que quebra a dinâmica central de dedução social do Cidade Dorme.

**Como testar independentemente:** Renderizar `CidadeDormeScreen` (ou `CidadeDormeNightSection`) no turno `night_assassin`, `night_angel` e `night_detective` uma vez para o jogador cujo papel está ativo e outra para um Cidadão dormindo (com `isNightCardRevealed: false`), comparando integralmente as árvores JSON renderizadas (`toJSON()`) e confirmando igualdade estrita.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que a partida está em `night_assassin`, `night_angel` ou `night_detective` e o jogador vivo ainda não tocou para consultar o turno (`isNightCardRevealed === false`), **Quando** a tela renderiza tanto no celular do papel ativo quanto no celular de qualquer outro jogador vivo que está dormindo, **Então** ambos exibem exatamente o mesmo cartão escuro comum (mesmo ícone, mesmo título `"A Cidade Dorme... Mantenha os olhos fechados"`, mesma altura mínima e o mesmo botão `"Tocar para Consultar Turno"`), sem lista de alvos, sem veredito e sem som/vibração local.
2. **Dado** a transição para um novo turno noturno (`night_assassin` → `night_angel` → `night_detective`), **Quando** a fase muda na ViewModel, **Então** `isNightCardRevealed` é automaticamente reiniciado para `false` em todos os aparelhos.

---

### História de Usuário 2 — Consulta Sob Demanda e Retorno ao Estado Comum Após Ação/Veredito (Prioridade: P1)

Como **Jogador vivo tocando para consultar o turno noturno**, quero abrir minha visão privada apenas enquanto seguro/toco no botão de consulta — vendo a lista de alvos se for minha vez ou um aviso neutro se estiver dormindo — e retornar ao cartão comum logo após confirmar minha ação ou visualizar o veredito do Detetive.

**Por que esta prioridade:** Garante usabilidade rápida no turno curto (`15 s–20 s`) sem deixar pistas persistentes na tela depois que o jogador age (`RF19`, `RNF07`, `RNF11`).

**Como testar independentemente:** Simular toque em `"Tocar para Consultar Turno"` para quem age e para quem dorme, confirmar seleção de alvo (Assassino/Anjo) e investigação (Detetive), validar o retorno imediato (ou em poucos segundos para o veredito) ao estado comum e o fechamento manual por `"Ocultar Tela Noturna"`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** um jogador vivo com `isNightCardRevealed === false`, **Quando** ele toca em `"Tocar para Consultar Turno"`, **Então**:
   - Se for o turno ativo do seu papel e ainda não tiver agido (`isMyActiveTurn && !hasSubmittedNightAction`), visualiza a lista de `SelectableOptionItem` com alvos elegíveis, o botão de confirmação (`"Confirmar Alvo"` / `"Proteger Jogador"` / `"Investigar Suspeito"`) e o botão `"Ocultar Tela Noturna"`.
   - Se **não** for seu turno ativo (ou se já tiver concluído a ação), visualiza dentro de um cartão com a mesma altura mínima a mensagem discreta `"Não é seu turno de ação — mantenha os olhos fechados"` (ou `"Sua ação noturna já foi registrada."`) e o botão `"Ocultar Tela Noturna"`.
2. **Dado** que o Assassino ou o Anjo confirmou sua escolha na visão aberta, **Quando** `handleConfirmAssassinTarget` ou `handleConfirmAngelProtection` conclui com sucesso, **Então** `isNightCardRevealed` retorna imediatamente para `false`, devolvendo a tela ao cartão comum idêntico ao de quem dorme.
3. **Dado** que o Detetive confirmou sua investigação e recebeu `room.detectiveVerdict`, **Quando** o card de veredito é exibido, **Então** ele pode fechá-lo imediatamente tocando em `"Ocultar Tela Noturna"` **e**, caso não toque, a tela retorna automaticamente ao cartão comum após `4 segundos` (tempo suficiente para leitura do veredito sem expor a tela indefinidamente).

---

### Casos de Borda (Edge Cases)

- **Consistência de altura visual (anti-dedução por volume):** o cartão fechado comum e os estados abertos (aviso de "não é sua vez" e lista de alvos/veredito) devem compartilhar altura mínima consistente (`minHeight` configurada via tokens de espaçamento em `theme.ts`) para evitar saltos óbvios de layout percebidos à distância.
- **Erro de validação durante confirmação noturna:** se ocorrer `DomainError` ao tentar confirmar alvo, `isNightCardRevealed` permanece `true` para que o jogador veja a mensagem de erro sem perder o contexto, podendo tentar novamente ou tocar em `"Ocultar Tela Noturna"`.
- **Limpeza de timeout do veredito:** se o turno mudar (`night_detective` → `day_debate`), o jogador ocultar manualmente antes de `4 s`, ou o componente desmontar, o timer de auto-ocultação do veredito deve ser cancelado imediatamente em `activeTimeoutsRef` para evitar vazamentos ou warnings no Jest.
- **Modo Espectador (`currentPlayer.isAlive === false`):** jogadores eliminados não participam da ação noturna; continuam vendo o banner `"Você foi eliminado — Acompanhe em silêncio"` e o cartão comum sem opção de consulta de turno.
- **Redução de movimento (`reduceMotion` / `RNF09`):** qualquer transição ao abrir/ocultar o cartão noturno deve respeitar `reduceMotion` (`0 ms` quando ativo).

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-66-01` (`RNF11`)**: Expor `isNightCardRevealed: boolean` e `handleToggleNightCardVisibility` / `handleHideNightCard` em `useCidadeDormeViewModel.ts`, iniciando em `false` e reiniciando para `false` a cada troca de fase/turno.
- **`RF-66-02` (`RNF11`)**: Renderizar em `src/view/components/cidadeDormeNightSection.tsx` um cartão noturno comum e idêntico (mesmo ícone, textos, altura mínima, botão `"Tocar para Consultar Turno"` e animação) para todos os jogadores vivos enquanto `isNightCardRevealed === false`.
- **`RF-66-03` (`RF19` / `RNF11`)**: Ao revelar o cartão (`isNightCardRevealed === true`), mostrar alvos/veredito somente ao papel ativo do turno, ou mensagem neutra `"Não é seu turno de ação — mantenha os olhos fechados"` aos demais, sempre com botão `"Ocultar Tela Noturna"` (`>= 48 dp`) e mesma altura mínima estrutural.
- **`RF-66-04` (`RNF11`)**: Ocultar automaticamente o cartão noturno imediatamente após confirmação de Assassino/Anjo e após `4 s` (ou por toque manual) após a exibição do veredito do Detetive.
- **`RF-66-05` (`RNF09` / `RNF10`)**: Usar exclusivamente tokens de `darkTokens` (`src/view/theme.ts`) e respeitar `reduceMotion`.

### Entidades e Estados Envolvidos (`src/viewmodel/` — sem mudanças em `src/model/`)
- **`CidadeDormeState` (`src/viewmodel/useCidadeDormeViewModel.ts`)**: adiciona `isNightCardRevealed: boolean`.
- **`CidadeDormeActions` (`src/viewmodel/useCidadeDormeViewModel.ts`)**: adiciona `handleToggleNightCardVisibility: () => void` e `handleHideNightCard: () => void`.

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (Paridade Visual Noturna `RNF11`):** Teste automatizado comparando a árvore renderizada (`toJSON()`) de quem age e de quem dorme durante `night_assassin`, `night_angel` e `night_detective` antes do toque comprova igualdade exata.
- **`CS-02` (Retorno Automático ao Estado Comum):** Após confirmar alvo/proteção ou decorridos `4 s` da investigação do Detetive (ou toque em `"Ocultar Tela Noturna"`), a tela volta ao estado comum camuflado.
- **`CS-03` (Acessibilidade `RNF07` / `RNF09`):** Botões de consulta/ocultação possuem `>= 48 dp` (`64 dp` quando Jumbo), rótulos semânticos claros (`accessibilityRole="button"`, `accessibilityLabel`) e respeitam `reduceMotion`.
- **`CS-04` (Arquitetura MVVM):** `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest --passWithNoTests`) passa com **0 violações**.
