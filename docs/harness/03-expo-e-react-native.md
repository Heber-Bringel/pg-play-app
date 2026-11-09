# 03 · Expo, React Native e Camadas de Bibliotecas

Este documento orienta o uso de comandos do Expo, roteamento com Expo Router e o posicionamento correto de cada biblioteca na arquitetura MVVM Sofisticado.

---

## 1. Comandos Essenciais

| Objetivo | Comando |
| :--- | :--- |
| Verificar arquitetura, tipos e testes | `npm run check` |
| Rodar apenas o verificador arquitetural | `npm run arquitetura` |
| Rodar suíte de testes unitários e de componentes | `npm test` |
| Instalar biblioteca compatível com o SDK do Expo | `npx expo install <pacote>` |
| Diagnosticar saúde do projeto Expo | `npx expo-doctor` |
| Alinhar versões de pacotes com o SDK | `npx expo install --fix` |
| Iniciar servidor limpando cache do Metro | `npx expo start --clear` |

---

## 2. Regras do Expo Router no Projeto

1. **`src/app/_layout.tsx`**: configura o navegador principal (`<Stack />`) e define as opções de cabeçalho.
2. **Rotas finas em `src/app/`**: todo arquivo de rota em `src/app/` apenas importa e reexporta a View correspondente de `src/view/`.
3. **Navegação imperativa na ViewModel**:
   - Use `router.push("/rota")` para empilhar uma nova tela.
   - Use `router.replace("/rota")` quando não fizer sentido voltar à tela anterior.
   - Use `router.back()` (verificando `router.canGoBack()`) para retornar à tela anterior.
   - Use `router.dismissTo("/")` para desempilhar múltiplas telas de volta ao Hub.
   - Parâmetros de rota (`useLocalSearchParams`) são lidos e convertidos na ViewModel, nunca na View.

---

## 3. Onde Fica Cada Biblioteca?

| Necessidade | Biblioteca / API | Camada Obrigatória |
| :--- | :--- | :--- |
| Componentes básicos e toque | `View`, `Text`, `Pressable`, `FlatList`, `TextInput` | `src/view/` |
| Ícones | `@expo/vector-icons` (`MaterialCommunityIcons`) | `src/view/` |
| Imagens otimizadas | `expo-image` | `src/view/` |
| Navegação e parâmetros de rota | `expo-router` | `src/viewmodel/` e `src/app/_layout.tsx` |
| Armazenamento chave-valor local | `@react-native-async-storage/async-storage` | `src/infra/datasources/` |
| Banco de dados relacional local | `expo-sqlite` | `src/infra/datasources/` |
| Requisições HTTP / REST | `fetch` | `src/infra/datasources/` |
| Backend em nuvem (Salas Multiplayer) | `@supabase/supabase-js` | `src/infra/services/` + `src/di/container.ts` |
| Áudio, câmera, localização, notificações | `expo-av`, `expo-camera`, `expo-location`, `expo-notifications` | Operação em `src/infra/services/`; componente visual (ex.: `CameraView`) em `src/view/` |

---

## 4. Backend, Variáveis de Ambiente e Build

- O roteiro completo de infraestrutura (Fase 1 local com `Memory*`/`AsyncStorage` e Fase 2 multiplayer com **Supabase** + `expo-av`) está detalhado em [`05-infraestrutura-e-supabase.md`](05-infraestrutura-e-supabase.md).
- Clientes externos (`@supabase/supabase-js`) são encapsulados em `src/infra/` e instanciados apenas em `src/di/container.ts`.
- Toda funcionalidade deve ter uma implementação `MemoryX` funcional em `src/infra/` para permitir execução e testes offline sem rede.
- Variáveis `EXPO_PUBLIC_` (`EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`) são embutidas no pacote final e **não são segredos**: nunca armazene chaves privadas (`service_role`) no repositório.
- Não edite `ios/` ou `android/` manualmente; configure permissões, `name`, `version` e `package` em `app.json`.
