export type TermometroParticipantMode = 'custom' | 'free';

export type TermometroDurationMinutes = 1 | 2 | 3;

export type TermometroOrderMode = 'list' | 'random';

export type TermometroStage = 'setup' | 'turn' | 'summary' | 'prayer' | 'closed';

export type TermometroThermalZone = 'cool' | 'warm' | 'completed';

export type TermometroSummary = {
  title: string;
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
  summaryTitle: string;
};
