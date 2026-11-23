# ✅ Lista de Tarefas (`tasks.md`): Correção de Sigilo da Tela Noturna no Cidade Dorme (`RNF11`)

- **Input:** `specs/022-fix-cidade-dorme-sigilo-tela-noite/spec.md` e `specs/022-fix-cidade-dorme-sigilo-tela-noite/plan.md`
- **Ordem de Execução Obrigatória:** De dentro para fora (`viewmodel` → `view` → `tests` → `npm run check`)
- **Receitas do Harness:** `/revisar-arquitetura`, `/commit-e-pr`
- **Issue vinculada:** `#66`

---

## Fase 1: ViewModel — Controle de Visibilidade Noturna e Auto-Ocultação (`src/viewmodel/`)
*Objetivo: Centralizar na ViewModel o estado de consulta sob demanda e o retorno automático ao cartão comum.*

- [x] **T001** Adicionar `isNightCardRevealed: boolean` a `CidadeDormeState` e `handleToggleNightCardVisibility` / `handleHideNightCard` a `CidadeDormeActions` em `src/viewmodel/useCidadeDormeViewModel.ts`, garantindo reset para `false` a cada troca de `phaseKey` e ao sair da sala
- [x] **T002** Atualizar `handleConfirmAssassinTarget`, `handleConfirmAngelProtection` e `handleConfirmDetectiveInvestigation` em `src/viewmodel/useCidadeDormeViewModel.ts` para ocultar imediatamente (`false`) após ação do Assassino/Anjo e agendar retorno automático após `4_000 ms` (com cleanup seguro) após o veredito do Detetive

---

## Fase 2: View — Cartão Noturno Camuflado e Mesma Altura (`src/view/`)
*Objetivo: Garantir aparência e altura idênticas para todos os jogadores vivos antes da interação na noite.*

- [x] **T003** Atualizar `src/view/components/cidadeDormeNightSection.tsx` para renderizar um cartão escuro comum idêntico (`"A Cidade Dorme... Mantenha os olhos fechados"` + botão `"Tocar para Consultar Turno"`) para todos os jogadores vivos quando `isNightCardRevealed === false`, sem qualquer distinção por papel ou turno ativo
- [x] **T004** Atualizar o estado revelado (`isNightCardRevealed === true`) em `src/view/components/cidadeDormeNightSection.tsx` para compartilhar a mesma `minHeight` entre o cartão fechado, a visão ativa (alvos/veredito) e a visão de quem dorme (`"Não é seu turno de ação — mantenha os olhos fechados"`), sempre oferecendo o botão `"Ocultar Tela Noturna"`
- [x] **T005** Conectar `isNightCardRevealed`, `onToggleNightCardVisibility` e `onHideNightCard` entre `src/view/cidade-dorme.tsx` e `CidadeDormeNightSection`

---

## Fase 3: Testes Automatizados (`tests/`)
*Objetivo: Provar matematicamente que a árvore renderizada de quem age e de quem dorme não difere antes do toque.*

- [x] **T006** Atualizar `tests/hooks/useCidadeDormeViewModel.test.ts` testando abertura/fechamento de `isNightCardRevealed`, retorno imediato após Assassino/Anjo, auto-ocultação após `4 s` no Detetive e reset automático na troca de turno
- [x] **T007** Atualizar `tests/mocks/cidadeDormeScreen.mock.test.tsx` com teste comparando `toJSON()` entre o celular de quem age e o celular de quem dorme antes do toque (em `night_assassin`, `night_angel` e `night_detective`), além de testar a visualização após o toque e a ocultação

---

## Fase 4: Verificação Arquitetural e Pull Request
*Objetivo: Validar 0 violações no Harness MVVM Sofisticado e abrir PR vinculado à Issue `#66`.*

- [x] **T008** Executar `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest --passWithNoTests`) e confirmar **0 violações**
- [x] **T009** Realizar commits convencionais e abrir Pull Request vinculando `Closes #66`
