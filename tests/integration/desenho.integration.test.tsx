import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import DesenhoScreen from '@/view/desenho';
import { pgPlayUseCases } from '@/di/container';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    getItem: jest.fn(async (key: string) => store.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
  };
});

describe('Desenho Relâmpago Integration (View + ViewModel + PgPlayUseCases + DataSources)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await pgPlayUseCases.resetScoreboard();
  });

  it('executa fluxo real de passagem de turno, ocultar palavra, acertar (+20 pts), pular (-5 pts) e atualizar placar', async () => {
    await render(<DesenhoScreen />);

    await waitFor(() => {
      expect(screen.getByText('Passe o celular ao desenhista')).toBeTruthy();
      expect(screen.getByText('Tribo de Judá')).toBeTruthy();
    });

    await fireEvent.press(screen.getByLabelText('Estou Pronto!'));

    await waitFor(() => {
      expect(screen.getByText('Arca de Noé')).toBeTruthy();
      expect(screen.getByText('Sem letras nem números')).toBeTruthy();
    });

    // Ocultar e reexibir palavra secreta
    await fireEvent.press(screen.getByLabelText('Esconder do Grupo'));
    await waitFor(() => {
      expect(screen.getByText('Palavra oculta — só o desenhista sabe')).toBeTruthy();
      expect(screen.getByLabelText('Mostrar Palavra')).toBeTruthy();
    });

    await fireEvent.press(screen.getByLabelText('Mostrar Palavra'));
    await waitFor(() => {
      expect(screen.getByText('Arca de Noé')).toBeTruthy();
    });

    // Registrar acerto (+20 pts) e conferir avanço de carta e placar
    await fireEvent.press(screen.getByLabelText('Acertaram! (+20 pts)'));
    await waitFor(() => {
      expect(screen.getByText('20 pts')).toBeTruthy();
      expect(screen.getByText('Tábua dos Dez Mandamentos')).toBeTruthy();
    });

    // Registrar pulo (-5 pts) e conferir saldo atualizado no domínio real
    await fireEvent.press(screen.getByLabelText('Pular (-5 pts)'));
    await waitFor(() => {
      expect(screen.getByText('15 pts')).toBeTruthy();
    });

    const scoreboard = await pgPlayUseCases.getScoreboard();
    expect(scoreboard.find((team) => team.name === 'Tribo de Judá')?.score).toBe(15);
  });
});
