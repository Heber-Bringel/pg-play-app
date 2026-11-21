# 🏗️ Plano de Implementação Técnica (`plan.md`): Melhorias de UI/UX e Animações Expressivas no Cidade Dorme

- **Branch:** `feat/020-uc07-cidade-dorme-ui-ux-animacoes`
- **Data:** 2026-11-21
- **Especificação de Origem:** `specs/020-uc07-cidade-dorme-ui-ux-animacoes/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

Implementar as melhorias visuais, informativas e de animação expressiva da **Issue `#56`** no **Cidade Dorme (`UC07`)**, preservando integralmente o domínio (`src/model/`), a infraestrutura (`src/infra/`), os casos de uso (`src/usecase/`) e as 7 camadas do **MVVM Sofisticado**:

1. **Conformidade de Camada para `reduceMotion` (`RNF09`):** Como `scripts/check-arquitetura.mjs` (`VIEWMODEL-IMPORT-PROIBIDO`) proíbe `src/viewmodel/` de importar `react-native`, o `useCidadeDormeViewModel.ts` gerencia o estado reativo `reduceMotion: boolean` (padrão `false`) e expõe `actions.handleSetReduceMotion(enabled: boolean)`, além de derivar `phaseTimeline`, `aliveCount` e `eliminatedCount` a partir dos dados públicos de `room`. A tela `src/view/cidade-dorme.tsx` consulta `AccessibilityInfo.isReduceMotionEnabled()` e assina o listener `AccessibilityInfo.addEventListener('reduceMotionChanged', ...)` em um `useEffect`, sincronizando o estado com `actions.handleSetReduceMotion`.
2. **Alinhamento ao Design System (`Issue #55`):** Documentar e alinhar previamente os novos componentes visuais em `design-system/04-componentes/` (linha do tempo de fases e painel/avatares/progresso do Cidade Dorme) reutilizando exclusivamente os tokens existentes em `src/view/theme.ts` (`tokens`, `darkTokens`, `semantic.motion.*`, `semantic.radius.*`, `semantic.color.*`), sem adicionar cores literais e sem quebrar o trabalho paralelo da Issue `#55`.
3. **Componentes Visuais Puros (`src/view/components/`):**
   - `cidadeDormePhaseTimeline.tsx` (`CidadeDormePhaseTimeline`): trilha `Noite → Amanhecer → Debate → Votação` com rodada atual e suporte a modo claro/escuro (`tokens`/`darkTokens`) e `reduceMotion`.
   - `cidadeDormeCityPanel.tsx` (`CidadeDormeCityPanel`): resumo `"Vivos X · Eliminados Y"`, grade de avatares (eliminados esmaecidos com `ghost-outline` e rótulo `"Eliminado"`, sem revelar papéis até `finished`) e barra visual de progresso para `"Prontos X/Y"` ou `"Votos X/Y"`.
   - Evolução de `selectableOptionItem.tsx` e `expressiveTimer.tsx` para receber prop opcional `reduceMotion?: boolean` (mantendo compatibilidade retroativa com chamadas existentes) e adicionar escala suave (`tokens.semantic.motion.spring.effects`) ao selecionar opção.
   - Evolução de `cidade-dorme.tsx`, `cidadeDormeRoleSection.tsx`, `cidadeDormeNightSection.tsx` e `cidadeDormeDaySection.tsx` com animações `Animated` orientadas pelos tokens `motion.*` e respeito integral a `reduceMotion` e `RNF11`.

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo devem estar marcados antes de gerar o `tasks.md` ou iniciar código.*

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada com os requisitos `RF-56-01` a `RF-56-07` e `UC07`.
- [x] **Artigo II (MVVM 7 Pastas)**: Todos os arquivos planejados em `src/` residem apenas em `viewmodel` e `view` (`src/view/cidade-dorme.tsx` e `src/view/components/`), sem alterar `model`, `infra`, `usecase`, `di` ou `app/cidade-dorme.tsx`.
- [x] **Artigo II (Rotas Finas e View Burra)**: `src/app/cidade-dorme.tsx` permanece como rota fina de 2 linhas; a ViewModel deriva `phaseTimeline`, `aliveCount`, `eliminatedCount` e gerencia `reduceMotion`; componentes em `src/view/components/` recebem apenas `props` e nunca importam `viewmodel`.
- [x] **Artigo II (Vocabulário)**: Nenhum arquivo, tipo, interface ou classe utiliza `Repository` ou `Connector`.
- [x] **Artigo III (Design System)**: 100% das cores, raios, espaçamentos e parâmetros de mola/duração usam tokens de `@/view/theme` (`tokens`, `darkTokens`, `semantic.motion.*`); zero cores literais fora de `src/view/theme.ts`; componentes alinhados em `design-system/04-componentes/`.
- [x] **Artigo IV (Testabilidade Offline)**: Toda a lógica de estado e renderização animada é testada com Jest + `react-test-renderer` usando mocks determinísticos (`AccessibilityInfo`, `Animated`) e `Memory*`, sem dependência de rede.

---

## 3. Mapeamento de Arquivos nas Camadas do MVVM

> **Sem alterações previstas em:** `src/model/`, `src/infra/`, `src/usecase/`, `src/di/` e `src/app/`.

```text
design-system/
└─ 04-componentes/
   └─ cidade-dorme-visual.md                        # Especificação visual alinhada à #55 para Linha do Tempo, Painel da Cidade e barras de progresso

src/
├─ viewmodel/
│  └─ useCidadeDormeViewModel.ts                    # Expõe reduceMotion, phaseTimeline, aliveCount, eliminatedCount e handleSetReduceMotion
└─ view/
   ├─ cidade-dorme.tsx                              # Lê AccessibilityInfo.isReduceMotionEnabled(), anima transição Noite <-> Dia (motion.spring.spatial) e renderiza Timeline + Painel
   └─ components/
      ├─ cidadeDormePhaseTimeline.tsx               # Novo componente puro: trilha Noite -> Amanhecer -> Debate -> Votação + ciclo atual
      ├─ cidadeDormeCityPanel.tsx                   # Novo componente puro: contador "Vivos X · Eliminados Y", grade de avatares e barra de progresso Prontos/Votos
      ├─ selectableOptionItem.tsx                   # Suporte a reduceMotion e animação de escala suave (motion.spring.effects) ao selecionar
      ├─ expressiveTimer.tsx                        # Prop opcional reduceMotion?: boolean para desativar pulso crítico quando Reduzir Movimento está ativo (RNF09)
      ├─ cidadeDormeRoleSection.tsx                 # Animação de virada (flip) na revelação/ocultação, barra de prontos e ícone por papel
      ├─ cidadeDormeNightSection.tsx                # Transição suave da legenda do Narrador (sem diferenciar telas à noite — RNF11) e veredito do Detetive alinhado
      └─ cidadeDormeDaySection.tsx                  # Entrada animada do Boletim do Amanhecer, escudo do Anjo, barras animadas no vote_result e stagger + ícones por papel em finished

tests/
├─ __mocks__/react-native.tsx                       # Adiciona AccessibilityInfo (isReduceMotionEnabled / addEventListener) e Animated.parallel / Animated.stagger / interpolate se necessários
├─ hooks/useCidadeDormeViewModel.test.ts            # Testa phaseTimeline em todas as fases, aliveCount, eliminatedCount e handleSetReduceMotion
├─ components/
│  ├─ selectableOptionItem.test.tsx                 # Testa comportamento com reduceMotion true/false
│  └─ cidadeDormeVisuals.test.tsx                   # Testa CidadeDormePhaseTimeline e CidadeDormeCityPanel (claro/escuro, sem vazar papéis)
└─ mocks/cidadeDormeScreen.mock.test.tsx            # Testa timeline, painel da cidade, barras de votação sem expor votantes, paridade noturna (RNF11) e reduceMotion (RNF09)
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento da Tela | Componente (`@/view/components/`) | Tokens Semânticos (`@/view/theme`) |
| :--- | :--- | :--- |
| Transição Noite ↔ Dia (fundo e badge) | `CidadeDormeScreen` (`Animated.View`) | `tokens.semantic.color.surface`, `darkTokens.semantic.color.surface`, `tokens.semantic.motion.spring.spatial` |
| Linha do tempo das fases (`Noite → Amanhecer → Debate → Votação`) | `CidadeDormePhaseTimeline` | `tokens.semantic.color.action`, `actionContainer`, `surfaceVariant`, `outline`, `tokens.semantic.radius.full` / `md`, `darkTokens.*` |
| Painel da cidade (`Vivos X · Eliminados Y` + grade de avatares + barra de progresso) | `CidadeDormeCityPanel` | `tokens.component.card.*`, `tokens.semantic.color.surfaceVariant`, `disabledBg`, `disabledText`, `action`, `actionContainer`, `darkTokens.*` |
| Virada da carta de papel secreto (`role_reveal`) | `CidadeDormeRoleSection` (`Animated.View`) | `tokens.component.card.*`, `tokens.semantic.motion.spring.spatial`, `tokens.semantic.color.success` / `errorContainer` |
| Seleção de alvo / voto com escala e *shape morphing* | `SelectableOptionItem` (`Animated.View`) | `tokens.component.quiz.*`, `tokens.semantic.radius.md` / `lg`, `tokens.semantic.motion.spring.effects` |
| Boletim do Amanhecer (entrada de cima + escudo do Anjo) | `CidadeDormeDaySection` (`Animated.View`) | `tokens.component.card.*`, `tokens.semantic.color.success`, `tokens.semantic.motion.spring.spatial`, `tokens.semantic.motion.duration.medium` |
| Resultado da Votação (barras animadas agregadas) | `CidadeDormeDaySection` | `tokens.semantic.color.action`, `actionContainer`, `highlight`, `surfaceVariant`, `tokens.semantic.radius.sm` / `full`, `tokens.semantic.motion.duration.medium` |
| Fim de Jogo (destaque vencedor + revelação sequencial com ícones por papel) | `CidadeDormeDaySection` | `tokens.semantic.color.highlight`, `errorContainer`, `actionContainer`, `tokens.semantic.motion.duration.short` / `medium` |
| Legenda do Narrador (troca animada *fade/slide*) | `CidadeDormeRoleSection`, `CidadeDormeNightSection`, `CidadeDormeDaySection` | `tokens.semantic.color.actionContainer`, `darkTokens.semantic.color.actionContainer`, `tokens.semantic.motion.duration.short` |
| Cronômetro Crítico respeitando `reduceMotion` | `ExpressiveTimer` | `tokens.component.timer.*`, `tokens.semantic.motion.spring.spatial` |

---

## 5. Estratégia de Testes (`tests/`)

- **Testes de Hook (`tests/hooks/useCidadeDormeViewModel.test.ts`):**
  - Verificar `state.phaseTimeline` marcando corretamente `night`, `dawn`, `debate` e `voting` ao longo do ciclo completo da partida.
  - Verificar `state.aliveCount` e `state.eliminatedCount` após eliminações na noite e na votação.
  - Verificar `state.reduceMotion` (padrão `false`) e atualização via `actions.handleSetReduceMotion(true)`.
- **Testes de Componentes (`tests/components/cidadeDormeVisuals.test.tsx` e `selectableOptionItem.test.tsx`):**
  - Validar `CidadeDormePhaseTimeline` nos temas `light` e `dark`, destacando a fase ativa e exibindo o número da rodada.
  - Validar `CidadeDormeCityPanel` exibindo `"Vivos X · Eliminados Y"`, barra de progresso (`Prontos X/Y` ou `Votos X/Y`), avatares esmaecidos para eliminados e **nenhum** texto ou ícone de papel secreto durante a partida.
  - Validar `SelectableOptionItem` e `ExpressiveTimer` com `reduceMotion={true}` sem disparar animações `Animated.spring`.
- **Testes de Tela com Mocks (`tests/mocks/cidadeDormeScreen.mock.test.tsx`):**
  - Validar renderização de `CidadeDormePhaseTimeline` e `CidadeDormeCityPanel` em `CidadeDormeScreen`.
  - **Paridade noturna (`RNF11`)**: renderizar o mesmo estado de `night_angel` para o Anjo (jogador ativo) e para um Cidadão (dormindo) e assegurar que cabeçalho, timeline, painel da cidade, legenda e cronômetro permanecem idênticos e sem revelar papéis.
  - **Sigilo de voto (`RNF11`)**: em `vote_result`, validar exibição das barras e totais numéricos (`voteReport.voteCounts` e `skipCount`) sem renderizar quem votou em quem.
  - **Redução de movimento (`RNF09`)**: mockar `AccessibilityInfo.isReduceMotionEnabled` retornando `true` e verificar que `Animated.spring` / `Animated.timing` não são executados nas transições.
  - **Ícones por papel e Modo Espectador (`RNF06`)**: validar ícones distintos por papel na revelação e no resumo final e destaque do selo `"Você foi eliminado — Acompanhe em silêncio"`.
