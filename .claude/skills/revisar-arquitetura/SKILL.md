---
name: revisar-arquitetura
description: Audita todo o projeto executando o verificador arquitetural, agrupa e explica eventuais violações e corrige de dentro para fora (model -> infra -> usecase -> di -> viewmodel -> view -> app).
---

# Receita: Revisar Arquitetura (`revisar-arquitetura`)

1. **Execute o verificador**:
   - Rode `npm run arquitetura` (e `npm run check`).
2. **Agrupe e explique os erros**:
   - Se houver erros, agrupe-os por código de regra e explique didaticamente por que cada um viola o padrão MVVM Sofisticado ou o Sistema de Design.
3. **Corrija de dentro para fora**:
   - Ordem de correção: `src/model/` → `src/infra/` → `src/usecase/` → `src/di/` → `src/viewmodel/` → `src/view/` → `src/app/`.
   - **Nunca** altere `scripts/check-arquitetura.mjs`, `AGENTS.md` ou `design-system/` para fazer um erro desaparecer.
4. **Auditoria semântica complementar (o que o script estático não vê)**:
   - Há alguma regra de negócio ou validação escondida dentro de uma ViewModel? (Se sim, mova para o Use Case).
   - Algum Use Case deixou de validar dados de entrada?
   - Há mistura entre `DataSource` (dados) e `Service` (funcionalidades)?
   - Todas as telas possuem os estados de carregando, erro, vazio e conteúdo?
5. **Confirmação final**:
   - Rode `npm run check` novamente e confirme `0 erros`.
