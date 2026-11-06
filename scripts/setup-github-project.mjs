#!/usr/bin/env node
/**
 * Script de Automação do GitHub (Labels, Milestones e Issues) — PG PLAY
 *
 * Requisitos para execução real:
 *   1. GitHub CLI instalado (`gh --version`)
 *   2. Autenticado (`gh auth status`)
 *   3. Repositório remoto configurado no git (`git remote -v`)
 *
 * Uso:
 *   node scripts/setup-github-project.mjs --dry-run   # Apenas exibe o que será criado
 *   node scripts/setup-github-project.mjs             # Cria Labels, Milestones e Issues no GitHub
 */

import { spawnSync } from 'node:child_process';

const isDryRun = process.argv.includes('--dry-run');

const LABELS = [
  {
    name: 'harness',
    color: '5B21B6',
    description: 'Engenharia de contexto, regras MVVM e linter arquitetural',
  },
  {
    name: 'design-system',
    color: 'C2410C',
    description: 'Tokens Material 3 Expressive (theme.ts) e componentes visuais',
  },
  {
    name: 'camada:model',
    color: '0F766E',
    description: 'Entidades (type), contratos (i*DataSource, i*Service) e errors.ts',
  },
  {
    name: 'camada:infra',
    color: '0369A1',
    description: 'Implementações concretas (Memory*, armazenamento, rede, áudio)',
  },
  {
    name: 'camada:usecase',
    color: '4338CA',
    description: 'Regras de negócio, validações e orquestração (src/usecase/)',
  },
  {
    name: 'camada:viewmodel',
    color: '7E22CE',
    description: 'Estado reativo, ações e navegação (src/viewmodel/)',
  },
  {
    name: 'camada:view',
    color: 'BE185D',
    description: 'Telas espelhadas (src/view/) e rotas finas (src/app/)',
  },
  {
    name: 'modo:1-celular',
    color: '15803D',
    description: 'Jogos presenciais em 1 celular compartilhado (Passa-Celular)',
  },
  {
    name: 'modo:multiplayer',
    color: 'B45309',
    description: 'Jogos em Sala Multiplayer (1 celular por jogador)',
  },
  {
    name: 'tests',
    color: '374151',
    description: 'Testes unitários e de integração com Jest',
  },
];

const MILESTONES = [
  {
    title: 'v0.1.0 — Fundação: Harness MVVM & Design System',
    description:
      'Configuração dos 5 Pilares do Harness MVVM Sofisticado, árvore de 7 pastas com .gitkeep, sincronização de src/view/theme.ts e dos 6 componentes do PG Play Expressive.',
  },
  {
    title: 'v0.2.0 — Núcleo & Jogos em 1 Celular (UC01–UC06)',
    description:
      'Domínio base, MemoryDataSources, Hub de Jogos (UC01), Gestão de Equipes (UC02), Mímica Expressiva (UC03), Quiz Relâmpago (UC04), Jogo da Forca (UC05) e Placar Geral (UC06).',
  },
  {
    title: 'v1.0.0 — Jogos em Sala Multiplayer (UC07–UC08)',
    description:
      'Serviço de salas multiplayer, Cidade Dorme com Narrador por áudio (UC07) e Adedonha Bíblica com Roleta Expressiva e botão Levantar Dúvida (UC08).',
  },
];

const ISSUES = [
  {
    title: '[HARNESS] Configurar os 5 Pilares do Harness MVVM Sofisticado e estrutura de pastas',
    milestone: MILESTONES[0].title,
    labels: ['harness', 'tests'],
    body: `## 🎯 Objetivo
Estruturar os 5 Pilares do Harness MVVM Sofisticado e a árvore das 7 pastas canônicas em \`src/\` com \`.gitkeep\`.

## 📦 Entregáveis
- [x] Pilar 1: \`AGENTS.md\`, \`CLAUDE.md\` e \`harness.config.json\`
- [x] Pilar 2: \`docs/harness/01..04.md\`
- [x] Pilar 3: Skills em \`.claude/skills/\` (\`nova-tela\`, \`nova-funcionalidade\`, \`sincronizar-tema\`, \`revisar-arquitetura\`)
- [x] Pilar 4: Verificador determinístico \`scripts/check-arquitetura.mjs\`
- [x] Pilar 5: Hook automático em \`.claude/settings.json\`
- [x] Templates de PR e Issues em \`.github/\` e guia \`CONTRIBUTING.md\`

## ✅ Critérios de Aceite
- \`npm run arquitetura\` retornando 0 violações.`,
  },
  {
    title: '[DS] Sincronizar src/view/theme.ts e os 6 componentes do PG Play Expressive',
    milestone: MILESTONES[0].title,
    labels: ['design-system', 'camada:view', 'tests'],
    body: `## 🎨 Objetivo
Executar a receita \`/sincronizar-tema\` para traduzir \`design-system/02-tokens.md\` e \`design-system/04-componentes/\` em código TypeScript/React Native dentro de \`src/view/\`.

## 🧩 Entregáveis
- [ ] \`src/view/theme.ts\` (com \`primitive\` privado e tokens semânticos/componentes para modos claro e escuro)
- [ ] \`src/view/components/expressiveButton.tsx\`
- [ ] \`src/view/components/expressiveTextField.tsx\`
- [ ] \`src/view/components/gameCard.tsx\`
- [ ] \`src/view/components/expressiveTimer.tsx\`
- [ ] \`src/view/components/quizOption.tsx\`
- [ ] \`src/view/components/letterKey.tsx\`
- [ ] Testes em \`tests/tokens.test.ts\` e \`tests/components.test.tsx\`

## ✅ Critérios de Aceite
- Zero cores hexadecimais fora de \`src/view/theme.ts\`.
- \`npm run check\` passando com 0 violações.`,
  },
  {
    title: '[UC01] Implementar Catálogo e Hub de Jogos com busca e filtro (RF01–RF03)',
    milestone: MILESTONES[1].title,
    labels: ['camada:model', 'camada:infra', 'camada:usecase', 'camada:viewmodel', 'camada:view', 'modo:1-celular'],
    body: `## 🎯 Caso de Uso: UC01 — Explorar Catálogo no Hub de Jogos
Implementar listagem e filtragem de minigames por modalidade (\`1 Celular\` vs \`Multi-Celular\`) seguindo as receitas \`/nova-funcionalidade\` e \`/nova-tela\`.

## 🏗️ Camadas MVVM
- [ ] \`src/model/errors.ts\` (\`DomainError\`, \`ValidationError\`, \`AuthError\`, \`DataSourceError\`)
- [ ] \`src/model/entities/minigame.ts\` e \`src/model/datasources/iGameCatalogDataSource.ts\`
- [ ] \`src/infra/datasources/memoryGameCatalogDataSource.ts\`
- [ ] \`src/usecase/iPgPlayUseCases.ts\` e \`src/usecase/pgPlayUseCases.ts\`
- [ ] \`src/di/container.ts\`
- [ ] \`src/viewmodel/useHubViewModel.ts\`
- [ ] \`src/view/index.tsx\`, \`src/app/index.tsx\` e \`src/app/_layout.tsx\``,
  },
  {
    title: '[UC02] Implementar Configuração e Gestão de Equipes (RF04–RF06)',
    milestone: MILESTONES[1].title,
    labels: ['camada:model', 'camada:infra', 'camada:usecase', 'camada:viewmodel', 'camada:view', 'modo:1-celular', 'tests'],
    body: `## 🎯 Caso de Uso: UC02 — Configurar Equipes da Sessão
Permitir cadastrar, listar e remover equipes (mínimo 2, máximo 6) com validação de nome único e mínimo de 2 caracteres no UseCase.

## 🏗️ Camadas MVVM
- [ ] \`src/model/entities/team.ts\` e \`src/model/datasources/iTeamDataSource.ts\`
- [ ] \`src/infra/datasources/memoryTeamDataSource.ts\`
- [ ] Métodos \`listTeams\`, \`addTeam\` e \`removeTeam\` em \`PgPlayUseCases\`
- [ ] \`src/viewmodel/useTeamsViewModel.ts\`
- [ ] \`src/view/teams.tsx\` e rota fina \`src/app/teams.tsx\``,
  },
  {
    title: '[UC03] Implementar Arena de Mímica Expressiva (RF07–RF09)',
    milestone: MILESTONES[1].title,
    labels: ['camada:model', 'camada:usecase', 'camada:viewmodel', 'camada:view', 'modo:1-celular', 'tests'],
    body: `## 🎯 Caso de Uso: UC03 — Jogar Rodada de Mímica Expressiva
Arena Passa-Celular com revelação protegida da palavra secreta, cronômetro de 60s (\`ExpressiveTimer\`), pontuação da equipe ativa e alternância de turno.

## 🏗️ Camadas MVVM
- [ ] \`MimicaCard\` em \`src/model/entities/arenaChallenge.ts\`
- [ ] \`src/viewmodel/useMimicaViewModel.ts\`
- [ ] \`src/view/mimica.tsx\` e rota fina \`src/app/mimica.tsx\``,
  },
  {
    title: '[UC04] Implementar Arena de Quiz Relâmpago (RF10–RF12)',
    milestone: MILESTONES[1].title,
    labels: ['camada:model', 'camada:usecase', 'camada:viewmodel', 'camada:view', 'modo:1-celular', 'tests'],
    body: `## 🎯 Caso de Uso: UC04 — Jogar Rodada de Quiz Relâmpago
Arena com perguntas de múltipla escolha (\`A–D\`), cronômetro de 30s, confirmação visual dupla (\`QuizOption\`), explicação imediata e pontuação automática.

## 🏗️ Camadas MVVM
- [ ] \`QuizQuestion\` em \`src/model/entities/arenaChallenge.ts\`
- [ ] \`src/viewmodel/useQuizViewModel.ts\`
- [ ] \`src/view/quiz.tsx\` e rota fina \`src/app/quiz.tsx\``,
  },
  {
    title: '[UC05] Implementar Arena do Jogo da Forca (RF13–RF15)',
    milestone: MILESTONES[1].title,
    labels: ['camada:model', 'camada:usecase', 'camada:viewmodel', 'camada:view', 'modo:1-celular', 'tests'],
    body: `## 🎯 Caso de Uso: UC05 — Jogar Rodada do Jogo da Forca
Arena com dica temática, palavra mascarada, limite de 6 erros e teclado alfabético acessível (\`LetterKey\`).

## 🏗️ Camadas MVVM
- [ ] \`ForcaPuzzle\` em \`src/model/entities/arenaChallenge.ts\`
- [ ] \`src/viewmodel/useForcaViewModel.ts\`
- [ ] \`src/view/forca.tsx\` e rota fina \`src/app/forca.tsx\``,
  },
  {
    title: '[UC06] Implementar Placar e Ranking Geral do PG (RF16–RF17)',
    milestone: MILESTONES[1].title,
    labels: ['camada:usecase', 'camada:viewmodel', 'camada:view', 'modo:1-celular', 'tests'],
    body: `## 🎯 Caso de Uso: UC06 — Consultar Placar e Reiniciar Sessão
Exibir ranking ordenado por pontuação, destaque de equipe líder, bônus e ação para zerar o placar da sessão.

## 🏗️ Camadas MVVM
- [ ] \`src/viewmodel/useScoreboardViewModel.ts\`
- [ ] \`src/view/scoreboard.tsx\` e rota fina \`src/app/scoreboard.tsx\``,
  },
  {
    title: '[UC07] Implementar Cidade Dorme em Sala Multiplayer com Narrador por Áudio (RF18–RF20)',
    milestone: MILESTONES[2].title,
    labels: ['camada:model', 'camada:infra', 'camada:usecase', 'camada:viewmodel', 'camada:view', 'modo:multiplayer', 'tests'],
    body: `## 🎯 Caso de Uso: UC07 — Jogar Cidade Dorme em Sala Multiplayer
Referência: \`docs/jogos/cidade-dorme.md\`.
Sorteio de papéis secretos (\`Cidadão\`, \`Sabotador\`, \`Anjo\`, \`Detetive\`), transição de fases (\`Noite\` ↔ \`Dia\` ↔ \`Votação\`) e apuração automática de vitória.

## 🏗️ Camadas MVVM
- [ ] \`CidadeDormeRoom\` e \`CidadeDormePlayer\` em \`src/model/entities/multiplayerSession.ts\`
- [ ] \`src/model/services/iMultiplayerRoomService.ts\`
- [ ] \`src/infra/services/memoryMultiplayerRoomService.ts\`
- [ ] \`src/viewmodel/useCidadeDormeViewModel.ts\`
- [ ] \`src/view/cidade-dorme.tsx\` e rota fina \`src/app/cidade-dorme.tsx\``,
  },
  {
    title: '[UC08] Implementar Adedonha Bíblica em Sala Multiplayer com Roleta Expressiva (RF21–RF23)',
    milestone: MILESTONES[2].title,
    labels: ['camada:model', 'camada:infra', 'camada:usecase', 'camada:viewmodel', 'camada:view', 'modo:multiplayer', 'tests'],
    body: `## 🎯 Caso de Uso: UC08 — Jogar Adedonha Bíblica em Sala Multiplayer
Referência: \`docs/jogos/adedonha-biblica.md\`.
Sorteio da letra da rodada, preenchimento de categorias bíblicas/temáticas, botão Jumbo **STOP!** e apuração assistida com botão *"Levantar Dúvida ✋"*.

## 🏗️ Camadas MVVM
- [ ] \`AdedonhaRoom\` e \`AdedonhaSubmission\` em \`src/model/entities/multiplayerSession.ts\`
- [ ] \`src/viewmodel/useAdedonhaViewModel.ts\`
- [ ] \`src/view/adedonha.tsx\` e rota fina \`src/app/adedonha.tsx\``,
  },
];

function runGh(args) {
  if (isDryRun) {
    console.log(`[DRY-RUN] gh ${args.map((a) => JSON.stringify(a)).join(' ')}`);
    return { status: 0, stdout: '' };
  }
  const res = spawnSync('gh', args, { encoding: 'utf8', shell: false });
  if (res.status !== 0) {
    console.error(`Erro ao executar gh ${args[0]}:`, res.stderr || res.stdout);
  }
  return res;
}

function main() {
  console.log(
    isDryRun
      ? '=== MODO DRY-RUN: Pré-visualizando Labels, Milestones e Issues do PG PLAY ===\n'
      : '=== Criando Labels, Milestones e Issues no GitHub via gh CLI ===\n'
  );

  console.log('1. Configurando Labels...');
  for (const label of LABELS) {
    runGh([
      'label',
      'create',
      label.name,
      '--color',
      label.color,
      '--description',
      label.description,
      '--force',
    ]);
  }

  console.log('\n2. Configurando Milestones via GitHub API...');
  for (const ms of MILESTONES) {
    runGh([
      'api',
      'repos/:owner/:repo/milestones',
      '-f',
      `title=${ms.title}`,
      '-f',
      `description=${ms.description}`,
      '-f',
      'state=open',
    ]);
  }

  console.log('\n3. Criando as 10 Issues do Projeto...');
  for (const issue of ISSUES) {
    const args = [
      'issue',
      'create',
      '--title',
      issue.title,
      '--milestone',
      issue.milestone,
      '--body',
      issue.body,
    ];
    for (const lb of issue.labels) {
      args.push('--label', lb);
    }
    runGh(args);
  }

  console.log('\nConcluído com sucesso!');
}

main();
