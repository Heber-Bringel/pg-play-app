---
name: "🎨 Design System / Componente (PG Play Expressive)"
about: "Sincronizar ou evoluir tokens e componentes do Material 3 Expressive em src/view/"
title: "[DS] Nome do componente ou grupo de tokens"
labels: ["design-system"]
assignees: []
---

## 🎨 Especificação de Origem (`design-system/`)

- **Documento de referência:** `design-system/02-tokens.md` ou `design-system/04-componentes/*.md`
- **Classificação M3 Expressive:** `Herdado` | `Adaptado` | `Novo`
- **Receita do Harness recomendada:** `/sincronizar-tema`

---

## 🧩 Entregáveis em `src/view/`

- [ ] Atualização de tokens semânticos/de componente em `src/view/theme.ts` (mantendo `primitive` privado/não exportado)
- [ ] Componente em `src/view/components/<nomeComponente>.tsx` (`export type ...Props` + `export const ...`)
- [ ] Propriedades de acessibilidade WCAG 2.1 (`accessibilityRole`, `accessibilityLabel`, `accessibilityState`, alvo mínimo `48x48dp`)
- [ ] Testes de renderização e estados em `tests/`

---

## ✅ Critérios de Aceite

1. [ ] Nenhum valor literal de cor (`#hex`, `rgb`, `rgba`) fora de `src/view/theme.ts`.
2. [ ] Todos os estados visuais documentados (`default`, `pressed`, `focused`, `disabled`, `error`/`critical`) implementados.
3. [ ] `npm run check` passando com 0 violações.
