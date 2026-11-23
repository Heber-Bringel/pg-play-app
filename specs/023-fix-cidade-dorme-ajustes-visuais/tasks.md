# ✅ Lista de Tarefas (`tasks.md`): Ajustes Visuais da Noite, Votação, Revelação e Linha do Tempo no Cidade Dorme

- **Input:** `specs/023-fix-cidade-dorme-ajustes-visuais/spec.md` e `specs/023-fix-cidade-dorme-ajustes-visuais/plan.md`
- **Ordem de Execução Obrigatória:** De dentro para fora (`viewmodel` → `components` → `tests` → `npm run check`)
- **Receitas do Harness:** `/revisar-arquitetura`, `/commit-e-pr`
- **Issue vinculada:** `#67`

---

## Fase 1: ViewModel — Etapa `"Amanhecer"` Ativa na Linha do Tempo (`src/viewmodel/`)
*Objetivo: Garantir que a etapa `"Amanhecer"` fique destacada como ativa na abertura do dia antes de transitar para `"Debate"`.*

- [x] **T001** Atualizar `buildPhaseTimeline` e adicionar controle de janela inicial de destaque do `"Amanhecer"` (`4_000 ms`, limpo em troca de fase, saída e unmount) em `src/viewmodel/useCidadeDormeViewModel.ts`

---

## Fase 2: Componentes Visuais e Seções (`src/view/components/`)
*Objetivo: Resolver os itens visuais 1, 2, 4 e 5 da tabela da Issue `#67` exclusivamente com tokens do `theme.ts`.*

- [x] **T002** Garantir suporte a `themeMode?: ThemeMode` em `src/view/components/gameCard.tsx` (alinhado ao DS v1.1.0 da `develop`) e passar `themeMode="dark"` no `GameCard` de `src/view/components/cidadeDormeNightSection.tsx` (Item 1)
- [x] **T003** Substituir `icon="weather-night"` por `icon="vote-outline"` no `GameCard` da fase `vote_result` em `src/view/components/cidadeDormeDaySection.tsx` (Item 2)
- [x] **T004** Substituir `playersTag={`Prontos: ${readyCount}/${totalCount}`}` por `"Sigilo Individual"` no `GameCard` de `src/view/components/cidadeDormeRoleSection.tsx`, mantendo `"Prontos X/Y"` apenas no `CidadeDormeCityPanel` (Item 4)
- [x] **T005** Adicionar o helper `getAvatarInitials(nickname)` em `src/view/components/cidadeDormeCityPanel.tsx` para gerar iniciais de 2 letras (`"DI"`, `"DO"`, `"AM"`) diferenciando jogadores com mesma inicial (Item 5)

---

## Fase 3: Testes Automatizados (`tests/`)
*Objetivo: Cobrir todos os 5 ajustes visuais com testes unitários de componentes, hooks e tela.*

- [x] **T006** Atualizar `tests/hooks/useCidadeDormeViewModel.test.ts` validando o passo `'dawn'` ativo ao abrir `day_debate` com `dawnReport` e a transição para `'debate'` após `4 s`
- [x] **T007** Atualizar `tests/components/cidadeDormeVisuals.test.tsx` (e `tests/components/gameCard.test.tsx`) validando iniciais de 2 letras (`DI`, `DO`) em `CidadeDormeCityPanel` e aplicação de `darkTokens` em `GameCard` com `themeMode="dark"`
- [x] **T008** Atualizar `tests/mocks/cidadeDormeScreen.mock.test.tsx` validando `themeMode="dark"` no `GameCard` noturno, ícone `vote-outline` em `vote_result`, passo `"Amanhecer"` ativo e ausência de duplicidade de `"Prontos"` em `role_reveal`

---

## Fase 4: Verificação Arquitetural e Pull Request
*Objetivo: Validar 0 violações no Harness MVVM Sofisticado e abrir PR vinculado à Issue `#67`.*

- [x] **T009** Executar `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest --passWithNoTests`) e confirmar **0 violações**
- [x] **T010** Realizar commits convencionais e abrir Pull Request vinculando `Closes #67`
