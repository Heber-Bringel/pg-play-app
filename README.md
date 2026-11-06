# 🎮 PG PLAY · Minigames para Pequenos Grupos

Repositório oficial do trabalho final integrado das disciplinas de **Interação Humano-Computador (IHC)** e **Programação para Dispositivos Móveis (PDM)** — **IFPI Campus Piripiri**.

O **PG PLAY** é um aplicativo móvel desenvolvido em **React Native + Expo + TypeScript** voltado para dinâmicas presenciais em Pequenos Grupos (PGs) de jovens e adultos, reunindo jogos rápidos em **1 celular compartilhado** (**Mímica Expressiva**, **Quiz Relâmpago** e **Jogo da Forca**) e jogos em **Sala Multiplayer** (**Cidade Dorme** e **Adedonha Bíblica**).

---

## 🏗️ Arquitetura MVVM Sofisticada, GitHub Spec Kit & Harness de Agentes

O projeto combina **três engrenagens integradas** para garantir qualidade arquitetural e visual no desenvolvimento com novos integrantes e agentes de IA:

1. **GitHub Spec Kit (Spec-Driven Development — `.specify/` e `specs/`)**: Nenhuma funcionalidade é codificada diretamente em `src/` sem antes passar pelo fluxo sequencial `Constitution` → `Specify (spec.md)` → `Plan (plan.md)` → `Tasks (tasks.md)` → `Implement`.
2. **Arquitetura MVVM Sofisticada (`src/`)**: Evolução do MVVM Simplificado dos Capítulos 8 e 10 de *Tutoriais de PDM*, organizando todo o código-fonte exclusivamente em 7 pastas canônicas.
3. **Harness de Engenharia de Contexto em 5 Pilares**: Regras, documentação sob demanda, skills e linter determinístico (`scripts/check-arquitetura.mjs`).

### Fluxo GitHub Spec Kit para Novos Integrantes (`.specify/` e `specs/`)

```text
.specify/
├── memory/
│   └── constitution.md        # Constituição inegociável do projeto (Artigos I a V)
├── templates/
│   ├── spec-template.md       # Template de Especificação Funcional (Dado/Quando/Então, RF/UC)
│   ├── plan-template.md       # Template de Plano Técnico (7 camadas MVVM + tokens Design System)
│   └── tasks-template.md      # Template de Tarefas ordenadas de dentro para fora
└── scripts/
    └── create-new-feature.mjs # Inicializador automático de specs (npm run spec:new)

specs/
├── README.md                  # Guia rápido do Spec Kit para novos integrantes
└── NNN-nome-feature/          # Criado via `npm run spec:new -- <slug>`
    ├── spec.md                # Fase 1 (/speckit.specify): O QUE e POR QUE construir
    ├── plan.md                # Fase 2 (/speckit.plan): COMO construir no MVVM + Design System
    └── tasks.md               # Fase 3 (/speckit.tasks): Checklist aprovado antes do código
```

### Estrutura das 7 Camadas em `src/`

```text
src/
├─ app/                  # Apenas rotas finas do Expo Router e _layout.tsx
├─ view/                 # Espelha app/ 1:1 (telas), além de components/ e theme.ts
│  └─ components/        # Componentes visuais reutilizáveis do Design System
├─ viewmodel/            # Custom Hooks: useXViewModel.ts -> [XState, XActions]
├─ usecase/              # Regras de negócio: iXUseCases.ts (interface) e xUseCases.ts (classe)
├─ model/                # Domínio puro (zero dependências externas)
│  ├─ entities/          # Entidades declaradas como type em objeto literal
│  ├─ datasources/       # Contratos de persistência: iXDataSource.ts (interface)
│  └─ services/          # Contratos de serviços externos/nativos: iXService.ts (interface)
├─ infra/                # Implementações concretas (MemoryX, Firebase, AsyncStorage, etc.)
│  ├─ datasources/       # Classes que implementam iXDataSource
│  └─ services/          # Classes que implementam iXService
└─ di/                   # Injeção de Dependências (container.ts — único ponto que importa @/infra)
```

### Os 5 Pilares do Harness

1. **Mapa Conciso do Repositório**: [`AGENTS.md`](AGENTS.md), [`CLAUDE.md`](CLAUDE.md) e [`harness.config.json`](harness.config.json) com as 12 Regras de Ouro e matriz de importações permitidas.
2. **Documentação Sob Demanda (`docs/harness/`)**:
   - [`docs/harness/README.md`](docs/harness/README.md) — Índice da documentação arquitetural do Harness.
   - [`docs/harness/01-arquitetura-mvvm.md`](docs/harness/01-arquitetura-mvvm.md) — Responsabilidades das 7 pastas, fluxo unidirecional e regras por camada.
   - [`docs/harness/02-convencoes-de-codigo.md`](docs/harness/02-convencoes-de-codigo.md) — Nomenclatura de arquivos, `type` vs `interface`, proibição de `any`/`React.FC`/`Repository` e erros de domínio (`DomainError`).
   - [`docs/harness/03-expo-e-react-native.md`](docs/harness/03-expo-e-react-native.md) — Regras de Expo Router, espelhamento 1:1 `app/` ↔ `view/` e navegação restrita à ViewModel.
   - [`docs/harness/04-views-e-design-system.md`](docs/harness/04-views-e-design-system.md) — Consumo estrito de tokens via `@/view/theme` e componentes do Design System.
3. **Receitas / Skills (`.claude/skills/` e `.github/prompts/`)**:
   - [`/speckit`](.claude/skills/speckit/SKILL.md) — Conduz o fluxo **GitHub Spec Kit** (`specify` → `plan` → `tasks` → `implement`) validado contra [`.specify/memory/constitution.md`](.specify/memory/constitution.md).
   - [`/sincronizar-tema`](.claude/skills/sincronizar-tema/SKILL.md) — Traduz `design-system/` para `src/view/theme.ts` e `src/view/components/`.
   - [`/nova-funcionalidade`](.claude/skills/nova-funcionalidade/SKILL.md) — Cria funcionalidade de dentro para fora (`model` → `infra` → `usecase` → `di` → `tests`).
   - [`/nova-tela`](.claude/skills/nova-tela/SKILL.md) — Cria `ViewModel`, `View` espelhada e rota fina em `src/app/`.
   - [`/revisar-arquitetura`](.claude/skills/revisar-arquitetura/SKILL.md) — Executa auditoria completa e corrige violações arquiteturais.
   - [`/commit-e-pr`](.claude/skills/commit-e-pr/SKILL.md) — Cria branches, commits convencionais e Pull Requests vinculados às Issues e Milestones.
4. **Linter Arquitetural Determinístico**: [`scripts/check-arquitetura.mjs`](scripts/check-arquitetura.mjs) — Verifica estrutura de pastas, grafo de imports, espelho `app/` ↔ `view/`, proibição de cores literais e assinaturas `[state, actions]`.
5. **Hooks Automáticos (`.claude/settings.json`)**: [`.claude/settings.json`](.claude/settings.json) — Executa o verificador automaticamente após cada edição (`PostToolUse`) e antes de encerrar (`Stop`).

### Comandos Disponíveis

```bash
# Cria um novo workspace de especificação no GitHub Spec Kit (specs/NNN-slug/)
npm run spec:new -- uc01-hub-jogos

# Verifica todas as regras arquiteturais do Harness MVVM Sofisticado
npm run arquitetura

# Executa verificação completa (Arquitetura + TypeScript + Jest)
npm run check

# Executa a suíte de testes unitários
npm test

# Pré-visualiza ou cadastra Labels, Milestones e Issues no GitHub via gh CLI
npm run github:setup -- --dry-run
```

---

## 🤝 Governança Git: Commits, PRs, Issues e Milestones

- 📘 **[Guia de Contribuição (`CONTRIBUTING.md`)](CONTRIBUTING.md)** — Padrão de **Conventional Commits** (`<tipo>(<escopo>): <descrição>`) com escopos mapeados para as 7 camadas do MVVM, nomenclatura de branches e fluxo de revisão.
- 🗺️ **[Planejamento de Milestones, Labels e Issues (`docs/planejamento/milestones-e-issues.md`)](docs/planejamento/milestones-e-issues.md)** — Roteiro das 3 Milestones (`v0.1.0`, `v0.2.0`, `v1.0.0`) e especificações das 10 Issues (`#1` a `#10`).
- 🔀 **[Template de Pull Request (`.github/PULL_REQUEST_TEMPLATE.md`)](.github/PULL_REQUEST_TEMPLATE.md)** e **[Templates de Issues (`.github/ISSUE_TEMPLATE/`)](.github/ISSUE_TEMPLATE/)**.

---

## 📚 Documentação de Requisitos, Harness e Jogos (`docs/`)

Toda a documentação de engenharia de requisitos, arquitetura, casos de uso e especificação detalhada das dinâmicas está organizada na pasta [`docs/`](docs/README.md):

- 📄 **[Índice Geral da Documentação (`docs/README.md`)](docs/README.md)**
- 🛡️ **[Documentação do Harness MVVM Sofisticado (`docs/harness/README.md`)](docs/harness/README.md)** — Regras arquiteturais, convenções de código, Expo Router e integração com o Design System.
- 📋 **[Especificação de Requisitos e Casos de Uso (`docs/requisitos/requisitos-e-casos-de-uso-pg-play.md`)](docs/requisitos/requisitos-e-casos-de-uso-pg-play.md)** — Requisitos Funcionais (`RF01–RF23`), Requisitos Não Funcionais (`RNF01–RNF11`), Casos de Uso (`UC01–UC08`) e Matriz de Rastreabilidade.
- 🎮 **[Catálogo de Jogos (`docs/jogos/README.md`)](docs/jogos/README.md)**
  - 🌙 **[Cidade Dorme (`docs/jogos/cidade-dorme.md`)](docs/jogos/cidade-dorme.md)** — Dedução social em Sala Multiplayer com Narrador por áudio clonado (voz masculina ou feminina) e alternância entre Tema Escuro (Noite) e Claro (Dia).
  - ✍️📖 **[Adedonha Bíblica (`docs/jogos/adedonha-biblica.md`)](docs/jogos/adedonha-biblica.md)** — Disputa em Sala Multiplayer com Roleta Expressiva do Alfabeto (M3 Expressive), colunas criadas pelo Moderador e apuração assistida com botão *"Levantar Dúvida ✋"*.

---

## 🎨 Sistema de Design: PG Play Expressive (`v1.0.0`)

Nosso sistema de design é baseado no **Google Material 3 Expressive (2025)** e está inteiramente documentado na pasta [`design-system/`](design-system/README.md):

- 📄 **[Documentação Principal (`design-system/README.md`)](design-system/README.md)** — Visão geral, as 5 forças, inventário de telas, glossário e governança.
- 🧭 **[01 - Princípios (`design-system/01-principios.md`)](design-system/01-principios.md)** — Os 4 valores que guiam as decisões visuais e de interação.
- 🎨 **[02 - Tokens (`design-system/02-tokens.md`)](design-system/02-tokens.md)** — Tokens primitivos, semânticos (Claro e Escuro), de componente e JSON W3C.
- 📐 **[03 - Fundamentos (`design-system/03-fundamentos.md`)](design-system/03-fundamentos.md)** — Regras verificáveis de cor, tipografia, grade de 8 pontos, ícones, elevação e física de mola.
- 🧩 **[04 - Componentes (`design-system/04-componentes/`)](design-system/04-componentes/)** — Especificação completa com código em **React Native + Expo**:
  - [Botão (`botao.md`)](design-system/04-componentes/botao.md)
  - [Campo de Texto (`campo-de-texto.md`)](design-system/04-componentes/campo-de-texto.md)
  - [Card de Minigame (`card-de-jogo.md`)](design-system/04-componentes/card-de-jogo.md)
  - [Cronômetro Expressivo (`cronometro-expressivo.md`)](design-system/04-componentes/cronometro-expressivo.md)
  - [Alternativa de Quiz (`alternativa-quiz.md`)](design-system/04-componentes/alternativa-quiz.md)
  - [Teclado da Forca (`teclado-forca.md`)](design-system/04-componentes/teclado-forca.md)
- 🔄 **[05 - Padrões (`design-system/05-padroes.md`)](design-system/05-padroes.md)** — Fluxos completos de Configuração de Equipes, Rodada com Tempo e Busca no Hub.
- ♿ **[06 - Acessibilidade (`design-system/06-acessibilidade.md`)](design-system/06-acessibilidade.md)** — Auditoria de contraste WCAG 2.1, alvos de toque, foco e leitores de tela.
- 🤖 **[07 - Teste com IA (`design-system/07-teste-com-ia.md`)](design-system/07-teste-com-ia.md)** — Registro das rodadas de validação *AI-friendly*.
- 📦 **[Changelog (`design-system/CHANGELOG.md`)](design-system/CHANGELOG.md)** — Histórico da versão `1.0.0` (`ds-v1.0.0`).
