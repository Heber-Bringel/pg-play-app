# 📋 Especificação de Funcionalidade (`spec.md`): site-politica-privacidade

- **Branch da Feature:** `feat/027-site-politica-privacidade`
- **Criado em:** 2026-11-25
- **Status:** Em Revisão
- **Caso(s) de Uso / Requisito(s):** Requisitos Não-Funcionais `RNF01` (Acessibilidade), `RNF06` (Privacidade e LGPD), `RNF12` (Operação offline e integridade) e Diretrizes de Publicação da Google Play Store (Developer Policy)
- **Issue vinculada:** `#82`

---

## 1. Cenários de Usuário & Testes de Aceitação *(Obrigatório)*

### História de Usuário 1 — Acessar a Política de Privacidade sob HTTPS para a Google Play Store (Prioridade: P1)

Como **Avaliador da Google Play Store** ou **Líder/Participante do PG**,
desejo acessar uma página web pública, estável e sob HTTPS contendo a **Política de Privacidade oficial do PG PLAY**,
para verificar a conformidade com a LGPD, o uso de permissões de hardware e a transparência no tratamento de dados.

**Por que esta prioridade:** É um requisito eliminatório e obrigatório do **Google Play Console** para aprovação e publicação do aplicativo na loja.

**Como testar independentemente:** Acessar a URL `/privacidade.html` no navegador, confirmando a presença do certificado SSL/HTTPS, sem exigência de login, contendo todos os tópicos exigidos pela Google Play Developer Policy.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o avaliador da Google Play ou usuário acessa `https://<dominio>/privacidade.html`, **Quando** a página carrega, **Então** o conteúdo é renderizado instantaneamente (< 1s), com protocolo HTTPS válido, sem bloqueios de autenticação.
2. **Dado** a leitura do documento de privacidade, **Quando** o usuário busca sobre dados coletados, **Então** o documento declara com transparência que dados de equipes e pontuações ficam restritos ao armazenamento local (`AsyncStorage`), dados do modo multiplayer (salas, PIN e apelidos) ficam no Supabase ligados a um login anônimo, sem nome real nem e-mail, e podem ser apagados a pedido; não há venda de dados nem anúncios invasivos, e descreve os recursos do aparelho (acelerômetro, vibração háptica, orientação de tela e síntese de voz) e a consulta de textos bíblicos à API pública `bible.helloao.org`.
3. **Dado** uma solicitação de suporte ou dúvida sobre privacidade, **Quando** o usuário chega ao rodapé do documento, **Então** há um canal de contato claro e a identificação do responsável pelo tratamento (o e-mail fica marcado como `[E-MAIL DE CONTATO]` até ser definido, e o deploy é bloqueado enquanto o marcador existir).

---

### História de Usuário 2 — Conhecer o PG PLAY através da Landing Page Institucional (Prioridade: P2)

Como **Líder de Pequeno Grupo** ou **Visitante**,
desejo acessar a página inicial do produto (`index.html`) para conhecer a proposta do PG PLAY,
visualizar capturas de tela dos minigames e acessar o botão de download para a Play Store.

**Por que esta prioridade:** Serve como cartão de visitas oficial do projeto acadêmico e aplicativo no ambiente web, facilitando a divulgação e adoção nos Pequenos Grupos.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o visitante acessa a raiz `https://<dominio>/` ou `index.html`, **Quando** a página carrega, **Então** visualiza a identidade visual do **PG Play Expressive** (paleta de cores, tipografia *Plus Jakarta Sans*, botão de ação de download no Google Play e resumo dos 8 minigames).
2. **Dado** que o visitante clica no link *"Política de Privacidade"* ou *"Termos de Uso"*, **Quando** aciona o link, **Então** é navegado diretamente para a página correspondente sem erros 404.

---

### História de Usuário 3 — Acessar os Termos de Uso e Regras de Utilização (Prioridade: P3)

Como **Usuário do aplicativo**,
desejo consultar os Termos de Uso (`termos.html`) para entender as condições de uso comunitário, acadêmico e gratuito do PG PLAY.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** o acesso a `https://<dominio>/termos.html`, **Quando** a página é lida, **Então** detalha a licença de uso comunitário sem custos, a isenção de responsabilidade sobre conteúdos inseridos pelo usuário e a propriedade intelectual do projeto.

---

### História de Usuário 4 — Abertura cinematográfica da Landing Page (Prioridade: P3, adendo de 2026-11-25)

Como **Visitante**, desejo uma landing page com movimento e personalidade, que transmita a energia dos jogos em grupo, sem perder a leitura nem a acessibilidade.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** que o visitante abre a página inicial, **Quando** ela carrega, **Então** o título, o texto e os botões entram em sequência com a mola `motion.spring.spatial`, sobre um fundo de aurora nas cores do Design System, e a ilustração do logo ganha vida (play pulsando, bolinhas do grupo comemorando, órbitas girando).
2. **Dado** que o visitante rola a página, **Quando** os cartões e os títulos entram na tela, **Então** eles aparecem com movimento suave, e o cabeçalho fixo ganha sombra.
3. **Dado** que o visitante troca de página, **Quando** clica em um link interno, **Então** a nova página aparece com uma transição suave e o logo permanece no lugar.
4. **Dado** que o sistema está com **"Reduzir movimento"** ligado, **Quando** qualquer página é aberta, **Então** nenhuma animação acontece e todo o conteúdo aparece imediatamente (`RNF09`).
5. **Dado** um navegador sem suporte a animações por rolagem ou a transições entre páginas, **Quando** a página é aberta, **Então** o conteúdo aparece completo e estático.

### História de Usuário 5 — Ver os jogos com telas reais do app (Prioridade: P2, adendo de 2026-11-25)

Como **Líder de Pequeno Grupo**, desejo ver como cada jogo funciona, com telas reais do aplicativo, antes de instalar.

**Cenários de Aceitação (Dado / Quando / Então):**

1. **Dado** a página inicial, **Quando** o visitante chega à seção "Os jogos", **Então** cada um dos 8 jogos aparece com uma captura real do app em moldura de celular, as etiquetas (modalidade, tempo, pontos) e um "como funciona" em 3 passos fiel à documentação em `docs/jogos/`.
2. **Dado** a seção "Como funciona", **Quando** o visitante rola, **Então** vê os 3 passos (equipes, catálogo, placar) com as telas correspondentes.
3. **Dado** qualquer largura entre 320 px e 1440 px, **Quando** a página é aberta, **Então** não há rolagem horizontal e os celulares, textos e etiquetas se reorganizam (coluna única no celular, lado a lado no desktop).
4. **Dado** o tema escuro do sistema, **Quando** a página abre, **Então** o celular do topo mostra a captura do app no tema escuro.



- **Acesso em dispositivos móveis**: O layout de `index.html`, `privacidade.html` e `termos.html` deve ser 100% responsivo, legível em telas pequenas (320px a 428px) e em telas grandes (desktop/tablet).
- **Sem suporte a JavaScript**: As páginas devem ser estáticas (HTML5 puro + CSS3), funcionando perfeitamente mesmo se o navegador do usuário desativar o JavaScript.
- **Degradação de rede**: O peso total da página com estilos deve ser inferior a 150 KB para carregamento imediato em redes 3G/4G instáveis.
- **Convivência com o Expo Web**: o site não pode ficar em `public/`. Com `web.output: "single"`, o Expo usa `public/index.html` como molde da página do app e injeta nele o bundle, o que quebraria o deploy web do app na Vercel (testado em 2026-11-25). Por isso o site fica em `site/`.
- **Sem terceiros no navegador**: as fontes são hospedadas no próprio site (sem Google Fonts nem CDN), para nenhuma página enviar o IP do visitante a terceiros.
- **Contato ainda não definido**: enquanto o marcador `[E-MAIL DE CONTATO]` existir, `npm run site:deploy` é bloqueado.
- **Acessibilidade (WCAG 2.1)**: As cores de fundo e texto na web devem respeitar o contraste mínimo de 4.5:1 exigido pelo Design System v1.1.0 e pelo projeto de IHC.

---

## 2. Requisitos da Funcionalidade *(Obrigatório)*

### Requisitos Funcionais (`RF`)
- **`RF-SITE-01`**: Criar Landing Page estática institucional em `site/index.html` com apresentação do produto, minigames e link de download.
- **`RF-SITE-02`**: Criar página de Política de Privacidade em `site/privacidade.html` detalhando armazenamento local (`AsyncStorage`), salas multiplayer no Supabase (login anônimo), API de textos bíblicos, recursos do aparelho (vibração háptica, acelerômetro, orientação de tela, síntese de voz) e conformidade LGPD.
- **`RF-SITE-03`**: Criar página de Termos de Uso em `site/termos.html`.
- **`RF-SITE-04`**: Criar folha de estilos `site/styles.css` consumindo os tokens semânticos do **PG Play Expressive** (variáveis CSS correspondentes a `action`, `surface`, `radius`, `font`).
- **`RF-SITE-05`**: Configurar o `firebase.json` e `.firebaserc` (pasta `site/`) para deploy em 1 comando no **Firebase Hosting** com protocolo HTTPS.

---

## 3. Critérios de Sucesso e Acessibilidade *(Obrigatório)*

- **`CS-01` (Google Play Console)**: URL pública sob HTTPS ativa e acessível sem autenticação.
- **`CS-02` (IHC / Design System)**: Cores e tipografia espelham fielmente o sistema de design `PG Play Expressive`.
- **`CS-03` (Performance Web)**: Carga inicial de cada página < 150 KB (HTML, CSS, fontes e imagens sem `loading="lazy"`); as capturas abaixo da dobra carregam sob demanda, com no máximo 40 KB cada (revisado no adendo de 2026-11-25).
- **`CS-04` (Conformidade MVVM)**: Nenhuma dependência externa adicionada ao aplicativo React Native; a pasta estática `site/` convive harmoniosamente na raiz do repositório.
### Casos de Borda (Edge Cases)