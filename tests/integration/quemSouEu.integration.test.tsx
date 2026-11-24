import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import QuemSouEuScreen from '@/view/quem-sou-eu';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    getItem: jest.fn(async (key: string) => store.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
  };
});

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockDismissTo = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    dismissTo: mockDismissTo,
    back: jest.fn(),
  }),
}));

describe('Integração Quem Sou Eu? (UC09)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPush.mockClear();
    mockReplace.mockClear();
    mockDismissTo.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renderiza tela de configuração com os 8 pacotes genéricos e inicia o fluxo até a carta na testa', async () => {
    const screen = await render(<QuemSouEuScreen />);

    await waitFor(() => {
      expect(screen.getByText('Preparar Partida')).toBeTruthy();
    });

    expect(screen.getByText('Famosos')).toBeTruthy();
    expect(screen.getByText('Animais')).toBeTruthy();
    expect(screen.getByText('Filmes e Séries')).toBeTruthy();
    expect(screen.getByText('Profissões')).toBeTruthy();
    expect(screen.getByText('Inclinação')).toBeTruthy();
    expect(screen.getByText('Botões')).toBeTruthy();
    expect(screen.queryByText('Inclinação + Botões')).toBeNull();

    // Modo Botões: os botões Jumbo aparecem durante o turno
    await fireEvent.press(screen.getByText('Botões'));
    await fireEvent.press(screen.getByText('Iniciar Partida'));

    await waitFor(() => {
      expect(screen.getByText('Estou Pronto!')).toBeTruthy();
    });

    await fireEvent.press(screen.getByText('Estou Pronto!'));

    await waitFor(() => {
      expect(screen.getByText('Posicione o celular na testa!')).toBeTruthy();
    });

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(screen.getByText('Acertou! (+10 pts)')).toBeTruthy();
      expect(screen.getByText('Passar')).toBeTruthy();
    });

    await fireEvent.press(screen.getByText('Acertou! (+10 pts)'));

    await waitFor(() => {
      expect(screen.getByText('ACERTOU! +10 pts')).toBeTruthy();
    });
    expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await fireEvent.press(screen.getByText('Passar'));

    await waitFor(() => {
      expect(screen.getByText('PASSOU')).toBeTruthy();
    });
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
  });
});
