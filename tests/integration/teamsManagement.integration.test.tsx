import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import TeamsScreen from '@/view/teams';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    getItem: jest.fn(async (key: string) => store.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
  };
});

describe('TeamsManagement Integration (View + ViewModel + UseCase + MemoryDataSource)', () => {
  it('cadastra equipe válida, exibe ValidationError real em nome curto e permite remoção', async () => {
    await render(<TeamsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Tribo de Judá')).toBeTruthy();
      expect(screen.getByText('Leões da Fé')).toBeTruthy();
    });

    const input = screen.getByLabelText('Nome da Equipe');
    await fireEvent.changeText(input, 'A');
    await fireEvent.press(screen.getByLabelText('Adicionar Equipe'));

    await waitFor(() => {
      expect(
        screen.getByText('Digite um nome com pelo menos 2 letras para a equipe.'),
      ).toBeTruthy();
    });

    await fireEvent.changeText(input, 'Atletas de Cristo');
    await fireEvent.press(screen.getByLabelText('Adicionar Equipe'));

    await waitFor(() => {
      expect(screen.getByText('Atletas de Cristo')).toBeTruthy();
    });
  });
});
