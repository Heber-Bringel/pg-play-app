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
  config: AdedonhaConfig;
  currentRound: number;
  currentLetter: string | null;
  usedLetters: string[];
  currentTallyColumnIndex: number;
  stopTriggeredBy: string | null;
  players: AdedonhaPlayer[];
  submissions: AdedonhaSubmission[];
};
