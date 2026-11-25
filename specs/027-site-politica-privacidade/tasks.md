# ✅ Lista de Tarefas (`tasks.md`): site-politica-privacidade

- **Input:** `specs/027-site-politica-privacidade/spec.md` e `specs/027-site-politica-privacidade/plan.md`
- **Ordem de Execução:** Estrutura → Documentos Legais → Landing Page & Estilos → Configuração de Deploy → Testes Automatizados → Verificação

---

## Fase 1: Estrutura Base e Identidade Visual Web

- [x] **T001** Criar a pasta `site/` e `site/assets/` com logo vetorial, favicon e fontes Plus Jakarta Sans locais (woff2 + OFL).
- [x] **T002** Criar `site/styles.css` mapeando os tokens de cores (claro e escuro), raios, espaçamentos e tipografia *Plus Jakarta Sans* do **PG Play Expressive**.

---

## Fase 2: Documentos Legais para a Google Play Store

- [x] **T003** Criar `site/privacidade.html` cobrindo a LGPD, o `AsyncStorage`, as salas no Supabase (login anônimo, sem apagamento automático), a API de textos bíblicos, os recursos do aparelho e o canal de contato (marcador `[E-MAIL DE CONTATO]`).
- [x] **T004** Criar `site/termos.html` com os Termos de Uso e regras de utilização gratuita/comunitária do app.

---

## Fase 3: Landing Page Institucional

- [x] **T005** Criar `site/index.html` com apresentação do PG PLAY, vitrine dos 8 minigames, destaques de IHC, botão de download para a Google Play Store e links institucionais no rodapé; criar `site/404.html`.

---

## Fase 4: Configuração de Deploy e Scripts

- [x] **T006** Criar `firebase.json` e `.firebaserc` configurando o **Firebase Hosting** apontando para a pasta `site/`.
- [x] **T007** Criar `scripts/check-site-publicacao.mjs` e os scripts `"site:check"` e `"site:deploy"` em `package.json` (deploy bloqueado com marcador pendente).

---

## Fase 5: Testes Automatizados e Verificação

- [x] **T008** Criar teste automatizado `tests/unit/siteIntegrity.test.ts` validando existência dos arquivos, links internos, seções obrigatórias da Google Play Store, ausência de recursos externos e peso < 150 KB.
- [x] **T009** Executar `npm run check` garantindo **0 violações** de arquitetura, TypeScript e 100% dos testes Jest aprovados (426 testes, 34 do site).
- [ ] **T010** Testar pré-visualização local do site (abrindo no navegador) e verificar responsividade mobile/desktop e temas claro/escuro.
- [x] **T011** E-mail de contato definido (`douglasleone09@gmail.com`) e projeto Firebase `pgplay-ifpi` criado e configurado em `.firebaserc` (2026-11-25).
- [ ] **T012** ~~Publicar com `npm run site:deploy`~~ (feito em 2026-11-25: https://pgplay-ifpi.web.app) e cadastrar a URL `https://pgplay-ifpi.web.app/privacidade` no Google Play Console *(pendente, feito pelo dono da conta de desenvolvedor)*.
- [ ] **T013** Commits convencionais e PR para a `develop` com `Closes #82` (`/commit-e-pr`).

---

## Fase 6: Adendo cinematográfico (2026-11-25)

- [x] **T014** Tokens de movimento em `site/styles.css`: durações (`motion.duration.*`) e as molas `motion.spring.spatial` e `motion.spring.effects` convertidas para `linear()`.
- [x] **T015** Hero: aurora de fundo, entrada em sequência, brilho no título e ilustração SVG animada; faixa de letreiro com os 8 jogos.
- [x] **T016** Rolagem: cartões e títulos revelados com `animation-timeline: view()`, sombra no cabeçalho fixo, barra de progresso nas páginas legais; transição entre páginas com `@view-transition`.
- [x] **T017** Todas as animações só dentro de `prefers-reduced-motion: no-preference`, com teste automatizado garantindo isso.

---

## Fase 7: Vitrine com telas reais (2026-11-25)

- [x] **T018** Capturar 12 telas reais do app (build sem `.env`, multiplayer em memória) e otimizar em WebP (≤ 40 KB cada).
- [x] **T019** Landing ampliada: hero com celular e formas M3, "Como funciona", vitrine dos 8 jogos com navegação por chips, claro/escuro, 6 cartões e chamada final.
- [x] **T020** Animações Material 3 Expressive: *shape morphing*, molas `spatial`/`effects` e revelações por rolagem, tudo dentro de `prefers-reduced-motion: no-preference`.
- [x] **T021** Responsividade conferida em 320, 360, 820 e 1366 px (sem rolagem horizontal) e testes de imagens (alt, tamanho, lazy, peso).

---

## Fase 8: Cabeçalho M3 Expressive (2026-11-25)

- [x] **T022** Cabeçalho como barra de ferramentas flutuante: pílula com vidro fosco e elevação ao rolar, marca com subtítulo, links em pílula com indicador ativo e *shape morphing*, destaque da seção visível (`:target-current`, Chrome 140+), botão "Baixar" e menu do celular com `<details>` (sem JavaScript), conferido em 320, 360, 820 e 1366 px nos temas claro e escuro.
