# ✅ Lista de Tarefas (`tasks.md`): Ajustes de Interface e Experiência (IHC) no Cidade Dorme

- **Input:** `specs/018-fix-cidade-dorme-ux-interface/spec.md` e `specs/018-fix-cidade-dorme-ux-interface/plan.md`
- **Ordem de Execução Obrigatória:** De dentro para fora (`viewmodel` → `components` → `view` → `tests` → `npm run check`)
- **Receitas do Harness:** `/nova-tela`, `/revisar-arquitetura`, `/commit-e-pr`

---

## Fase 1: ViewModel — Sincronia do Relógio e Timeout de Conexão (`src/viewmodel/`)
*Objetivo: Tratar latência > 10s na entrada da sala e garantir cálculo único de tempo restante.*

- [ ] **T001** Implementar timeout de `10 s` com `Promise.race` / `clearTimeout` em `handleCreateRoom` e `handleJoinRoom` em `src/viewmodel/useCidadeDormeViewModel.ts`, liberando `loading` e definindo mensagem de erro amigável para nova tentativa
- [ ] **T002** Consolidar cálculo de `secondsRemaining` em `src/viewmodel/useCidadeDormeViewModel.ts` a partir de `room.phaseEndsAt` (integrado à Issue `#41`) para eliminar divergências entre celulares

---

## Fase 2: Novo Componente de Opção Selecionável (`src/view/components/`)
*Objetivo: Eliminar repetição de letras A–D preservando acessibilidade e contraste claro/escuro.*

- [ ] **T003** Criar `SelectableOptionItem` em `src/view/components/selectableOptionItem.tsx` com `tokens` (`light`) e `darkTokens` (`dark`), alvo mínimo `56 dp`, *shape morphing* e suporte a badge numérico (`1..16`) ou ícone semântico (`hand-back-left-outline`), sem modificar `QuizOption` (`UC04`)

---

## Fase 3: Ajustes Visuais na Tela e Seções (`src/view/`)
*Objetivo: Corrigir cabeçalho, spinner de progresso, aviso para convidados, veredito único e ícones do Dia.*

- [ ] **T004** Atualizar o badge do cabeçalho em `src/view/cidade-dorme.tsx` exibindo `"Lobby"` em `lobby`, `"Revelação"` em `role_reveal`, `"A Noite N"` à noite, `"O Dia N"` no dia e `"Fim de Jogo"` em `finished`
- [ ] **T005** Adicionar `ActivityIndicator` (cor `tokens.semantic.color.action`) e texto de progresso durante `loading` em `src/view/components/cidadeDormeEntrySection.tsx`
- [ ] **T006** Atualizar a aba `"Parâmetros"` em `src/view/components/cidadeDormeLobbySection.tsx` exibindo o aviso claro para convidados (*"Somente o moderador altera os parâmetros da sala."*) e resumo legível das configurações
- [ ] **T007** Atualizar `src/view/components/cidadeDormeNightSection.tsx` para usar `SelectableOptionItem` (numeração `1..16`, `darkTokens`) e fazer o card de veredito substituir completamente a lista de suspeitos do Detetive
- [ ] **T008** Atualizar `src/view/components/cidadeDormeDaySection.tsx` para corrigir os ícones (`weather-sunny` no Boletim do Amanhecer e `vote-outline` na Fase 3 Votação Secreta), usar `SelectableOptionItem` na lista de votação e atribuir ícone próprio (`hand-back-left-outline`) a *"Abster-se / Pular Voto"*

---

## Fase 4: Testes, Verificação Arquitetural e Pull Request
*Objetivo: Atualizar suíte de testes semântica e garantir 0 violações em 390 px e no Harness.*

- [ ] **T009** Adicionar `ActivityIndicator` em `tests/__mocks__/react-native.tsx` (se ausente) e criar testes de componente em `tests/components/selectableOptionItem.test.tsx`
- [ ] **T010** Atualizar `tests/hooks/useCidadeDormeViewModel.test.ts` (timeout de `10 s` e sincronia por `phaseEndsAt`) e `tests/mocks/cidadeDormeScreen.mock.test.tsx` (cabeçalho pré-jogo, numeração sem repetição A–D, ícone de abster-se, aviso na aba Parâmetros, veredito substituindo lista e ícones diurnos)
- [ ] **T011** Executar `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest`) e confirmar **0 violações** e zero cores literais fora de `src/view/theme.ts`
- [ ] **T012** Realizar commits convencionais e abrir Pull Request seguindo a receita `/commit-e-pr` vinculando `Closes #43`
