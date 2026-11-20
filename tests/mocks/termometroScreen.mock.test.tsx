import React from 'react';
import renderer, { act } from 'react-test-renderer';
import TermometroRoute from '@/app/termometro';
import TermometroScreen from '@/view/termometro';
import * as termometroVmModule from '@/viewmodel/useTermometroViewModel';
import type {
  TermometroActions,
  TermometroState,
} from '@/viewmodel/useTermometroViewModel';

const createMockActions = (): TermometroActions => ({
  handleSelectParticipantMode: jest.fn(async () => {}),
  handleSelectDuration: jest.fn(async () => {}),
  handleSelectOrderMode: jest.fn(async () => {}),
  handleAddCustomParticipant: jest.fn(async () => true),
  handleRemoveCustomParticipant: jest.fn(async () => {}),
  handleStartMoment: jest.fn(async () => {}),
  handleStartSpeaking: jest.fn(async () => {}),
  handleTick: jest.fn(async () => {}),
  handleTogglePause: jest.fn(async () => {}),
  handleNextSpeaker: jest.fn(async () => {}),
  handleSkipSpeaker: jest.fn(async () => {}),
  handleFinishFreeMode: jest.fn(async () => {}),
  handleOpenPrayerMoment: jest.fn(async () => {}),
  handleEndEncounter: jest.fn(async () => {}),
  handleRequestExit: jest.fn(),
  handleCancelExit: jest.fn(),
  handleConfirmExit: jest.fn(async () => {}),
  handleRetry: jest.fn(async () => {}),
});

const baseState: TermometroState = {
  stage: 'setup',
  participantMode: 'teams',
  durationMinutes: 1,
  durationSeconds: 60,
  orderMode: 'list',
  participants: ['Tribo de Judá', 'Leões da Fé'],
  currentIndex: 0,
  currentSpeakerLabel: 'Tribo de Judá',
  hasStartedSpeaking: false,
  isPaused: false,
  secondsRemaining: 60,
  sharedCount: 2,
  skippedCount: 1,
  confirmingExit: false,
  loading: false,
  error: null,
  inputError: null,
};

describe('TermometroScreen — Testes de Tela com Mocks de ViewModel (UC11)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve reexportar a tela corretamente na rota fina src/app/termometro.tsx', () => {
    expect(TermometroRoute).toBe(TermometroScreen);
  });

  it('deve renderizar o estado de carregamento (loading) e o estado de erro', () => {
    const actions = createMockActions();
    const spy = jest.spyOn(termometroVmModule, 'useTermometroViewModel');

    spy.mockReturnValue([{ ...baseState, loading: true }, actions]);
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<TermometroScreen />);
    });
    expect(
      tree.root.findByProps({
        accessibilityLabel: 'Carregando Termômetro de Pedidos',
      } as any)
    ).toBeDefined();

    spy.mockReturnValue([
      { ...baseState, error: 'Falha ao iniciar roda de pedidos.' },
      actions,
    ]);
    act(() => {
      tree.update(<TermometroScreen />);
    });

    const retryBtn = tree.root.findByProps({
      accessibilityLabel: 'Tentar Novamente',
    } as any);
    act(() => {
      retryBtn.props.onPress();
    });
    expect(actions.handleRetry).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar a fase setup com seleção de participantes, tempo, ordem e botão Começar (RF38)', async () => {
    const actions = createMockActions();
    const spy = jest.spyOn(termometroVmModule, 'useTermometroViewModel');

    spy.mockReturnValue([
      { ...baseState, stage: 'setup', participantMode: 'custom', participants: ['Ana'] },
      actions,
    ]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<TermometroScreen />);
    });

    const dur2Chip = tree.root.findByProps({
      accessibilityLabel: 'Tempo 2 min',
    } as any);
    const randomOrderChip = tree.root.findByProps({
      accessibilityLabel: 'Ordem Ordem sorteada',
    } as any);
    const addBtn = tree.root.findByProps({
      accessibilityLabel: 'Adicionar Participante',
    } as any);
    const removeChip = tree.root.findByProps({
      accessibilityLabel: 'Remover Ana',
    } as any);
    const startBtn = tree.root.findByProps({
      accessibilityLabel: 'Começar',
    } as any);

    await act(async () => {
      dur2Chip.props.onPress();
      randomOrderChip.props.onPress();
      addBtn.props.onPress();
      removeChip.props.onPress();
      startBtn.props.onPress();
    });

    expect(actions.handleSelectDuration).toHaveBeenCalledWith(2);
    expect(actions.handleSelectOrderMode).toHaveBeenCalledWith('random');
    expect(actions.handleAddCustomParticipant).toHaveBeenCalled();
    expect(actions.handleRemoveCustomParticipant).toHaveBeenCalledWith('Ana');
    expect(actions.handleStartMoment).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar a fase turn (antes e durante a fala), summary anônimo sem nomes e prayer (RF39, RF40, RNF12)', () => {
    const actions = createMockActions();
    const spy = jest.spyOn(termometroVmModule, 'useTermometroViewModel');

    // 1. Vez da pessoa antes de começar a falar
    spy.mockReturnValue([
      {
        ...baseState,
        stage: 'turn',
        currentSpeakerLabel: 'Mariana',
        hasStartedSpeaking: false,
      },
      actions,
    ]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<TermometroScreen />);
    });

    const startSpeakBtn = tree.root.findByProps({
      accessibilityLabel: 'Começar a falar',
    } as any);
    const skipBtn = tree.root.findByProps({
      accessibilityLabel: 'Pular minha vez',
    } as any);
    act(() => {
      startSpeakBtn.props.onPress();
      skipBtn.props.onPress();
    });
    expect(actions.handleStartSpeaking).toHaveBeenCalledTimes(1);
    expect(actions.handleSkipSpeaker).toHaveBeenCalledTimes(1);

    // 2. Vez da pessoa falando (com botões Próximo e Pausar)
    spy.mockReturnValue([
      {
        ...baseState,
        stage: 'turn',
        currentSpeakerLabel: 'Mariana',
        hasStartedSpeaking: true,
        secondsRemaining: 0,
      },
      actions,
    ]);
    act(() => {
      tree.update(<TermometroScreen />);
    });

    const nextBtn = tree.root.findByProps({
      accessibilityLabel: 'Próximo',
    } as any);
    const pauseBtn = tree.root.findByProps({
      accessibilityLabel: 'Pausar',
    } as any);
    act(() => {
      nextBtn.props.onPress();
      pauseBtn.props.onPress();
    });
    expect(actions.handleNextSpeaker).toHaveBeenCalledTimes(1);
    expect(actions.handleTogglePause).toHaveBeenCalledTimes(1);

    // 3. Resumo anônimo (summary) — só números, sem nomes
    spy.mockReturnValue([
      {
        ...baseState,
        stage: 'summary',
        participants: [],
        currentSpeakerLabel: '',
        sharedCount: 4,
        skippedCount: 1,
      },
      actions,
    ]);
    act(() => {
      tree.update(<TermometroScreen />);
    });

    const allTexts = tree.root
      .findAllByType('Text' as any)
      .map((t) => String(t.props.children));
    expect(allTexts.some((t) => t.includes('Todos compartilharam'))).toBe(true);
    expect(allTexts.some((t) => t.includes('Mariana'))).toBe(false);

    const prayerBtn = tree.root.findByProps({
      accessibilityLabel: 'Momento de Oração',
    } as any);
    act(() => {
      prayerBtn.props.onPress();
    });
    expect(actions.handleOpenPrayerMoment).toHaveBeenCalledTimes(1);

    // 4. Momento de Oração (prayer) sem cronômetro
    spy.mockReturnValue([
      {
        ...baseState,
        stage: 'prayer',
        participants: [],
        currentSpeakerLabel: '',
      },
      actions,
    ]);
    act(() => {
      tree.update(<TermometroScreen />);
    });

    const endBtn = tree.root.findByProps({
      accessibilityLabel: 'Encerrar Encontro',
    } as any);
    act(() => {
      endBtn.props.onPress();
    });
    expect(actions.handleEndEncounter).toHaveBeenCalledTimes(1);
  });
});
