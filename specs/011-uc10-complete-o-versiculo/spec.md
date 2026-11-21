# 📋 Especificação de Funcionalidade (`spec.md`): uc10-complete-o-versiculo

- **Branch da Feature:** `feat/011-uc10-complete-o-versiculo`
- **Criado em:** 2026-11-19
- **Status:** Em Revisão
- **Caso(s) de Uso / Requisito(s):** `UC10` (`RF09–RF12`, `RF24`, `RF28–RF31`, `RF35–RF37`, `RNF02–RNF09`) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md` e `docs/jogos/complete-o-versiculo.md`
- **Issue vinculada:** `#34`

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Jogar rodada de Complete o Versículo em 1 Celular (Prioridade: P1)

O **Líder do PG** e a **Equipe da Vez** querem jogar **Complete o Versículo** em um único celular compartilhado, alternando turnos entre as equipes cadastradas, lendo uma passagem bíblica famosa com `1` a `2` lacunas numeradas e tentando completá-las dentro do tempo configurado antes de revelar a referência.

**Por que esta prioridade:** É o fluxo principal do minigame (`UC10`), responsável pela dinâmica de memória bíblica em grupo e pela pontuação enviada ao Placar Geral.

**Como testar independentemente:** Configurar ao menos 2 equipes, acessar `/versiculo` pelo Hub, selecionar pacotes/parâmetros na preparação, iniciar o turno, preencher as lacunas e conferir o resultado até o resumo final e ida ao Placar.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que existem ao menos `2` equipes cadastradas e ao menos `1` pacote de passagens selecionado, **Quando** a equipe toca em *"Estou Pronto!"* na tela de passagem de turno, **Então** o sistema exibe a passagem bíblica com `1` ou `2` lacunas numeradas (`1`, `2`), a referência oculta, um `ExpressiveTextField` por lacuna e o `ExpressiveTimer` em contagem regressiva (`RF10`, `RF35`).
2. **Dado** uma passagem com lacunas exibida, **Quando** a equipe digita as palavras corretas (mesmo com diferença de maiúsculas/minúsculas ou sem acentos, ex.: `pereca` para `pereça`) e toca em *"Conferir"*, **Então** cada lacuna correta recebe feedback visual por cor + forma + ícone (`check-circle`), soma `+10 pts` por lacuna e revela o versículo completo com referência e tradução (`RF36`, `RF37`, `RNF06`).
3. **Dado** que todas as passagens configuradas por equipe foram concluídas (ou o banco de passagens selecionado se esgotou), **Quando** o último turno é finalizado, **Então** o sistema registra os pontos das equipes no placar (`ITeamDataSource`) e exibe o resumo final com acesso ao Placar Geral (`RF12`, `RF31`).

---

### História de Usuário 2 — Usar Dica, Tempo Esgotado e Aceite do Líder (Prioridade: P2)

A **Equipe da Vez** pode solicitar uma dica durante a passagem (reduzindo a pontuação da lacuna para `+5 pts`), e o **Líder** pode validar respostas equivalentes durante a conferência.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** uma passagem em andamento, **Quando** a equipe toca em *"Ver Dica"*, **Então** o sistema revela a primeira letra e o número de letras de cada lacuna (ex.: `U _ _ _ _ _ _ _ _`) e marca a dica como usada, fazendo cada lacuna correta valer `+5 pts` em vez de `+10 pts` (`RF35`, `RF37`).
2. **Dado** que o cronômetro atinge `00:00`, **Quando** o tempo se esgota, **Então** o sistema confere automaticamente as respostas marcadas até o momento, marca lacunas erradas ou vazias com cor + forma + ícone (`close-circle`) e revela as palavras corretas, o versículo completo, a referência e a tradução (`RF36`).

---

### História de Usuário 3 — Seleção de Pacotes, Parâmetros e Saída Segura (Prioridade: P2)

O **Líder do PG** pode escolher quais pacotes bíblicos entram no sorteio (`RF28`), definir tempo por passagem (`30s`, `45s`, `60s`) e passagens por equipe (`1` a `5`) (`RF29`), e sair com segurança pausando o cronômetro (`RF11`).

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o Líder desmarca todos os pacotes de passagens, **Quando** tenta iniciar a partida, **Então** o `UseCase` lança `ValidationError` e a `View` exibe a mensagem semântica de erro sem iniciar a partida.
2. **Dado** uma partida em andamento, **Quando** o usuário toca em *"Sair"*, **Então** o cronômetro pausa e um `ConfirmModal` solicita confirmação antes de encerrar e voltar ao Hub (`RF11`).

---

### Casos de Borda (Edge Cases)

- Tentativa de iniciar sem ao menos `2` equipes cadastradas (`ValidationError`).
- Tentativa de iniciar sem nenhum pacote selecionado ou com quantidade de passagens/tempo fora das faixas permitidas (`ValidationError`).
- Submissão com campos vazios ou apenas espaços (`0 pts`, palavra correta revelada).
- Respostas com acentuação omitida, cedilha omitida ou letras maiúsculas/minúsculas misturadas devem ser aceitas como corretas.
- Passagens não podem se repetir na mesma partida (`RF30`); se o banco dos pacotes escolhidos terminar antes das rodadas configuradas, a partida encerra de forma limpa exibindo os resultados acumulados.
- Operação 100% offline usando `MemoryVerseDataSource` e `AsyncStorageTeamDataSource`/`MemoryTeamDataSource`.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-01` (`RF35`)**: Exibir passagem bíblica famosa com `1` a `2` lacunas numeradas em palavras-chave, mantendo a referência oculta durante a resposta, com um `ExpressiveTextField` por lacuna e botão *"Ver Dica"*.
- **`RF-02` (`RF36`)**: Conferir respostas ao tocar em *"Conferir"* ou ao zerar o tempo, normalizando acentos e caixa alta/baixa, revelando palavras corretas, versículo completo, referência e tradução.
- **`RF-03` (`RF37`)**: Pontuar `+10 pts` por lacuna correta sem dica, `+5 pts` com dica e `0 pts` para errada/vazia, somando os pontos da equipe ao placar geral ao fim da partida (`RF31`).
- **`RF-04` (`RF28`, `RF29`, `RF30`)**: Permitir seleção múltipla de pacotes (*Salmos e Provérbios*, *Evangelhos*, *Cartas de Paulo*, *Antigo Testamento*), tempo (`30s`, `45s`, `60s`) e passagens por equipe (`1` a `5`), garantindo sorteio sem repetição e lançando `ValidationError` no `UseCase` para configurações inválidas.
- **`RF-05` (`RF01`, `RF09`, `RF10`, `RF11`)**: Ativar o card **Complete o Versículo** no catálogo do Hub (`/versiculo`), manter passagem de turno entre equipes, alerta crítico nos últimos `10s` do `ExpressiveTimer` e saída segura com `ConfirmModal`.

### Entidades de Domínio Envolvidas (`src/model/entities/`)
- **`VersePack`**: `'Salmos e Provérbios' | 'Evangelhos' | 'Cartas de Paulo' | 'Antigo Testamento'`
- **`VerseBlank`**: `{ index: number; answer: string }`
- **`VersePassage`**: `{ id: string; pack: VersePack; textWithBlanks: string; fullText: string; blanks: VerseBlank[]; reference: string; translation: string }`
- **`VerseBlankResult`**: `{ index: number; userAnswer: string; expectedAnswer: string; isCorrect: boolean; pointsAwarded: number }`
- **`MinigameRoute` / `MinigameIconName` (`minigame.ts`)**: incluir rota `'/versiculo'` e ícone `'book-open-variant'`.

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (IHC / Acessibilidade)**: Todos os alvos interativos respeitam o mínimo de `48 dp × 48 dp` (`64 dp` para ações Jumbo), rótulos `accessibilityLabel` nas lacunas (*"Resposta da lacuna N"*), leitura acessível da referência revelada e feedback combinado por cor + forma + ícone (`RNF06`, `RNF07`, `RNF09`).
- **`CS-02` (Arquitetura MVVM)**: `npm run check` (`check-arquitetura.mjs` + `tsc --noEmit` + `jest`) executa com **0 violações** e todos os testes passando.
