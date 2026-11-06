---
name: sincronizar-tema
description: Sincroniza os tokens e componentes de design-system/ com src/view/theme.ts e src/view/components/. Use ao iniciar o projeto ou quando o sistema de design for atualizado.
---

# Receita: Sincronizar Tema (`sincronizar-tema`)

1. **Leia a especificação do Sistema de Design**:
   - Leia `harness.config.json`.
   - Leia `design-system/README.md`, `design-system/02-tokens.md`, `design-system/03-fundamentos.md` e `design-system/06-acessibilidade.md`.
   - Se houver valores marcados como `TODO` em `02-tokens.md`, pare imediatamente e pergunte ao usuário.
2. **Gere ou atualize `src/view/theme.ts`**:
   - Mantenha o objeto `primitive` interno ao arquivo (**não exportado**).
   - Exporte os tokens semânticos (`color`, `space`, `radius`, `font`, `border`, `icon`, `typography`, `elevation`, `motion`) e de componente (`button`, `input`, `card`, `timer`, `quiz`, `key`), além de `tokens` (claro), `darkTokens` (escuro) e `createTokens`.
   - Garanta que todos os valores correspondam exatamente a `design-system/02-tokens.md`.
3. **Sincronize os componentes em `src/view/components/`**:
   - Para cada arquivo em `design-system/04-componentes/*.md`, garanta o componente correspondente em `src/view/components/` com nome em `camelCase.tsx`.
   - Implemente todas as variantes como `type` de prop, todos os estados visuais/interativos e atributos de acessibilidade (`accessibilityRole`, `accessibilityLabel`, `accessibilityState`).
   - Use apenas export nomeado (`export const Nome = ...`) e nunca use ViewModel dentro de `src/view/components/`.
4. **Verifique e documente**:
   - Execute `npm run check`.
   - Apresente uma tabela mapeando cada token de `02-tokens.md` para o símbolo exportado em `src/view/theme.ts`.
