# 🏗️ Plano de Implementação Técnica (`plan.md`): Ajustes Visuais da Noite, Votação, Revelação e Linha do Tempo no Cidade Dorme

- **Branch:** `fix/023-cidade-dorme-ajustes-visuais`
- **Data:** 2026-11-22
- **Especificação de Origem:** `specs/023-fix-cidade-dorme-ajustes-visuais/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

Aplicar os 5 ajustes visuais de leitura e coerência semântica levantados na **Issue `#67`** para o **Cidade Dorme (`UC07`)**, mantendo intactas as camadas de domínio (`src/model/`), infraestrutura (`src/infra/`), casos de uso (`src/usecase/`), DI (`src/di/`) e rotas (`src/app/`):
1. **Cartão escuro à noite (`gameCard.tsx` + `cidadeDormeNightSection.tsx`):** Passar `themeMode="dark"` no `GameCard` de `cidadeDormeNightSection.tsx` (assegurando que `GameCard` aceite `themeMode?: ThemeMode` e aplique `darkTokens`, conforme já padronizado no Design System v1.1.0 em `develop`).
2. **Ícone diurno no resultado da votação (`cidadeDormeDaySection.tsx`):** Trocar `icon="weather-night"` por `icon="vote-outline"` no `GameCard` da fase `vote_result`.
3. **Etapa `"Amanhecer"` ativa na linha do tempo (`useCidadeDormeViewModel.ts`):** Adicionar controle de destaque inicial do passo `'dawn'` ao entrar em `day_debate` (`isDawnHighlightActive`), marcando `dawn` com `isActive: true` durante os primeiros `4_000 ms` de exibição do Boletim do Amanhecer e transitando automaticamente para `debate` (`isActive: true`, `dawn.isCompleted: true`), com cleanup seguro do timer.
4. **Fim da duplicidade de `"Prontos X/Y"` (`cidadeDormeRoleSection.tsx`):** Alterar `playersTag` do `GameCard` de revelação para `"Sigilo Individual"`, mantendo o contador `"Prontos X/Y"` apenas na barra de progresso do `CidadeDormeCityPanel`.
5. **Avatares com 2 letras (`cidadeDormeCityPanel.tsx`):** Extrair o helper puro `getAvatarInitials(nickname)` gerando 2 letras maiúsculas para diferenciar apelidos com mesma inicial (ex.: `"Diego"` → `"DI"`, `"Douglas"` → `"DO"`).

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo devem estar marcados antes de gerar o `tasks.md` ou iniciar código.*

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada com os 5 itens da Issue `#67` (`RF-67-01` a `RF-67-05`).
- [x] **Artigo II (MVVM 7 Pastas)**: Todas as alterações residem exclusivamente em `src/viewmodel/` e `src/view/components/`.
- [x] **Artigo II (Rotas Finas e View Burra)**: `src/app/cidade-dorme.tsx` permanece com 2 linhas; a regra temporal de destaque da etapa `'dawn'` na timeline fica na `ViewModel`; os componentes visuais recebem apenas `props`.
- [x] **Artigo II (Vocabulário)**: Nenhum arquivo ou símbolo usa `Repository` ou `Connector`.
- [x] **Artigo III (Design System)**: Zero cores literais; reutiliza exclusivamente `tokens` e `darkTokens` (`src/view/theme.ts`) e props oficiais de `GameCard`, `CidadeDormePhaseTimeline` e `CidadeDormeCityPanel` (alinhado ao DS `1.1.0`).
- [x] **Artigo IV (Testabilidade Offline)**: Todos os ajustes visuais e transições temporizadas são testados offline com Jest, `jest.useFakeTimers()` e RNTL.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

> **Sem alterações previstas em:** `src/model/`, `src/infra/`, `src/usecase/`, `src/di/` e `src/app/`.

```text
src/
├─ viewmodel/
│  └─ useCidadeDormeViewModel.ts                  # Estado/timer da etapa inicial 'dawn' ao entrar em day_debate, atualizando phaseTimeline
└─ view/
   └─ components/
      ├─ gameCard.tsx                             # Garante suporte a prop opcional themeMode?: ThemeMode (já presente no DS v1.1.0 da develop)
      ├─ cidadeDormeNightSection.tsx              # Passa themeMode="dark" no GameCard noturno "A Noite · Turno do…"
      ├─ cidadeDormeDaySection.tsx                # Altera icon="weather-night" para icon="vote-outline" no GameCard de vote_result
      ├─ cidadeDormeRoleSection.tsx               # Altera playersTag para "Sigilo Individual" removendo duplicidade de "Prontos X/Y"
      └─ cidadeDormeCityPanel.tsx                 # Implementa getAvatarInitials(nickname) exibindo 2 letras nos avatares (ex.: DI, DO)

tests/
├─ hooks/
│  └─ useCidadeDormeViewModel.test.ts             # Valida step 'dawn' ativo ao entrar em day_debate e transição para 'debate' após 4s
├─ components/
│  ├─ gameCard.test.tsx                           # Valida renderização de GameCard com themeMode="dark"
│  └─ cidadeDormeVisuals.test.tsx                 # Valida avatar com 2 letras (DI, DO) em CidadeDormeCityPanel e passo 'dawn' ativo na timeline
└─ mocks/
   └─ cidadeDormeScreen.mock.test.tsx             # Valida ausência de duplicidade de "Prontos" em role_reveal, ícone vote-outline em vote_result e card escuro à noite
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento da Tela | Componente (`@/view/components/`) | Tokens Semânticos (`@/view/theme`) |
| :--- | :--- | :--- |
| Card de turno noturno (`"A Noite · Turno do…"`) | `GameCard` (`themeMode="dark"`) | `darkTokens.component.card.bg`, `darkTokens.component.card.border`, `darkTokens.semantic.color.onSurface` |
| Card de resultado da votação (`vote_result`) | `GameCard` (`icon="vote-outline"`) | `tokens.component.card.*`, `tokens.semantic.color.onActionContainer` |
| Passo `"Amanhecer"` na linha do tempo | `CidadeDormePhaseTimeline` | `activeTokens.semantic.color.actionContainer`, `activeTokens.semantic.color.action`, `activeTokens.semantic.radius.md` |
| Card de revelação sem contador duplicado | `GameCard` (`playersTag="Sigilo Individual"`) | `tokens.component.card.*`, `tokens.semantic.color.surfaceVariant` |
| Avatar de jogador com 2 letras | `CidadeDormeCityPanel` | `activeTokens.semantic.color.actionContainer`, `onActionContainer`, `font.caption` |

---

## 5. Detalhamento dos 5 Ajustes

1. **Helper `getAvatarInitials(nickname)` (`cidadeDormeCityPanel.tsx`):**
   - Divide o `nickname.trim()` por espaços (`/\s+/`).
   - Se houver `>= 2` palavras, usa a 1ª letra da 1ª palavra + 1ª letra da 2ª palavra em maiúsculas (ex.: `"Ana Maria"` → `"AM"`).
   - Se houver apenas 1 palavra, usa as 2 primeiras letras em maiúsculas via `.slice(0, 2)` (ex.: `"Diego"` → `"DI"`, `"Douglas"` → `"DO"`, `"B"` → `"B"`).
   - Se vazio, retorna `"?"`.
2. **Transição `"Amanhecer"` → `"Debate"` (`useCidadeDormeViewModel.ts`):**
   - Ao entrar pela primeira vez no `phaseKey` de `day_debate` (em uma nova rodada), ativa `isDawnHighlightActive = true` (quando `room.dawnReport` está presente) e registra um `setTimeout` de `4_000 ms` (limpo no unmount, saída ou troca de fase) que define `isDawnHighlightActive = false`.
   - `buildPhaseTimeline(phase, isDawnActive)` marca `activeIndex = 1` (`dawn`) e `completedUpTo = 0` (`night`) enquanto `isDawnActive === true`, passando depois a `activeIndex = 2` (`debate`) e `completedUpTo = 1` (`night`, `dawn`).

---

## 6. Estratégia de Testes (`tests/`)

- **Testes de Hook (`tests/hooks/useCidadeDormeViewModel.test.ts`):**
  - Ao avançar para `day_debate` com `dawnReport`, `state.phaseTimeline` marca `dawn.isActive === true` imediatamente e, após `4_000 ms` com `jest.advanceTimersByTime`, passa `debate.isActive === true` e `dawn.isCompleted === true`.
- **Testes de Componentes (`tests/components/cidadeDormeVisuals.test.tsx` e `tests/components/gameCard.test.tsx`):**
  - `CidadeDormeCityPanel` renderiza `"DI"` para `"Diego"` e `"DO"` para `"Douglas"`, `"AM"` para `"Ana Maria"`.
  - `GameCard` com `themeMode="dark"` aplica estilo escuro (`darkTokens.component.card.bg`).
- **Testes de Tela com Mocks (`tests/mocks/cidadeDormeScreen.mock.test.tsx`):**
  - Em `role_reveal`, `"Prontos 0/5"` aparece apenas uma vez (no `CidadeDormeCityPanel`), e o `GameCard` exibe `"Sigilo Individual"`.
  - Em `vote_result`, o `GameCard` usa `icon="vote-outline"` (sem `"weather-night"`).
  - À noite (`night_assassin`), o `GameCard` recebe `themeMode="dark"`.
