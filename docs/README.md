# 📚 Documentação do Projeto — PG PLAY

Bem-vindo à documentação de Engenharia de Requisitos, Arquitetura MVVM Sofisticada, IHC, Qualidade/Testes (**Engenharia de Software III**) e Especificação de Jogos do **PG PLAY** (trabalho final integrado de **IHC**, **PDM** e **Engenharia de Software III** — **IFPI Campus Piripiri**).

---

## 📂 Estrutura de Pastas

```text
docs/
├── README.md                                        # Índice geral da documentação
├── harness/                                         # Pilar 2 do Harness MVVM Sofisticado
│   ├── README.md                                    # Visão geral do Harness e receitas disponíveis
│   ├── 01-arquitetura-mvvm.md                       # As 7 pastas de src/, responsabilidades e fluxo MVVM
│   ├── 02-convencoes-de-codigo.md                   # Nomes, type vs interface, erros de domínio e testes
│   ├── 03-expo-e-react-native.md                    # Expo Router, rotas finas e navegação na ViewModel
│   ├── 04-views-e-design-system.md                  # Consumo de tokens (@/view/theme) e componentes M3
│   ├── 05-infraestrutura-e-supabase.md              # Roteiro 1 (Memory/AsyncStorage) e Roteiro 2 (Supabase Realtime/RLS)
│   └── 06-testes-e-qualidade-es3.md                 # As 7 categorias de testes, cobertura >= 80% e 3 fluxos E2E
├── qualidade-e-testes/
│   └── estrategia-testes-e-iso25010.md              # Qualidade ISO/IEC 25010, Suíte de Testes e Guia de Defesa Oral (ES III)
├── requisitos/
│   └── requisitos-e-casos-de-uso-pg-play.md         # RF, RNF, Atores, Casos de Uso (UC01–UC08) e Rastreabilidade
├── planejamento/
│   └── milestones-e-issues.md                       # Labels, 3 Milestones (v0.1.0–v1.0.0) e as 11 Issues do GitHub
└── jogos/
    ├── README.md                                    # Catálogo de jogos (Modo Sala Multiplayer vs. Modo 1 Celular)
    ├── cidade-dorme.md                              # Especificação completa do Cidade Dorme (Narrador por áudio)
    └── adedonha-biblica.md                          # Especificação completa da Adedonha Bíblica (Roleta Expressiva M3)
```

---

## 🔗 Acesso Rápido

1. 🛡️ **[Arquitetura e Harness MVVM Sofisticado (`harness/README.md`)](harness/README.md)**
   - Regras de separação em 7 camadas (`app`, `view`, `viewmodel`, `usecase`, `model`, `infra`, `di`), convenções de TypeScript/React Native, rotas finas do Expo Router, infraestrutura Supabase e testes automatizados.
2. 🧪 **[Estratégia de Testes Automatizados e Qualidade ISO/IEC 25010 (`qualidade-e-testes/estrategia-testes-e-iso25010.md`)](qualidade-e-testes/estrategia-testes-e-iso25010.md)**
   - Características da **ISO/IEC 25010** no PG PLAY, mapeamento das 7 categorias obrigatórias de testes (Unitários, Componentes RNTL, Mocks, Hooks, Cobertura `>= 80%`, Integração e 3 Fluxos E2E Maestro), regras de histórico Git e **Respostas às 18 Perguntas da Defesa Oral**.
3. 🗺️ **[Planejamento de Milestones, Labels e Issues (`planejamento/milestones-e-issues.md`)](planejamento/milestones-e-issues.md)** e **[Guia de Contribuição (`../CONTRIBUTING.md`)](../CONTRIBUTING.md)**
   - Padrão de Commits Convencionais, Pull Requests, Labels por camada MVVM, 3 Milestones e 11 Issues mapeadas aos Casos de Uso (`UC01–UC08`) e à suíte de testes de Engenharia de Software III.
4. 📋 **[Especificação de Requisitos e Casos de Uso (`requisitos/requisitos-e-casos-de-uso-pg-play.md`)](requisitos/requisitos-e-casos-de-uso-pg-play.md)**
   - Requisitos Funcionais (`RF01` a `RF31`), Requisitos Não Funcionais (`RNF01` a `RNF11`), Casos de Uso (`UC01` a `UC08`) e Matriz de Rastreabilidade.
5. 🎮 **[Catálogo de Jogos (`jogos/README.md`)](jogos/README.md)**
   - 🌙 **[Cidade Dorme (`jogos/cidade-dorme.md`)](jogos/cidade-dorme.md)** — Dedução social em Sala Multiplayer com Narrador do próprio app via voz clonada (masculina ou feminina) e transição automática entre tema Escuro (Noite) e Claro (Dia).
   - ✍️📖 **[Adedonha Bíblica (`jogos/adedonha-biblica.md`)](jogos/adedonha-biblica.md)** — Disputa em Sala Multiplayer com Roleta Expressiva do Alfabeto (Material 3 Expressive), colunas criadas pelo Moderador e apuração assistida com botão *"Levantar Dúvida ✋"*.
6. 🎨 **[Sistema de Design PG Play Expressive (`../design-system/README.md`)](../design-system/README.md)**
   - Princípios, Tokens, Fundamentos, Componentes em React Native + Expo, Padrões, Acessibilidade e Testes.
