# 🏗️ Plano de Implementação Técnica (`plan.md`): UC09 — Quem Sou Eu?

- **Branch:** `feat/021-uc09-quem-sou-eu`
- **Data:** 2026-11-23
- **Especificação de Origem:** `specs/021-uc09-quem-sou-eu/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`

---

## 1. Resumo Técnico

Implementação do minigame **Quem Sou Eu?** (`UC09`) seguindo rigorosamente as 7 camadas do **MVVM Sofisticado**. O domínio define as entidades puras de cartas genéricas (`QuemSouEuCard`), o contrato de dados (`IQuemSouEuDataSource`) e o contrato do sensor de inclinação (`ITiltSensorService`). Na infraestrutura, implementamos o banco local em memória (`MemoryQuemSouEuDataSource` com 8 pacotes temáticos genéricos, sem conteúdo bíblico), o sensor real com `expo-sensors` (`ExpoSensorsTiltSensorService` com histerese e cooldown de `1 s`) e a versão `MemoryTiltSensorService` para testes determinísticos. O `QuemSouEuUseCases` valida a partida, embaralha cartas sem repetição, pontua `+10 pts` por acerto / `0 pts` por passe e grava os pontos no `ITeamDataSource`. A `useQuemSouEuViewModel` orquestra as fases (`setup` → `handoff` → `countdown` → `playing` → `summary` → `finished`), o cronômetro, a inscrição no sensor e a navegação.

---

## 2. Verificação Constitucional (*Constitution Check*)

*GATE OBRIGATÓRIO: Todos os itens abaixo devem estar marcados antes de gerar o `tasks.md` ou iniciar código.*

- [x] **Artigo I (SDD)**: A especificação `spec.md` está completa e validada com os requisitos `UC09` / `RF32`–`RF34` e `docs/jogos/quem-sou-eu.md`.
- [x] **Artigo II (MVVM 7 Pastas)**: Todos os arquivos planejados residem apenas em `app`, `view`, `viewmodel`, `usecase`, `model`, `infra` ou `di`.
- [x] **Artigo II (Rotas Finas e View Burra)**: A rota `src/app/quem-sou-eu.tsx` terá apenas 2 linhas e toda a navegação (`expo-router`) ficará na `ViewModel`.
- [x] **Artigo II (Vocabulário)**: Nenhum arquivo, interface ou classe usa `Repository` ou `Connector` (apenas `DataSource` e `Service`).
- [x] **Artigo III (Design System)**: Todos os estilos usam exclusivamente tokens de `@/view/theme` e componentes de `@/view/components/`.
- [x] **Artigo IV (Testabilidade Offline)**: Toda dependência de `src/infra/` possui implementação `Memory*` injetada via `src/di/container.ts`.

---

## 3. Mapeamento de Arquivos nas 7 Camadas do MVVM

Ordem de criação/alteração de dentro para fora:

```text
src/
├─ model/
│  ├─ entities/minigame.ts                       # [ALTERAR] Adicionar rota '/quem-sou-eu' e ícone 'account-question-outline'
│  ├─ entities/quemSouEuCard.ts                  # [CRIAR] QuemSouEuPack, QuemSouEuCard, QuemSouEuMatchConfig, QuemSouEuCardResult, TiltGesture
│  ├─ datasources/iQuemSouEuDataSource.ts        # [CRIAR] export interface IQuemSouEuDataSource
│  └─ services/iTiltSensorService.ts             # [CRIAR] export interface ITiltSensorService
├─ infra/
│  ├─ datasources/memoryGameCatalogDataSource.ts # [ALTERAR] Registrar card ativo 'quem-sou-eu' no catálogo do Hub
│  ├─ datasources/memoryQuemSouEuDataSource.ts   # [CRIAR] Banco de 64 cartas genéricas (8 temas x 8 cartas, sem conteúdo bíblico)
│  ├─ services/memoryTiltSensorService.ts        # [CRIAR] Implementação em memória com cooldown de 1s e emitGesture() para testes
│  └─ services/expoSensorsTiltSensorService.ts   # [CRIAR] Implementação real com expo-sensors (Accelerometer + histerese + cooldown 1s)
├─ usecase/
│  ├─ iQuemSouEuUseCases.ts                      # [CRIAR] export interface IQuemSouEuUseCases
│  └─ quemSouEuUseCases.ts                       # [CRIAR] Validações (ValidationError), embaralhamento sem repetição, pontuação (+10/0) e placar
├─ di/
│  └─ container.ts                               # [ALTERAR] Instanciar MemoryQuemSouEuDataSource + ExpoSensorsTiltSensorService e exportar quemSouEuUseCases
├─ viewmodel/
│  └─ useQuemSouEuViewModel.ts                   # [CRIAR] Estado e ações das 6 fases, contagem 3s, timer, assinatura do sensor e navegação
├─ view/
│  └─ quem-sou-eu.tsx                            # [CRIAR] Tela espelhada usando exclusivamente @/view/theme e @/view/components/*
└─ app/
   └─ quem-sou-eu.tsx                            # [CRIAR] Rota fina de 2 linhas reexportando @/view/quem-sou-eu
```

### Dependência Expo a instalar
- `npx expo install expo-sensors` (conforme `docs/harness/03-expo-e-react-native.md` e Issue `#33`).

---

## 4. Inventário do Design System (`PG Play Expressive`)

| Elemento da Tela | Componente (`@/view/components/`) | Tokens Semânticos (`@/view/theme`) |
| :--- | :--- | :--- |
| Barra superior (Sair + Tag do jogo) | `ExpressiveButton` (`variant="outlined"`), `ExpressiveTag` (`tone="action"`) | `color.surface`, `space.md`, `icon.md` |
| Seleção de Pacotes, Tempo, Rodadas e Gesto | `ExpressiveChip` (seleção múltipla/única) | `color.actionContainer`, `color.onSurface`, `space.sm` |
| Carta em jogo (Modo Testa) | Card com tipografia *Display* (`font.display`) e tag do tema (`ExpressiveTag`) | `component.card.*`, `font.display`, `color.onSurface`, `radius.xl` |
| Contagem regressiva (`3..2..1`) | Card central com tipografia *Display* | `color.actionContainer`, `color.onActionContainer`, `font.display` |
| Cronômetro da rodada | `ExpressiveTimer` (modo crítico `<= 10s`) | `component.timer.*`, `color.error`, `color.onError` |
| Ações de Acerto e Passe | `ExpressiveButton` (`size="jumbo"`, `variant="primary"` / `variant="tonal"`) | `button.jumboHeight` (`64dp`), `space.sm` (`>= 8dp`) |
| Feedback visual do gesto (`Acertou!` / `Passou`) | Banner/overlay semântico (respeitando `Reduce Motion`) com ícone `check-circle` / `skip-next` | `color.success`, `color.onSuccess`, `color.surfaceVariant`, `color.onSurface` |
| Resumo do Turno e Conclusão | Cards de resumo com ícones semânticos + `ExpressiveButton` (`"Próxima Equipe"`, `"Ir para o Placar Final"`) | `color.successContainer`, `color.onSuccessContainer`, `color.surfaceVariant` |
| Confirmação de saída | `ConfirmModal` (com cronômetro pausado) | `color.scrim`, `component.card.*` |

---

## 5. Estratégia de Testes (`tests/`)

- **Testes Unitários de Caso de Uso (`tests/unit/quemSouEuUseCases.test.ts`)**:
  - Validação de preparação da partida (`ValidationError` para < 2 equipes, 0 pacotes, rodadas fora de 1–5, duração inválida).
  - Embaralhamento sem repetição de cartas e filtragem por pacotes selecionados.
  - Verificação explícita de que nenhum pacote/carta possui conteúdo bíblico.
  - Pontuação `+10 pts` por acerto, `0 pts` por passe e gravação no `MemoryTeamDataSource`.
  - Cooldown de `1 s` no `MemoryTiltSensorService`.
- **Testes de Hook / ViewModel (`tests/hooks/useQuemSouEuViewModel.test.ts`)**:
  - Transições completas de fase (`setup` → `handoff` → `countdown` → `playing` → `summary` → `finished`).
  - Disparo por gesto de inclinação (ativado vs. desativado) e por botões.
  - Descarte da carta atual ao zerar o cronômetro e envio de pontos ao Placar ao avançar.
  - Pausa do cronômetro e sensor durante o `ConfirmModal` de saída.
  - Encerramento gracioso quando o banco de cartas se esgota.
- **Testes de Integração / Tela (`tests/integration/quemSouEu.integration.test.tsx`)**:
  - Renderização dos estados (`loading`, `error`, `setup`, `handoff`, `countdown`, `playing`, `summary`, `finished`), consultas semânticas RNTL e fluxo completo até o placar.
