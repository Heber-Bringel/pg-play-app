# 🏗️ Plano de Implementação Técnica (`plan.md`): [NOME DA FUNCIONALIDADE]

- **Branch:** `feat/[NNN-slug-da-feature]`
- **Data:** [DATA]
- **Especificação de Origem:** `specs/[NNN-slug-da-feature]/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

[Resumo em 3–5 linhas da solução técnica e de como ela se encaixa nas 7 camadas do MVVM Sofisticado.]

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo devem estar marcados antes de gerar o `tasks.md` ou iniciar código.*

- [ ] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada com os requisitos `RF`/`UC`.
- [ ] **Artigo II (MVVM 7 Pastas)**: Todos os arquivos planejados residem apenas em `app`, `view`, `viewmodel`, `usecase`, `model`, `infra` ou `di`.
- [ ] **Artigo II (Rotas Finas e View Burra)**: A rota em `src/app/` terá apenas 2 linhas e toda a navegação (`expo-router`) ficará na `ViewModel`.
- [ ] **Artigo II (Vocabulário)**: Nenhum arquivo, interface ou classe usa `Repository` ou `Connector` (apenas `DataSource` e `Service`).
- [ ] **Artigo III (Design System)**: Todos os estilos usam exclusivamente tokens de `@/view/theme` e componentes de `@/view/components/`.
- [ ] **Artigo IV (Testabilidade Offline)**: Toda dependência de `src/infra/` possui implementação `Memory*` injetada via `src/di/container.ts`.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

Liste exatamente quais arquivos serão criados ou alterados em cada camada (ordem de dentro para fora):

```text
src/
├─ model/
│  ├─ entities/[entidade].ts             # export type Nome = { ... }
│  ├─ datasources/i[Nome]DataSource.ts   # export interface I[Nome]DataSource
│  ├─ services/i[Nome]Service.ts         # export interface I[Nome]Service (se aplicável)
│  └─ errors.ts                          # DomainError / ValidationError
├─ infra/
│  ├─ datasources/memory[Nome]DataSource.ts
│  └─ services/memory[Nome]Service.ts    # (se aplicável)
├─ usecase/
│  ├─ i[Nome]UseCases.ts                 # export interface I[Nome]UseCases
│  └─ [nome]UseCases.ts                  # export class [Nome]UseCases implements I[Nome]UseCases
├─ di/
│  └─ container.ts                       # Instancia Memory* e exporta o UseCase
├─ viewmodel/
│  └─ use[Tela]ViewModel.ts              # export function use[Tela]ViewModel(): [[Tela]State, [Tela]Actions]
├─ view/
│  └─ [rota].tsx                         # Tela espelhada consumindo use[Tela]ViewModel e @/view/theme
└─ app/
   └─ [rota].tsx                         # Rota fina de 2 linhas reexportando @/view/[rota]
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento da Tela | Componente (`@/view/components/`) | Tokens Semânticos (`@/view/theme`) |
| :--- | :--- | :--- |
| Ex.: Botão principal | `ExpressiveButton` (`size="xl"`, `variant="primary"`) | `color.brandPrimary`, `space.xl` |
| Ex.: Entrada de texto | `ExpressiveTextField` | `color.borderFocus`, `color.statusDanger` |

---

## 5. Estratégia de Testes (`tests/`)

- **Testes de Caso de Uso (`tests/[feature].test.ts`)**:
  - Fluxo principal (caminho feliz) usando `Memory*DataSource` / `Memory*Service`.
  - Validações de regra de negócio garantindo lançamento de `ValidationError`.
- **Testes de ViewModel e View (`tests/[feature].test.tsx`)**:
  - Transições de `[state, actions]` e renderização dos componentes com `testID`.
