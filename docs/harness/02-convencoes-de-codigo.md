# 02 · Convenções de Código e Nomenclatura

Todas as convenções abaixo são verificadas automaticamente por `scripts/check-arquitetura.mjs`.

---

## 1. O que Sempre Fazer vs. O que Nunca Fazer

| Sempre usar | Nunca usar |
| :--- | :--- |
| TypeScript estrito em todos os arquivos (`.ts` e `.tsx`) | `any` ou arquivos `.js` dentro de `src/` |
| `export type` para Props, Entidades, Estados e Actions | `interface` para Props, Entidades ou Estados |
| `export interface` apenas para contratos (`I*Service`, `I*DataSource`, `I*UseCases`) | `type` para contratos implementados por classes |
| `const Nome = ({ ... }: NomeProps) => { ... };` | `React.FC`, `function Nome()` para componentes ou `export default function` |
| Telas em `src/view/`: `export default Nome;` na última linha | Export nomeado para telas de rota |
| Componentes em `src/view/components/`: `export const Nome = ...` (export nomeado) | `export default` em `src/view/components/` |
| `catch (err: unknown)` com verificação `err instanceof DomainError` | `catch (err: any)` |
| Importações com alias `@/` (`@/view/theme`, `@/model/errors`) | Caminhos relativos `./` ou `../` dentro de `src/` |
| Atualização funcional de estado quando depende do anterior (`prev => ...`) | Mutações diretas de arrays/objetos de estado |
| `StyleSheet.create({...})` no final do arquivo `.tsx` | Estilos inline com cores hexadecimais ou números mágicos |

---

## 2. Padrão de Nomes de Arquivos e Símbolos

| Elemento | Caminho em `src/` | Nome do Arquivo | Símbolo Exportado |
| :--- | :--- | :--- | :--- |
| **Rota fina** | `src/app/` | Mesmo nome da rota (`index.tsx`, `teams.tsx`, `+not-found.tsx`) | `export default NomeDaTela` |
| **Tela (View)** | `src/view/` | Espelho exato de `src/app/` (`index.tsx`, `teams.tsx`, `+not-found.tsx`) | `const NomeDaTela` + `export default NomeDaTela` |
| **Componente Visual** | `src/view/components/` | `camelCase.tsx` (ex.: `expressiveButton.tsx`, `gameCard.tsx`) | `export type NomeProps` + `export const Nome` |
| **Tema** | `src/view/theme.ts` | `theme.ts` | `color`, `space`, `radius`, `font`, `tokens`, `darkTokens` |
| **ViewModel** | `src/viewmodel/` | `useXViewModel.ts` (ex.: `useHubViewModel.ts`) | `export type XState`, `export type XActions`, `export function useXViewModel` |
| **Contrato de Use Case** | `src/usecase/` | `iXUseCases.ts` (ex.: `iPgPlayUseCases.ts`) | `export interface IXUseCases` |
| **Classe de Use Case** | `src/usecase/` | `xUseCases.ts` (ex.: `pgPlayUseCases.ts`) | `export class XUseCases implements IXUseCases` |
| **Entidade** | `src/model/entities/` | `camelCase.ts` (ex.: `team.ts`, `minigame.ts`) | `export type Team` |
| **Contrato DataSource** | `src/model/datasources/` | `iXDataSource.ts` (ex.: `iTeamDataSource.ts`) | `export interface ITeamDataSource` |
| **Contrato Service** | `src/model/services/` | `iXService.ts` (ex.: `iMultiplayerRoomService.ts`) | `export interface IMultiplayerRoomService` |
| **Infra DataSource** | `src/infra/datasources/` | `memoryXDataSource.ts` / `sqliteXDataSource.ts` | `export class MemoryXDataSource implements IXDataSource` |
| **Infra Service** | `src/infra/services/` | `memoryXService.ts` / `firebaseXService.ts` | `export class MemoryXService implements IXService` |
| **Container DI** | `src/di/container.ts` | `container.ts` | Instâncias exportadas dos Use Cases |
