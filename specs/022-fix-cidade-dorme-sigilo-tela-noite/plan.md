# 🏗️ Plano de Implementação Técnica (`plan.md`): Correção de Sigilo da Tela Noturna no Cidade Dorme (`RNF11`)

- **Branch:** `fix/022-cidade-dorme-sigilo-tela-noite`
- **Data:** 2026-11-22
- **Especificação de Origem:** `specs/022-fix-cidade-dorme-sigilo-tela-noite/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

Eliminar o vazamento visual de papel durante os turnos noturnos do **Cidade Dorme (`UC07`, Issue `#66`)** mantendo intactas as camadas de domínio (`src/model/`), infraestrutura (`src/infra/`) e casos de uso (`src/usecase/`), atuando na **ViewModel** (`src/viewmodel/`) e na **View** (`src/view/`):
1. Em `src/viewmodel/useCidadeDormeViewModel.ts`: adicionar o estado `isNightCardRevealed: boolean` (sempre `false` ao entrar em qualquer fase noturna) e as ações `handleToggleNightCardVisibility` e `handleHideNightCard`. Após a confirmação do Assassino ou Anjo, `isNightCardRevealed` volta imediatamente a `false`; após a investigação do Detetive, agenda um timer seguro (de `4_000 ms`, registrado em `activeTimeoutsRef`) que fecha o veredito automaticamente se o jogador não tiver tocado em `"Ocultar Tela Noturna"` antes.
2. Em `src/view/cidade-dorme.tsx` e `src/view/components/cidadeDormeNightSection.tsx`: transformar o bloco noturno em um cartão único camuflado enquanto `isNightCardRevealed === false`, garantindo que qualquer jogador vivo (ativo no turno ou dormindo) renderize exatamente a mesma estrutura, textos, altura mínima (`minHeight`) e botão (`"Tocar para Consultar Turno"`), sem diferença alguma na árvore renderizada antes do toque.

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo devem estar marcados antes de gerar o `tasks.md` ou iniciar código.*

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada com os requisitos `RF-66-01` a `RF-66-05` e `RNF11`.
- [x] **Artigo II (MVVM 7 Pastas)**: Todas as alterações residem exclusivamente em `src/viewmodel/useCidadeDormeViewModel.ts`, `src/view/cidade-dorme.tsx` e `src/view/components/cidadeDormeNightSection.tsx`.
- [x] **Artigo II (Rotas Finas e View Burra)**: `src/app/cidade-dorme.tsx` permanece com 2 linhas; todo controle de estado (`isNightCardRevealed`) e timer de auto-ocultação (`4 s`) ficam na `ViewModel`; `CidadeDormeNightSection` apenas renderiza `props` e dispara callbacks.
- [x] **Artigo II (Vocabulário)**: Nenhum uso de `Repository` ou `Connector`.
- [x] **Artigo III (Design System)**: Estilos usam apenas `darkTokens` (`src/view/theme.ts`) e componentes oficiais (`ExpressiveButton`, `SelectableOptionItem`, `ExpressiveTimer`, `GameCard`), sem cores literais e com alvos `>= 48 dp` (`64 dp` nos botões Jumbo).
- [x] **Artigo IV (Testabilidade Offline)**: Paridade noturna e temporizadores testáveis 100% offline com `jest.useFakeTimers()`, RNTL / `react-test-renderer` e `Memory*`.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

> **Sem alterações previstas em:** `src/model/`, `src/infra/`, `src/usecase/`, `src/di/` e `src/app/`.

```text
src/
├─ viewmodel/
│  └─ useCidadeDormeViewModel.ts                  # Estado isNightCardRevealed, ações handleToggleNightCardVisibility / handleHideNightCard, reset por fase e auto-ocultação pós-ação/veredito
└─ view/
   ├─ cidade-dorme.tsx                            # Repassa isNightCardRevealed, onToggleNightCardVisibility e onHideNightCard para CidadeDormeNightSection
   └─ components/
      └─ cidadeDormeNightSection.tsx              # Cartão comum camuflado idêntico antes do toque; visão condicional privada (alvos, veredito ou aviso neutro) com mesma minHeight após toque

tests/
├─ hooks/
│  └─ useCidadeDormeViewModel.test.ts             # Testa isNightCardRevealed, retorno imediato após Assassino/Anjo, auto-ocultação após 4s no Detetive e reset na troca de fase
└─ mocks/
   └─ cidadeDormeScreen.mock.test.tsx             # Compara toJSON() de quem age vs quem dorme antes do toque (paridade estrita RNF11) e valida consulta/ocultação
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento da Tela | Componente (`@/view/components/`) | Tokens Semânticos (`@/view/theme`) |
| :--- | :--- | :--- |
| Cartão noturno comum (`!isNightCardRevealed`) | `CidadeDormeNightSection` (`View` + `MaterialCommunityIcons` + `ExpressiveButton`) | `darkTokens.component.card.*`, `darkTokens.semantic.color.onSurface`, `onSurfaceMuted`, `border.thin`, `space['3xl']` |
| Botão `"Tocar para Consultar Turno"` | `ExpressiveButton` (`variant="tonal"`, `icon="eye-outline"`) | `darkTokens.semantic.color.actionContainer`, `button.minHeight` (`>= 48 dp`) |
| Botão `"Ocultar Tela Noturna"` | `ExpressiveButton` (`variant="outlined"`, `icon="eye-off-outline"`) | `darkTokens.semantic.color.outline`, `button.minHeight` (`>= 48 dp`) |
| Lista de alvos / aviso neutro | `SelectableOptionItem` (`themeMode="dark"`) e container com `minHeight` compartilhada | `darkTokens.component.quiz.*`, `darkTokens.semantic.color.actionContainer` |
| Veredito do Detetive | `CidadeDormeNightSection` (`verdictCard`) | `darkTokens.semantic.color.errorContainer`, `success`, `radius.sm` / `md` |

---

## 5. Detalhamento da Paridade Visual Noturna (`RNF11`)

1. **Antes do toque (`isNightCardRevealed === false`) para jogadores vivos:**
   - **Nenhuma** prop visual do cartão comum depende de `currentPlayer.role`, `isMyActiveTurn`, `hasSubmittedNightAction`, `hasVerdictThisRound` ou `eligibleTargets.length`.
   - Dessa forma, para qualquer dois jogadores vivos na mesma sala e turno noturno, `CidadeDormeNightSection` produz **árvore React/JSON idêntica** até que o próprio jogador toque em `"Tocar para Consultar Turno"`.
2. **Altura consistente (`minHeight`):**
   - Definir uma `minHeight` compartilhada (calculada com tokens de `darkTokens.semantic.space` — ex.: `darkTokens.semantic.space['3xl'] * 4` = `256 dp`) tanto no cartão fechado quanto no container aberto (seja na mensagem neutra `"Não é seu turno de ação — mantenha os olhos fechados"` ou no conteúdo ativo), reduzindo disparidades perceptíveis de layout.
3. **Auto-ocultação segura na ViewModel:**
   - Manter uma `ref` específica `nightHideTimeoutRef` (além de limpar no unmount junto a `activeTimeoutsRef`) para cancelar o timer de `4_000 ms` se o jogador tocar em `"Ocultar Tela Noturna"`, mudar de turno ou sair da partida antes do prazo.

---

## 6. Estratégia de Testes (`tests/`)

- **Testes de Hook (`tests/hooks/useCidadeDormeViewModel.test.ts`):**
  - Validar que `isNightCardRevealed` inicia `false`.
  - Validar `handleToggleNightCardVisibility` e `handleHideNightCard`.
  - Validar que `handleConfirmAssassinTarget` e `handleConfirmAngelProtection` definem `isNightCardRevealed = false` após sucesso.
  - Validar com `jest.useFakeTimers()` que `handleConfirmDetectiveInvestigation` mantém `isNightCardRevealed = true` para leitura do veredito e volta para `false` automaticamente após `4_000 ms`.
  - Validar reset de `isNightCardRevealed = false` quando a fase muda (`night_assassin` → `night_angel`).
- **Testes de Tela com Mocks (`tests/mocks/cidadeDormeScreen.mock.test.tsx`):**
  - **Asserção estrutural de sigilo (`RNF11`):** Renderizar `CidadeDormeScreen` para o Assassino e para um Cidadão em `night_assassin` (e repetir para Anjo e Detetive) com `isNightCardRevealed: false` e garantir `expect(actorTree).toEqual(sleeperTree)` após normalizar qualquer dado exclusivo se houver, assegurando que `toJSON()` é idêntico.
  - Simular interação (`isNightCardRevealed: true`) para quem age (exibe alvos/veredito + `"Ocultar Tela Noturna"`) e para quem dorme (exibe `"Não é seu turno de ação — mantenha os olhos fechados"` + `"Ocultar Tela Noturna"`).
