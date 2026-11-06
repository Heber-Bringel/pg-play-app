---
name: "🐛 Bug ou Violação Arquitetural (Harness)"
about: "Reportar erro funcional, falha de teste ou violação detectada pelo check-arquitetura.mjs"
title: "[FIX] Descrição curta do problema"
labels: ["bug"]
assignees: []
---

## 🔍 Descrição do Problema

<!-- Descreva o erro encontrado ou cole a saída do comando `npm run check` -->

```text
Cole aqui o log de erro (check-arquitetura.mjs, tsc ou jest)
```

---

## 📂 Camada e Arquivo Afetado

- **Arquivo(s):** `src/...`
- **Regra do Harness violada (se aplicável):** <!-- Ex.: VIEW-NAVEGACAO, ESTILO-COR-LITERAL, MODEL-ENTIDADE-TYPE -->
- **Receita recomendada:** `/revisar-arquitetura`

---

## ✅ Critérios de Correção

- [ ] Problema corrigido na camada responsável sem mascarar regras em `scripts/check-arquitetura.mjs`.
- [ ] Teste de regressão adicionado em `tests/`.
- [ ] `npm run check` passando com 0 erros.
