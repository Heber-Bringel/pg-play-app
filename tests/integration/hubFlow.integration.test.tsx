import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import HubScreen from '@/view/index';
import { router } from 'expo-router';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    getItem: jest.fn(async (key: string) => store.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
  };
});

describe('HubFlow Integration (View + ViewModel + UseCase + MemoryDataSource)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('carrega catálogo real, filtra por modalidade e navega ao selecionar jogo', async () => {
    await render(<HubScreen />);

    await waitFor(() => {
      expect(screen.getByText('Mímica Expressiva')).toBeTruthy();
      expect(screen.getByText('Quiz Relâmpago')).toBeTruthy();
    });

    const multiChip = screen.getByText('Multi-Celular');
    await fireEvent.press(multiChip);

    await waitFor(() => {
      expect(screen.getByText('Cidade Dorme')).toBeTruthy();
      expect(screen.queryByText('Quiz Relâmpago')).toBeNull();
    });

    const todosChip = screen.getByText('Todos');
    await fireEvent.press(todosChip);

    await waitFor(() => {
      expect(screen.getByText('Quiz Relâmpago')).toBeTruthy();
    });

    await fireEvent.press(screen.getByText('Quiz Relâmpago'));
    expect(router.push).toHaveBeenCalledWith('/quiz');
  });
});
