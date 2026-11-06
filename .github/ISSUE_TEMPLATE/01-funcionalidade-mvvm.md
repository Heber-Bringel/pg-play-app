---
name: "🚀 Nova Funcionalidade / Caso de Uso (MVVM)"
about: "Especificar um Caso de Uso ou funcionalidade do PG PLAY seguindo as 7 camadas do MVVM Sofisticado"
title: "[UC00] Título da funcionalidade"
labels: ["enhancement"]
assignees: []
---

## 🎯 Objetivo e Caso de Uso

- **Caso de Uso:** `UC0X` (`docs/requisitos/requisitos-e-casos-de-uso-pg-play.md`)
- **Requisitos Funcionais:** `RF0X`, `RF0Y`
- **Modalidade:** `1 Celular (Passa-Celular)` | `Sala Multiplayer (Rede)`
- **Receitas do Harness recomendadas:** `/nova-funcionalidade` e `/nova-tela`

---

## 🏗️ Plano de Implementação por Camada (De dentro para fora)

### 1. Domínio (`src/model/`)
- [ ] Entidade(s) em `src/model/entities/*.ts` (`export type Nome = { ... }`)
- [ ] Contrato(s) em `src/model/datasources/i*DataSource.ts` ou `src/model/services/i*Service.ts`
- [ ] Erros de domínio (`ValidationError`, `DataSourceError`, `AuthError` em `src/model/errors.ts`)

### 2. Infraestrutura (`src/infra/`)
- [ ] Implementação offline/memória `src/infra/datasources/memory*DataSource.ts` ou `src/infra/services/memory*Service.ts`

### 3. Caso de Uso e DI (`src/usecase/` e `src/di/`)
- [ ] Interface `src/usecase/i*UseCases.ts` e classe `src/usecase/*UseCases.ts`
- [ ] Registro no `src/di/container.ts`

### 4. Apresentação (`src/viewmodel/`, `src/view/` e `src/app/`)
- [ ] ViewModel `src/viewmodel/use*ViewModel.ts` retornando `[state, actions]`
- [ ] Tela `src/view/*.tsx` usando apenas tokens de `@/view/theme` e componentes de `@/view/components/*`
- [ ] Rota fina de 2 linhas espelhada em `src/app/*.tsx`

### 5. Testes e Verificação (`tests/`)
- [ ] Testes unitários em `tests/*.test.ts(x)`
- [ ] `npm run check` passando com 0 violações

---

## ✅ Critérios de Aceite

1. [ ] Regra de negócio validada no UseCase com lançamento de `ValidationError` para entradas inválidas.
2. [ ] Interface construída exclusivamente com tokens e componentes do **PG Play Expressive** (`design-system/`).
3. [ ] `node scripts/check-arquitetura.mjs`, `tsc --noEmit` e `jest` aprovados sem erros.
