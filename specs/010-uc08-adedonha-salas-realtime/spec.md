# 📋 Especificação de Funcionalidade (`spec.md`): UC08 — Salas Reais, Refatoração Visual e Supabase Realtime na Adedonha Bíblica

- **Branch da Feature:** `feat/010-uc08-adedonha-salas-realtime`
- **Criado em:** 2026-11-17
- **Status:** Em Revisão
- **Caso(s) de Uso / Requisito(s):** `UC08` (`RF21`, `RF22`, `RF23`, `RNF03`, `RNF06`, `RNF07`, `RNF09`, `RNF10`) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md`, `docs/jogos/adedonha-biblica.md` e `docs/harness/05-infraestrutura-e-supabase.md`
- **Milestone / Issue vinculada:** `v1.0.0 — Jogos em Sala Multiplayer (UC07–UC08)`

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Identificação do Jogador e Fluxo de Criar / Entrar em Sala (Prioridade: P1)

Como **Moderador ou Participante do PG**, ao abrir a **Adedonha Bíblica**, quero informar meu apelido e escolher entre **Criar uma Nova Sala** ou **Entrar com Código PIN**, em vez de cair diretamente em uma sala pré-carregada sem identificação.

**Por que esta prioridade:** Sem identificação e entrada por código PIN, não é possível distinguir o Moderador dos demais jogadores nem conectar múltiplos celulares em uma mesma sala (`RNF03`).

**Como testar independentemente:** Abrir `/adedonha`, preencher apelido válido, testar a criação de sala (recebendo código PIN e papel de Moderador) e a entrada em sala existente com PIN (como Participante), além da validação de apelido curto ou PIN inválido.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o usuário acessou a Adedonha Bíblica sem estar conectado a uma sala, **Quando** a tela inicial carrega, **Então** o sistema exibe a etapa de entrada solicitando **Seu Apelido** e oferecendo as opções **Criar Sala (Moderador)** e **Entrar com Código PIN**.
2. **Dado** que o usuário digitou o apelido `"Heber"` e tocou em **Criar Sala**, **Quando** o UseCase cria a sala, **Então** o usuário entra no Lobby como **Moderador (`isHost: true`)** visualizando o **Código PIN** para compartilhar com o grupo.
3. **Dado** que um participante digitou o apelido `"Ana"` e o PIN `"PG2026"` e tocou em **Entrar na Sala**, **Quando** a sala é localizada, **Então** o participante entra no Lobby conectado como jogador comum (`isHost: false`), visualizando o código da sala e a lista de jogadores.
4. **Dado** que o usuário deixou o apelido com menos de 2 letras ou informou um PIN inválido (`< 4` caracteres ou inexistente), **Quando** tenta criar ou entrar na sala, **Então** o `UseCase` lança `ValidationError` ou `DataSourceError` e a `View` exibe a mensagem semântica de erro sem sair da etapa de entrada.

---

### História de Usuário 2 — Apuração Assistida Limpa, Semântica e Sem Poluição de Botões (Prioridade: P1)

Como **Moderador ou Jogador na fase de Apuração (`tally`)**, quero visualizar cada resposta em um card espaçado e legível, com selo semântico de pontuação (**Cor + Ícone + Texto**) e botões compactos organizados por papel (jogador levanta dúvida; moderador julga), evitando dezenas de botões gigantes empilhados na tela.

**Por que esta prioridade:** A auditoria visual apontou excesso de botões grandes empilhados por jogador na fase `tally`, informações muito próximas e falta de hierarquia clara entre ações do jogador e do moderador (`design-system/06-acessibilidade.md`).

**Como testar independentemente:** Avançar uma rodada até a fase `tally` e verificar que cada resposta exibe 1 card estruturado, barra de veredito compacta (`>= 48 dp`), distinção visual clara entre Única (`+10`), Repetida (`+5`) e Inválida (`0`), e espaçamento adequado entre blocos.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que a sala está na fase `tally` com 3 ou mais jogadores, **Quando** a coluna atual é exibida, **Então** cada submissão é renderizada em seu próprio card com espaçamento mínimo `space.md`, exibindo apelido, resposta, selo semântico (`Única +10`, `Repetida +5` ou `Inválida 0`) e indicador de dúvida (quando `doubtCount > 0`).
2. **Dado** que o usuário atual é o Moderador (`isHost: true`), **Quando** visualiza uma resposta na apuração, **Então** vê os 3 controles compactos de veredito (**Única**, **Repetida**, **Inválida**) organizados lado a lado com alvo mínimo `48 dp × 48 dp` e destaque do veredito atual, além do botão **Levantar Dúvida**.
3. **Dado** que o usuário está na fase de preenchimento (`filling`), **Quando** visualiza os botões de ação no rodapé, **Então** o botão Jumbo **ADEDONHA! (Parar Rodada)** tem destaque principal e separação clara (`space.lg`) em relação ao controle do Moderador (**Encerrar Tempo da Rodada**).

---

### História de Usuário 3 — Sincronização em Tempo Real via Supabase (`SupabaseMultiplayerRoomService`) (Prioridade: P1)

Como **Grupo conectado em celulares diferentes**, queremos que criação de sala, entrada de jogadores, giro da roleta, grito de *"ADEDONHA!"*, dúvidas levantadas e vereditos do Moderador sejam sincronizados automaticamente via **Supabase (Auth Anônima + Postgres + Realtime)** assim que as credenciais `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` estiverem configuradas.

**Por que esta prioridade:** Permite jogar presencialmente cada um no seu celular bastando preencher as credenciais do projeto Supabase no `.env` (`docs/harness/05-infraestrutura-e-supabase.md`).

**Como testar independentemente:** Testar com `MemoryMultiplayerRoomService` (quando não há variáveis de ambiente configuradas, garantindo modo offline 100% funcional) e com testes unitários mockando o cliente `@supabase/supabase-js` em `SupabaseMultiplayerRoomService`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que as variáveis `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` estão definidas no `.env`, **Quando** o `di/container.ts` inicializa `adedonhaUseCases`, **Então** o app utiliza `SupabaseMultiplayerRoomService` com autenticação anônima (`signInAnonymously`) e assinatura Realtime na sala (`rooms`, `room_players`, `adedonha_submissions`).
2. **Dado** que o `.env` não possui credenciais do Supabase configuradas, **Quando** o app inicia ou roda `npm test`, **Então** o `di/container.ts` utiliza `MemoryMultiplayerRoomService` sem erros, mantendo o modo offline e os testes determinísticos.
3. **Dado** que ocorreu alteração na sala por outro celular via Supabase Realtime, **Quando** o evento chega no canal da sala, **Então** a `useAdedonhaViewModel` recarrega/atualiza o `AdedonhaRoom` automaticamente sem necessidade de o jogador recarregar a tela.

---

### Casos de Borda (Edge Cases)

- **Apelido vazio ou menor que 2 caracteres / Código PIN menor que 4 caracteres:** Lança `ValidationError` com feedback semântico no campo ou banner de erro.
- **Código PIN inexistente no banco ou memória:** Lança `DataSourceError` amigável (*"Sala não encontrada para o código informado."*).
- **Falha de rede ou credencial inválida no Supabase:** Convertida em `AuthError` ou `DataSourceError` dentro de `src/infra/services/supabaseMultiplayerRoomService.ts`.
- **Jogador não-host tentando ações de Moderador na View:** Controles exclusivos de Moderador (configurar colunas, girar roleta, encerrar tempo manualmente, julgar respostas, avançar coluna/rodada) ficam ocultos ou substituídos por mensagem informativa quando `isCurrentPlayerHost === false`, mantendo suporte ao modo de demonstração offline.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-01`**: Exibir fluxo inicial de entrada na Adedonha Bíblica com campo de apelido, criação de sala (gerando código PIN) e entrada em sala existente por código PIN.
- **`RF-02`**: Identificar o jogador local na ViewModel (`currentPlayerId` e `isCurrentPlayerHost`) e utilizar esse identificador ao enviar respostas e acionar `"ADEDONHA!"`.
- **`RF-03`**: Refatorar `src/view/adedonha.tsx` para consumir exclusivamente `tokens` de `@/view/theme`, removendo poluição de 4 botões grandes por jogador na fase `tally` e agrupando cada submissão em um card semântico bem espaçado com barra compacta de veredito (`>= 48 dp`).
- **`RF-04`**: Implementar `SupabaseMultiplayerRoomService` com `@supabase/supabase-js` (Auth anônima, consultas/mutações em `rooms`, `room_players` e `adedonha_submissions`, e assinatura Realtime por `roomId`) mais método `subscribeToRoom` no contrato `IMultiplayerRoomService`.
- **`RF-05`**: Fornecer `.env.example` documentado e seleção automática em `src/di/container.ts` entre `SupabaseMultiplayerRoomService` (quando `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` existirem) e `MemoryMultiplayerRoomService` (fallback offline/testes).

### Entidades de Domínio Envolvidas (`src/model/entities/multiplayerSession.ts`)
- **`AdedonhaRoom`**, **`AdedonhaPlayer`**, **`AdedonhaSubmission`**, **`AdedonhaConfig`**, **`AdedonhaTallyVerdict`**: mantidos como `type` puro; `AdedonhaRoom` pode incluir ou associar `localPlayerId` apenas no estado da ViewModel (não poluindo o domínio persistido) ou retorno da sessão.

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (IHC / Acessibilidade)**: Todos os alvos interativos (inclusive os botões compactos de veredito na apuração) respeitam o mínimo de `48 dp × 48 dp` (`64 dp` para ações Jumbo) e combinam **cor semântica + forma + ícone + texto** (`design-system/06-acessibilidade.md`).
- **`CS-02` (Arquitetura MVVM)**: `npm run check` (`check-arquitetura.mjs` + `tsc` + `jest`) executa com **0 violações** e todos os testes passando.
- **`CS-03` (Pronto para Credenciais)**: Basta preencher `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` no `.env` e reiniciar o Expo para jogar em salas reais com sincronização Realtime.
