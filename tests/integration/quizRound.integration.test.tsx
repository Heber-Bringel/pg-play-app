import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import QuizScreen from '@/view/quiz';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    getItem: jest.fn(async (key: string) => store.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
  };
});

describe('QuizRound Integration (View + ViewModel + UseCase + MemoryDataSource)', () => {
  it('executa passagem de turno ("Estou Pronto!") e exibe alternativas reais da rodada', async () => {
    await render(<QuizScreen />);

    await waitFor(() => {
      expect(screen.getByLabelText('Estou Pronto!')).toBeTruthy();
    });

    await fireEvent.press(screen.getByLabelText('Estou Pronto!'));

    await waitFor(() => {
      expect(screen.getByText(/Pergunta 1\//i)).toBeTruthy();
    });
  });
});
