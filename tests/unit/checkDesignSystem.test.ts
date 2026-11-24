/// <reference types="node" />
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Testes do verificador scripts/check-design-system.mjs (issue #75, spec 025).
// Cada teste monta um src/view/ temporário e executa o script com --root.

const SCRIPT = path.join(__dirname, '..', '..', 'scripts', 'check-design-system.mjs');

type Run = { status: number | null; output: string };

const tempRoots: string[] = [];

function createProject(files: Record<string, string>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'check-ds-'));
  tempRoots.push(root);
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(root, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
  }
  return root;
}

function runCheck(root: string, extraArgs: string[] = []): Run {
  const result = spawnSync(process.execPath, [SCRIPT, '--root', root, ...extraArgs], {
    encoding: 'utf8',
  });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

// Componente válido com JSX e estilos customizáveis.
function component({
  jsx = '<Text style={styles.title}>Olá</Text>',
  styles = 'title: { fontSize: activeTokens.semantic.font.body.size },',
  header = '',
}: { jsx?: string; styles?: string; header?: string } = {}): string {
  return `import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme, type AppTokens } from '@/view/theme';
${header}
export const Demo = ({ style }: { style?: object }) => {
  const activeTokens = useTheme();
  const styles = useMemo(() => createStyles(activeTokens), [activeTokens]);
  return (
    <View>
      ${jsx}
    </View>
  );
};

const createStyles = (activeTokens: AppTokens) =>
  StyleSheet.create({
    ${styles}
  });
`;
}

const BUTTON_OK = `<Pressable
        accessibilityRole="button"
        accessibilityLabel="Começar"
        onPress={() => {}}
        style={styles.button}
      />`;
const BUTTON_STYLE_OK = 'button: { minHeight: activeTokens.semantic.space[\'2xl\'] },';

afterAll(() => {
  for (const root of tempRoots) fs.rmSync(root, { recursive: true, force: true });
});

describe('check-design-system — verificador do PG Play Expressive (#75)', () => {
  it('aprova um componente que segue todas as regras', () => {
    const root = createProject({
      'src/view/components/demo.tsx': component({ jsx: BUTTON_OK, styles: BUTTON_STYLE_OK }),
    });

    const run = runCheck(root);

    expect(run.status).toBe(0);
    expect(run.output).toContain('Design System OK — 0 erros');
  });

  describe('DS-NUMERO-MAGICO', () => {
    it('reprova literal numérico em espaçamento, com arquivo e linha', () => {
      const root = createProject({
        'src/view/components/demo.tsx': component({ styles: 'title: { padding: 13 },' }),
      });

      const run = runCheck(root);

      expect(run.status).toBe(1);
      expect(run.output).toMatch(/\[ERRO\] DS-NUMERO-MAGICO — src\/view\/components\/demo\.tsx:\d+/);
      expect(run.output).toContain('padding: 13');
    });

    it('reprova literal em estilo inline do JSX', () => {
      const root = createProject({
        'src/view/components/demo.tsx': component({
          jsx: '<Text style={{ fontSize: 18 }}>Olá</Text>',
        }),
      });

      expect(runCheck(root).output).toContain('fontSize: 18');
    });

    it('aceita 0 e expressões derivadas de token', () => {
      const root = createProject({
        'src/view/components/demo.tsx': component({
          styles: "title: { margin: 0, minHeight: activeTokens.semantic.space['3xl'] * 4 },",
        }),
      });

      expect(runCheck(root).status).toBe(0);
    });
  });

  describe('DS-USE-THEME', () => {
    it('reprova arquivo com estilos sem useTheme()', () => {
      const root = createProject({
        'src/view/components/demo.tsx': `import React from 'react';
import { StyleSheet, Text } from 'react-native';
export const Demo = () => <Text style={styles.title}>Olá</Text>;
const styles = StyleSheet.create({ title: { flex: 1 } });
`,
      });

      const run = runCheck(root);

      expect(run.status).toBe(1);
      expect(run.output).toContain('DS-USE-THEME');
      expect(run.output).toContain('sem chamar useTheme()');
    });

    it('reprova import estático de tokens', () => {
      const root = createProject({
        'src/view/components/demo.tsx': component({
          header: "import { tokens } from '@/view/theme';",
        }),
      });

      const run = runCheck(root);

      expect(run.status).toBe(1);
      expect(run.output).toContain('Importa "tokens" estático');
    });
  });

  describe('DS-ACESSIBILIDADE', () => {
    it('reprova Pressable sem papel e rótulo acessíveis', () => {
      const root = createProject({
        'src/view/components/demo.tsx': component({
          jsx: '<Pressable onPress={() => {}} style={styles.button} />',
          styles: BUTTON_STYLE_OK,
        }),
      });

      const run = runCheck(root);

      expect(run.status).toBe(1);
      expect(run.output).toContain('DS-ACESSIBILIDADE');
      expect(run.output).toContain('accessibilityRole e accessibilityLabel');
    });

    it('não acusa quando as props vêm por spread', () => {
      const root = createProject({
        'src/view/components/demo.tsx': component({
          jsx: '<Pressable {...{ onPress: () => {} }} style={styles.button} />',
          styles: BUTTON_STYLE_OK,
        }),
      });

      expect(runCheck(root).output).not.toContain('DS-ACESSIBILIDADE');
    });
  });

  describe('DS-ALVO-TOQUE', () => {
    it('reprova Pressable cujo estilo não declara minHeight nem height', () => {
      const root = createProject({
        'src/view/components/demo.tsx': component({
          jsx: BUTTON_OK,
          styles: 'button: { padding: activeTokens.semantic.space.md },',
        }),
      });

      const run = runCheck(root);

      expect(run.status).toBe(1);
      expect(run.output).toContain('DS-ALVO-TOQUE');
      expect(run.output).toContain('48 dp');
    });

    it('resolve styles.chave em array com helper local e estilo pressionado', () => {
      const root = createProject({
        'src/view/components/demo.tsx': component({
          jsx: `<Pressable
        accessibilityRole="button"
        accessibilityLabel="Começar"
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }, getFocusRing()]}
      />`,
          styles: BUTTON_STYLE_OK,
        }),
      });

      expect(runCheck(root).status).toBe(0);
    });

    it('não confia em helper local para garantir a altura', () => {
      const root = createProject({
        'src/view/components/demo.tsx': component({
          jsx: `<Pressable accessibilityRole="button" accessibilityLabel="Começar" style={[styles.button, focusRing]} />`,
          styles: 'button: { padding: activeTokens.semantic.space.md },',
        }),
      });

      expect(runCheck(root).output).toContain('DS-ALVO-TOQUE');
    });

    it('aceita estilo recebido por prop, que pode trazer a altura de fora', () => {
      const root = createProject({
        'src/view/components/demo.tsx': component({
          jsx: '<Pressable accessibilityRole="button" accessibilityLabel="Começar" style={style} />',
        }),
      });

      expect(runCheck(root).output).not.toContain('DS-ALVO-TOQUE');
    });

    it('aceita fundo de modal que cobre o pai', () => {
      const root = createProject({
        'src/view/components/demo.tsx': component({
          jsx: '<Pressable accessibilityRole="button" accessibilityLabel="Fechar" style={styles.backdrop} />',
          styles: "backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },",
        }),
      });

      expect(runCheck(root).status).toBe(0);
    });
  });

  describe('DS-COMPONENTE-PADRAO', () => {
    it('avisa sobre Pressable em tela sem bloquear', () => {
      const root = createProject({
        'src/view/tela.tsx': component({ jsx: BUTTON_OK, styles: BUTTON_STYLE_OK }),
      });

      const run = runCheck(root);

      expect(run.status).toBe(0);
      expect(run.output).toContain('[AVISO] DS-COMPONENTE-PADRAO — src/view/tela.tsx');
    });

    it('não avisa dentro de src/view/components/', () => {
      const root = createProject({
        'src/view/components/demo.tsx': component({ jsx: BUTTON_OK, styles: BUTTON_STYLE_OK }),
      });

      expect(runCheck(root).output).not.toContain('DS-COMPONENTE-PADRAO');
    });
  });

  describe('exceção ds-ignore-next-line', () => {
    it('ignora a regra na linha seguinte quando há motivo', () => {
      const root = createProject({
        'src/view/components/demo.tsx': component({
          styles: `title: {
      // ds-ignore-next-line DS-NUMERO-MAGICO: largura fixa exigida pela animação
      width: 3,
    },`,
        }),
      });

      expect(runCheck(root).status).toBe(0);
    });

    it('não vale sem motivo escrito', () => {
      const root = createProject({
        'src/view/components/demo.tsx': component({
          styles: `title: {
      // ds-ignore-next-line DS-NUMERO-MAGICO
      width: 3,
    },`,
        }),
      });

      expect(runCheck(root).output).toContain('DS-NUMERO-MAGICO');
    });
  });

  describe('modos de execução', () => {
    it('--files analisa só os arquivos indicados', () => {
      const root = createProject({
        'src/view/components/ok.tsx': component(),
        'src/view/components/ruim.tsx': component({ styles: 'title: { padding: 13 },' }),
      });

      const onlyOk = runCheck(root, ['--files', 'src/view/components/ok.tsx']);
      const onlyBad = runCheck(root, ['--files', 'src/view/components/ruim.tsx']);

      expect(onlyOk.status).toBe(0);
      expect(onlyOk.output).toContain('em 1 arquivo(s)');
      expect(onlyBad.status).toBe(1);
    });

    it('ignora src/view/theme.ts e arquivos fora de src/view/', () => {
      const root = createProject({
        'src/view/theme.ts': 'export const space = { md: 16 };',
        'src/viewmodel/useDemo.ts': 'export const x = { padding: 13 };',
        'src/view/components/demo.tsx': component(),
      });

      const run = runCheck(root);

      expect(run.status).toBe(0);
      expect(run.output).toContain('em 1 arquivo(s)');
    });
  });
});
