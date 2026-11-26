import type {
  DesenhoCategory,
  DrawingElement,
} from '@/model/entities/drawingChallenge';

export type AdedonhaPhase =
  | 'lobby'
  | 'roulette'
  | 'filling'
  | 'stop_countdown'
  | 'tally'
  | 'round_summary'
  | 'finished';

export type AdedonhaSubmissionStatus =
  | 'pending'
  | 'unique'
  | 'repeated'
  | 'invalid';

export type AdedonhaTallyVerdict = 'unique' | 'repeated' | 'invalid';

export type AdedonhaRoundDuration = 60 | 90 | 120;

export type AdedonhaTotalRounds = 5 | 7 | 10;

export type AdedonhaConfig = {
  columns: string[];
  roundDurationSeconds: AdedonhaRoundDuration;
  totalRounds: AdedonhaTotalRounds;
  excludeHardLetters: boolean;
};

export type AdedonhaPlayer = {
  id: string;
  nickname: string;
  isHost: boolean;
  score: number;
  stopCount: number;
  uniqueAnswersCount: number;
};

export type AdedonhaSubmission = {
  id: string;
  roomId: string;
  roundNumber: number;
  playerId: string;
  playerNickname: string;
  columnName: string;
  answerText: string;
  status: AdedonhaSubmissionStatus;
  doubtCount: number;
  points: number;
};

export type AdedonhaAwards = {
  generalChampion: AdedonhaPlayer | null;
  fastestHand: AdedonhaPlayer | null;
  rareVocabulary: AdedonhaPlayer | null;
};

export type AdedonhaRoom = {
  id: string;
  code: string;
  gameType: 'adedonha';
  hostId: string;
  phase: AdedonhaPhase;
  version: number;
  phaseEndsAt: string | null;
  config: AdedonhaConfig;
  currentRound: number;
  currentLetter: string | null;
  usedLetters: string[];
  currentTallyColumnIndex: number;
  stopTriggeredBy: string | null;
  players: AdedonhaPlayer[];
  submissions: AdedonhaSubmission[];
};

export type CidadeDormeRole = 'cidadao' | 'assassino' | 'anjo' | 'detetive';

export type CidadeDormeActionKind =
  | 'ready'
  | 'night_assassin'
  | 'night_angel'
  | 'night_detective'
  | 'vote';

export type CidadeDormeActionRecord = {
  id: string;
  roomId: string;
  roundNumber: number;
  playerId: string;
  kind: CidadeDormeActionKind;
  targetId: string | null;
  createdAt: string;
};

export type CidadeDormeAlignment = 'cidade' | 'infiltrados';

export type CidadeDormeVoiceProfile = 'masculina' | 'feminina';

export type CidadeDormePhase =
  | 'lobby'
  | 'role_reveal'
  | 'night_assassin'
  | 'night_angel'
  | 'night_detective'
  | 'day_debate'
  | 'day_voting'
  | 'vote_result'
  | 'finished';

export type CidadeDormeDayDebateDuration = 60 | 120 | 180;

export type CidadeDormeNightTurnDuration = 15 | 20;

export type CidadeDormeAssassinCount = 1 | 2 | 3;

export type CidadeDormeConfig = {
  narratorVoice: CidadeDormeVoiceProfile;
  assassinCount: CidadeDormeAssassinCount;
  dayDebateSeconds: CidadeDormeDayDebateDuration;
  nightTurnSeconds: CidadeDormeNightTurnDuration;
  revealRoleOnDeath: boolean;
};

export type CidadeDormeDetectiveVerdict = {
  targetPlayerId: string;
  targetNickname: string;
  isAssassin: boolean;
  roundNumber: number;
};

export type CidadeDormeDawnReport = {
  roundNumber: number;
  attackedPlayerId: string | null;
  attackedNickname: string | null;
  savedByAngel: boolean;
  eliminatedPlayerId: string | null;
  eliminatedNickname: string | null;
  eliminatedRole: CidadeDormeRole | null;
};

export type CidadeDormeVoteReport = {
  roundNumber: number;
  eliminatedPlayerId: string | null;
  eliminatedNickname: string | null;
  eliminatedRole: CidadeDormeRole | null;
  tieOrSkipped: boolean;
  voteCounts: Record<string, number>;
  skipCount: number;
};

export type CidadeDormePlayer = {
  id: string;
  nickname: string;
  isHost: boolean;
  isAlive: boolean;
  isReady: boolean;
  role: CidadeDormeRole | null;
  hasVoted: boolean;
};

export type CidadeDormeRoom = {
  id: string;
  code: string;
  gameType: 'cidade-dorme';
  hostId: string;
  phase: CidadeDormePhase;
  version: number;
  config: CidadeDormeConfig;
  currentRound: number;
  phaseEndsAt: string | null;
  narratorCaption: string;
  players: CidadeDormePlayer[];
  allyAssassinIds?: string[];
  nightTargetId: string | null;
  nightProtectedId: string | null;
  detectiveVerdict: CidadeDormeDetectiveVerdict | null;
  votesByPlayerId: Record<string, string>;
  dawnReport: CidadeDormeDawnReport | null;
  voteReport: CidadeDormeVoteReport | null;
  winner: CidadeDormeAlignment | null;
};

export type DesenhoPhase = 'lobby' | 'drawing' | 'turn_summary' | 'finished';

export type DesenhoTurnDuration = 60 | 90 | 120;

export type DesenhoConfig = {
  turnDurationSeconds: DesenhoTurnDuration;
  totalRounds: number;
  categories: DesenhoCategory[];
};

export type DesenhoPlayer = {
  id: string;
  nickname: string;
  isHost: boolean;
  score: number;
  drawingScore: number;
  firstGuessCount: number;
  hasGuessedCurrentTurn: boolean;
};

export type DesenhoGuess = {
  id: string;
  playerId: string;
  playerNickname: string;
  text: string;
  isCorrect: boolean;
  pointsAwarded: number;
  createdAt: string;
};

export type DesenhoAwards = {
  generalChampion: DesenhoPlayer | null;
  bestArtist: DesenhoPlayer | null;
  eagleEye: DesenhoPlayer | null;
};

export type DesenhoRoom = {
  id: string;
  code: string;
  gameType: 'desenho';
  hostId: string;
  phase: DesenhoPhase;
  version: number;
  phaseEndsAt: string | null;
  config: DesenhoConfig;
  currentRound: number;
  drawerOrder: string[];
  currentDrawerIndex: number;
  currentDrawerId: string | null;
  currentCardCategory: DesenhoCategory | null;
  currentSecretWord: string | null;
  usedCardIds: string[];
  elements: DrawingElement[];
  guesses: DesenhoGuess[];
  players: DesenhoPlayer[];
};
