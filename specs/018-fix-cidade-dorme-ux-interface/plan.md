# 🏗️ Plano de Implementação Técnica (`plan.md`): Ajustes de Interface e Experiência (IHC) no Cidade Dorme

- **Branch:** `fix/018-cidade-dorme-ux-interface`
- **Data:** 2026-11-19
- **Especificação de Origem:** `specs/018-fix-cidade-dorme-ux-interface/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

Aplicar os 7 refinamentos de interface e experiência do **Cidade Dorme (`Issue #43`)** mantendo 100% de aderência ao **Design System PG Play Expressive** e às 7 camadas do **MVVM Sofisticado**:
1. Criar o componente reutilizável acessível `SelectableOptionItem` (`src/view/components/selectableOptionItem.tsx`) suportando modo claro (`tokens`) e escuro (`darkTokens`), prefixo numérico (`1..16`) ou ícone (`hand-back-left-outline` para abstenção), alvo `>= 56 dp` e *shape morphing* sem quebrar `QuizOption` (`UC04`);
2. Atualizar `useCidadeDormeViewModel` (`src/viewmodel/useCidadeDormeViewModel.ts`) para aplicar timeout de `10 s` em `handleCreateRoom` / `handleJoinRoom` (com erro recuperável e limpeza de timer) e derivar `secondsRemaining` de `room.phaseEndsAt` (integrado à `#41`);
3. Atualizar `src/view/cidade-dorme.tsx` (cabeçalho contextual por fase) e os 4 componentes de seção (`cidadeDormeEntrySection.tsx` com `ActivityIndicator`, `cidadeDormeLobbySection.tsx` com aviso na aba Parâmetros, `cidadeDormeNightSection.tsx` substituindo a lista pelo veredito do Detetive e usando `SelectableOptionItem` escuro, e `cidadeDormeDaySection.tsx` corrigindo os ícones do Dia/Votação e usando `SelectableOptionItem` claro + ícone próprio em *"Abster-se / Pular Voto"*).

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo devem estar marcados antes de gerar o `tasks.md` ou iniciar código.*

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada com os 7 pontos de UX/IHC da Issue `#43`.
- [x] **Artigo II (MVVM 7 Pastas)**: Todos os arquivos planejados residem apenas em `viewmodel` e `view` (`src/view/components/` e `src/view/cidade-dorme.tsx`), preservando rota fina em `src/app/cidade-dorme.tsx`.
- [x] **Artigo II (Rotas Finas e View Burra)**: Toda lógica de timeout e cálculo de cronômetro fica em `useCidadeDormeViewModel`; componentes recebem exclusivamente `props`.
- [x] **Artigo II (Vocabulário)**: Nenhum arquivo, interface ou classe usa termos proibidos.
- [x] **Artigo III (Design System)**: 100% dos estilos e cores (inclusive `ActivityIndicator`) usam exclusivamente `tokens` e `darkTokens` de `@/view/theme`, com alvos `>= 48 dp` (`>= 56 dp` nas opções de seleção) e cor + forma + ícone.
- [x] **Artigo IV (Testabilidade Offline)**: Timeout de `10 s`, cálculo de `phaseEndsAt` e estados de UI são cobertos com testes determinísticos sem rede.

---

## 3. Mapeamento de Arquivos nas Camadas do MVVM

```text
src/
├─ viewmodel/
│  └─ useCidadeDormeViewModel.ts                  # Timeout de 10s em criar/entrar sala + sincronia de secondsRemaining via phaseEndsAt
└─ view/
   ├─ cidade-dorme.tsx                            # Cabeçalho contextual: Lobby / Revelação / A Noite N / O Dia N / Fim de Jogo
   └─ components/
      ├─ selectableOptionItem.tsx                 # Novo componente acessível (>= 56dp) com numeração 1..16 ou ícone próprio e suporte light/dark
      ├─ cidadeDormeEntrySection.tsx              # ActivityIndicator + mensagem de progresso durante loading
      ├─ cidadeDormeLobbySection.tsx              # Aviso "Somente o moderador altera os parâmetros" + resumo legível na aba Parâmetros
      ├─ cidadeDormeNightSection.tsx              # Usa SelectableOptionItem (darkTokens); card de veredito substitui lista do Detetive
      └─ cidadeDormeDaySection.tsx                # Usa SelectableOptionItem (tokens) com ícone próprio em Abster-se + ícones weather-sunny e vote-outline
tests/
├─ __mocks__/react-native.tsx                     # Garante exportação de ActivityIndicator para os testes Jest
├─ components/selectableOptionItem.test.tsx       # Testes RNTL de acessibilidade, tema claro/escuro, seleção numérica e ícone
├─ hooks/useCidadeDormeViewModel.test.ts          # Testes de timeout de 10s ao criar/entrar e sincronia de cronômetro por phaseEndsAt
└─ mocks/cidadeDormeScreen.mock.test.tsx          # Atualiza e adiciona asserções para cabeçalho, letras/números, veredito, aviso e ícones
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento da Tela | Componente (`@/view/components/`) | Tokens Semânticos (`@/view/theme`) |
| :--- | :--- | :--- |
| Cabeçalho contextual por fase | Badge em `src/view/cidade-dorme.tsx` | `tokens.semantic.color.actionContainer`, `darkTokens.semantic.color.actionContainer`, `radius.full` |
| Opções de jogadores (Noite / Dia) e Abstenção | `SelectableOptionItem` | `tokens.component.quiz.minHeight` (`56`), `tokens.semantic.color.actionContainer`, `darkTokens.semantic.color.actionContainer`, `tokens.semantic.radius.lg` / `radius.md` |
| Indicador de progresso ao criar/entrar na sala | `ActivityIndicator` (`cidadeDormeEntrySection.tsx`) | `tokens.semantic.color.action`, `tokens.semantic.space.sm` |
| Aviso de permissão na aba Parâmetros (convidado) | Container informativo (`cidadeDormeLobbySection.tsx`) | `tokens.semantic.color.actionContainer`, `tokens.semantic.color.onActionContainer`, `tokens.semantic.radius.lg` |
| Cards de Amanhecer e Fase 3 Votação | `GameCard` (`cidadeDormeDaySection.tsx`) | `tokens.component.card.*` com ícones `weather-sunny` e `vote-outline` |

---

## 5. Estratégia de Testes (`tests/`)

- **Testes de Componente (`tests/components/selectableOptionItem.test.tsx`):**
  - Validar renderização numérica (`1..16`) sem repetição `A–D`, renderização com ícone próprio (`hand-back-left-outline`), estado `selected` nos temas `light` (`tokens`) e `dark` (`darkTokens`), e altura mínima `>= 56 dp`.
- **Testes de Hook (`tests/hooks/useCidadeDormeViewModel.test.ts`):**
  - Com `jest.useFakeTimers()`, simular promise pendente por `10_000 ms` em `handleCreateRoom` e confirmar `loading === false` + mensagem amigável em `state.error`.
  - Testar cálculo consistente de `secondsRemaining` a partir de `room.phaseEndsAt`.
- **Testes de Tela (`tests/mocks/cidadeDormeScreen.mock.test.tsx`):**
  - Validar cabeçalho `"PIN XXXX · Lobby"` em `lobby` e `"PIN XXXX · Revelação"` em `role_reveal` (em vez de `"O Dia 1"`).
  - Validar ausência de letras repetidas `A–D` e ícone próprio em *"Abster-se / Pular Voto"*.
  - Validar aviso `"Somente o moderador altera os parâmetros"` na aba Parâmetros para convidados.
  - Validar que quando `detectiveVerdict` existe, a lista de suspeitos não é renderizada.
  - Validar ícones `weather-sunny` (Amanhecer) e `vote-outline` (Fase 3 · Votação Secreta).
