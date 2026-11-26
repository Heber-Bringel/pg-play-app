import fs from 'fs';
import path from 'path';

// Site institucional estático (spec 027, issue #82): Landing Page, Política de
// Privacidade e Termos de Uso exigidos pelo Google Play Console.
const SITE_DIR = path.join(__dirname, '..', '..', 'site');
const PAGES = ['index.html', 'privacidade.html', 'termos.html', '404.html'];
const MAX_PAGE_BYTES = 150 * 1024;

const readSite = (relativePath: string): string =>
  fs.readFileSync(path.join(SITE_DIR, relativePath), 'utf8');

const sizeOf = (relativePath: string): number =>
  fs.statSync(path.join(SITE_DIR, relativePath)).size;

// Referências de href/src (links, folha de estilo, imagens, fontes pré-carregadas).
const extractReferences = (html: string): string[] =>
  Array.from(html.matchAll(/\s(?:href|src)="([^"]+)"/g), (match) => match[1]);

const extractCssUrls = (css: string): string[] =>
  Array.from(css.matchAll(/url\('([^']+)'\)/g), (match) => match[1]);

const isExternal = (reference: string): boolean => /^(https?:)?\/\//.test(reference);

// Resolve uma referência interna para o arquivo e a âncora dentro de site/.
const resolveInternal = (
  fromPage: string,
  reference: string
): { file: string; anchor: string | null } => {
  const [rawPath, anchor = null] = reference.split('#');
  if (rawPath === '') {
    return { file: fromPage, anchor };
  }
  const resolved = rawPath.startsWith('/')
    ? rawPath.slice(1)
    : path.posix.join(path.posix.dirname(fromPage), rawPath);
  return { file: resolved === '' ? 'index.html' : resolved, anchor };
};

describe('Site institucional (site/)', () => {
  it.each(PAGES)('%s existe e é uma página HTML5 em português', (page) => {
    const html = readSite(page);
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('<html lang="pt-BR">');
    expect(html).toContain('<meta charset="utf-8">');
    expect(html).toContain('name="viewport"');
    expect(html).toMatch(/<title>[^<]*PG PLAY[^<]*<\/title>/);
  });

  it.each(PAGES)('%s funciona sem JavaScript', (page) => {
    expect(readSite(page)).not.toMatch(/<script/i);
  });

  it.each(PAGES)('%s tem todos os links internos válidos', (page) => {
    const html = readSite(page);
    const internal = extractReferences(html).filter(
      (reference) => !isExternal(reference) && !reference.startsWith('mailto:')
    );

    for (const reference of internal) {
      const { file, anchor } = resolveInternal(page, reference);
      expect({ reference, exists: fs.existsSync(path.join(SITE_DIR, file)) }).toEqual({
        reference,
        exists: true,
      });
      if (anchor) {
        expect({ reference, hasAnchor: readSite(file).includes(`id="${anchor}"`) }).toEqual({
          reference,
          hasAnchor: true,
        });
      }
    }
  });

  it.each(PAGES)('%s não carrega recursos de outros domínios', (page) => {
    const html = readSite(page);
    // Links de navegação para fora são permitidos; recursos carregados, não.
    const loadedResources = Array.from(
      html.matchAll(/<(?:link|img|source)\b[^>]*\s(?:href|src)="([^"]+)"/g),
      (match) => match[1]
    );
    expect(loadedResources.filter(isExternal)).toEqual([]);
  });

  it.each(PAGES)('%s carrega menos de 150 KB na abertura (CSS, fontes e imagens sem lazy)', (page) => {
    const html = readSite(page);
    const css = readSite('styles.css');
    const assets = new Set<string>(['styles.css']);
    // Imagens com loading="lazy" só baixam quando a pessoa rola até elas.
    const lazyImages = new Set(
      Array.from(html.matchAll(/<img\b[^>]*\ssrc="([^"]+)"[^>]*loading="lazy"/g), (match) =>
        resolveInternal(page, match[1]).file
      )
    );
    for (const reference of extractReferences(html)) {
      if (!isExternal(reference) && /\.(css|svg|woff2|webp)$/.test(reference)) {
        const file = resolveInternal(page, reference).file;
        const eagerElsewhere = html.includes(`src="${reference}"`) &&
          new RegExp(`<img\\b[^>]*src="${reference}"(?![^>]*loading="lazy")[^>]*>`).test(html);
        if (!lazyImages.has(file) || eagerElsewhere) {
          assets.add(file);
        }
      }
    }
    for (const url of extractCssUrls(css)) {
      assets.add(path.posix.join('.', url));
    }
    const total = sizeOf(page) + Array.from(assets).reduce((sum, file) => sum + sizeOf(file), 0);
    expect(total).toBeLessThan(MAX_PAGE_BYTES);
  });

  it('a folha de estilos usa os tokens do PG Play Expressive', () => {
    const css = readSite('styles.css');
    // Valores de src/view/theme.ts (modo claro e escuro).
    expect(css).toContain('--color-action: #5B21B6;');
    expect(css).toContain('--color-action: #D8B4FE;');
    expect(css).toContain('--color-surface: #FDF8FF;');
    expect(css).toContain('--color-surface: #141218;');
    expect(css).toContain('--color-highlight: #FACC15;');
    expect(css).toContain('--radius-xl: 28px;');
    expect(css).toContain('--radius-full: 9999px;');
    expect(css).toContain("font-family: 'Plus Jakarta Sans'");
    expect(css).toContain('prefers-color-scheme: dark');
    expect(css).toContain('prefers-reduced-motion: reduce');
  });

  it('só anima dentro de prefers-reduced-motion: no-preference (RNF09)', () => {
    const css = readSite('styles.css');
    const opening = '@media (prefers-reduced-motion: no-preference) {';
    const start = css.indexOf(opening);
    expect(start).toBeGreaterThan(-1);

    // Encontra o fim do bloco contando chaves.
    let depth = 0;
    let end = start + opening.length - 1;
    for (; end < css.length; end += 1) {
      if (css[end] === '{') depth += 1;
      if (css[end] === '}') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    const motionBlock = css.slice(start, end + 1);
    const outside = (css.slice(0, start) + css.slice(end + 1)).replace(/\/\*[\s\S]*?\*\//g, '');

    expect(motionBlock).toContain('@keyframes');
    expect(motionBlock).toContain('@view-transition');
    expect(motionBlock).toContain('animation-timeline: view()');
    expect(outside).not.toMatch(/\banimation(-name)?\s*:/);
    expect(outside).not.toContain('@keyframes');
    expect(outside).not.toContain('@view-transition');
    expect(outside).not.toContain('scroll-behavior: smooth');
  });

  it('as fontes da folha de estilos existem no site', () => {
    const urls = extractCssUrls(readSite('styles.css'));
    expect(urls.length).toBeGreaterThanOrEqual(3);
    for (const url of urls) {
      expect(fs.existsSync(path.join(SITE_DIR, url))).toBe(true);
    }
    expect(fs.existsSync(path.join(SITE_DIR, 'assets', 'fonts', 'OFL.txt'))).toBe(true);
  });
});

describe('Política de Privacidade (Google Play Console e LGPD)', () => {
  const html = readSite('privacidade.html');

  it.each([
    'Armazenamento Local',
    'Modo Multiplayer e Supabase',
    'Permissões de Dispositivo (Sensores, Vibração e Áudio)',
    'Público-Alvo e Proteção a Menores',
    'LGPD e Direitos dos Titulares',
    'Canal de Contato e Suporte',
  ])('tem a seção "%s"', (section) => {
    expect(html).toMatch(new RegExp(`<h2[^>]*>[^<]*${section.replace(/[()]/g, '\\$&')}</h2>`));
  });

  it('declara o que o app usa de fato', () => {
    expect(html).toContain('AsyncStorage');
    expect(html).toContain('login anônimo');
    expect(html).toContain('bible.helloao.org');
    expect(html).toContain('Acelerômetro');
    // Salas não são apagadas automaticamente: a política não pode prometer o contrário.
    expect(html).toContain('não são apagados automaticamente');
  });

  it('identifica o responsável e o canal de contato', () => {
    expect(html).toContain('Equipe PG PLAY');
    expect(html).toContain('id="contato"');
    expect(html).toMatch(/href="mailto:[^"@]+@[^"]+\.[a-z]+"/);
    expect(html).not.toContain('[E-MAIL DE CONTATO]');
  });
});

describe('Termos de Uso', () => {
  const html = readSite('termos.html');

  it('cobre licença gratuita, conteúdo do usuário e propriedade intelectual', () => {
    expect(html).toContain('Licença de uso gratuita');
    expect(html).toContain('Conteúdo criado por quem joga');
    expect(html).toContain('Propriedade intelectual');
    expect(html).toContain('href="privacidade.html"');
  });
});

describe('Landing Page', () => {
  const html = readSite('index.html');
  const images = Array.from(html.matchAll(/<img\b[^>]*>/g), (match) => match[0]);
  const screens = images.filter((tag) => tag.includes('assets/screens/'));

  it('mostra telas reais do app com texto alternativo e tamanho declarado', () => {
    expect(screens.length).toBeGreaterThanOrEqual(10);
    for (const tag of screens) {
      expect(tag).toMatch(/\salt="[^"]{20,}"/);
      expect(tag).toMatch(/\swidth="\d+"/);
      expect(tag).toMatch(/\sheight="\d+"/);
    }
  });

  it('só a primeira tela carrega na abertura; as demais são lazy', () => {
    const eager = screens.filter((tag) => !tag.includes('loading="lazy"'));
    expect(eager).toHaveLength(1);
    expect(eager[0]).toContain('assets/screens/hub.webp');
  });

  it('as versões alternativas (<source srcset>) existem', () => {
    const sources = Array.from(html.matchAll(/<source\b[^>]*srcset="([^"]+)"/g), (match) => match[1]);
    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) {
      expect(fs.existsSync(path.join(SITE_DIR, source))).toBe(true);
    }
  });

  it('cada captura pesa no máximo 40 KB', () => {
    const files = fs.readdirSync(path.join(SITE_DIR, 'assets', 'screens'));
    expect(files.length).toBeGreaterThanOrEqual(10);
    for (const file of files) {
      expect({ file, ok: sizeOf(`assets/screens/${file}`) <= 40 * 1024 }).toEqual({ file, ok: true });
    }
  });

  it('apresenta os 8 minigames do catálogo', () => {
    for (const game of [
      'Mímica Expressiva',
      'Quiz Relâmpago',
      'Jogo da Forca',
      'Quem Sou Eu?',
      'Complete o Versículo',
      'Termômetro de Pedidos',
      'Cidade Dorme',
      'Adedonha Bíblica',
    ]) {
      expect(html).toContain(`">${game}</h3>`);
      expect(html).toMatch(new RegExp(`<h3 id="t-[a-z-]+">${game.replace('?', '\\?')}</h3>`));
    }
  });

  it('leva à Google Play, à Política de Privacidade e aos Termos de Uso', () => {
    expect(html).toContain('https://play.google.com/store/apps/details?id=br.pgplay.app');
    expect(html).toContain('href="privacidade.html"');
    expect(html).toContain('href="termos.html"');
  });
});

describe('Firebase Hosting', () => {
  const config = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', '..', 'firebase.json'), 'utf8')
  ) as { hosting: { public: string; cleanUrls: boolean } };

  it('publica a pasta site/, e não public/ (que o Expo Web usa como molde do app)', () => {
    expect(config.hosting.public).toBe('site');
    expect(config.hosting.cleanUrls).toBe(true);
    expect(fs.existsSync(path.join(__dirname, '..', '..', 'public', 'index.html'))).toBe(false);
  });
});
