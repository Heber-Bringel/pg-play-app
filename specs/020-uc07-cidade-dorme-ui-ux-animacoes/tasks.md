# ✅ Lista de Tarefas (`tasks.md`): Melhorias de UI/UX e Animações Expressivas no Cidade Dorme

- **Input:** `specs/020-uc07-cidade-dorme-ui-ux-animacoes/spec.md` e `specs/020-uc07-cidade-dorme-ui-ux-animacoes/plan.md`
- **Ordem de Execução Obrigatória:** De dentro para fora (`design-system` → `viewmodel` → `components` → `view` → `tests` → `npm run check`)
- **Receitas do Harness:** `/nova-tela`, `/revisar-arquitetura`, `/commit-e-pr`
- **Status:** ⏸️ **Aguardando aprovação humana** antes de iniciar implementação em `src/`

---

## Fase 1: Alinhamento de Design System (`design-system/`)
*Objetivo: Especificar os novos padrões visuais do Cidade Dorme em `design-system/04-componentes/` usando exclusivamente tokens existentes em `src/view/theme.ts`, alinhados à Issue `#55`.*

- [ ] **T001** Documentar a especificação de `CidadeDormePhaseTimeline`, `CidadeDormeCityPanel` e barras de progresso/avatares em `design-system/04-componentes/cidade-dorme-visual.md` (reutilizando tokens semânticos de `design-system/02-tokens.md`, contraste WCAG e `RNF09`/`RNF11`, sem criar cores literais nem conflitar com a Issue `#55`)

---

## Fase 2: ViewModel — Estado de Acessibilidade (`reduceMotion`), Linha do Tempo e Contadores (`src/viewmodel/`)
*Objetivo: Expor os dados públicos de ciclo, contagens e flag `reduceMotion` em `useCidadeDormeViewModel.ts` mantendo isolamento de `react-native`.*

- [ ] **T002** Definir `CidadeDormeTimelineStepId` e `CidadeDormeTimelineStep` e derivar `phaseTimeline`, `aliveCount` e `eliminatedCount` em `src/viewmodel/useCidadeDormeViewModel.ts` (apenas a partir de `room.phase`, `room.currentRound` e `room.players[i].isAlive`, sem expor dados secretos — `RNF11`)
- [ ] **T003** Adicionar `reduceMotion: boolean` ao `CidadeDormeState` e `handleSetReduceMotion: (enabled: boolean) => void` ao `CidadeDormeActions` em `src/viewmodel/useCidadeDormeViewModel.ts`

---

## Fase 3: Componentes Visuais Puros e Suporte a `reduceMotion` (`src/view/components/`)
*Objetivo: Criar a linha do tempo e o painel da cidade e adaptar os componentes reutilizáveis às animações com `tokens.semantic.motion.*` e `RNF09`.*

- [ ] **T004** Criar `CidadeDormePhaseTimeline` em `src/view/components/cidadeDormePhaseTimeline.tsx` (exibindo `Noite → Amanhecer → Debate → Votação`, etapa ativa com cor + forma + ícone, número da rodada e suporte a `tokens` / `darkTokens`)
- [ ] **T005** Criar `CidadeDormeCityPanel` em `src/view/components/cidadeDormeCityPanel.tsx` (contador `"Vivos X · Eliminados Y"`, grade de avatares com eliminados esmaecidos via `ghost-outline` + rótulo `"Eliminado"` sem revelar papel secreto, e barra visual de progresso para `"Prontos X/Y"` ou `"Votos X/Y"`)
- [ ] **T006** Atualizar `src/view/components/selectableOptionItem.tsx` (escala suave com `tokens.semantic.motion.spring.effects` + prop `reduceMotion?: boolean`) e `src/view/components/expressiveTimer.tsx` (prop `reduceMotion?: boolean` para suprimir pulso crítico quando ativo — `RNF09`)

---

## Fase 4: Animações e Informação Visual na Tela e Seções (`src/view/`)
*Objetivo: Integrar linha do tempo, painel da cidade, leitura de `AccessibilityInfo` e animações expressivas em todas as fases sem quebrar o sigilo noturno.*

- [ ] **T007** Atualizar `src/view/cidade-dorme.tsx` para ler `AccessibilityInfo.isReduceMotionEnabled()` + assinar `reduceMotionChanged` (atualizando `actions.handleSetReduceMotion`), animar a transição Noite ↔ Dia com `tokens.semantic.motion.spring.spatial` e renderizar `CidadeDormePhaseTimeline` e `CidadeDormeCityPanel` nas fases ativas
- [ ] **T008** Atualizar `src/view/components/cidadeDormeRoleSection.tsx` (virada animada da carta de papel respeitando `reduceMotion`, barra visual de prontos e ícone específico por papel) e `src/view/components/cidadeDormeNightSection.tsx` (troca animada *fade/slide* na legenda do Narrador sem distinguir celulares à noite — `RNF11`, veredito do Detetive alinhado à doc e destaque do selo de espectador)
- [ ] **T009** Atualizar `src/view/components/cidadeDormeDaySection.tsx` para animar a entrada do Boletim do Amanhecer (escudo do Anjo quando salvo), barras horizontais sequenciais em `vote_result` (somente contagem agregada por candidato/abstenção), barras de progresso de votos em `day_voting`, revelação sequencial (*stagger*) com ícone por papel em `finished` e troca animada na legenda do Narrador

---

## Fase 5: Testes Automatizados, Verificação Arquitetural e Pull Request (`tests/`)
*Objetivo: Garantir cobertura de movimento, sigilo noturno, acessibilidade e conformidade do Harness MVVM.*

- [ ] **T010** Atualizar `tests/__mocks__/react-native.tsx` (mock de `AccessibilityInfo` e métodos `Animated` necessários) e atualizar `tests/hooks/useCidadeDormeViewModel.test.ts` testando `phaseTimeline`, `aliveCount`, `eliminatedCount` e `handleSetReduceMotion`
- [ ] **T011** Criar `tests/components/cidadeDormeVisuals.test.tsx`, atualizar `tests/components/selectableOptionItem.test.tsx` e atualizar `tests/mocks/cidadeDormeScreen.mock.test.tsx` (validando timeline, painel sem vazar papel, barras de votação sem expor votantes, paridade visual à noite `RNF11`, ícones por papel e desativação de animações quando `reduceMotion === true`)
- [ ] **T012** Executar `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest --passWithNoTests`) confirmando **0 violações**, e abrir Pull Request via `/commit-e-pr` vinculando `Closes #56`
