# 🏗️ Plano de Implementação Técnica (`plan.md`): Validação de Atores e Alvos na Noite e Votação do Cidade Dorme

- **Branch:** `fix/017-cidade-dorme-validacao-acoes-alvos`
- **Data:** 2026-11-19
- **Especificação de Origem:** `specs/017-fix-cidade-dorme-validacao-acoes-alvos/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

Blindar as regras de legitimidade de ator e alvo na Noite e Votação do **Cidade Dorme (`Issue #42`)** seguindo a Regra 6 do **Harness MVVM Sofisticado**:
1. Atualizar os contratos em `ICidadeDormeUseCases` e `CidadeDormeUseCases` (`src/usecase/`) para exigir `actorPlayerId` em todas as ações noturnas e validar papel, `isAlive`, limite de 1 investigação do Detetive por rodada, proibição de auto-ataque/ataque a parceiro Assassino, proibição de auto-investigação e proibição de autovoto em `castVote` (mantendo proteção própria do Anjo permitida);
2. Refletir as mesmas verificações nas RPCs server-side do Supabase documentadas em `docs/harness/05-infraestrutura-e-supabase.md` / `src/infra/services/supabaseMultiplayerRoomService.ts`;
3. Atualizar `useCidadeDormeViewModel` (`src/viewmodel/`) para repassar `activePlayerId` nas ações noturnas e derivar opções elegíveis consistentes;
4. Filtrar as listas exibidas em `cidadeDormeNightSection.tsx` e `cidadeDormeDaySection.tsx` (excluindo alvos proibidos e removendo a lista do Detetive quando já existir veredito na rodada).

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo devem estar marcados antes de gerar o `tasks.md` ou iniciar código.*

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada com todas as regras da Issue `#42`.
- [x] **Artigo II (MVVM 7 Pastas)**: Todas as validações de negócio residem exclusivamente em `src/usecase/cidadeDormeUseCases.ts` (e replicadas no servidor Supabase em `infra`), nunca apenas na `View`.
- [x] **Artigo II (Rotas Finas e View Burra)**: As seções em `src/view/components/` apenas exibem a lista filtrada recebida/derivada sem lançar erros nem importar `usecase`.
- [x] **Artigo II (Vocabulário)**: Nenhum arquivo, interface ou classe usa termos proibidos (apenas `UseCases`, `Service`, `DataSource`).
- [x] **Artigo III (Design System)**: Sem introdução de cores ou medidas literais; mantém componentes e tokens de `@/view/theme`.
- [x] **Artigo IV (Testabilidade Offline)**: Todos os cenários de erro `ValidationError` são testados deterministicamente em `MemoryMultiplayerRoomService`.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

```text
src/
├─ model/
│  └─ services/iMultiplayerRoomService.ts           # Garante actorPlayerId nas operações atômicas noturnas/voto (#38/#40)
├─ infra/
│  └─ services/
│     ├─ memoryMultiplayerRoomService.ts            # Preserva compatibilidade nas chamadas atômicas
│     └─ supabaseMultiplayerRoomService.ts          # Repassa actorPlayerId às RPCs server-side que validam auth.uid()/papel/vida
├─ usecase/
│  ├─ iCidadeDormeUseCases.ts                       # Adiciona actorPlayerId a submitAssassinTarget, submitAngelProtection e submitDetectiveInvestigation
│  └─ cidadeDormeUseCases.ts                        # Implementa todas as validações de ator, papel, vida, alvo e limite de investigação (ValidationError)
├─ viewmodel/
│  └─ useCidadeDormeViewModel.ts                    # Repassa activePlayerId às chamadas de UseCase e expõe listas filtradas / estado de veredito
└─ view/
   └─ components/
      ├─ cidadeDormeNightSection.tsx                # Filtra alvos (Assassino sem si/parceiros; Detetive sem si e oculta lista pós-veredito; Anjo inclui a si)
      └─ cidadeDormeDaySection.tsx                  # Filtra próprio jogador da lista de votação mantendo "Abster-se / Pular Voto"
tests/
├─ unit/cidadeDormeUseCases.test.ts                 # Regressão completa para cada regra de ValidationError e auto-proteção do Anjo
├─ hooks/useCidadeDormeViewModel.test.ts            # Valida repasse de activePlayerId e filtragem de opções
└─ mocks/cidadeDormeScreen.mock.test.tsx            # Valida listas filtradas na noite/votação e ocultação da lista do Detetive após veredito
```

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento da Tela | Componente (`@/view/components/`) | Tokens Semânticos (`@/view/theme`) |
| :--- | :--- | :--- |
| Opções de alvo noturno filtradas | `SelectableOptionItem` (`#43`) / `QuizOption` | `darkTokens.component.card.*`, `darkTokens.semantic.color.*` |
| Banner de erro de validação (`ValidationError`) | Banner de erro em `cidade-dorme.tsx` | `tokens.semantic.color.errorContainer`, `darkTokens.semantic.color.errorContainer` |
| Card de veredito único do Detetive | Container de veredito em `cidadeDormeNightSection.tsx` | `darkTokens.semantic.color.errorContainer`, `darkTokens.semantic.color.success` |

---

## 5. Estratégia de Testes (`tests/`)

- **Testes Unitários de Regra de Negócio (`tests/unit/cidadeDormeUseCases.test.ts`):**
  - Detetive tentando investigar 2 vezes na mesma rodada → `ValidationError`.
  - Jogador morto tentando atacar, proteger, investigar ou votar → `ValidationError`.
  - Jogador com papel errado (ex.: Cidadão ou Anjo tentando `submitAssassinTarget`) → `ValidationError`.
  - Assassino tentando atacar a si mesmo ou a outro Assassino → `ValidationError`.
  - Detetive tentando investigar a si mesmo → `ValidationError`.
  - Votante tentando votar em si mesmo (`castVote`) → `ValidationError`.
  - Anjo protegendo a si mesmo → **permitido e salvo corretamente**.
- **Testes de Tela (`tests/mocks/cidadeDormeScreen.mock.test.tsx`):**
  - Confirmar que na lista do Assassino não aparece seu próprio nome nem de parceiro Assassino.
  - Confirmar que na lista do Detetive não aparece seu próprio nome, e quando `detectiveVerdict` está presente na rodada, nenhuma opção de suspeito aparece renderizada.
  - Confirmar que na lista de `day_voting` não aparece o nome do próprio jogador, mantendo *"Abster-se / Pular Voto"*.
