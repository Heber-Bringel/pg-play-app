import type {
  TermometroDurationMinutes,
  TermometroOrderMode,
  TermometroParticipantMode,
  TermometroSession,
  TermometroSummary,
} from '@/model/entities/termometro';

export interface ITermometroUseCases {
  getSession(): Promise<TermometroSession>;
  setParticipantMode(mode: TermometroParticipantMode): Promise<TermometroSession>;
  setDurationMinutes(minutes: TermometroDurationMinutes): Promise<TermometroSession>;
  setOrderMode(order: TermometroOrderMode): Promise<TermometroSession>;
  addCustomParticipant(name: string): Promise<TermometroSession>;
  removeCustomParticipant(name: string): Promise<TermometroSession>;
  startMoment(): Promise<TermometroSession>;
  startSpeaking(): Promise<TermometroSession>;
  tickSecond(): Promise<TermometroSession>;
  togglePause(): Promise<TermometroSession>;
  nextSpeaker(): Promise<TermometroSession>;
  skipSpeaker(): Promise<TermometroSession>;
  finishFreeMode(): Promise<TermometroSession>;
  openPrayerMoment(): Promise<TermometroSession>;
  getAnonymousSummary(): Promise<TermometroSummary>;
  closeEncounter(): Promise<TermometroSession>;
  endSession(): Promise<TermometroSession>;
}
