# 📋 Especificação de Funcionalidade (`spec.md`): Termômetro de Pedidos de Oração (`UC11`)

- **Branch da Feature:** `feat/019-uc11-termometro-de-pedidos`
- **Criado em:** 2026-11-20
- **Status:** Aprovado
- **Caso(s) de Uso / Requisito(s):** `UC11` (`RF38`, `RF39`, `RF40`, `RNF12`) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md` e `docs/jogos/termometro-de-pedidos.md`
- **Issue vinculada:** `#35`

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Configurar e conduzir a roda de pedidos de oração com termômetro de tempo (Prioridade: P1)

Como **Líder / Moderador do PG**, ao final do encontro, desejo abrir a dinâmica **Termômetro de Pedidos** no Hub (com a tag `"1 Celular · Encerramento"`), escolher quem participa (equipes cadastradas, lista de nomes digitada na hora ou modo livre sem nomes), o tempo de fala por pessoa (`1`, `2` ou `3 min`) e a ordem (na ordem da lista ou sorteada), para conduzir o momento de pedidos de oração com tempo organizado e acolhedor.

**Por que esta prioridade:** É o propósito central do `UC11` (`RF38`, `RF39`): organizar o momento espiritual que fecha o encontro do PG sem transformar os pedidos em competição.

**Como testar independentemente:** Selecionar "Termômetro de Pedidos" no Hub, escolher participantes e tempo de `1 min`, tocar em `"Começar"`, na vez do participante tocar em `"Começar a falar"`, observar o `ExpressiveTimer` (`variant="thermometer"`) encher até 100% exibindo `"Pode ir concluindo"` (a partir de 70%) e `"Tempo concluído"` (em 100%) sem cortar a fala, e tocar em `"Próximo"`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o Líder abre o Termômetro de Pedidos, **Quando** configura o modo de participantes (`teams`, `custom` ou `free`), o tempo de fala (`1`, `2` ou `3 min`) e a ordem (`list` ou `random`) e toca em `"Começar"`, **Então** o sistema inicia a roda de fala mostrando a vez da primeira pessoa (ou `"Próxima pessoa"` no modo livre) com o termômetro vazio (`0%`) e aguardando o toque em `"Começar a falar"` (`RF38`, `RF39`).
2. **Dado** que é a vez de um participante, **Quando** ele toca em `"Começar a falar"`, **Então** o termômetro começa a encher (`0%` a `70%` em tons frios `color.actionContainer`, `70%` a `<100%` em tons quentes `color.highlight` com o texto `"Pode ir concluindo"`), exibindo também o tempo restante em `MM:SS` (`RF39`).
3. **Dado** que o tempo de fala da pessoa chegou ao fim (`00:00` / `100%`), **Quando** o cronômetro zera, **Então** o termômetro exibe o ícone `heart` e o texto `"Tempo concluído"`, **sem bloquear nem cortar a fala**, aguardando que a pessoa conclua e toque em `"Próximo"` (`RF39`).

---

### História de Usuário 2 — Pular a vez, pausar a roda e encerrar com resumo anônimo e Momento de Oração (Prioridade: P2)

Como **Participante ou Líder do PG**, desejo poder tocar em `"Pular minha vez"` (sem obrigatoriedade de falar) ou `"Pausar"` (para orar ou acolher no meio da roda) e, ao final, ver apenas o resumo numérico anônimo (`quantos compartilharam` e `quantos preferiram não falar`, sem nomes), abrir a tela calma `"Momento de Oração"` (sem cronômetro) e tocar em `"Encerrar Encontro"` descartando todos os nomes da memória sem alterar o placar (`RF39`, `RF40`, `RNF12`).

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que é a vez de um participante (falando ou antes de começar), **Quando** ele toca em `"Pular minha vez"`, **Então** o sistema incrementa apenas o contador anônimo `skippedCount` e passa imediatamente para a próxima pessoa (`RF39`).
2. **Dado** que todos os participantes da lista tiveram sua vez (ou o Líder encerrou a roda no modo livre), **Quando** a roda termina, **Então** o sistema exibe `"Todos compartilharam"` apenas com números (`sharedCount` e `skippedCount`, **sem nomes**), oferece o botão `"Momento de Oração"` (tela calma sem cronômetro) e, ao tocar em `"Encerrar Encontro"`, limpa a sessão da memória e retorna ao Hub sem alterar o placar do PG (`RF40`, `RNF12`).

---

### História de Usuário 3 — Validação de configuração inválida (Prioridade: P3)

Como **Líder do PG**, caso eu selecione o modo de lista de nomes digitados sem informar ao menos 1 nome válido (`>= 2` caracteres) ou tente configurar um tempo fora de `1`, `2` ou `3` minutos, desejo receber uma mensagem clara de `ValidationError`.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o modo de participantes é `"custom"` com lista vazia (ou um nome com menos de 2 caracteres), **Quando** o Líder tenta adicionar o nome ou iniciar o momento, **Então** o `TermometroUseCases` lança `ValidationError` e a `View` exibe a mensagem semântica de erro.

---

### Casos de Borda (Edge Cases)

- **Tempo esgotado nunca corta a fala:** quando `secondsRemaining === 0`, o estado permanece na vez da pessoa atual com `"Tempo concluído"` até o toque manual em `"Próximo"` ou `"Pular minha vez"`.
- **Pausar e retomar:** tocar em `"Pausar"` congela o preenchimento do termômetro até que o Líder toque em `"Continuar"`.
- **Modo livre sem nomes (`free`):** permite avançar indefinidamente com `"Próximo"` ou `"Pular minha vez"` exibindo `"Próxima pessoa (N)"`, além de um botão `"Concluir Roda de Pedidos"` para ir ao resumo anônimo quando todos do grupo tiverem participado.
- **Privacidade estrita (`RNF12`):** zero gravação de áudio, zero campo de texto para digitar o pedido de oração, zero persistência em `AsyncStorage` ou rede (`Supabase`), e descarte completo dos nomes ao encerrar ou sair.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`) e Não Funcionais (`RNF`)
- **`RF38`**: Permitir ao Líder definir os participantes (`teams`, `custom` ou `free`), o tempo de fala por pessoa (`1`, `2` ou `3 min`, equivalentes a `60`, `120` ou `180` segundos) e a ordem (`list` ou `random`).
- **`RF39`**: Mostrar de quem é a vez e um termômetro (`ExpressiveTimer` com `variant="thermometer"`) que enche conforme o tempo passa, iniciado apenas quando a pessoa toca em `"Começar a falar"`, sinalizando `"Pode ir concluindo"` (`>= 70%`) e `"Tempo concluído"` (`100%`) sem interromper a fala, oferecendo `"Próximo"`, `"Pular minha vez"` e `"Pausar"` / `"Continuar"`.
- **`RF40`**: Exibir resumo final apenas com números (`sharedCount` e `skippedCount`, sem nomes), oferecer a tela `"Momento de Oração"` sem cronômetro e encerrar voltando ao Hub sem alterar o placar do encontro.
- **`RNF12`**: Manter nomes apenas em memória durante o momento e descartá-los integralmente ao encerrar; não gravar áudio, texto de pedidos nem enviar dados para a rede.

### Entidades de Domínio Envolvidas (`src/model/entities/`)
- **`TermometroSession` e tipos auxiliares (`src/model/entities/termometro.ts`)**:
  - `TermometroParticipantMode = 'teams' | 'custom' | 'free'`
  - `TermometroDurationMinutes = 1 | 2 | 3`
  - `TermometroOrderMode = 'list' | 'random'`
  - `TermometroStage = 'setup' | 'turn' | 'summary' | 'prayer'`
  - `TermometroThermalZone = 'cool' | 'warm' | 'completed'`
  - `TermometroSummary = { sharedCount: number; skippedCount: number; totalParticipants: number }`
  - `TermometroSession = { stage: TermometroStage; participantMode: TermometroParticipantMode; durationMinutes: TermometroDurationMinutes; durationSeconds: number; orderMode: TermometroOrderMode; participants: string[]; currentIndex: number; currentSpeakerLabel: string; hasStartedSpeaking: boolean; isPaused: boolean; secondsRemaining: number; sharedCount: number; skippedCount: number }`

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (IHC / Acessibilidade)**: A variante `thermometer` do `ExpressiveTimer` exibe o tempo em `MM:SS`, barra de preenchimento visual, ícone semântico (`thermometer-low`, `thermometer-high`, `heart`) e texto de faixa (`"Tempo tranquilo"`, `"Pode ir concluindo"`, `"Tempo concluído"`), respeitando `RNF06` (cor + forma/ícone + texto) e `RNF08` (anúncio de 30 segundos restantes e tempo concluído).
- **`CS-02` (Privacidade RNF12 e Placar RF40)**: O placar geral do PG permanece 100% inalterado e `participants` é esvaziado (`[]`) ao encerrar.
- **`CS-03` (Arquitetura MVVM)**: `npm run check` (`check-arquitetura.mjs` + `tsc --noEmit` + `jest`) executa com **0 violações**.
