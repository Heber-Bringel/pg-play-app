# 📋 Especificação de Funcionalidade (`spec.md`): Validação de Atores e Alvos na Noite e Votação do Cidade Dorme

- **Branch da Feature:** `fix/017-cidade-dorme-validacao-acoes-alvos`
- **Criado em:** 2026-11-19
- **Status:** Em Revisão
- **Caso(s) de Uso / Requisito(s):** `UC07` (`RF18`, `RF19`, `RF20`, `RNF11`) — Ref.: `AGENTS.md` (Regra 6 — Regras nos UseCases), `docs/jogos/cidade-dorme.md`, `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md`, `src/usecase/cidadeDormeUseCases.ts` e `src/view/components/cidadeDorme{Night,Day}Section.tsx`
- **Issue vinculada:** `#42` (`v1.0.0 — Jogos em Sala Multiplayer (UC07–UC08)`)

---

## 1. Descrição do Problema & Cenários de Usuário *(Obrigatório)*

### Causas Raiz Diagnosticadas (Simulação com 5 Jogadores e Auditoria de Código)
1. **Múltiplas investigações do Detetive na mesma noite:** após receber o veredito do primeiro suspeito, a lista de suspeitos continua ativa na tela (`cidadeDormeNightSection.tsx`) e `submitDetectiveInvestigation` não bloqueia nova investigação na mesma rodada (`room.currentRound`).
2. **Ausência de validação de quem está agindo (`actorPlayerId`):** `submitAssassinTarget`, `submitAngelProtection` e `submitDetectiveInvestigation` verificam apenas a fase da sala — não recebem o ID do autor da ação e não validam se ele está **vivo** e se tem o **papel correspondente à fase** (`Regra 6` do Harness).
3. **Alvos inválidos visíveis e aceitos:**
   - o **Assassino** pode ver e escolher a si mesmo ou outro **Assassino** parceiro como vítima;
   - o **Detetive** pode ver e investigar a si mesmo;
   - qualquer jogador pode ver e votar em si mesmo em `day_voting`.
   - *(Exceção legítima a preservar: o **Anjo PODE proteger a si mesmo** na própria rodada noturna!)*

---

### História de Usuário 1 — Validação Estrita de Autor, Papel, Vida e Limite de 1 Investigação no UseCase (Prioridade: P1)

Como **Sistema / Regra de Negócio (`CidadeDormeUseCases`)**, quero exigir `actorPlayerId` em todas as ações noturnas e validar papel, estado `isAlive`, elegibilidade do alvo e limite de uma investigação por noite, lançando `ValidationError` em qualquer tentativa indevida.

**Por que esta prioridade:** Viola a Regra 6 do Harness (validações de domínio devem residir no UseCase, não apenas ocultadas na interface) e evita trapaças ou erros de jogo (`RF18`, `RF20`, `RNF11`).

**Como testar independentemente:** Invocar os métodos de `CidadeDormeUseCases` diretamente em `tests/unit/cidadeDormeUseCases.test.ts` simulando atores mortos, com papel trocado, segunda investigação do Detetive e autovoto/autoataque.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o Detetive vivo já investigou um suspeito na rodada atual (`detectiveVerdict?.roundNumber === room.currentRound`), **Quando** tenta chamar `submitDetectiveInvestigation` novamente na mesma noite, **Então** o UseCase lança `ValidationError` impedindo múltiplas investigações (`RF19`).
2. **Dado** um jogador morto (`isAlive === false`) ou sem o papel do turno (`cidadao`, `anjo` em turno de `night_assassin`, etc.), **Quando** envia uma ação noturna (`submitAssassinTarget`, `submitAngelProtection` ou `submitDetectiveInvestigation`), **Então** o UseCase lança `ValidationError` antes de alterar qualquer estado (`RNF11`).
3. **Dado** que o Assassino tenta escolher a si mesmo ou outro Assassino como vítima, o Detetive tenta investigar a si mesmo, ou um votante tenta votar em si mesmo (`castVote`), **Quando** o UseCase valida o alvo, **Então** lança `ValidationError` explicativo (`RF20`).
4. **Dado** que o **Anjo** vivo escolhe proteger a **si mesmo**, **Quando** chama `submitAngelProtection(roomId, angel.id, angel.id)`, **Então** o UseCase aceita normalmente e registra `nightProtectedId = angel.id` (`RF19`).

---

### História de Usuário 2 — Listas Filtradas na Interface de Noite e Votação (Prioridade: P1)

Como **Assassino, Detetive ou Votante**, quero visualizar nas listas da tela apenas os alvos permitidos pelas regras do jogo, evitando toques inválidos acidentais e removendo a lista de suspeitos do Detetive assim que o veredito sair.

**Por que esta prioridade:** Previne erros de uso (`ISO/IEC 25010`) e garante clareza visual após o Detetive concluir sua investigação (`RF18`, `RF20`).

**Como testar independentemente:** Renderizar `CidadeDormeNightSection` e `CidadeDormeDaySection` com diferentes `currentPlayer` e verificar que opções proibidas não aparecem na lista.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** o turno do **Assassino**, **Quando** `cidadeDormeNightSection.tsx` exibe os alvos, **Então** exclui o próprio Assassino e quaisquer parceiros Assassinos (`role === 'assassino'` ou presentes em `room.allyAssassinIds`).
2. **Dado** o turno do **Detetive**, **Quando** ainda não investigou, **Então** a lista exclui o próprio Detetive; **Quando** `detectiveVerdict` existe na rodada atual, **Então** a lista de suspeitos é ocultada e apenas o card de veredito permanece visível.
3. **Dado** a fase de **Votação Secreta** (`day_voting`), **Quando** um jogador vivo abre a lista de opções, **Então** vê todos os outros jogadores vivos mais *"Abster-se / Pular Voto"*, sem exibir o próprio nome como opção de voto.

---

### Casos de Borda (Edge Cases)

- **Sala em modo com 2+ Assassinos (`assassinCount >= 2`) sob sigilo `RNF11` (`#40`):** como os demais papéis vêm ocultos (`role: null`), o UseCase/ViewModel utiliza `room.allyAssassinIds` (enviado exclusivamente ao Assassino) para filtrar parceiros na lista sem vazar papéis aos outros jogadores.
- **Auto-proteção do Anjo:** nunca deve ser filtrada nem bloqueada — o Anjo precisa aparecer em sua própria lista de proteção noturna.
- **Assinatura de testes anteriores:** todos os testes unitários existentes de `submitAssassinTarget`, `submitAngelProtection` e `submitDetectiveInvestigation` devem ser atualizados para passar `actorPlayerId`.
- **Validação duplicada nas RPCs do Supabase:** quando integrado às RPCs (`#38` / `#40`), o PostgreSQL valida também `auth.uid()` + `secret_role` + `is_alive` e ausência de alvo próprio/aliado no banco.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-42-01`**: Atualizar `ICidadeDormeUseCases` e `CidadeDormeUseCases` para receber `actorPlayerId: string` em `submitAssassinTarget`, `submitAngelProtection` e `submitDetectiveInvestigation`.
- **`RF-42-02`**: Lançar `ValidationError` se ator estiver morto, não tiver o papel correspondente à fase, tentar investigar mais de 1 vez na mesma noite, tentar investigar a si mesmo, tentar atacar a si/parceiro Assassino ou tentar votar em si mesmo.
- **`RF-42-03`**: Permitir explicitamente que o Anjo proteja a si mesmo (`protectedPlayerId === actorPlayerId`).
- **`RF-42-04`**: Filtrar as listas de seleção em `useCidadeDormeViewModel` / `cidadeDormeNightSection.tsx` / `cidadeDormeDaySection.tsx` (e ocultar lista do Detetive após veredito).

### Entidades e Contratos Envolvidas (`src/usecase/`)
- **`ICidadeDormeUseCases`** (`src/usecase/iCidadeDormeUseCases.ts`):
  - `submitAssassinTarget(roomId: string, actorPlayerId: string, targetPlayerId: string): Promise<CidadeDormeRoom>`
  - `submitAngelProtection(roomId: string, actorPlayerId: string, protectedPlayerId: string | null): Promise<CidadeDormeRoom>`
  - `submitDetectiveInvestigation(roomId: string, actorPlayerId: string, suspectPlayerId: string | null): Promise<CidadeDormeRoom>`

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (Regras no Domínio/UseCase)**: 100% das ações inválidas lançam `ValidationError` diretamente no `CidadeDormeUseCases` (e nas RPCs server-side).
- **`CS-02` (Prevenção de Erros na UI)**: Listas exibem somente opções válidas e o veredito do Detetive substitui a lista de suspeitos sem opções proibidas.
- **`CS-03` (Arquitetura MVVM)**: `npm run check` (`check-arquitetura.mjs` + `tsc --noEmit` + `jest`) executa com **0 violações** e todos os testes de regressão passando.
