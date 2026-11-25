# 🏗️ Plano de Implementação Técnica (`plan.md`): site-politica-privacidade

- **Branch:** `feat/027-site-politica-privacidade`
- **Data:** 2026-11-25
- **Especificação de Origem:** `specs/027-site-politica-privacidade/spec.md`
- **Constituição de Referência:** `.specify/memory/constitution.md`
- **Issue Vinculada:** `#82`

---

## 1. Resumo Técnico da Solução

Para disponibilizar a **Política de Privacidade** e os **Termos de Uso** exigidos pelo Google Play Console sob uma URL pública HTTPS, o site é uma **pasta estática `site/` (HTML5 + CSS3, sem JavaScript) publicada no Firebase Hosting**, que dá HTTPS automático.

**Por que `site/` e não `public/`** (revisão de 2026-11-25): o app usa Expo Web com `web.output: "single"`. Nesse modo o Expo copia `public/` para o `dist/` e usa `public/index.html` como **molde da página do app**, injetando nele o bundle JS. Uma landing em `public/index.html` quebraria o deploy web do app na Vercel (`vercel.json` publica o `dist/`). Testado com `expo export -p web`: o `dist/index.html` saiu com o título da landing e os `<script>` do app.

A abordagem mantém o app React Native (`src/`) intacto, carrega instantaneamente (sem o bundle do Expo Web) e não adiciona dependências ao `package.json`: o deploy usa `npx firebase-tools`.

---

## 2. Verificação Constitucional (*Constitution Check*)

- [x] **Artigo I (SDD / Spec Kit)**: `spec.md`, `plan.md` e `tasks.md` revisados antes do desenvolvimento do site.
- [x] **Artigo II (Isolamento de Camadas MVVM)**: nenhum arquivo em `src/`; o site fica em `site/`, na raiz do repositório, fora do alcance do Metro.
- [x] **Artigo III (Design System PG Play Expressive)**: `site/styles.css` traduz os tokens de `src/view/theme.ts` em variáveis CSS (`:root`), com os modos claro e escuro (`prefers-color-scheme`), os raios, os espaçamentos e a fonte *Plus Jakarta Sans*. Os componentes seguem `botao.md` (pílula, altura mínima 48 px) e `card-de-jogo.md` (raio 28 px, borda de 2 px em `outline`).
- [x] **Artigo IV (Qualidade e Testes)**: teste Jest `tests/unit/siteIntegrity.test.ts` audita os arquivos, os links internos, as seções obrigatórias e o peso das páginas.

---

## 3. Mapeamento de Arquivos

```text
pg-play-app/
├─ site/
│  ├─ index.html                     # Landing Page (apresentação, 8 minigames, destaques de IHC, download)
│  ├─ privacidade.html               # Política de Privacidade para a Play Store
│  ├─ termos.html                    # Termos de Uso
│  ├─ 404.html                       # Página de erro do Firebase Hosting com links de volta
│  ├─ styles.css                     # Folha de estilo única com os tokens Expressive
│  └─ assets/
│     ├─ logo.svg                    # Logotipo vetorial do PG PLAY
│     ├─ favicon.svg                 # Ícone do site (SVG, aceito pelos navegadores atuais)
│     └─ fonts/                      # Plus Jakarta Sans 400/700/800 em woff2 (subconjunto latino) + OFL.txt
├─ firebase.json                     # Firebase Hosting apontando para "site", com cleanUrls e cabeçalhos
├─ .firebaserc                       # Projeto Firebase padrão (ajustar ao ID real antes do deploy)
├─ scripts/check-site-publicacao.mjs # Bloqueia o deploy se houver marcador pendente (ex.: e-mail)
├─ package.json                      # Scripts "site:check" e "site:deploy"
└─ tests/
   └─ unit/
      └─ siteIntegrity.test.ts       # Teste Jest que audita o HTML e os links do site
```

**Fora do plano original:** o badge oficial "Disponível no Google Play" não foi incluído; é marca do Google e só pode ser usado como arquivo oficial baixado do Google, depois que o app estiver publicado. A landing usa um botão do Design System com o link `https://play.google.com/store/apps/details?id=br.edu.ifpi.pgplay` (pacote de `app.json`). A galeria de capturas de tela também ficou de fora, porque o repositório não tem capturas; a vitrine dos minigames usa cartões no estilo do `GameCard`.

---

## 4. Mapeamento dos Tokens do Design System para CSS (`site/styles.css`)

| Token semântico (`theme.ts`) | Variável CSS | Claro | Escuro |
| :--- | :--- | :--- | :--- |
| `color.action` | `--color-action` | `#5B21B6` | `#D8B4FE` |
| `color.actionHover` | `--color-action-hover` | `#4C1D95` | `#DDD6FE` |
| `color.onAction` | `--color-on-action` | `#FFFFFF` | `#2E1065` |
| `color.actionContainer` | `--color-action-container` | `#EDE9FE` | `#3B0764` |
| `color.onActionContainer` | `--color-on-action-container` | `#2E1065` | `#EDE9FE` |
| `color.secondaryContainer` | `--color-secondary-container` | `#FFEDD5` | `#9A3412` |
| `color.onSecondaryContainer` | `--color-on-secondary-container` | `#431407` | `#FFEDD5` |
| `color.highlight` | `--color-highlight` | `#FACC15` | `#FACC15` |
| `color.onHighlight` | `--color-on-highlight` | `#1D1B20` | `#1D1B20` |
| `color.surface` | `--color-surface` | `#FDF8FF` | `#141218` |
| `color.surfaceContainer` | `--color-surface-container` | `#FFFFFF` | `#1D1B20` |
| `color.surfaceVariant` | `--color-surface-variant` | `#F3EDF7` | `#2B2930` |
| `color.onSurface` | `--color-on-surface` | `#1D1B20` | `#E6E0E9` |
| `color.onSurfaceMuted` | `--color-on-surface-muted` | `#49454F` | `#CAC4D0` |
| `color.outline` | `--color-outline` | `#79747E` | `#938F99` |
| `color.focus` | `--color-focus` | `#1D1B20` | `#E6E0E9` |
| `space.sm / md / lg / xl / 2xl` | `--space-sm` … `--space-2xl` | `8 / 16 / 24 / 32 / 48 px` | — |
| `radius.md / lg / xl / full` | `--radius-md` … `--radius-full` | `16 / 20 / 28 / 9999 px` | — |
| `font.*.family` | `--font-family` | `'Plus Jakarta Sans'` (400, 700, 800) | — |
| `border.thin / focus` | `--border-thin`, `--border-focus` | `2 / 3 px` | — |

---

## 5. Conteúdo da Política de Privacidade (conferido no código em 2026-11-25)

| Tema | O que o app faz de fato | Fonte |
| :--- | :--- | :--- |
| Dados locais | Equipes, placar, parâmetros de partida e tema salvos no `AsyncStorage` | `src/infra/datasources/asyncStorage*.ts` |
| Pedidos de oração | Ficam só na memória durante o Termômetro de Pedidos; não são gravados | `src/usecase/termometroUseCases.ts` (sem DataSource) |
| Multiplayer | Login anônimo no Supabase; salas, PIN, apelidos, respostas da Adedonha e papéis/ações do Cidade Dorme. Salas e apelidos **não são apagados automaticamente** ao fim da partida; segredos e ações do Cidade Dorme são limpos pelo próprio jogo | `supabaseMultiplayerRoomService.ts`, `supabase/migrations/` |
| API externa | Textos bíblicos buscados em `https://bible.helloao.org` (recebe o IP, nenhum dado pessoal) | `helloAoVerseDataSource.ts` |
| Recursos do aparelho | Vibração (`expo-haptics`), acelerômetro (`expo-sensors`, só no Quem Sou Eu), orientação de tela, síntese de voz (`expo-speech`). Nenhum exige permissão perigosa; não há câmera, microfone, localização nem contatos | `src/infra/services/` |
| Anúncios e rastreamento | Nenhum SDK de anúncios, analytics ou rastreamento | `package.json` |

---

## 6. Estratégia de Testes e Validação

1. **Teste automatizado (`tests/unit/siteIntegrity.test.ts`)**:
   - `site/index.html`, `site/privacidade.html` e `site/termos.html` existem, têm `lang="pt-BR"`, `<title>`, `viewport` e nenhum `<script>`;
   - `privacidade.html` contém as seções: "Armazenamento Local", "Modo Multiplayer e Supabase", "Permissões de Dispositivo (Sensores, Vibração e Áudio)", "Público-Alvo e Proteção a Menores", "LGPD e Direitos dos Titulares" e "Canal de Contato e Suporte";
   - todos os links e recursos relativos apontam para arquivos existentes;
   - nenhuma página carrega recurso de outro domínio (fontes e CSS locais);
   - cada página com CSS e fontes pesa menos de 150 KB;
   - `site/styles.css` usa os valores do `theme.ts` (ex.: `#5B21B6`, `#FDF8FF`).
2. **Bloqueio de publicação (`npm run site:check`)**: falha enquanto houver `[E-MAIL DE CONTATO]` ou outro marcador `[...]` pendente; o `site:deploy` roda esse passo antes do Firebase. O `npm run check` não depende dele, para não travar commits.
3. **Linter e arquitetura**: `npm run check` com **0 violações** e todos os testes passando.
4. **Pré-visualização local**: abrir `site/index.html` no navegador, em largura de celular (360 px) e de desktop, nos temas claro e escuro.
5. **Deploy no Firebase**: `npm run site:deploy` e conferência da URL HTTPS (`https://pgplay-ifpi.web.app/privacidade`).

---

## 7. Adendo cinematográfico (2026-11-25)

Só CSS, sem JavaScript (a CSP continua `script-src 'none'`). As animações mexem apenas em `transform`, `opacity` e `clip-path`, para rodar suave em celulares simples.

| Efeito | Técnica | Token |
| :--- | :--- | :--- |
| Entrada do hero em sequência | `@keyframes` + `animation-delay` | `motion.spring.spatial` (600 ms, `linear()`) |
| Aurora de fundo | gradientes radiais com `color-mix()` das cores `action`, `secondary` e `highlight` | — |
| Ilustração viva (play, grupo, órbitas) | SVG inline com classes animadas por CSS | `motion.duration.long` (pulso do cronômetro) |
| Letreiro com os 8 jogos | faixa duplicada em `translateX`, `aria-hidden` | — |
| Revelação na rolagem | `animation-timeline: view()` dentro de `@supports` | `motion.spring.effects` |
| Cabeçalho e barra de leitura | `animation-timeline: scroll()` | — |
| Transição entre páginas | `@view-transition { navigation: auto; }` | `motion.duration.medium` |

**Acessibilidade:** todo o bloco fica em `@media (prefers-reduced-motion: no-preference)`. Fora dele não há `animation`, então com "Reduzir movimento" o site fica estático. Navegadores sem suporte mostram o conteúdo completo, porque os estados iniciais (ex.: `opacity: 0`) só existem dentro das animações.

---

## 8. Adendo: vitrine com telas reais e Material 3 Expressive (2026-11-25)

**Capturas:** build web temporário com `EXPO_NO_DOTENV=1` (multiplayer em memória), Chrome headless controlado pelo DevTools Protocol (sem dependências novas), viewport de 412 × 892 px a 2x; equipes fictícias semeadas no `localStorage`. Saída em `site/assets/screens/*.webp` (540 px de largura, qualidade 74, de 13 a 36 KB).

| Seção da landing | Conteúdo | Movimento (só com `no-preference`) |
| :--- | :--- | :--- |
| Hero | Celular com o hub (claro ou escuro via `<picture>`), chips flutuantes recriando o cronômetro, a tag e o "Acertaram!", formas M3 | Entrada com `spring.spatial`, *shape morphing* cookie → flor → trevo (CSS `d: path()`), rotação lenta, flutuação |
| Como funciona | 3 passos com número em forma M3 e telas de equipes, catálogo e placar | Formas desdobram e passos sobem com a rolagem |
| Os jogos | Chips de navegação; 8 linhas com captura real, etiquetas e "como funciona" (Quem Sou Eu? em paisagem) | Celular entra de lado e se endireita; forma de fundo com parallax |
| Claro ou escuro | Dois celulares (hub claro e escuro) | Abrem como um leque |
| Feito para todo mundo | 6 cartões (`card-de-jogo.md`) | Cascata na rolagem |
| Chamada final | Bloco `color.action` com botão `highlight` | Cresce e arredonda ao entrar na tela |

**Formas M3 Expressive:** geradas por fórmula polar (`r = R·(1 + a·cos nθ)`) com 72 pontos cada (cookie 9, flor 8, trevo 4, sol 12, burst 6), para todas poderem se transformar umas nas outras.

**Responsividade:** coluna única abaixo de 56rem; cabeçalho fixo só a partir de 40rem (no celular ele rola com a página); links do cabeçalho em uma linha só; conferido sem rolagem horizontal em 320, 360, 820 e 1366 px.
