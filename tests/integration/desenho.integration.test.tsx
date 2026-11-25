import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { MemoryGameCatalogDataSource } from '@/infra/datasources/memoryGameCatalogDataSource';
import { MemoryMultiplayerRoomService } from '@/infra/services/memoryMultiplayerRoomService';
import { DesenhoUseCases } from '@/usecase/desenhoUseCases';
import { DesenhoScreen } from '@/view/desenho';

let mockRoomService: MemoryMultiplayerRoomService;
let mockDesenhoUseCases: DesenhoUseCases;

jest.mock('@/di/container', () => ({
  get desenhoUseCases() {
    return mockDesenhoUseCases;
  },
  isSupabaseMultiplayerEnabled: false,
  gameFeedbackUseCases: {
    notifyTimerTick: jest.fn().mockResolvedValue(undefined),
    notifyAnswerHit: jest.fn().mockResolvedValue(undefined),
    notifyAnswerWrong: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('Integração Real — Desenho Relâmpago Multiplayer (UC12)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockRoomService = new MemoryMultiplayerRoomService();
    mockDesenhoUseCases = new DesenhoUseCases(
      mockRoomService,
      new MemoryGameCatalogDataSource()
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve abrir a sala demo, iniciar partida, sumir tema após 5s, desenhar forma geométrica e receber palpite correto em tempo real', async () => {
    const screen = await render(<DesenhoScreen />);

    await fireEvent.press(screen.getByText('Abrir Sala de Demonstração'));
    expect(screen.getByText('Sala DR2026 — Lobby')).toBeTruthy();

    await fireEvent.press(screen.getByText('Começar Partida!'));
    expect(screen.getByTestId('desenho-initial-theme-card')).toBeTruthy();

    // Após 5 segundos, o tema desaparece e o canvas expande
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(screen.queryByTestId('desenho-initial-theme-card')).toBeNull();
    expect(screen.getByText('Espiar palavra')).toBeTruthy();

    // Seleciona Retângulo + Preenchido e desenha na folha
    await fireEvent.press(screen.getByLabelText('Forma Retângulo'));
    await fireEvent.press(screen.getByLabelText('Estilo Preenchido'));

    const paper = screen.getByTestId('drawing-canvas-paper');
    await act(async () => {
      paper.props.onResponderGrant({ nativeEvent: { locationX: 15, locationY: 20 } });
      paper.props.onResponderMove({ nativeEvent: { locationX: 110, locationY: 95 } });
      paper.props.onResponderRelease();
    });

    const roomAfterDraw = await mockDesenhoUseCases.getRoom('room-desenho-1');
    expect(roomAfterDraw.elements).toHaveLength(1);
    expect(roomAfterDraw.elements[0]).toMatchObject({
      tool: 'rectangle',
      fillMode: 'fill',
    });

    // Simula os outros 2 jogadores (Ana e Lucas) acertando em tempo real
    const secretWord = roomAfterDraw.currentSecretWord!;
    await act(async () => {
      await mockDesenhoUseCases.submitGuess(
        'room-desenho-1',
        'desenho-player-2',
        secretWord
      );
      await mockDesenhoUseCases.submitGuess(
        'room-desenho-1',
        'desenho-player-3',
        secretWord
      );
    });

    expect(screen.getByText(/Fim do Turno/)).toBeTruthy();

    const summaryRoom = await mockDesenhoUseCases.getRoom('room-desenho-1');
    expect(summaryRoom.phase).toBe('turn_summary');
    expect(
      summaryRoom.players.find((p) => p.id === 'desenho-player-2')?.score
    ).toBe(20);
    expect(
      summaryRoom.players.find((p) => p.id === 'desenho-player-3')?.score
    ).toBe(15);
    expect(
      summaryRoom.players.find((p) => p.id === 'desenho-player-1')?.score
    ).toBe(15);
  });
});
