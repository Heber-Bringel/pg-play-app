import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import WelcomeRoute from '@/app/welcome';
import WelcomeScreen from '@/view/welcome';
import * as welcomeVmModule from '@/viewmodel/useWelcomeViewModel';
import type {
  WelcomeActions,
  WelcomeState,
} from '@/viewmodel/useWelcomeViewModel';

const createMockActions = (): WelcomeActions => ({
  handleStartGames: jest.fn(),
  handleOpenMultiplayer: jest.fn(),
  handleOpenTeams: jest.fn(),
  handleOpenScoreboard: jest.fn(),
  handleRequestReset: jest.fn(),
  handleCancelReset: jest.fn(),
  handleResetScoreboard: jest.fn(async () => {}),
  handleDismissSplash: jest.fn(),
  handleRetry: jest.fn(async () => {}),
});

const baseState: WelcomeState = {
  teams: [
    { id: 't1', name: 'Leões de Judá', score: 60 },
    { id: 't2', name: 'Filhos da Luz', score: 50 },
    { id: 't3', name: 'Tribo Ágape', score: 30 },
  ],
  podiumTeams: [
    { id: 't1', name: 'Leões de Judá', score: 60 },
    { id: 't2', name: 'Filhos da Luz', score: 50 },
    { id: 't3', name: 'Tribo Ágape', score: 30 },
  ],
  totalTeams: 3,
  totalPoints: 140,
  loading: false,
  error: null,
  confirmingReset: false,
  splashVisible: false,
};

describe('WelcomeScreen — Testes de Tela com Mocks de ViewModel (Issue #80)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reexporta WelcomeScreen na rota fina src/app/welcome.tsx', () => {
    expect(WelcomeRoute).toBe(WelcomeScreen);
  });

  it('renderiza estado de carregamento (loading)', async () => {
    const actions = createMockActions();
    jest
      .spyOn(welcomeVmModule, 'useWelcomeViewModel')
      .mockReturnValue([{ ...baseState, loading: true }, actions]);

    await render(<WelcomeScreen />);
    expect(screen.getByText('Preparando o Painel do Encontro...')).toBeTruthy();
  });

  it('renderiza estado de erro e aciona Tentar Novamente', async () => {
    const actions = createMockActions();
    jest
      .spyOn(welcomeVmModule, 'useWelcomeViewModel')
      .mockReturnValue([
        { ...baseState, error: 'Falha ao carregar equipes.' },
        actions,
      ]);

    await render(<WelcomeScreen />);
    expect(screen.getByText('Falha ao carregar equipes.')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Tentar Novamente'));
    expect(actions.handleRetry).toHaveBeenCalledTimes(1);
  });

  it('renderiza estado inicial sem equipes (0 equipes) sem pílula de contagem no topo', async () => {
    const actions = createMockActions();
    jest
      .spyOn(welcomeVmModule, 'useWelcomeViewModel')
      .mockReturnValue([
        {
          ...baseState,
          teams: [],
          podiumTeams: [],
          totalTeams: 0,
          totalPoints: 0,
        },
        actions,
      ]);

    await render(<WelcomeScreen />);
    expect(screen.queryByText('Sem equipes')).toBeNull();
    expect(screen.getByText('Monte as equipes do encontro')).toBeTruthy();
    expect(screen.getByLabelText('Alternar para tema escuro')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Cadastrar Equipes'));
    expect(actions.handleOpenTeams).toHaveBeenCalledTimes(1);
  });

  it('renderiza o pódio, toggle de tema 1 toque, CTAs principais, modal de reset e splash overlay', async () => {
    const actions = createMockActions();
    jest
      .spyOn(welcomeVmModule, 'useWelcomeViewModel')
      .mockReturnValue([
        {
          ...baseState,
          confirmingReset: true,
          splashVisible: true,
        },
        actions,
      ]);

    await render(<WelcomeScreen />);

    expect(screen.queryByText('3 equipes · 140 pts')).toBeNull();
    expect(screen.queryByLabelText('Ir para Início')).toBeNull();
    expect(screen.getByLabelText('Alternar para tema escuro')).toBeTruthy();
    expect(screen.getByText('Pódio do Encontro')).toBeTruthy();
    expect(screen.getByText('Leões de Judá')).toBeTruthy();
    expect(screen.getByText('Zerar o placar do PG?')).toBeTruthy();
    expect(
      screen.getByLabelText('Abrindo PG PLAY, Minigames para Pequenos Grupos')
    ).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Iniciar Jogos'));
    await fireEvent.press(screen.getByLabelText('Sala Multiplayer (PIN)'));
    await fireEvent.press(screen.getByLabelText('Confirmar e Zerar'));

    expect(actions.handleStartGames).toHaveBeenCalledTimes(1);
    expect(actions.handleOpenMultiplayer).toHaveBeenCalledTimes(1);
    expect(actions.handleResetScoreboard).toHaveBeenCalledTimes(1);
  });
});
