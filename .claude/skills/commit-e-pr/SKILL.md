---
name: commit-e-pr
description: Cria branches, commits convencionais (Conventional Commits) e Pull Requests seguindo o CONTRIBUTING.md, .github/PULL_REQUEST_TEMPLATE.md e as Milestones/Issues do PG PLAY.
---

# Receita `/commit-e-pr`: Commits Convencionais, Branches e Pull Requests

Use esta receita sempre que for criar uma branch, realizar commits ou abrir um Pull Request no repositório **PG PLAY**.

## 1. Leitura obrigatória antes de executar

1. Leia `CONTRIBUTING.md`.
2. Se for abrir PR, leia `.github/PULL_REQUEST_TEMPLATE.md`.
3. Se for criar ou referenciar Issues/Milestones, leia `docs/planejamento/milestones-e-issues.md`.

## 2. Passo a passo obrigatório

### Passo 1 — Verificação de integridade (`npm run check`)
Antes de criar qualquer commit, execute:
```bash
npm run check
```
Se houver qualquer violação arquitetural (`check-arquitetura.mjs`), erro de tipo (`tsc --noEmit`) ou falha de teste (`jest`), corrija antes de commitar.

### Passo 2 — Nome da Branch
Se estiver em uma tarefa de funcionalidade ou correção, verifique se está em uma branch adequada:
- `feat/uc01-hub-jogos` (Casos de Uso `UC01` a `UC08`)
- `feat/ds-sincronizar-tema` (Design System)
- `fix/<descricao-curta>` (Correções)
- `docs/<descricao-curta>` (Documentação)
- `chore/<descricao-curta>` (Infraestrutura do repositório / Harness)

### Passo 3 — Formato do Commit (Conventional Commits)
Monte a mensagem de commit estritamente no formato:
```text
<tipo>(<escopo>): <descrição curta no imperativo em português>
```
- **Tipos válidos**: `feat`, `fix`, `refactor`, `style`, `test`, `docs`, `chore`, `ci`.
- **Escopos válidos**: `model`, `infra`, `usecase`, `di`, `viewmodel`, `view`, `app`, `design-system`, `harness`, `tests`, `docs`.
- **Dica**: Se a entrega atravessar múltiplas camadas MVVM, prefira commits atômicos por camada (ex.: `feat(model): ...`, `feat(infra): ...`, `feat(usecase): ...`, `feat(viewmodel): ...`, `feat(view): ...`) ou use o escopo principal da entrega detalhando as camadas no corpo do commit.

### Passo 4 — Abertura de Pull Request
Ao abrir um PR com `gh pr create`:
1. Use o título no formato Conventional Commits (ex.: `feat(usecase): implementar gestao de equipes (UC02)`).
2. Preencha o corpo exatamente com a estrutura de `.github/PULL_REQUEST_TEMPLATE.md`:
   - `Closes #<numero-da-issue>`
   - Checklist das camadas MVVM alteradas
   - Tabela de tokens e componentes do `PG Play Expressive` utilizados
   - Confirmação do `npm run check`.
