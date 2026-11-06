---
description: "Fase 1 do GitHub Spec Kit: Cria ou atualiza a especificação funcional (spec.md) da feature a partir de .specify/templates/spec-template.md"
---

Siga rigorosamente a Constituição em `.specify/memory/constitution.md` e o template `.specify/templates/spec-template.md`.

1. Caso a pasta `specs/NNN-slug/` ainda não exista para a feature solicitada, execute `npm run spec:new -- <slug>`.
2. Consulte `docs/requisitos/requisitos-e-casos-de-uso-pg-play.md` e `docs/jogos/`.
3. Preencha `specs/NNN-slug/spec.md` com Histórias de Usuário priorizadas (P1, P2), cenários *Dado/Quando/Então*, casos de borda, requisitos funcionais (`RF`) e critérios de acessibilidade IHC.
4. Apresente o `spec.md` gerado ao usuário e pergunte se podemos avançar para `/speckit.plan`.
