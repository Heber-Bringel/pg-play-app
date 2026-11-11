# 📐 Plano Técnico de Arquitetura (`plan.md`): 003-uc04-quiz-relampago

- **Branch da Feature:** `feat/003-uc04-quiz-relampago`
- **Criado em:** 2026-11-11
- **Status:** Aprovado
- **Autor / Perfil:** Douglas Leone (`DouglasLeone`)
- **Milestone:** `v0.2.0 — Núcleo & Jogos em 1 Celular (UC01–UC06)`
- **Issue vinculada:** `#12` (`[UC04] Implementar Arena de Quiz Relâmpago (RF10–RF12)`)

---

## 1. Verificação de Conformidade com a Constituição (Artigos I a V)

- [x] **Artigo I — 7 Camadas:** O código será organizado estritamente em `model`, `infra`, `usecase`, `di`, `viewmodel`, `view` e `app`.
- [x] **Artigo II — Fluxo Unidirecional e Dependências:** `view/quiz.tsx` consome exclusivamente `useQuizViewModel`; regras de pontuação de quiz em `pgPlayUseCases`; infraestrutura isolada e instanciada em `container.ts`.
- [x] **Artigo III — Governança de Roteamento e View:** `src/app/quiz.tsx` terá apenas 2 linhas; `src/view/quiz.tsx` não importa `expo-router`.
- [x] **Artigo IV — Design System PG Play Expressive:** Uso exclusivo de tokens semânticos e dos componentes `QuizOption`, `ExpressiveTimer`, `GameCard` e `ExpressiveButton`.
- [x] **Artigo V — Qualidade e Pirâmide de Testes:** Testes unitários para regras de quiz em `tests/unit/pgPlayUseCases.quiz.test.ts`, testes de hook em `tests/hooks/useQuizViewModel.test.ts` e testes de tela em `tests/mocks/quizScreen.mock.test.tsx`.

---

## 2. Mapeamento dos Arquivos nas 7 Camadas

```text
src/
├── model/
│   ├── entities/
│   │   └── arenaChallenge.ts            # QuizCategory, QuizOptionKey, QuizOptionItem, QuizQuestion
│   └── datasources/
│       └── iGameCatalogDataSource.ts   # Adicionar listQuizQuestions(categories?)
├── infra/
│   └── datasources/
│       └── memoryGameCatalogDataSource.ts # Implementar banco de perguntas de quiz
├── usecase/
│   ├── iPgPlayUseCases.ts              # listQuizQuestions e scoreQuizAnswer
│   └── pgPlayUseCases.ts               # Implementar regras de pontuação (+10 pts)
├── di/
│   └── container.ts                    # Manter instâncias integradas
├── viewmodel/
│   └── useQuizViewModel.ts             # Hook: [QuizState, QuizActions]
├── view/
│   └── quiz.tsx                        # Tela da arena de Quiz Relâmpago
└── app/
    └── quiz.tsx                        # Rota fina: import QuizScreen from "@/view/quiz"; export default QuizScreen;
```

---

## 3. Interfaces e Tipos por Camada

### 3.1. Camada `model`
```ts
export type QuizCategory =
  | 'Bíblico'
  | 'Conhecimentos Gerais'
  | 'Geografia'
  | 'História'
  | 'Ciência'
  | 'Música e Cinema'
  | 'Esportes';

export type QuizOptionKey = 'A' | 'B' | 'C' | 'D';

export type QuizOptionItem = {
  key: QuizOptionKey;
  text: string;
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: QuizOptionItem[];
  correctKey: QuizOptionKey;
  explanation?: string;
  category: QuizCategory;
};
```

### 3.2. Camada `usecase`
```ts
export interface IPgPlayUseCases {
  // ...
  listQuizQuestions(categories?: QuizCategory[]): Promise<QuizQuestion[]>;
  scoreQuizAnswer(teamId: string, isCorrect: boolean, points?: number): Promise<Team[]>;
}
```

### 3.3. Camada `viewmodel`
```ts
export type QuizPhase = 'pass-turn' | 'playing' | 'answered' | 'finished';

export type QuizState = {
  phase: QuizPhase;
  teams: Team[];
  currentTeamIndex: number;
  currentTeam: Team | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  currentQuestion: QuizQuestion | null;
  selectedOptionKey: QuizOptionKey | null;
  isCorrect: boolean | null;
  secondsRemaining: number;
  confirmingExit: boolean;
  loading: boolean;
  error: string | null;
};

export type QuizActions = {
  handleStartTurn: () => void;
  handleSelectOption: (key: QuizOptionKey) => Promise<void>;
  handleTick: () => void;
  handleNextQuestion: () => void;
  handleRequestExit: () => void;
  handleCancelExit: () => void;
  handleConfirmExit: () => void;
  handleGoToScoreboard: () => void;
  handleGoToTeams: () => void;
  handleRetry: () => Promise<void>;
};
```

### 3.4. Camada `view`
- Renderiza com base em `state.phase`:
  - `pass-turn`: Card indicando a equipe da vez, número da pergunta e botão Jumbo *"Estou Pronto!"*.
  - `playing` ou `answered`: `ExpressiveTimer`, `GameCard` com a pergunta, 4 `QuizOption`, explicação (se respondida) e botão *"Próxima Pergunta"*.
  - `finished`: Card de parabéns e botão *"Ir para o Placar Final"*.
- Diálogo de saída segura ativado por `state.confirmingExit`.
