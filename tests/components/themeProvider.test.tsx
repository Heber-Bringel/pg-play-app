import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { Text, useColorScheme } from 'react-native';
import {
  darkTokens,
  ThemeProvider,
  tokens,
  useTheme,
  type AppTokens,
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
});
