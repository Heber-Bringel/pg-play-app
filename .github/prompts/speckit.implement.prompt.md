---
description: "Fase 4 do GitHub Spec Kit: Executa as tarefas aprovadas em tasks.md respeitando o Harness MVVM Sofisticado e validando com npm run check"
---

Siga rigorosamente `.specify/memory/constitution.md`, `AGENTS.md` e as receitas em `.claude/skills/`.

1. Leia `specs/NNN-slug/spec.md`, `plan.md` e `tasks.md`.
2. Execute as tarefas na ordem exata de `tasks.md` (de dentro para fora), marcando `[x]` em cada item concluído.
3. Respeite as 12 Regras de Ouro do `AGENTS.md` em cada arquivo criado.
4. Ao finalizar, execute `npm run check` (`node scripts/check-arquitetura.mjs && tsc --noEmit && jest`) e corrija qualquer violação antes de encerrar.
