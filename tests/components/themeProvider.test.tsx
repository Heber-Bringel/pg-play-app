import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text, useColorScheme } from 'react-native';
import {
  darkTokens,
  ThemeProvider,
  tokens,
  useTheme,
  useThemeOverride,
  type AppTokens,
  type ThemeMode,
} from '@/view/theme';

const mockedUseColorScheme = useColorScheme as jest.Mock;

describe('ThemeProvider & useTheme (tema claro/escuro automático via useColorScheme)', () => {
  afterEach(() => {
    mockedUseColorScheme.mockReturnValue('light');
  });

  it('acompanha automaticamente useColorScheme() entre light e dark', () => {
    let observed!: AppTokens;
    const Probe = () => {
      observed = useTheme();
      return <Text>{observed.mode}</Text>;
    };

    mockedUseColorScheme.mockReturnValue('light');
    act(() => {
      renderer.create(
        <ThemeProvider>
          <Probe />
        </ThemeProvider>
      );
    });
    expect(observed).toBe(tokens);
    expect(observed.semantic.color.surface).toBe('#FDF8FF');

    mockedUseColorScheme.mockReturnValue('dark');
    act(() => {
      renderer.create(
        <ThemeProvider>
          <Probe />
        </ThemeProvider>
      );
    });
    expect(observed).toBe(darkTokens);
    expect(observed.semantic.color.surface).toBe('#141218');
  });

  it('permite override local via ThemeProvider mode="dark" mesmo com sistema em light', () => {
    mockedUseColorScheme.mockReturnValue('light');
    let outerMode = '';
    let innerMode = '';

    const OuterProbe = () => {
      outerMode = useTheme().mode;
      return (
        <ThemeProvider mode="dark">
          <InnerProbe />
        </ThemeProvider>
      );
    };
    const InnerProbe = () => {
      innerMode = useTheme().mode;
      return <Text>{innerMode}</Text>;
    };

    act(() => {
      renderer.create(
        <ThemeProvider>
          <OuterProbe />
        </ThemeProvider>
      );
    });

    expect(outerMode).toBe('light');
    expect(innerMode).toBe('dark');
  });

  it('permite override local via ThemeProvider mode="light" mesmo com sistema em dark', () => {
    mockedUseColorScheme.mockReturnValue('dark');
    let outerMode = '';
    let innerMode = '';

    const OuterProbe = () => {
      outerMode = useTheme().mode;
      return (
        <ThemeProvider mode="light">
          <InnerProbe />
        </ThemeProvider>
      );
    };
    const InnerProbe = () => {
      innerMode = useTheme().mode;
      return <Text>{innerMode}</Text>;
    };

    act(() => {
      renderer.create(
        <ThemeProvider>
          <OuterProbe />
        </ThemeProvider>
      );
    });

    expect(outerMode).toBe('dark');
    expect(innerMode).toBe('light');
  });

  it('useThemeOverride sobrescreve o ThemeProvider raiz entre light/dark sob sistema dark e restaura ao passar null ou desmontar', () => {
    mockedUseColorScheme.mockReturnValue('dark');
    let observedRootTokens!: AppTokens;

    const RootProbe = () => {
      observedRootTokens = useTheme();
      return <Text>{observedRootTokens.mode}</Text>;
    };

    const OverrideChild = ({ mode }: { mode: ThemeMode | null }) => {
      useThemeOverride(mode);
      return null;
    };

    const Host = ({
      showChild,
      mode,
    }: {
      showChild: boolean;
      mode: ThemeMode | null;
    }) => (
      <ThemeProvider>
        <RootProbe />
        {showChild ? <OverrideChild mode={mode} /> : null}
      </ThemeProvider>
    );

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<Host showChild mode="light" />);
    });
    expect(observedRootTokens).toBe(tokens);
    expect(observedRootTokens.mode).toBe('light');

    act(() => {
      tree.update(<Host showChild mode="dark" />);
    });
    expect(observedRootTokens).toBe(darkTokens);
    expect(observedRootTokens.mode).toBe('dark');

    act(() => {
      tree.update(<Host showChild mode="light" />);
    });
    expect(observedRootTokens).toBe(tokens);
    expect(observedRootTokens.mode).toBe('light');

    act(() => {
      tree.update(<Host showChild mode={null} />);
    });
    expect(observedRootTokens).toBe(darkTokens);
    expect(observedRootTokens.mode).toBe('dark');

    act(() => {
      tree.update(<Host showChild mode="light" />);
    });
    expect(observedRootTokens).toBe(tokens);

    act(() => {
      tree.update(<Host showChild={false} mode="light" />);
    });
    expect(observedRootTokens).toBe(darkTokens);
    expect(observedRootTokens.mode).toBe('dark');
  });
});
