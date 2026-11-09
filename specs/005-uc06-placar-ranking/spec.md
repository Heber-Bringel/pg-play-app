# Especificação da Funcionalidade: UC06 — Placar e Ranking Geral do PG

- **Feature Branch**: `feat/005-uc06-placar-ranking`
- **Criada em**: 2026-11-09
- **Status**: Aprovado
- **Caso de Uso / Requisitos**: `UC06` (`RF16`, `RF17`, `RNF04`, `RNF05`, `RNF07`, `RNF08`, `RNF10`)
- **Milestone / Issue vinculada**: `v0.2.0 — Núcleo & Jogos em 1 Celular (UC01–UC06)` / Issue #14

---

## 1. Cenários de Usuário e Testes (*User Stories*)

### História de Usuário 1 — Consultar Ranking e Destaque do Líder (Prioridade: P1)

Como **Líder / Moderador do PG**, quero visualizar o placar geral das equipes ordenado decrescentemente pela pontuação acumulada e com destaque visual para o 1º colocado, para celebrar a equipe líder da dinâmica.

**Cenários de Aceitação (Dado / Quando / Então)**:

1. **Dado** que existem equipes cadastradas na sessão com pontuações variadas, **Quando** a tela de Placar (`scoreboard`) é aberta, **Então** o sistema deve exibir as equipes ordenadas da maior para a menor pontuação, destacando o 1º colocado com borda `highlight` e ícone de coroa (`crown`).
2. **Dado** que o placar está aberto, **Quando** o Líder concede um ponto bônus (`+10 pts`) para uma equipe, **Então** a pontuação da equipe é incrementada e o ranking é reordenado automaticamente.

---

### História de Usuário 2 — Alternar Jogo ou Zerar Placar do Encontro (Prioridade: P1)

Como **Líder / Moderador do PG**, quero poder retornar ao Hub para escolher outro minigame mantendo os pontos atuais ou zerar o placar de todas as equipes, para conduzir novas rodadas ou iniciar um novo encontro.

**Cenários de Aceitação (Dado / Quando / Então)**:

1. **Dado** que existem equipes com pontos acumulados no placar, **Quando** o Líder toca em *"Zerar Placar do PG"*, **Então** todas as equipes têm sua pontuação redefinida para `0 pts`.
2. **Dado** que o Líder está na tela de Placar, **Quando** toca em *"Escolher Outro Jogo"*, **Então** a ViewModel navega de volta para o Hub (`router.push('/')`) preservando os pontos acumulados.

---

## 2. Casos de Borda e Fluxos de Exceção (*Edge Cases*)

- **Validação de bônus inválido (`ValidationError`)**: tentar conceder bônus para `teamId` vazio/inexistente ou com valor menor ou igual a zero deve lançar `ValidationError`.
- **Lista vazia de equipes (`empty`)**: caso nenhuma equipe esteja cadastrada na sessão, exibir estado vazio com ação para retornar ao Hub.
- **Falha no DataSource (`DataSourceError`)**: exibir mensagem de erro semântica e botão para tentar novamente.

---

## 3. Requisitos Funcionais e Não Funcionais

- **RF16**: Exibir pódio e ranking ordenado de forma decrescente pela pontuação acumulada, aplicando destaque visual (`highlightLeader`) e ícone `crown` ao 1º lugar.
- **RF17**: Permitir retornar ao catálogo mantendo os pontos acumulados (*"Escolher Outro Jogo"*) ou reiniciar as pontuações (*"Zerar Placar do PG"*).
- **RNF10**: 100% das propriedades visuais devem referenciar `src/view/theme.ts` (`tokens`).
