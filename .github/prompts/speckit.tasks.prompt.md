---
description: "Fase 3 do GitHub Spec Kit: Quebra o plano técnico em tarefas atômicas ordenadas de dentro para fora (tasks.md)"
---

Siga rigorosamente `.specify/memory/constitution.md` e o template `.specify/templates/tasks-template.md`.

1. Leia `spec.md` e `plan.md` da feature ativa em `specs/NNN-slug/`.
2. Gere o checklist `specs/NNN-slug/tasks.md` ordenado por dependência de dentro para fora:
   - Fase 1: `src/model/` (erros, entidades `type`, contratos `interface`)
   - Fase 2: `src/infra/` (implementações `Memory*`)
   - Fase 3: `src/usecase/` e `src/di/container.ts`
   - Fase 4: `tests/` (testes unitários de UseCase)
   - Fase 5: `src/viewmodel/`, `src/view/` e rota fina em `src/app/`
   - Fase 6: Verificação `npm run check` e PR (`/commit-e-pr`)
3. Pare no checkpoint humano e peça aprovação do usuário antes de executar `/speckit.implement`.
