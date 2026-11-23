# 📋 Especificação de Funcionalidade (`spec.md`): UC09 — Quem Sou Eu?

- **Branch da Feature:** `feat/021-uc09-quem-sou-eu`
- **Criado em:** 2026-11-23
- **Status:** Aprovado
- **Caso(s) de Uso / Requisito(s):** `UC09` (`RF32`–`RF34`, `RF09`–`RF12`, `RF24`, `RF28`–`RF31`, `RNF02`, `RNF04`, `RNF06`, `RNF07`, `RNF09`) — Ref.: `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md` e `docs/jogos/quem-sou-eu.md`
- **Issue vinculada:** `#33`

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Jogar turno no modo testa com inclinação ou botões (Prioridade: P1)

Como **Representante da Equipe da Vez**, quero segurar o celular na testa com a tela virada para a minha equipe exibindo uma carta temática genérica (não bíblica), para adivinhar o máximo de cartas dentro do tempo usando o gesto de inclinação ou botões Jumbo na tela.

**Por que esta prioridade:** É o núcleo da dinâmica do *Quem Sou Eu?* no PG PLAY, garantindo diversão presencial em 1 celular compartilhado e acessibilidade completa com alternativa tátil ao gesto.

**Como testar independentemente:** Configurar pelo menos 2 equipes, iniciar a partida de *Quem Sou Eu?*, passar pela tela de passagem de turno e contagem de 3 segundos, registrar acertos e passes por gesto (via `MemoryTiltSensorService`) e pelos botões Jumbo até o fim do turno.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que a partida foi iniciada, **Quando** o representante toca em **"Estou Pronto!"** na tela de passagem de turno, **Então** o sistema executa uma contagem regressiva de `3` segundos e em seguida exibe a primeira carta em tipografia *Display* de alto impacto com o `ExpressiveTimer`.
2. **Dado** que a carta está na tela e o gesto de inclinação está ativado, **Quando** o representante inclina o celular para baixo (ou toca no botão Jumbo **"Acertou!"**), **Então** o app exibe feedback com cor `success` + ícone `check-circle` + texto *"Acertou!"*, soma `+10 pts`, bloqueia novos gestos por `1 s` e sorteia a próxima carta.
3. **Dado** que a carta está na tela, **Quando** o representante inclina o celular para cima (ou toca no botão Jumbo **"Passar"**), **Então** o app exibe feedback com cor `surfaceVariant` + ícone `skip-next` + texto *"Passou"*, mantém a pontuação sem penalidade (`0 pts`), bloqueia novos gestos por `1 s` e sorteia a próxima carta.
4. **Dado** que o cronômetro chegou a `00:00`, **Quando** o turno termina, **Então** a carta atual é descartada sem pontuar e o app exibe o **Resumo do Turno** com as cartas acertadas, as cartas passadas (com dica opcional) e os pontos ganhos no turno.

---

### História de Usuário 2 — Configurar parâmetros e pacotes temáticos genéricos (Prioridade: P1)

Como **Líder do PG**, quero escolher os pacotes de temas genéricos (*Famosos*, *Animais*, *Filmes e Séries*, *Desenhos e Animações*, *Profissões*, *Comidas*, *Objetos do Dia a Dia* e *Lugares do Mundo*), o tempo por turno (`45s`, `60s`, `90s`), o número de rodadas por equipe (`1` a `5`) e ativar/desativar o gesto de inclinação antes de começar.

**Por que esta prioridade:** Permite adaptar a duração, o tema e a acessibilidade da partida ao perfil do Pequeno Grupo (`RF28`, `RF29`, `RF33`).

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o usuário está na tela de configuração do *Quem Sou Eu?*, **Quando** tenta iniciar a partida sem nenhum pacote selecionado ou com menos de `2` equipes cadastradas, **Então** o `UseCase` lança `ValidationError` e a `View` exibe o banner semântico de erro.
2. **Dado** que o gesto de inclinação foi desativado na configuração, **Quando** o celular é inclinado durante o turno, **Então** nada acontece e apenas os botões Jumbo funcionam.

---

### História de Usuário 3 — Consolidar pontuação no Placar Geral e sair com segurança (Prioridade: P2)

Como **Líder do PG**, quero que os pontos de cada turno sejam somados ao Placar Geral do PG ao avançar de turno e que o botão **"Sair"** pause o cronômetro e peça confirmação antes de abandonar a partida.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que todas as rodadas configuradas terminaram (ou o banco de cartas se esgotou), **Quando** o último resumo de turno é concluído, **Então** os pontos acumulados estão registrados no Placar Geral e o card de conclusão oferece **"Ir para o Placar Final"** e **"Jogar Novamente"**.
2. **Dado** que um turno está em andamento, **Quando** o Líder toca em **"Sair"**, **Então** o cronômetro pausa, o sensor de inclinação para de disparar e um `ConfirmModal` solicita confirmação antes de voltar ao Hub.

---

### Casos de Borda (Edge Cases)

- **Menos de 2 equipes cadastradas:** Exibe aviso na tela de configuração com atalho direto **"Gerenciar Equipes"** (`/teams`) e bloqueia o início com `ValidationError`.
- **Nenhum pacote selecionado:** Bloqueia o início com `ValidationError` amigável.
- **Gestos consecutivos muito rápidos:** Cooldown obrigatório de `1000 ms` (`1 s`) após cada gesto para evitar contagem dupla ao retornar o celular à testa.
- **Banco de cartas esgotado antes do fim das rodadas (`RF12`, `RF30`):** Cartas nunca se repetem na mesma partida; ao acabarem as cartas disponíveis, o turno encerra indo ao resumo e, ao avançar, exibe a tela de conclusão com envio ao Placar Final.
- **Tempo crítico (`<= 10s`):** `ExpressiveTimer` entra no Modo Crítico com cor + forma + ícone (`RNF06`).
- **Dispositivo sem acelerômetro / ambiente Web / modo offline (`RNF02`, `RNF03`):** Opera 100% offline com `MemoryQuemSouEuDataSource`; caso o acelerômetro não esteja disponível, o jogo funciona normalmente pelos botões Jumbo sem lançar erro fatal.
- **`Reduce Motion` ativo:** Feedback de acerto/passe não pisca a tela inteira; exibe apenas ícone e texto de confirmação.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF28`**: Selecionar um ou mais pacotes temáticos genéricos por `ExpressiveChip` (nenhum pacote bíblico).
- **`RF29`**: Configurar tempo por turno (`45s`, `60s`, `90s`; padrão `60s`), rodadas por equipe (`1` a `5`; padrão `2`) e ativação do gesto de inclinação (padrão ativado).
- **`RF24`**: Tela de passagem de turno (*"Vez da Equipe [Nome]"*) com instrução de posicionamento na testa e botão **"Estou Pronto!"**.
- **`RF32`**: Contagem de `3` segundos seguida pela exibição da carta genérica em tipografia *Display* de alto impacto, legível à distância.
- **`RF33`**: Registrar acerto (inclinar para baixo) e passe (inclinar para cima) via `ITiltSensorService` com cooldown de `1 s`, além de botões Jumbo equivalentes e opção de desativar o gesto.
- **`RF34`**: Somar `+10 pts` por acerto, `0 pts` no passe (sem penalidade), descartar a carta atual ao zerar o tempo e exibir resumo do turno com cartas acertadas, passadas e dicas opcionais.
- **`RF10`, `RF11`, `RF12`, `RF30`, `RF31`**: Cronômetro expressivo com modo crítico, saída com confirmação e pausa, não repetição de cartas, tratamento de banco esgotado e envio de pontos ao Placar Geral.

### Entidades de Domínio Envolvidas (`src/model/entities/`)
- **`QuemSouEuPack`**: União literal dos 8 temas genéricos (`'Famosos' | 'Animais' | 'Filmes e Séries' | 'Desenhos e Animações' | 'Profissões' | 'Comidas' | 'Objetos do Dia a Dia' | 'Lugares do Mundo'`).
- **`QuemSouEuCard`**: `{ id: string; name: string; pack: QuemSouEuPack; hint?: string }`.
- **`QuemSouEuMatchConfig`**: `{ packs: QuemSouEuPack[]; durationSeconds: QuemSouEuDurationOption; roundsPerTeam: number; tiltEnabled: boolean }`.
- **`QuemSouEuCardResult`**: `{ card: QuemSouEuCard; outcome: 'hit' | 'pass'; pointsAwarded: number }`.
- **`TiltGesture`**: `'hit' | 'pass'`.

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (Conteúdo Genérico)**: 100% das cartas pertencem aos 8 temas genéricos; zero conteúdo bíblico.
- **`CS-02` (IHC / Acessibilidade)**: Alvos mínimos `48 dp × 48 dp` (`64 dp` nos botões Jumbo de Acerto e Passe), espaçamento `>= 8 dp`, feedback combinando cor + forma + ícone, suporte a `allowFontScaling` e respeito a `Reduce Motion`.
- **`CS-03` (Arquitetura MVVM & Testes)**: `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest`) executa com **0 violações** e todos os testes aprovados.
