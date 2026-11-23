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
  handleClearFieldErrors: jest.fn(),
  handleStartMoment: jest.fn(async () => {}),
  handleStartSpeaking: jest.fn(async () => {}),
  handleTick: jest.fn(async () => {}),
  handleTogglePause: jest.fn(async () => {}),
  handleNextSpeaker: jest.fn(async () => {}),
  handleSkipSpeaker: jest.fn(async () => {}),
  handleFinishFreeMode: jest.fn(async () => {}),
  handleOpenPrayerMoment: jest.fn(async () => {}),
  handleRequestEndFromSummary: jest.fn(),
  handleCancelEndWithoutPrayer: jest.fn(),
  handleEndEncounter: jest.fn(async () => {}),
  handleBackToHub: jest.fn(async () => {}),
  handleRequestExit: jest.fn(),
  handleCancelExit: jest.fn(),
  handleConfirmExit: jest.fn(async () => {}),
  handleRetry: jest.fn(async () => {}),
});

const baseState: TermometroState = {
  stage: 'setup',
  participantMode: 'custom',
  durationMinutes: 1,
  durationSeconds: 60,
  orderMode: 'list',
  participants: ['Ana', 'Lucas'],
  currentIndex: 0,
  currentSpeakerLabel: 'Ana',
  hasStartedSpeaking: false,
  isPaused: false,
  secondsRemaining: 60,
  sharedCount: 2,
  skippedCount: 1,
  summaryTitle: 'Roda de pedidos concluída',
  confirmingExit: false,
  confirmingEndWithoutPrayer: false,
  loading: false,
  error: null,
  fieldError: null,
  setupError: null,
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

  it('deve renderizar a fase setup, adicionar participante com Enter (onSubmitEditing) e limpar erro ao digitar (RF38, Issues #48 e #53)', async () => {
    const actions = createMockActions();
    const spy = jest.spyOn(termometroVmModule, 'useTermometroViewModel');

    spy.mockReturnValue([
      {
        ...baseState,
        stage: 'setup',
        participantMode: 'custom',
        participants: ['Ana'],
        fieldError: 'Digite pelo menos 2 letras.',
        setupError: 'Adicione pelo menos 1 participante.',
      },
      actions,
    ]);

    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<TermometroScreen />);
    });

    // Rótulo sem prefixo duplicado "Modo Modo livre"
    const freeModeChip = tree.root.findByProps({
      accessibilityLabel: 'Modo livre (sem nomes)',
    } as any);
    expect(freeModeChip).toBeDefined();

    // Digitar no campo chama handleClearFieldErrors e Enter (onSubmitEditing) adiciona participante
    const input = tree.root.findByType('TextInput' as any);
    await act(async () => {
      input.props.onChangeText('Marcos');
    });
    expect(actions.handleClearFieldErrors).toHaveBeenCalledTimes(1);

    await act(async () => {
      input.props.onSubmitEditing();
    });
    expect(actions.handleAddCustomParticipant).toHaveBeenCalledWith('Marcos');

    const dur2Chip = tree.root.findByProps({
      accessibilityLabel: 'Tempo 2 min',
    } as any);
    const randomOrderChip = tree.root.findByProps({
      accessibilityLabel: 'Ordem Ordem sorteada',
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
      removeChip.props.onPress();
      startBtn.props.onPress();
    });

    expect(actions.handleSelectDuration).toHaveBeenCalledWith(2);
    expect(actions.handleSelectOrderMode).toHaveBeenCalledWith('random');
    expect(actions.handleRemoveCustomParticipant).toHaveBeenCalledWith('Ana');
    expect(actions.handleStartMoment).toHaveBeenCalledTimes(1);
  });

  it('deve renderizar a fase turn respeitando limite de ações, ocultar Pular/Pausar quando indevido e exibir fechamento acolhedor (Issues #49, #50, #51 e #54)', () => {
    const actions = createMockActions();
    const spy = jest.spyOn(termometroVmModule, 'useTermometroViewModel');

    // 1. Vez da pessoa no modo custom antes de começar a falar (mostra Começar a falar e Pular minha vez)
    spy.mockReturnValue([
      {
        ...baseState,
        stage: 'turn',
        participantMode: 'custom',
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

    // 2. Vez da pessoa falando com tempo correndo (> 0s): mostra Próximo e botão de ícone Pausar no timer; NÃO mostra Pular minha vez
    spy.mockReturnValue([
      {
        ...baseState,
        stage: 'turn',
        participantMode: 'custom',
        currentSpeakerLabel: 'Mariana',
        hasStartedSpeaking: true,
        secondsRemaining: 35,
      },
      actions,
    ]);
    act(() => {
      tree.update(<TermometroScreen />);
    });

    expect(
      tree.root.findAllByProps({ accessibilityLabel: 'Pular minha vez' } as any)
    ).toHaveLength(0);

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

    // 3. Tempo concluído (00:00): botão Pausar não aparece mais
    spy.mockReturnValue([
      {
        ...baseState,
        stage: 'turn',
        participantMode: 'free',
        currentSpeakerLabel: 'Próxima pessoa',
        hasStartedSpeaking: true,
        secondsRemaining: 0,
      },
      actions,
    ]);
    act(() => {
      tree.update(<TermometroScreen />);
    });
    expect(
      tree.root.findAllByProps({ accessibilityLabel: 'Pausar' } as any)
    ).toHaveLength(0);

    const finishFreeBtn = tree.root.findByProps({
      accessibilityLabel: 'Encerrar roda',
    } as any);
    act(() => {
      finishFreeBtn.props.onPress();
    });
    expect(actions.handleFinishFreeMode).toHaveBeenCalledTimes(1);

    // 4. Resumo anônimo (summary) — só números, sem nomes, e confirmação antes de pular oração
    spy.mockReturnValue([
      {
        ...baseState,
        stage: 'summary',
        participants: [],
        currentSpeakerLabel: '',
        sharedCount: 4,
        skippedCount: 1,
        summaryTitle: 'Roda de pedidos concluída',
      },
      actions,
    ]);
    act(() => {
      tree.update(<TermometroScreen />);
    });

    const allTexts = tree.root
      .findAllByType('Text' as any)
      .map((t) => String(t.props.children));
    expect(allTexts.some((t) => t.includes('Roda de pedidos concluída'))).toBe(
      true
    );
    expect(allTexts.some((t) => t.includes('Mariana'))).toBe(false);

    const endFromSummaryBtn = tree.root.findByProps({
      accessibilityLabel: 'Encerrar Encontro',
    } as any);
    act(() => {
      endFromSummaryBtn.props.onPress();
    });
    expect(actions.handleRequestEndFromSummary).toHaveBeenCalledTimes(1);

    // 5. Momento de Oração (prayer) -> Encerrar Encontro
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

    // 6. Fechamento acolhedor (closed) -> Voltar ao Hub
    spy.mockReturnValue([
      {
        ...baseState,
        stage: 'closed',
        participants: [],
        currentSpeakerLabel: '',
      },
      actions,
    ]);
    act(() => {
      tree.update(<TermometroScreen />);
    });

    const backHubBtn = tree.root.findByProps({
      accessibilityLabel: 'Voltar ao Hub',
    } as any);
    act(() => {
      backHubBtn.props.onPress();
    });
    expect(actions.handleBackToHub).toHaveBeenCalledTimes(1);
  });
});
