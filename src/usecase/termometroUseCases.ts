import type {
  TermometroDurationMinutes,
  TermometroOrderMode,
  TermometroParticipantMode,
  TermometroSession,
  TermometroSummary,
} from '@/model/entities/termometro';
import { ValidationError } from '@/model/errors';
import type { ITermometroUseCases } from '@/usecase/iTermometroUseCases';

const VALID_MODES: ReadonlySet<TermometroParticipantMode> = new Set([
  'custom',
  'free',
]);

const VALID_DURATIONS: ReadonlySet<TermometroDurationMinutes> = new Set([1, 2, 3]);

const VALID_ORDERS: ReadonlySet<TermometroOrderMode> = new Set(['list', 'random']);

function shuffleNames(names: string[], randomFn: () => number): string[] {
  const copy = [...names];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(randomFn() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

function buildSummaryTitle(sharedCount: number, skippedCount: number): string {
  if (sharedCount > 0 && skippedCount === 0) {
    return 'Todos compartilharam';
  }
  return 'Roda de pedidos concluída';
}

function createInitialSession(): TermometroSession {
  return {
    stage: 'setup',
    participantMode: 'custom',
    durationMinutes: 1,
    durationSeconds: 60,
    orderMode: 'list',
    participants: [],
    currentIndex: 0,
    currentSpeakerLabel: '',
    hasStartedSpeaking: false,
    isPaused: false,
    secondsRemaining: 60,
    sharedCount: 0,
    skippedCount: 0,
    summaryTitle: 'Roda de pedidos concluída',
  };
}

export class TermometroUseCases implements ITermometroUseCases {
  private session: TermometroSession = createInitialSession();
  private customParticipants: string[] = [];

  constructor(private readonly randomFn: () => number = Math.random) {}

  private cloneSession(): TermometroSession {
    return {
      ...this.session,
      participants: [...this.session.participants],
    };
  }

  private resolveSetupParticipants(mode: TermometroParticipantMode): string[] {
    if (mode === 'custom') {
      return [...this.customParticipants];
    }
    return [];
  }

  async getSession(): Promise<TermometroSession> {
    if (this.session.stage === 'setup') {
      this.session.participants = this.resolveSetupParticipants(
        this.session.participantMode
      );
    }
    return this.cloneSession();
  }

  async setParticipantMode(
    mode: TermometroParticipantMode
  ): Promise<TermometroSession> {
    if (!VALID_MODES.has(mode)) {
      throw new ValidationError(
        'Modo de participantes inválido para o Termômetro de Pedidos.'
      );
    }
    this.session.participantMode = mode;
    this.session.participants = this.resolveSetupParticipants(mode);
    return this.cloneSession();
  }

  async setDurationMinutes(
    minutes: TermometroDurationMinutes
  ): Promise<TermometroSession> {
    if (!VALID_DURATIONS.has(minutes)) {
      throw new ValidationError(
        'O tempo de fala por pessoa deve ser de 1, 2 ou 3 minutos.'
      );
    }
    this.session.durationMinutes = minutes;
    this.session.durationSeconds = minutes * 60;
    this.session.secondsRemaining = minutes * 60;
    return this.cloneSession();
  }

  async setOrderMode(order: TermometroOrderMode): Promise<TermometroSession> {
    if (!VALID_ORDERS.has(order)) {
      throw new ValidationError(
        'A ordem de participação deve ser lista ou sorteio.'
      );
    }
    this.session.orderMode = order;
    return this.cloneSession();
  }

  async addCustomParticipant(name: string): Promise<TermometroSession> {
    if (this.session.stage !== 'setup') {
      throw new ValidationError(
        'Só é possível adicionar participantes durante a configuração da roda.'
      );
    }
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      throw new ValidationError(
        'Digite um nome com pelo menos 2 letras para o participante.'
      );
    }
    if (cleanName.length > 24) {
      throw new ValidationError(
        'O nome do participante deve ter no máximo 24 caracteres.'
      );
    }
    const exists = this.customParticipants.some(
      (item) => item.toLowerCase() === cleanName.toLowerCase()
    );
    if (exists) {
      throw new ValidationError('Este participante já está na lista.');
    }

    this.customParticipants.push(cleanName);
    this.session.participantMode = 'custom';
    this.session.participants = [...this.customParticipants];
    return this.cloneSession();
  }

  async removeCustomParticipant(name: string): Promise<TermometroSession> {
    if (this.session.stage !== 'setup') {
      throw new ValidationError(
        'Só é possível remover participantes durante a configuração da roda.'
      );
    }
    const cleanName = name.trim();
    if (!cleanName) {
      throw new ValidationError(
        'Informe o nome do participante para remover da lista.'
      );
    }
    this.customParticipants = this.customParticipants.filter(
      (item) => item.toLowerCase() !== cleanName.toLowerCase()
    );
    if (this.session.participantMode === 'custom') {
      this.session.participants = [...this.customParticipants];
    }
    return this.cloneSession();
  }

  async startMoment(): Promise<TermometroSession> {
    const baseParticipants = this.resolveSetupParticipants(
      this.session.participantMode
    );

    if (
      this.session.participantMode !== 'free' &&
      baseParticipants.length === 0
    ) {
      throw new ValidationError(
        'Adicione pelo menos 1 participante ou escolha o Modo Livre para começar.'
      );
    }

    const orderedParticipants =
      this.session.participantMode === 'free'
        ? []
        : this.session.orderMode === 'random'
          ? shuffleNames(baseParticipants, this.randomFn)
          : [...baseParticipants];

    const firstSpeaker =
      this.session.participantMode === 'free'
        ? 'Próxima pessoa'
        : orderedParticipants[0];

    this.session = {
      ...this.session,
      stage: 'turn',
      participants: orderedParticipants,
      currentIndex: 0,
      currentSpeakerLabel: firstSpeaker,
      hasStartedSpeaking: false,
      isPaused: false,
      secondsRemaining: this.session.durationSeconds,
      sharedCount: 0,
      skippedCount: 0,
      summaryTitle: 'Roda de pedidos concluída',
    };

    return this.cloneSession();
  }

  async startSpeaking(): Promise<TermometroSession> {
    if (this.session.stage !== 'turn') {
      throw new ValidationError(
        'A roda de fala precisa estar ativa para iniciar o tempo.'
      );
    }
    this.session.hasStartedSpeaking = true;
    this.session.isPaused = false;
    return this.cloneSession();
  }

  async tickSecond(): Promise<TermometroSession> {
    if (
      this.session.stage !== 'turn' ||
      !this.session.hasStartedSpeaking ||
      this.session.isPaused
    ) {
      return this.cloneSession();
    }

    // O fim do tempo apenas sinaliza (0s), nunca interrompe nem avança sozinho (RF39)
    this.session.secondsRemaining = Math.max(
      0,
      this.session.secondsRemaining - 1
    );
    return this.cloneSession();
  }

  async togglePause(): Promise<TermometroSession> {
    if (this.session.stage !== 'turn') {
      throw new ValidationError(
        'Só é possível pausar durante a vez de fala ativa.'
      );
    }
    if (!this.session.hasStartedSpeaking) {
      throw new ValidationError(
        'Inicie a fala antes de pausar o termômetro.'
      );
    }
    if (this.session.secondsRemaining <= 0) {
      throw new ValidationError(
        'O tempo desta fala já foi concluído.'
      );
    }
    this.session.isPaused = !this.session.isPaused;
    return this.cloneSession();
  }

  private transitionToSummary(): TermometroSession {
    this.session.stage = 'summary';
    this.session.participants = [];
    this.session.currentSpeakerLabel = '';
    this.session.hasStartedSpeaking = false;
    this.session.isPaused = false;
    this.session.secondsRemaining = this.session.durationSeconds;
    this.session.summaryTitle = buildSummaryTitle(
      this.session.sharedCount,
      this.session.skippedCount
    );
    return this.cloneSession();
  }

  private advanceTurn(didShare: boolean): TermometroSession {
    if (this.session.stage !== 'turn') {
      throw new ValidationError('A roda de fala não está em andamento.');
    }

    if (didShare) {
      this.session.sharedCount += 1;
    } else {
      this.session.skippedCount += 1;
    }

    if (this.session.participantMode === 'free') {
      this.session.currentIndex += 1;
      this.session.currentSpeakerLabel = 'Próxima pessoa';
      this.session.hasStartedSpeaking = false;
      this.session.isPaused = false;
      this.session.secondsRemaining = this.session.durationSeconds;
      return this.cloneSession();
    }

    const nextIndex = this.session.currentIndex + 1;
    if (nextIndex >= this.session.participants.length) {
      return this.transitionToSummary();
    }

    this.session.currentIndex = nextIndex;
    this.session.currentSpeakerLabel = this.session.participants[nextIndex];
    this.session.hasStartedSpeaking = false;
    this.session.isPaused = false;
    this.session.secondsRemaining = this.session.durationSeconds;
    return this.cloneSession();
  }

  async nextSpeaker(): Promise<TermometroSession> {
    return this.advanceTurn(true);
  }

  async skipSpeaker(): Promise<TermometroSession> {
    if (this.session.stage !== 'turn') {
      throw new ValidationError('A roda de fala não está em andamento.');
    }
    if (this.session.participantMode === 'free') {
      throw new ValidationError(
        'No modo livre não há fila de nomes para pular a vez.'
      );
    }
    if (this.session.hasStartedSpeaking) {
      throw new ValidationError(
        'Quem já começou a falar deve avançar pelo botão Próximo.'
      );
    }
    return this.advanceTurn(false);
  }

  async finishFreeMode(): Promise<TermometroSession> {
    if (this.session.stage !== 'turn') {
      throw new ValidationError('A roda de fala não está em andamento.');
    }
    if (this.session.hasStartedSpeaking) {
      this.session.sharedCount += 1;
    }
    return this.transitionToSummary();
  }

  async openPrayerMoment(): Promise<TermometroSession> {
    if (this.session.stage !== 'summary' && this.session.stage !== 'prayer') {
      throw new ValidationError(
        'O Momento de Oração é aberto após o resumo da roda de pedidos.'
      );
    }
    this.session.stage = 'prayer';
    this.session.participants = [];
    this.session.currentSpeakerLabel = '';
    return this.cloneSession();
  }

  async getAnonymousSummary(): Promise<TermometroSummary> {
    const title = buildSummaryTitle(
      this.session.sharedCount,
      this.session.skippedCount
    );
    return {
      title,
      sharedCount: this.session.sharedCount,
      skippedCount: this.session.skippedCount,
      totalParticipants: this.session.sharedCount + this.session.skippedCount,
    };
  }

  async closeEncounter(): Promise<TermometroSession> {
    // RNF12: descarta todos os nomes digitados imediatamente antes da mensagem final
    const finalShared = this.session.sharedCount;
    const finalSkipped = this.session.skippedCount;
    this.customParticipants = [];
    this.session = {
      ...createInitialSession(),
      stage: 'closed',
      sharedCount: finalShared,
      skippedCount: finalSkipped,
      summaryTitle: buildSummaryTitle(finalShared, finalSkipped),
    };
    return this.cloneSession();
  }

  async endSession(): Promise<TermometroSession> {
    // RNF12: descarta todos os nomes digitados e reinicia o estado em memória
    this.customParticipants = [];
    this.session = createInitialSession();
    return this.cloneSession();
  }
}
