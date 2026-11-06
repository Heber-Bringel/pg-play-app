# 📐 Diretório de Especificações (`specs/`) — GitHub Spec Kit

Este diretório armazena os artefatos de **Spec-Driven Development (SDD)** de cada funcionalidade ou Caso de Uso (`UC01` a `UC08`) do **PG PLAY**, seguindo a metodologia oficial do **GitHub Spec Kit** combinada ao nosso **Harness MVVM Sofisticado**.

---

## 🚀 Como um Novo Integrante Deve Começar uma Tarefa

> **Regra de Ouro (Artigo I da Constituição)**: Nunca comece escrevendo código diretamente em `src/`. Toda funcionalidade nasce aqui em `specs/`!

### Passo 1 — Inicializar a pasta da especificação
Execute o comando abaixo informando o identificador da Issue ou Caso de Uso:

```bash
npm run spec:new -- uc01-hub-jogos
```

Isso criará automaticamente a pasta `specs/001-uc01-hub-jogos/` com os 3 arquivos do ciclo **Spec Kit**:

```text
specs/
└── 001-uc01-hub-jogos/
    ├── spec.md    # 1. Specify: O QUE construir (User Stories, Dado/Quando/Então, RF/UC)
    ├── plan.md    # 2. Plan: COMO construir nas 7 camadas do MVVM + tokens do Design System
    └── tasks.md   # 3. Tasks: Checklist ordenado de dentro para fora (model -> infra -> usecase -> di -> tests -> viewmodel -> view -> app)
```

### Passo 2 — O Fluxo de 4 Etapas com a IA (`/speckit`)

1. **Specify (`spec.md`)**: Preencha (ou peça ao agente com `/speckit`) o `spec.md` consultando [`docs/requisitos/requisitos-e-casos-de-uso-pg-play.md`](../docs/requisitos/requisitos-e-casos-de-uso-pg-play.md) e [`docs/jogos/`](../docs/jogos/).
2. **Plan (`plan.md`)**: Peça ao agente para gerar o `plan.md` validando o *Constitution Check* contra [`.specify/memory/constitution.md`](../.specify/memory/constitution.md) e listando todos os arquivos por camada MVVM e componentes de [`design-system/`](../design-system/README.md).
3. **Tasks (`tasks.md`)**: Peça ao agente para detalhar o `tasks.md` na ordem estrita de dentro para fora. **Revise o `tasks.md` antes de autorizar a implementação!**
4. **Implement (`src/` e `tests/`)**: Autorize o agente a executar as tarefas do `tasks.md` usando as receitas `/sincronizar-tema`, `/nova-funcionalidade` e `/nova-tela`, validando cada entrega com `npm run check`.

---

## 🗂️ Sugestão de Numeração Alinhada às Issues do Projeto

| Pasta em `specs/` | Issue / Caso de Uso | Milestone |
| :--- | :--- | :--- |
| `specs/001-ds-sincronizar-tema/` | Issue `#2` — Sincronizar `theme.ts` e 6 componentes | `v0.1.0` |
| `specs/002-uc01-hub-jogos/` | Issue `#3` — `UC01` Catálogo e Hub de Jogos | `v0.2.0` |
| `specs/003-uc02-gestao-equipes/` | Issue `#4` — `UC02` Configuração de Equipes | `v0.2.0` |
| `specs/004-uc03-arena-mimica/` | Issue `#5` — `UC03` Arena de Mímica Expressiva | `v0.2.0` |
| `specs/005-uc04-arena-quiz/` | Issue `#6` — `UC04` Arena de Quiz Relâmpago | `v0.2.0` |
| `specs/006-uc05-arena-forca/` | Issue `#7` — `UC05` Arena do Jogo da Forca | `v0.2.0` |
| `specs/007-uc06-placar-geral/` | Issue `#8` — `UC06` Placar e Ranking Geral | `v0.2.0` |
| `specs/008-uc07-cidade-dorme/` | Issue `#9` — `UC07` Cidade Dorme (Sala Multiplayer) | `v1.0.0` |
| `specs/009-uc08-adedonha-biblica/` | Issue `#10` — `UC08` Adedonha Bíblica (Sala Multiplayer) | `v1.0.0` |
