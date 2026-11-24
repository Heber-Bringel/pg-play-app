# 📋 Especificação de Funcionalidade (`spec.md`): rf29-parametros-partida

- **Branch da Feature:** `feat/019-rf29-parametros-partida`
- **Criado em:** 2026-11-21
- **Status:** Em Revisão
- **Caso(s) de Uso / Requisito(s):** `UC03`, `UC04`, `UC05` (`RF29`, `RF31`) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md`
- **Issue vinculada:** `#31`

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Ajustar parâmetros da partida na Mímica, Quiz e Forca (Prioridade: P1)

O **Líder do PG** deseja ajustar tempo, tentativas e quantidade de rodadas/perguntas/palavras antes do primeiro turno de **Mímica Expressiva**, **Quiz Relâmpago** e **Jogo da Forca**, partindo sempre de valores padrão prontos para iniciar com `1` toque.

**Por que esta prioridade:** Permite adaptar a duração e dificuldade de cada jogo presencial ao ritmo do Pequeno Grupo (`RF29`).

**Como testar independentemente:** Abrir Mímica, Quiz ou Forca, alterar os chips de parâmetros antes do primeiro turno, iniciar a partida e confirmar que o cronômetro, as tentativas e o limite de rodadas/perguntas respeitam a configuração escolhida.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o Líder abre a **Mímica Expressiva**, **Quando** observa a seção *"Parâmetros da Partida"* no primeiro turno, **Então** os valores padrão (`60s` e `3` rodadas) já estão selecionados em `ExpressiveChip`, podendo alternar tempo (`45s` / `60s` / `90s`) e rodadas (`1` a `5`) ou tocar direto em *"Estou Pronto!"* (`1` toque).
2. **Dado** que o Líder abre o **Quiz Relâmpago**, **Quando** seleciona tempo por pergunta (`15s` / `20s` / `30s`, padrão `20s`) e quantidade de perguntas (`5` / `10` / `15`, padrão `10`), **Então** o cronômetro usa o tempo escolhido e a partida encerra ao concluir o número configurado de perguntas, ajustado para a alternância justa entre equipes (ou quando o banco acabar), enviando os pontos ao placar (`RF31`).
3. **Dado** que o Líder abre o **Jogo da Forca**, **Quando** seleciona tentativas (`5` / `6` / `8`, padrão `6`) e palavras por equipe (`1` a `5`, padrão `3`), **Então** cada palavra inicia com o número configurado de tentativas e a partida encerra ao concluir as palavras configuradas (`RF31`).

---

### História de Usuário 2 — Validação de faixas e persistência da última configuração (Prioridade: P2)

O sistema deve validar os parâmetros no `UseCase` e lembrar a última configuração usada pelo Líder.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** um valor fora da faixa permitida (ex.: tempo `10s` na Mímica, `7` rodadas na Forca ou `25` perguntas no Quiz), **Quando** o `UseCase` tenta salvar/aplicar o parâmetro, **Então** lança `ValidationError` com mensagem legível e a `View` exibe o erro sem corromper o estado.
2. **Dado** que o Líder configurou `90s` e `5` rodadas na Mímica, **Quando** abre a Mímica novamente em seguida, **Então** a última configuração salva é carregada automaticamente via `IMatchSettingsDataSource`.

---

### Casos de Borda (Edge Cases)

- Quando o Quiz configura `10` ou `15` perguntas, mas o banco possui menos perguntas disponíveis, a partida encerra de forma limpa ao esgotar as perguntas disponíveis (`RF12`).
- Os padrões seguem as docs dos jogos (`docs/jogos/`): Mímica `60s` e `3` rodadas, Quiz `20s` e `10` perguntas, Forca `6` tentativas e `3` palavras.
- **Alternância justa no Quiz:** as perguntas se alternam entre as equipes, então o total efetivo é arredondado para baixo até um múltiplo do número de equipes (ex.: `5` perguntas com `2` equipes viram `4`, `2` por equipe). Quando o total efetivo difere do escolhido, a tela mostra um aviso com o total e a quantidade por equipe, incluindo o caso em que o pacote tem menos perguntas.
- Quantidades de perguntas maiores que o pacote atual ficam desativadas nos chips do Quiz (`listAvailableQuizQuestionCounts`). A menor opção (`5`) fica sempre disponível, e uma quantidade já salva continua marcada, com o aviso explicando o total efetivo.
- Toques seguidos em chips diferentes não podem se sobrescrever: o `UseCase` grava só o campo alterado e serializa as gravações.
- Valores inválidos encontrados no armazenamento (corrompidos ou de versão antiga) voltam ao padrão ao carregar.
- Os chips de parâmetros só ficam editáveis antes do início efetivo da partida (turno 1 em `pass-turn`), evitando alteração no meio de uma partida em andamento.
- Operação 100% offline com `MemoryMatchSettingsDataSource` (testes) e `AsyncStorageMatchSettingsDataSource` (app).

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-01` (`RF29`)**: Oferecer seleção por `ExpressiveChip` de:
  - Mímica: tempo `45s` / `60s` / `90s` e rodadas `1`–`5`;
  - Quiz: tempo `15s` / `20s` / `30s` e perguntas `5` / `10` / `15`;
  - Forca: tentativas `5` / `6` / `8` e palavras `1`–`5`.
- **`RF-02` (`RF29`)**: Validar todas as faixas no `PgPlayUseCases` lançando `ValidationError` para valores inválidos e persistir a última configuração em `IMatchSettingsDataSource`.
- **`RF-03` (`RF31`)**: Encerrar a partida ao atingir o limite configurado de rodadas/perguntas/palavras e integrar os pontos ao placar.

### Entidades de Domínio Envolvidas (`src/model/entities/`)
- **`MatchSettings`**: `{ mimica: { durationSeconds: 45 | 60 | 90; totalRounds: number }; quiz: { durationSeconds: 15 | 20 | 30; questionCount: 5 | 10 | 15 }; forca: { maxAttempts: 5 | 6 | 8; totalRounds: number } }`

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (IHC / Acessibilidade)**: Todos os `ExpressiveChip` respeitam alvo mínimo de `48 dp × 48 dp` e rótulos acessíveis (`RNF07`, `RNF09`).
- **`CS-02` (Arquitetura MVVM)**: `npm run check` (`check-arquitetura.mjs` + `tsc` + `jest`) executa com **0 violações** e todos os testes passando.
