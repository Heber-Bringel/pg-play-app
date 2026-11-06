---
name: nova-tela
description: Cria uma tela no padrão MVVM Sofisticado (rota fina em src/app/, tela em src/view/ e ViewModel em src/viewmodel/). Use sempre que o usuário pedir uma nova tela ou fluxo visual.
---

# Receita: Nova Tela (`nova-tela`)

Siga os passos abaixo na ordem exata:

1. **Entenda o pedido**: identifique o caminho da rota, os estados necessários (`XState`), as ações do usuário (`XActions`) e as navegações envolvidas. Se precisar de regras de negócio que ainda não existem no Use Case, execute primeiro a receita `nova-funcionalidade`.
2. **Leia as referências obrigatórias**:
   - `docs/harness/01-arquitetura-mvvm.md`
   - `docs/harness/04-views-e-design-system.md`
   - `design-system/README.md`, `02-tokens.md`, `05-padroes.md` e `06-acessibilidade.md`
3. **Crie a ViewModel (`src/viewmodel/useXViewModel.ts`)**:
   - Exporte `type XState` e `type XActions` (ações com prefixo `handle`).
   - Exporte `function useXViewModel(useCases: IXUseCases = defaultUseCases): [XState, XActions]`.
   - Concentre toda a navegação (`router.push`, `replace`, `back`) e o tratamento de `DomainError` aqui.
4. **Verifique os componentes (`src/view/components/`)**:
   - Reutilize os componentes existentes do Design System (`ExpressiveButton`, `ExpressiveTextField`, `GameCard`, `ExpressiveTimer`, `QuizOption`, `LetterKey`).
   - Se faltar algum componente ou token, pare e pergunte ao usuário antes de criar.
5. **Crie a View (`src/view/<caminho-da-rota>.tsx`)**:
   - Consuma `const [state, actions] = useXViewModel();`.
   - Contemple os estados de carregando, erro, vazio e conteúdo.
   - Use apenas tokens de `@/view/theme` no `StyleSheet.create` (no final do arquivo).
   - Exporte com `export default NomeDaTela;` na última linha.
6. **Crie a Rota Fina (`src/app/<caminho-da-rota>.tsx`)**:
   - Apenas `import NomeDaTela from "@/view/<caminho-da-rota>";` e `export default NomeDaTela;`.
   - Se necessário, registre o título fixo em `src/app/_layout.tsx`.
7. **Verifique e documente**:
   - Execute `npm run check` e corrija qualquer erro apontado.
   - Liste os arquivos criados por camada e apresente a tabela de tokens e componentes utilizados.
