import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AppHeader } from '@/view/components/appHeader';
import { ThemeProvider } from '@/view/theme';

describe('AppHeader — Cabeçalho Unificado com Toggle de Tema 1 Toque', () => {
  it('renderiza PG PLAY e alterna tema claro e escuro com 1 toque', async () => {
    await render(
      <ThemeProvider>
        <AppHeader />
      </ThemeProvider>
    );

    expect(screen.getByText('PG PLAY')).toBeTruthy();

    const toDarkBtn = screen.getByLabelText('Alternar para tema escuro');
    expect(toDarkBtn.props.accessibilityRole).toBe('button');

    await fireEvent.press(toDarkBtn);

    const toLightBtn = screen.getByLabelText('Alternar para tema claro');
    expect(toLightBtn.props.accessibilityRole).toBe('button');

    await fireEvent.press(toLightBtn);
    expect(screen.getByLabelText('Alternar para tema escuro')).toBeTruthy();
  });
});
