---
name: nova-funcionalidade
description: Cria uma nova funcionalidade de negócio de dentro para fora no padrão MVVM Sofisticado (Domínio -> Infraestrutura em memória -> Use Case -> Container DI -> Testes). Use sempre que o usuário pedir novas regras de negócio, entidades, armazenamento ou serviços.
---

# Receita: Nova Funcionalidade (`nova-funcionalidade`)

Construa sempre **de dentro para fora**, seguindo esta ordem:

0. **Planejar**:
   - Identifique quais entidades (`type`) pertencem ao domínio.
   - Decida para cada dependência externa: guarda/recupera dados (`DataSource`) ou executa uma operação/recurso (`Service`)?
   - Liste os métodos e validações do Use Case.
1. **Camada de Domínio (`src/model/`)**:
   - Crie ou atualize as entidades puras em `src/model/entities/<nome>.ts` (`export type`).
   - Verifique se `src/model/errors.ts` possui os erros necessários (`DomainError`, `ValidationError`, `AuthError`, `DataSourceError`).
   - Crie os contratos (`export interface`) em `src/model/datasources/i<Nome>DataSource.ts` ou `src/model/services/i<Nome>Service.ts` (zero imports externos).
2. **Camada de Infraestrutura em Memória (`src/infra/`)**:
   - Crie `src/infra/datasources/memory<Nome>DataSource.ts` ou `src/infra/services/memory<Nome>Service.ts` usando `implements`.
   - Converta eventuais falhas em `DataSourceError` ou `AuthError`.
3. **Camada de Use Cases (`src/usecase/`)**:
   - Defina o contrato em `src/usecase/i<Nome>UseCases.ts` (`export interface`).
   - Implemente a classe em `src/usecase/<nome>UseCases.ts` (`implements`), recebendo os contratos pelo construtor e aplicando todas as validações de negócio (lançando `ValidationError`).
4. **Container de Injeção de Dependências (`src/di/container.ts`)**:
   - Instancie a infraestrutura e exporte a instância do Use Case tipada pela interface.
5. **Testes Unitários (`tests/`)**:
   - Escreva testes unitários para o Use Case injetando implementações `Memory` ou mocks dos contratos.
6. **Integração Visual (se solicitada)**:
   - Siga a receita `nova-tela` para expor a funcionalidade na ViewModel, View e rota fina.
7. **Implementação Real de Infraestrutura (se solicitada)**:
   - Adicione a classe concreta (`Firebase*`, `Sqlite*`, `AsyncStorage*`) em `src/infra/` e altere apenas a linha de criação em `src/di/container.ts`.
8. **Verificação Final**:
   - Execute `npm run check` até obter `0 erros`.
