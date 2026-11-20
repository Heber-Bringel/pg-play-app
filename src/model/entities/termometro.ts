export type TermometroParticipantMode = 'teams' | 'custom' | 'free';

export type TermometroDurationMinutes = 1 | 2 | 3;

export type TermometroOrderMode = 'list' | 'random';

export type TermometroStage = 'setup' | 'turn' | 'summary' | 'prayer';

export type TermometroThermalZone = 'cool' | 'warm' | 'completed';

export type TermometroSummary = {
  sharedCount: number;
  skippedCount: number;
  totalParticipants: number;
};

export type TermometroSession = {
  stage: TermometroStage;
  participantMode: TermometroParticipantMode;
  durationMinutes: TermometroDurationMinutes;
  durationSeconds: number;
  orderMode: TermometroOrderMode;
  participants: string[];
  currentIndex: number;
  currentSpeakerLabel: string;
  hasStartedSpeaking: boolean;
  isPaused: boolean;
  secondsRemaining: number;
  sharedCount: number;
  skippedCount: number;
};
