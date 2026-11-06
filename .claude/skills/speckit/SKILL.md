---
name: speckit
description: Executa o ciclo completo do GitHub Spec Kit (Specify -> Plan -> Tasks -> Implement) integrado à Constituição (.specify/memory/constitution.md) e ao Harness MVVM Sofisticado.
---

# Receita `/speckit`: Fluxo Spec-Driven Development (GitHub Spec Kit + MVVM)

Use esta receita sempre que iniciar ou evoluir qualquer funcionalidade no **PG PLAY** seguindo o **GitHub Spec Kit**.

## 1. Leitura obrigatória

1. Leia `.specify/memory/constitution.md` (Constituição do projeto).
2. Leia `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md` (e `docs/jogos/` se for jogo multiplayer).
3. Consulte os templates oficiais em `.specify/templates/`:
   - `.specify/templates/spec-template.md`
   - `.specify/templates/plan-template.md`
   - `.specify/templates/tasks-template.md`

---

## 2. As 4 Fases do Ciclo Spec Kit

### Fase 1 — `/speckit.specify` (`specs/NNN-slug/spec.md`)
1. Se a pasta `specs/NNN-slug/` ainda não existir, execute:
   ```bash
   npm run spec:new -- <slug-da-feature>
   ```
2. Preencha `specs/NNN-slug/spec.md` definindo **O QUE** e **POR QUE** construir:
   - Histórias de usuário priorizadas (`P1`, `P2`, `P3`) com cenários **Dado / Quando / Então**.
   - Casos de borda (entradas vazias, duplicadas, tempo esgotado, modo offline).
   - Vínculo explícito com `UC01–UC08` e `RF01–RF23`.

### Fase 2 — `/speckit.plan` (`specs/NNN-slug/plan.md`)
1. Leia o `spec.md` aprovado e a Constituição (`.specify/memory/constitution.md`).
2. Preencha `specs/NNN-slug/plan.md` definindo **COMO** construir:
   - Marque o **Constitution Check** (Artigos I a V).
   - Mapeie cada arquivo exato nas **7 pastas de `src/`** (`model` → `infra` → `usecase` → `di` → `viewmodel` → `view` → `app`).
   - Liste na tabela quais componentes de `@/view/components/` e tokens de `@/view/theme` serão utilizados.

### Fase 3 — `/speckit.tasks` (`specs/NNN-slug/tasks.md`)
1. Quebre o `plan.md` em tarefas numeradas (`T001`, `T002`, ...) em `specs/NNN-slug/tasks.md` seguindo estritamente a ordem de dentro para fora:
   - **Fase 1**: Domínio (`src/model/`)
   - **Fase 2**: Infraestrutura `Memory*` (`src/infra/`)
   - **Fase 3**: Caso de Uso e DI (`src/usecase/` e `src/di/container.ts`)
   - **Fase 4**: Testes unitários (`tests/`)
   - **Fase 5**: ViewModel, View e Rota Fina (`src/viewmodel/`, `src/view/`, `src/app/`)
   - **Fase 6**: Verificação com `npm run check` e PR (`/commit-e-pr`)
2. **PARE E PEÇA APROVAÇÃO DO USUÁRIO** antes de iniciar a Fase 4 (`Implement`).

### Fase 4 — `/speckit.implement` (Execução em `src/` e `tests/`)
1. Com o `tasks.md` aprovado pelo usuário, execute uma tarefa por vez marcando `[x]` em `specs/NNN-slug/tasks.md`.
2. Utilize as receitas `/sincronizar-tema`, `/nova-funcionalidade` e `/nova-tela` durante a codificação.
3. Ao concluir, execute `npm run check` e garanta **0 violações**.
