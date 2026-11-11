# 📋 Checklist de Tarefas (`tasks.md`): 003-uc04-quiz-relampago

- **Branch da Feature:** `feat/003-uc04-quiz-relampago`
- **Criado em:** 2026-11-11
- **Status:** Concluído
- **Autor / Perfil:** Douglas Leone (`DouglasLeone`)
- **Milestone:** `v0.2.0 — Núcleo & Jogos em 1 Celular (UC01–UC06)`
- **Issue vinculada:** `#12` (`[UC04] Implementar Arena de Quiz Relâmpago (RF10–RF12)`)

---

## Ordem de Implementação (De Dentro para Fora)

### Fase 1: Domínio Puro (`model/`)
- [x] **T01 — Entidades de Quiz:** Adicionar `QuizCategory`, `QuizOptionKey`, `QuizOptionItem` e `QuizQuestion` em `src/model/entities/arenaChallenge.ts`.
- [x] **T02 — Contrato de Catálogo:** Adicionar `listQuizQuestions(categories?: QuizCategory[])` em `src/model/datasources/iGameCatalogDataSource.ts`.

### Fase 2: Infraestrutura (`infra/`)
- [x] **T03 — Catálogo em Memória:** Implementar banco com 12 perguntas (Bíblico, Conhecimentos Gerais, Ciência, História, Geografia, Música e Cinema, Esportes) em `src/infra/datasources/memoryGameCatalogDataSource.ts`.

### Fase 3: Regras de Negócio (`usecase/`)
- [x] **T04 — Interface de UseCase:** Adicionar assinaturas `listQuizQuestions` e `scoreQuizAnswer` em `src/usecase/iPgPlayUseCases.ts`.
- [x] **T05 — Implementação de UseCase:** Implementar validação e pontuação (+10 pts por acerto) em `src/usecase/pgPlayUseCases.ts`.

### Fase 4: Testes Unitários de Domínio (`tests/unit/`)
- [x] **T06 — Testes de Quiz UseCase:** Criar `tests/unit/pgPlayUseCases.quiz.test.ts` cobrindo listagem, filtros por categoria, pontuação correta (+10 pts), erro (0 pts) e validações (8 testes).

### Fase 5: Estado e Ações (`viewmodel/`)
- [x] **T07 — ViewModel Custom Hook:** Criar `src/viewmodel/useQuizViewModel.ts` exportando `QuizState`, `QuizActions` e `useQuizViewModel` com controle de fases (`pass-turn`, `playing`, `answered`, `finished`), temporizador de 20s e navegação.
- [x] **T08 — Testes de Hook:** Criar `tests/hooks/useQuizViewModel.test.ts` cobrindo fases, seleção de resposta correta, resposta errada, tempo esgotado e navegação ao placar (9 testes).

### Fase 6: Visual e Rotas (`view/` e `app/`)
- [x] **T09 — Tela Espelhada:** Criar `src/view/quiz.tsx` consumindo `QuizOption`, `ExpressiveTimer`, `GameCard` e `ExpressiveButton`.
- [x] **T10 — Rota Fina Expo Router:** Criar `src/app/quiz.tsx` de 2 linhas (`import QuizScreen from '@/view/quiz'; export default QuizScreen;`).
- [x] **T11 — Testes de Mock de Tela:** Criar `tests/mocks/quizScreen.mock.test.tsx` cobrindo fases, estados de erro e interações (8 testes).

### Fase 7: Verificação Final e Governança
- [x] **T12 — Verificação Completa:** Executar `npm run check` garantindo 0 erros de arquitetura, TypeScript e Jest (17 suítes, 118 testes aprovados).
- [x] **T13 — Commits e Pull Request:** Fazer commits convencionais por camada e abrir PR para `develop` vinculando à Issue `#12`.
