import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  DesenhoCategory,
  DrawingElement,
} from '@/model/entities/drawingChallenge';
import type {
  AdedonhaConfig,
  AdedonhaPhase,
  AdedonhaPlayer,
  AdedonhaRoom,
  AdedonhaRoundDuration,
  AdedonhaSubmission,
  AdedonhaSubmissionStatus,
  AdedonhaTallyVerdict,
  AdedonhaTotalRounds,
  CidadeDormeActionKind,
  CidadeDormeConfig,
  CidadeDormeDetectiveVerdict,
  CidadeDormeRole,
  CidadeDormeRoom,
  DesenhoConfig,
  DesenhoGuess,
  DesenhoPhase,
  DesenhoPlayer,
  DesenhoRoom,
  DesenhoTurnDuration,
} from '@/model/entities/multiplayerSession';
import { AuthError, ConflictError, DataSourceError, ValidationError } from '@/model/errors';
import type {
  IMultiplayerRoomService,
  StartDesenhoTurnInput,
  SubmitDesenhoGuessResult,
} from '@/model/services/iMultiplayerRoomService';

export type SupabaseServiceConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

type StoredRoomConfig = {
  columns?: string[];
  roundDurationSeconds?: AdedonhaRoundDuration;
  totalRounds?: AdedonhaTotalRounds;
  excludeHardLetters?: boolean;
  usedLetters?: string[];
  currentTallyColumnIndex?: number;
  stopTriggeredBy?: string | null;
  stopCountsByUserId?: Record<string, number>;
};

type DbRoomRow = {
  id: string;
  code: string;
  game_type: string;
  host_id: string;
  status: string;
  phase: string;
  version?: number;
  phase_ends_at?: string | null;
  config: StoredRoomConfig | null;
  current_round: number;
  current_letter: string | null;
};

type DbRoomPlayerRow = {
  id: string;
  room_id: string;
  user_id: string;
  nickname: string;
  is_host: boolean;
  is_alive?: boolean;
  is_ready?: boolean;
  has_voted?: boolean;
  score: number;
};

type DbCidadeDormeSecretRow = {
  room_id: string;
  user_id: string;
  secret_role: CidadeDormeRole;
  detective_verdict: CidadeDormeDetectiveVerdict | null;
};

type DbCidadeDormeActionRow = {
  id?: string;
  room_id: string;
  round_number: number;
  user_id: string;
  kind: CidadeDormeActionKind;
  target_id: string | null;
  created_at?: string;
};

type DbSubmissionRow = {
  id: string;
  room_id: string;
  round_number: number;
  user_id: string;
  column_name: string;
  answer_text: string;
  status: string;
  doubt_count: number;
  points: number;
};

type WebSessionStorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

type SupabaseAuthStorageAdapter = {
  getItem: (key: string) => Promise<string | null> | string | null;
  setItem: (key: string, value: string) => Promise<void> | void;
  removeItem: (key: string) => Promise<void> | void;
};

// TODO (temporário): isolar sessão anônima por aba no Web usando sessionStorage
// para facilitar testes com múltiplos jogadores em abas do mesmo navegador.
// No mobile (Android/iOS), mantém AsyncStorage normalmente.
function resolveTemporaryAuthStorage(): SupabaseAuthStorageAdapter {
  const globalScope = globalThis as {
    sessionStorage?: WebSessionStorageLike;
  };
  const webSessionStorage = globalScope.sessionStorage;

  if (
    webSessionStorage &&
    typeof webSessionStorage.getItem === 'function' &&
    typeof webSessionStorage.setItem === 'function' &&
    typeof webSessionStorage.removeItem === 'function'
  ) {
    return {
      getItem: (key: string) => webSessionStorage.getItem(key),
      setItem: (key: string, value: string) => {
        webSessionStorage.setItem(key, value);
      },
      removeItem: (key: string) => {
        webSessionStorage.removeItem(key);
      },
    };
  }

  return AsyncStorage;
}

const DEFAULT_COLUMNS: string[] = [
  'Personagem Bíblico',
  'Livro da Bíblia',
  'Cidade, Monte ou Rio Bíblico',
];

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generatePinCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    const idx = Math.floor(Math.random() * ROOM_CODE_CHARS.length);
    code += ROOM_CODE_CHARS[idx];
  }
  return code;
}

export class SupabaseMultiplayerRoomService implements IMultiplayerRoomService {
  private readonly delegateService?: IMultiplayerRoomService;
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;
  private client?: SupabaseClient;
  private activeRoomId: string | null = null;
  private cachedUserId: string | null = null;
  private activeChannels: Map<string, ReturnType<SupabaseClient['channel']>> =
    new Map();

  constructor(
    config: SupabaseServiceConfig = {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
    delegateService?: IMultiplayerRoomService,
    customClient?: SupabaseClient
  ) {
    this.supabaseUrl = config.supabaseUrl.trim();
    this.supabaseAnonKey = config.supabaseAnonKey.trim();
    this.delegateService = delegateService;
    this.client = customClient;
  }

  private ensureCredentials(): void {
    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      throw new AuthError(
        'Credenciais do Supabase não configuradas para a sala multiplayer.'
      );
    }
  }

  private getClient(): SupabaseClient {
    this.ensureCredentials();
    if (!this.client) {
      this.client = createClient(this.supabaseUrl, this.supabaseAnonKey, {
        auth: {
          storage: resolveTemporaryAuthStorage(),
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      });
    }
    return this.client;
  }

  private async ensureAuthenticatedUserId(): Promise<string> {
    if (this.cachedUserId) {
      return this.cachedUserId;
    }

    const client = this.getClient();
    const { data: sessionData, error: sessionError } =
      await client.auth.getSession();
    if (sessionError) {
      throw new AuthError('Não foi possível verificar a sessão do jogador.');
    }
    if (sessionData.session?.user?.id) {
      const userId = sessionData.session.user.id;
      this.cachedUserId = userId;
      return userId;
    }

    const { data: anonData, error: anonError } =
      await client.auth.signInAnonymously();
    if (anonError || !anonData.user?.id) {
      throw new AuthError(
        'Não foi possível iniciar sessão anônima no Supabase.'
      );
    }

    const userId = anonData.user.id;
    this.cachedUserId = userId;
    return userId;
  }

  private async rotateAnonymousUserId(): Promise<string> {
    const client = this.getClient();
    const { data: anonData, error: anonError } =
      await client.auth.signInAnonymously();
    if (anonError || !anonData.user?.id) {
      throw new AuthError(
        'Não foi possível iniciar nova sessão anônima para este participante.'
      );
    }
    this.cachedUserId = anonData.user.id;
    return this.cachedUserId;
  }

  private wrapError(err: unknown, fallbackMessage: string): never {
    if (
      err instanceof AuthError ||
      err instanceof DataSourceError ||
      err instanceof ValidationError
    ) {
      throw err;
    }
    if (err instanceof Error && err.message.trim()) {
      throw new DataSourceError(err.message);
    }
    throw new DataSourceError(fallbackMessage);
  }

  private mapToDomainRoom(
    row: DbRoomRow,
    playerRows: DbRoomPlayerRow[],
    submissionRows: DbSubmissionRow[]
  ): AdedonhaRoom {
    const rawConfig = row.config ?? {};
    const nicknameByUserId = new Map<string, string>();
    for (const p of playerRows) {
      nicknameByUserId.set(p.user_id, p.nickname);
    }

    const submissions: AdedonhaSubmission[] = submissionRows.map((sub) => ({
      id: sub.id,
      roomId: sub.room_id,
      roundNumber: sub.round_number,
      playerId: sub.user_id,
      playerNickname: nicknameByUserId.get(sub.user_id) ?? 'Jogador',
      columnName: sub.column_name,
      answerText: sub.answer_text,
      status: sub.status as AdedonhaSubmissionStatus,
      doubtCount: sub.doubt_count,
      points: sub.points,
    }));

    const stopCounts = rawConfig.stopCountsByUserId ?? {};
    const players: AdedonhaPlayer[] = playerRows.map((p) => {
      const playerSubs = submissions.filter((s) => s.playerId === p.user_id);
      const uniqueAnswersCount = playerSubs.filter(
        (s) => s.status === 'unique'
      ).length;
      return {
        id: p.user_id,
        nickname: p.nickname,
        isHost: p.is_host,
        score: p.score,
        stopCount: stopCounts[p.user_id] ?? 0,
        uniqueAnswersCount,
      };
    });

    const trimmedLetter = row.current_letter ? row.current_letter.trim() : null;

    return {
      id: row.id,
      code: row.code,
      gameType: 'adedonha',
      hostId: row.host_id,
      phase: (row.phase || 'lobby') as AdedonhaPhase,
      version: row.version ?? 0,
      phaseEndsAt: row.phase_ends_at ?? null,
      config: {
        columns: rawConfig.columns ?? [...DEFAULT_COLUMNS],
        roundDurationSeconds: rawConfig.roundDurationSeconds ?? 90,
        totalRounds: rawConfig.totalRounds ?? 5,
        excludeHardLetters: rawConfig.excludeHardLetters ?? true,
      },
      currentRound: row.current_round,
      currentLetter: trimmedLetter && trimmedLetter.length > 0 ? trimmedLetter : null,
      usedLetters: rawConfig.usedLetters ?? [],
      currentTallyColumnIndex: rawConfig.currentTallyColumnIndex ?? 0,
      stopTriggeredBy: rawConfig.stopTriggeredBy ?? null,
      players,
      submissions,
    };
  }

  private async fetchRawRoomState(roomId: string): Promise<{
    roomRow: DbRoomRow;
    playerRows: DbRoomPlayerRow[];
    submissionRows: DbSubmissionRow[];
  }> {
    const client = this.getClient();

    const { data: roomData, error: roomError } = await client
      .from('rooms')
      .select(
        'id, code, game_type, host_id, status, phase, config, current_round, current_letter'
      )
      .eq('id', roomId)
      .single();

    if (roomError || !roomData) {
      throw new DataSourceError('Sala multiplayer não encontrada no Supabase.');
    }

    const { data: playersData, error: playersError } = await client
      .from('room_players')
      .select('id, room_id, user_id, nickname, is_host, score')
      .eq('room_id', roomId);

    if (playersError) {
      throw new DataSourceError('Erro ao carregar jogadores da sala.');
    }

    const { data: submissionsData, error: submissionsError } = await client
      .from('adedonha_submissions')
      .select(
        'id, room_id, round_number, user_id, column_name, answer_text, status, doubt_count, points'
      )
      .eq('room_id', roomId);

    if (submissionsError) {
      throw new DataSourceError('Erro ao carregar respostas da rodada.');
    }

    return {
      roomRow: roomData as DbRoomRow,
      playerRows: (playersData ?? []) as DbRoomPlayerRow[],
      submissionRows: (submissionsData ?? []) as DbSubmissionRow[],
    };
  }

  private async loadRoomSnapshot(roomId: string): Promise<AdedonhaRoom> {
    const { roomRow, playerRows, submissionRows } =
      await this.fetchRawRoomState(roomId);
    return this.mapToDomainRoom(roomRow, playerRows, submissionRows);
  }

  private async recalculateAndPersistScores(roomId: string): Promise<void> {
    const client = this.getClient();
    const { playerRows, submissionRows } = await this.fetchRawRoomState(roomId);

    for (const player of playerRows) {
      const totalScore = submissionRows
        .filter((s) => s.user_id === player.user_id)
        .reduce((acc, s) => acc + s.points, 0);

      const { error } = await client
        .from('room_players')
        .update({ score: totalScore })
        .eq('room_id', roomId)
        .eq('user_id', player.user_id);

      if (error) {
        throw new DataSourceError('Falha ao atualizar pontuação dos jogadores.');
      }
    }
  }

  async getLocalPlayerId(roomId?: string): Promise<string | null> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.getLocalPlayerId(roomId);
    }
    try {
      return await this.ensureAuthenticatedUserId();
    } catch {
      return null;
    }
  }

  subscribeToRoom(
    roomId: string,
    onRoomUpdated: (room: AdedonhaRoom) => void
  ): () => void {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.subscribeToRoom(roomId, onRoomUpdated);
    }

    const client = this.getClient();
    const channelName = `adedonha-room-${roomId}`;
    const previousChannel = this.activeChannels.get(channelName);
    if (previousChannel) {
      this.activeChannels.delete(channelName);
      void client.removeChannel(previousChannel);
    }

    let latestSeq = 0;
    const refresh = () => {
      const seq = ++latestSeq;
      void this.loadRoomSnapshot(roomId)
        .then((snapshot) => {
          if (seq === latestSeq) {
            onRoomUpdated(snapshot);
          }
        })
        .catch(() => {
          // Atualizações em segundo plano ignoram falhas transitórias de rede.
        });
    };

    const channel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        refresh
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${roomId}`,
        },
        refresh
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'adedonha_submissions',
          filter: `room_id=eq.${roomId}`,
        },
        refresh
      )
      .subscribe();

    this.activeChannels.set(channelName, channel);

    return () => {
      if (this.activeChannels.get(channelName) === channel) {
        this.activeChannels.delete(channelName);
      }
      void client.removeChannel(channel);
    };
  }

  async getAdedonhaRoom(roomId?: string): Promise<AdedonhaRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      try {
        return await this.delegateService.getAdedonhaRoom(roomId);
      } catch (err: unknown) {
        return this.wrapError(err, 'Falha ao sincronizar sala no Supabase.');
      }
    }

    const targetId = roomId ?? this.activeRoomId;
    if (!targetId) {
      throw new DataSourceError(
        'Nenhuma sala ativa selecionada. Crie uma sala ou informe o código PIN.'
      );
    }

    try {
      await this.ensureAuthenticatedUserId();
      this.activeRoomId = targetId;
      return await this.loadRoomSnapshot(targetId);
    } catch (err: unknown) {
      return this.wrapError(err, 'Falha ao sincronizar sala no Supabase.');
    }
  }

  async createAdedonhaRoom(
    hostNickname: string,
    initialColumns: string[] = DEFAULT_COLUMNS
  ): Promise<AdedonhaRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      try {
        return await this.delegateService.createAdedonhaRoom(
          hostNickname,
          initialColumns
        );
      } catch (err: unknown) {
        return this.wrapError(err, 'Não foi possível criar sala no Supabase.');
      }
    }

    try {
      const client = this.getClient();
      const userId = await this.ensureAuthenticatedUserId();
      const code = generatePinCode();
      const storedConfig: StoredRoomConfig = {
        columns: [...initialColumns],
        roundDurationSeconds: 90,
        totalRounds: 5,
        excludeHardLetters: true,
        usedLetters: [],
        currentTallyColumnIndex: 0,
        stopTriggeredBy: null,
        stopCountsByUserId: {},
      };

      const { data: createdRoom, error: roomError } = await client
        .from('rooms')
        .insert({
          code,
          game_type: 'adedonha',
          host_id: userId,
          status: 'lobby',
          phase: 'lobby',
          config: storedConfig,
          current_round: 1,
          current_letter: null,
        })
        .select('id')
        .single();

      if (roomError || !createdRoom) {
        throw new DataSourceError('Não foi possível criar a sala no Supabase.');
      }

      const roomId = (createdRoom as { id: string }).id;
      const { error: playerError } = await client.from('room_players').insert({
        room_id: roomId,
        user_id: userId,
        nickname: hostNickname.trim(),
        is_host: true,
        is_ready: true,
        score: 0,
      });

      if (playerError) {
        throw new DataSourceError(
          'Sala criada, mas falhou ao registrar o Moderador.'
        );
      }

      this.activeRoomId = roomId;
      return await this.loadRoomSnapshot(roomId);
    } catch (err: unknown) {
      return this.wrapError(err, 'Não foi possível criar sala no Supabase.');
    }
  }

  async joinAdedonhaRoom(code: string, nickname: string): Promise<AdedonhaRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      try {
        return await this.delegateService.joinAdedonhaRoom(code, nickname);
      } catch (err: unknown) {
        return this.wrapError(
          err,
          'Não foi possível entrar na sala via Supabase.'
        );
      }
    }

    try {
      const client = this.getClient();
      let userId = await this.ensureAuthenticatedUserId();
      const normalizedCode = code.trim().toUpperCase();

      const { data: roomData, error: roomError } = await client
        .from('rooms')
        .select('id, host_id, phase')
        .eq('code', normalizedCode)
        .eq('game_type', 'adedonha')
        .single();

      if (roomError || !roomData) {
        throw new DataSourceError(
          'Código de sala não encontrado. Confira o PIN com o Moderador.'
        );
      }

      const targetRoom = roomData as { id: string; host_id: string; phase: string };
      const cleanNickname = nickname.trim();

      const { data: existingPlayersData, error: existingPlayersError } =
        await client
          .from('room_players')
          .select('id, room_id, user_id, nickname, is_host, score')
          .eq('room_id', targetRoom.id);

      if (existingPlayersError) {
        throw new DataSourceError('Erro ao verificar participantes da sala.');
      }

      const existingPlayers = (existingPlayersData ?? []) as DbRoomPlayerRow[];
      let sameUserRow = existingPlayers.find((p) => p.user_id === userId);
      const duplicateNickRow = existingPlayers.find(
        (p) =>
          p.user_id !== userId &&
          p.nickname.trim().toLowerCase() === cleanNickname.toLowerCase()
      );

      if (duplicateNickRow) {
        throw new ValidationError(
          'Já existe um participante com este apelido na sala. Escolha outro nome.'
        );
      }

      if (
        sameUserRow &&
        sameUserRow.nickname.trim().toLowerCase() !==
          cleanNickname.toLowerCase()
      ) {
        // Aba duplicada no navegador Web herda sessionStorage do líder/outro jogador;
        // cria novo usuário anônimo sem invalidar a sessão original.
        userId = await this.rotateAnonymousUserId();
        sameUserRow = undefined;
      }

      if (sameUserRow) {
        if (
          sameUserRow.nickname.trim().toLowerCase() !==
          cleanNickname.toLowerCase()
        ) {
          const { error: updateError } = await client
            .from('room_players')
            .update({ nickname: cleanNickname })
            .eq('room_id', targetRoom.id)
            .eq('user_id', userId);

          if (updateError) {
            throw new DataSourceError(
              'Não foi possível atualizar seu apelido na sala.'
            );
          }
        }
      } else {
        if (targetRoom.phase !== 'lobby') {
          throw new ValidationError(
            'A partida já começou. Novos jogadores só podem entrar no Lobby.'
          );
        }
        const { error: insertError } = await client.from('room_players').insert({
          room_id: targetRoom.id,
          user_id: userId,
          nickname: cleanNickname,
          is_host: targetRoom.host_id === userId,
          is_ready: true,
          score: 0,
        });

        if (insertError) {
          throw new DataSourceError('Não foi possível entrar na sala.');
        }
      }

      this.activeRoomId = targetRoom.id;
      return await this.loadRoomSnapshot(targetRoom.id);
    } catch (err: unknown) {
      return this.wrapError(
        err,
        'Não foi possível entrar na sala via Supabase.'
      );
    }
  }

  async leaveAdedonhaRoom(roomId: string, playerId: string): Promise<void> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.leaveAdedonhaRoom(roomId, playerId);
    }

    if (this.activeRoomId === roomId) {
      this.activeRoomId = null;
    }

    try {
      const client = this.getClient();
      const { data: roomData } = await client
        .from('rooms')
        .select('id, host_id, phase')
        .eq('id', roomId)
        .single();

      const row = roomData as
        | { id: string; host_id: string; phase: string }
        | null;
      if (row && row.phase === 'lobby' && row.host_id !== playerId) {
        await client
          .from('room_players')
          .delete()
          .eq('room_id', roomId)
          .eq('user_id', playerId);
      }
    } catch {
      // Saída em best-effort: não bloqueia o retorno do jogador ao Hub.
    }
  }

  async updateAdedonhaColumns(
    roomId: string,
    columns: string[]
  ): Promise<AdedonhaRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.updateAdedonhaColumns(roomId, columns);
    }

    try {
      const client = this.getClient();
      const { roomRow } = await this.fetchRawRoomState(roomId);
      const nextConfig: StoredRoomConfig = {
        ...(roomRow.config ?? {}),
        columns: [...columns],
      };

      const { error } = await client
        .from('rooms')
        .update({ config: nextConfig })
        .eq('id', roomId);

      if (error) {
        throw new DataSourceError('Falha ao atualizar colunas da sala.');
      }
      return await this.loadRoomSnapshot(roomId);
    } catch (err: unknown) {
      return this.wrapError(err, 'Falha ao atualizar colunas da sala.');
    }
  }

  async updateAdedonhaConfig(
    roomId: string,
    partialConfig: Partial<Omit<AdedonhaConfig, 'columns'>>
  ): Promise<AdedonhaRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.updateAdedonhaConfig(roomId, partialConfig);
    }

    try {
      const client = this.getClient();
      const { roomRow } = await this.fetchRawRoomState(roomId);
      const nextConfig: StoredRoomConfig = {
        ...(roomRow.config ?? {}),
        ...partialConfig,
      };

      const { error } = await client
        .from('rooms')
        .update({ config: nextConfig })
        .eq('id', roomId);

      if (error) {
        throw new DataSourceError('Falha ao atualizar configurações da sala.');
      }
      return await this.loadRoomSnapshot(roomId);
    } catch (err: unknown) {
      return this.wrapError(err, 'Falha ao atualizar configurações da sala.');
    }
  }

  async spinAlphabetRoulette(
    roomId: string,
    drawnLetter: string
  ): Promise<AdedonhaRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.spinAlphabetRoulette(roomId, drawnLetter);
    }

    try {
      const client = this.getClient();
      const { roomRow } = await this.fetchRawRoomState(roomId);
      const upper = drawnLetter.trim().toUpperCase();
      const prevConfig = roomRow.config ?? {};
      const prevUsed = prevConfig.usedLetters ?? [];
      const updatedUsed = prevUsed.includes(upper)
        ? [...prevUsed]
        : [...prevUsed, upper];

      const nextConfig: StoredRoomConfig = {
        ...prevConfig,
        usedLetters: updatedUsed,
        currentTallyColumnIndex: 0,
        stopTriggeredBy: null,
      };

      const { error } = await client
        .from('rooms')
        .update({
          phase: 'roulette',
          status: 'playing',
          current_letter: upper,
          config: nextConfig,
        })
        .eq('id', roomId);

      if (error) {
        throw new DataSourceError('Falha ao registrar letra sorteada.');
      }
      return await this.loadRoomSnapshot(roomId);
    } catch (err: unknown) {
      return this.wrapError(err, 'Falha ao registrar letra sorteada.');
    }
  }

  async openRoundFilling(
    roomId: string,
    expectedPhase?: AdedonhaPhase
  ): Promise<AdedonhaRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.openRoundFilling(roomId, expectedPhase);
    }

    try {
      const client = this.getClient();
      const { roomRow } = await this.fetchRawRoomState(roomId);
      const duration = roomRow.config?.roundDurationSeconds ?? 90;
      const phaseEndsAt = new Date(Date.now() + duration * 1000).toISOString();

      let query = client
        .from('rooms')
        .update({ phase: 'filling', status: 'playing', phase_ends_at: phaseEndsAt })
        .eq('id', roomId);
      if (expectedPhase) {
        query = query.eq('phase', expectedPhase);
      }
      const { error } = await query;

      if (error) {
        throw new DataSourceError('Falha ao iniciar preenchimento da rodada.');
      }
      return await this.loadRoomSnapshot(roomId);
    } catch (err: unknown) {
      return this.wrapError(err, 'Falha ao iniciar preenchimento da rodada.');
    }
  }

  async submitPlayerAnswers(
    roomId: string,
    playerId: string,
    answers: Record<string, string>
  ): Promise<AdedonhaRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.submitPlayerAnswers(
        roomId,
        playerId,
        answers
      );
    }

    try {
      const client = this.getClient();
      const { roomRow } = await this.fetchRawRoomState(roomId);
      const columns = roomRow.config?.columns ?? [...DEFAULT_COLUMNS];

      const { error: deleteError } = await client
        .from('adedonha_submissions')
        .delete()
        .eq('room_id', roomId)
        .eq('round_number', roomRow.current_round)
        .eq('user_id', playerId);

      if (deleteError) {
        throw new DataSourceError('Falha ao limpar respostas anteriores.');
      }

      const rowsToInsert = columns.map((columnName) => ({
        room_id: roomId,
        round_number: roomRow.current_round,
        user_id: playerId,
        column_name: columnName,
        answer_text: (answers[columnName] ?? '').trim(),
        status: 'pending',
        doubt_count: 0,
        points: 0,
      }));

      if (rowsToInsert.length > 0) {
        const { error: insertError } = await client
          .from('adedonha_submissions')
          .insert(rowsToInsert);

        if (insertError) {
          throw new DataSourceError('Falha ao enviar respostas da rodada.');
        }
      }

      return await this.loadRoomSnapshot(roomId);
    } catch (err: unknown) {
      return this.wrapError(err, 'Falha ao enviar respostas da rodada.');
    }
  }

  async triggerAdedonhaStop(
    roomId: string,
    playerId: string
  ): Promise<AdedonhaRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.triggerAdedonhaStop(roomId, playerId);
    }

    try {
      const client = this.getClient();
      const { roomRow, playerRows } = await this.fetchRawRoomState(roomId);
      const player = playerRows.find((p) => p.user_id === playerId);
      if (!player) {
        throw new DataSourceError(
          'Jogador não encontrado para acionar ADEDONHA.'
        );
      }

      const prevConfig = roomRow.config ?? {};
      const prevCounts = prevConfig.stopCountsByUserId ?? {};
      const nextConfig: StoredRoomConfig = {
        ...prevConfig,
        stopTriggeredBy: player.nickname,
        stopCountsByUserId: {
          ...prevCounts,
          [playerId]: (prevCounts[playerId] ?? 0) + 1,
        },
      };

      const { error } = await client
        .from('rooms')
        .update({ phase: 'stop_countdown', config: nextConfig })
        .eq('id', roomId);

      if (error) {
        throw new DataSourceError('Falha ao registrar pedido de ADEDONHA.');
      }
      return await this.loadRoomSnapshot(roomId);
    } catch (err: unknown) {
      return this.wrapError(err, 'Falha ao registrar pedido de ADEDONHA.');
    }
  }

  async startTallyPhase(
    roomId: string,
    classifiedSubmissions: AdedonhaSubmission[],
    expectedPhase?: AdedonhaPhase
  ): Promise<AdedonhaRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.startTallyPhase(
        roomId,
        classifiedSubmissions,
        expectedPhase
      );
    }

    try {
      const client = this.getClient();
      const { roomRow } = await this.fetchRawRoomState(roomId);

      for (const sub of classifiedSubmissions) {
        if (sub.roundNumber !== roomRow.current_round) continue;
        const { error } = await client
          .from('adedonha_submissions')
          .update({ status: sub.status, points: sub.points })
          .eq('id', sub.id);

        if (error) {
          throw new DataSourceError(
            'Falha ao salvar pré-classificação da rodada.'
          );
        }
      }

      await this.recalculateAndPersistScores(roomId);

      const nextConfig: StoredRoomConfig = {
        ...(roomRow.config ?? {}),
        currentTallyColumnIndex: 0,
      };

      const { error: roomError } = await client
        .from('rooms')
        .update({ phase: 'tally', config: nextConfig })
        .eq('id', roomId);

      if (roomError) {
        throw new DataSourceError('Falha ao iniciar fase de apuração.');
      }
      return await this.loadRoomSnapshot(roomId);
    } catch (err: unknown) {
      return this.wrapError(err, 'Falha ao iniciar fase de apuração.');
    }
  }

  async raiseDoubt(roomId: string, submissionId: string): Promise<AdedonhaRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.raiseDoubt(roomId, submissionId);
    }

    try {
      const client = this.getClient();
      const { submissionRows } = await this.fetchRawRoomState(roomId);
      const target = submissionRows.find((s) => s.id === submissionId);
      if (!target) {
        throw new DataSourceError(
          'Submissão não encontrada para levantar dúvida.'
        );
      }

      const { error } = await client
        .from('adedonha_submissions')
        .update({ doubt_count: target.doubt_count + 1 })
        .eq('id', submissionId);

      if (error) {
        throw new DataSourceError('Falha ao registrar dúvida na resposta.');
      }
      return await this.loadRoomSnapshot(roomId);
    } catch (err: unknown) {
      return this.wrapError(err, 'Falha ao registrar dúvida na resposta.');
    }
  }

  async judgeSubmission(
    roomId: string,
    submissionId: string,
    verdict: AdedonhaTallyVerdict,
    points: number
  ): Promise<AdedonhaRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.judgeSubmission(
        roomId,
        submissionId,
        verdict,
        points
      );
    }

    try {
      const client = this.getClient();
      const { error } = await client
        .from('adedonha_submissions')
        .update({ status: verdict, points })
        .eq('id', submissionId);

      if (error) {
        throw new DataSourceError('Falha ao registrar veredito do Moderador.');
      }

      await this.recalculateAndPersistScores(roomId);
      return await this.loadRoomSnapshot(roomId);
    } catch (err: unknown) {
      return this.wrapError(err, 'Falha ao registrar veredito do Moderador.');
    }
  }

  async advanceTallyColumn(roomId: string): Promise<AdedonhaRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.advanceTallyColumn(roomId);
    }

    try {
      const client = this.getClient();
      const { roomRow } = await this.fetchRawRoomState(roomId);
      const prevConfig = roomRow.config ?? {};
      const columns = prevConfig.columns ?? [...DEFAULT_COLUMNS];
      const currentIndex = prevConfig.currentTallyColumnIndex ?? 0;
      const nextIndex = currentIndex + 1;

      if (nextIndex < columns.length) {
        const nextConfig: StoredRoomConfig = {
          ...prevConfig,
          currentTallyColumnIndex: nextIndex,
        };
        const { error } = await client
          .from('rooms')
          .update({ config: nextConfig })
          .eq('id', roomId);

        if (error) {
          throw new DataSourceError('Falha ao avançar para a próxima coluna.');
        }
        return await this.loadRoomSnapshot(roomId);
      }

      const totalRounds = prevConfig.totalRounds ?? 5;
      const isLastRound = roomRow.current_round >= totalRounds;
      const { error } = await client
        .from('rooms')
        .update({
          phase: isLastRound ? 'finished' : 'round_summary',
          status: isLastRound ? 'finished' : 'playing',
        })
        .eq('id', roomId);

      if (error) {
        throw new DataSourceError('Falha ao encerrar apuração da rodada.');
      }
      return await this.loadRoomSnapshot(roomId);
    } catch (err: unknown) {
      return this.wrapError(err, 'Falha ao avançar para a próxima coluna.');
    }
  }

  async advanceToNextRound(
    roomId: string,
    expectedPhase?: AdedonhaPhase
  ): Promise<AdedonhaRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.advanceToNextRound(roomId, expectedPhase);
    }

    try {
      const client = this.getClient();
      const { roomRow } = await this.fetchRawRoomState(roomId);
      const prevConfig = roomRow.config ?? {};
      const totalRounds = prevConfig.totalRounds ?? 5;

      if (roomRow.current_round >= totalRounds) {
        const { error } = await client
          .from('rooms')
          .update({ phase: 'finished', status: 'finished' })
          .eq('id', roomId);

        if (error) {
          throw new DataSourceError('Falha ao finalizar partida.');
        }
        return await this.loadRoomSnapshot(roomId);
      }

      const nextConfig: StoredRoomConfig = {
        ...prevConfig,
        currentTallyColumnIndex: 0,
        stopTriggeredBy: null,
      };

      const { error } = await client
        .from('rooms')
        .update({
          phase: 'lobby',
          status: 'lobby',
          current_round: roomRow.current_round + 1,
          current_letter: null,
          config: nextConfig,
        })
        .eq('id', roomId);

      if (error) {
        throw new DataSourceError('Falha ao iniciar próxima rodada.');
      }
      return await this.loadRoomSnapshot(roomId);
    } catch (err: unknown) {
      return this.wrapError(err, 'Falha ao iniciar próxima rodada.');
    }
  }

  private mapRowToCidadeDormeRoom(
    row: {
      id: string;
      code: string;
      host_id: string;
      phase: string;
      version?: number;
      current_round: number;
      phase_ends_at?: string | null;
      narrator_caption?: string | null;
      config: Record<string, unknown> | null;
    },
    playerRows: DbRoomPlayerRow[] = [],
    secretRows: DbCidadeDormeSecretRow[] = [],
    actionRows: DbCidadeDormeActionRow[] = [],
    viewerId: string | null = null,
    allyAssassinIdsFromRpc: string[] = []
  ): CidadeDormeRoom {
    const raw = (row.config ?? {}) as Partial<CidadeDormeRoom> & {
      config?: CidadeDormeConfig;
      removedPlayerIds?: unknown;
    };
    const removedPlayerIdSet = new Set(
      Array.isArray(raw.removedPlayerIds)
        ? raw.removedPlayerIds.filter(
            (id): id is string => typeof id === 'string'
          )
        : []
    );
    const activePlayerRows = playerRows.filter(
      (pRow) => !removedPlayerIdSet.has(pRow.user_id)
    );
    const defaultCfg: CidadeDormeConfig = {
      narratorVoice: 'masculina',
      assassinCount: 1,
      dayDebateSeconds: 120,
      nightTurnSeconds: 15,
      revealRoleOnDeath: true,
    };

    const resolvedConfig: CidadeDormeConfig = {
      ...defaultCfg,
      ...(raw.config ?? {}),
    };
    const phase = (row.phase || raw.phase || 'lobby') as CidadeDormeRoom['phase'];
    const currentRound = row.current_round ?? raw.currentRound ?? 1;
    const isFinished = phase === 'finished';

    const secretByUserId = new Map(secretRows.map((s) => [s.user_id, s]));
    const readyUserIds = new Set(
      actionRows
        .filter((a) => a.round_number === currentRound && a.kind === 'ready')
        .map((a) => a.user_id)
    );
    const votedUserIds = new Set(
      actionRows
        .filter((a) => a.round_number === currentRound && a.kind === 'vote')
        .map((a) => a.user_id)
    );

    const revealedDeadRoles = new Map<string, CidadeDormeRole>();
    if (resolvedConfig.revealRoleOnDeath) {
      if (raw.dawnReport?.eliminatedPlayerId && raw.dawnReport.eliminatedRole) {
        revealedDeadRoles.set(
          raw.dawnReport.eliminatedPlayerId,
          raw.dawnReport.eliminatedRole
        );
      }
      if (raw.voteReport?.eliminatedPlayerId && raw.voteReport.eliminatedRole) {
        revealedDeadRoles.set(
          raw.voteReport.eliminatedPlayerId,
          raw.voteReport.eliminatedRole
        );
      }
    }

    const mergedPlayers: CidadeDormeRoom['players'] = activePlayerRows.map(
      (pRow) => {
      const isAlive = pRow.is_alive ?? true;
      const isReady =
        Boolean(pRow.is_ready) ||
        (phase === 'role_reveal' && readyUserIds.has(pRow.user_id));
      const hasVoted =
        Boolean(pRow.has_voted) ||
        (phase === 'day_voting' && votedUserIds.has(pRow.user_id));

      const secret = secretByUserId.get(pRow.user_id);
      const canSeeRole =
        isFinished ||
        (viewerId !== null && pRow.user_id === viewerId) ||
        (!isAlive && resolvedConfig.revealRoleOnDeath);

      const resolvedRole: CidadeDormeRole | null = canSeeRole
        ? secret?.secret_role ?? revealedDeadRoles.get(pRow.user_id) ?? null
        : null;

      return {
        id: pRow.user_id,
        nickname: pRow.nickname,
        isHost: pRow.is_host || pRow.user_id === row.host_id,
        isAlive,
        isReady,
        role: resolvedRole,
        hasVoted,
      };
    });

    const viewerSecret = viewerId ? secretByUserId.get(viewerId) : undefined;
    const isViewerAssassin = viewerSecret?.secret_role === 'assassino';
    const isViewerDetective = viewerSecret?.secret_role === 'detetive';

    const allyAssassinSet = new Set<string>();
    if (isViewerAssassin) {
      for (const allyId of allyAssassinIdsFromRpc) {
        if (allyId !== viewerId) {
          allyAssassinSet.add(allyId);
        }
      }
      for (const secret of secretRows) {
        if (secret.secret_role === 'assassino' && secret.user_id !== viewerId) {
          allyAssassinSet.add(secret.user_id);
        }
      }
    }

    const rawVerdict = isViewerDetective
      ? viewerSecret?.detective_verdict ?? null
      : null;
    const detectiveVerdict =
      rawVerdict && rawVerdict.roundNumber === currentRound
        ? { ...rawVerdict }
        : null;

    return {
      id: row.id,
      code: row.code,
      gameType: 'cidade-dorme',
      hostId: row.host_id,
      phase,
      version: row.version ?? 0,
      config: resolvedConfig,
      currentRound,
      phaseEndsAt:
        row.phase_ends_at ??
        (typeof raw.phaseEndsAt === 'string' ? raw.phaseEndsAt : null),
      narratorCaption:
        row.narrator_caption ??
        raw.narratorCaption ??
        'Sala pronta no Lobby.',
      players: mergedPlayers,
      allyAssassinIds: Array.from(allyAssassinSet),
      nightTargetId: null,
      nightProtectedId: null,
      detectiveVerdict,
      votesByPlayerId: {},
      dawnReport: raw.dawnReport ? { ...raw.dawnReport } : null,
      voteReport: raw.voteReport
        ? {
            ...raw.voteReport,
            voteCounts: { ...raw.voteReport.voteCounts },
          }
        : null,
      winner: raw.winner ?? null,
    };
  }

  private notifyCidadeDormeRoomBroadcast(roomId: string): void {
    try {
      const channel = this.activeChannels.get(`cidade-dorme-room-${roomId}`) as
        | {
            send?: (payload: {
              type: 'broadcast';
              event: string;
              payload: Record<string, unknown>;
            }) => unknown;
          }
        | undefined;
      if (channel && typeof channel.send === 'function') {
        void channel.send({
          type: 'broadcast',
          event: 'room_updated',
          payload: { roomId },
        });
      }
    } catch {
      // Falha transitória no broadcast não bloqueia a persistência via Postgres Changes.
    }
  }

  private async invokeCidadeDormeRpc(
    fnName: string,
    params: Record<string, unknown>,
    fallbackMessage: string
  ): Promise<void> {
    const client = this.getClient();
    if (typeof client.rpc !== 'function') {
      throw new DataSourceError(
        `Função RPC ${fnName} não configurada no cliente Supabase.`
      );
    }
    const { error } = await client.rpc(fnName, params);
    if (error) {
      if (error.code === 'P0001') {
        throw new ValidationError(error.message || fallbackMessage);
      }
      throw new DataSourceError(error.message || fallbackMessage);
    }
  }

  async getCidadeDormeRoom(
    roomId?: string,
    viewerPlayerId?: string
  ): Promise<CidadeDormeRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      try {
        return await this.delegateService.getCidadeDormeRoom(
          roomId,
          viewerPlayerId
        );
      } catch (err: unknown) {
        return this.wrapError(
          err,
          'Falha ao sincronizar sala de Cidade Dorme no Supabase.'
        );
      }
    }

    const targetId = roomId ?? this.activeRoomId;
    if (!targetId) {
      throw new DataSourceError(
        'Nenhuma sala de Cidade Dorme ativa. Crie uma sala ou informe o PIN.'
      );
    }

    try {
      const client = this.getClient();
      const authenticatedUserId = await this.ensureAuthenticatedUserId();
      const effectiveViewerId = viewerPlayerId ?? authenticatedUserId;

      const { data, error } = await client
        .from('rooms')
        .select(
          'id, code, host_id, phase, version, current_round, phase_ends_at, narrator_caption, config'
        )
        .eq('id', targetId)
        .single();

      if (error || !data) {
        throw new DataSourceError(
          'Sala de Cidade Dorme não encontrada no Supabase.'
        );
      }

      const { data: playersData, error: playersError } = await client
        .from('room_players')
        .select(
          'id, room_id, user_id, nickname, is_host, is_alive, is_ready, has_voted, score'
        )
        .eq('room_id', targetId);

      if (playersError) {
        throw new DataSourceError(
          'Erro ao carregar jogadores da sala de Cidade Dorme.'
        );
      }

      const { data: secretsData } = await client
        .from('cidade_dorme_secrets')
        .select('room_id, user_id, secret_role, detective_verdict')
        .eq('room_id', targetId);

      const { data: actionsData } = await client
        .from('cidade_dorme_actions')
        .select('id, room_id, round_number, user_id, kind, target_id, created_at')
        .eq('room_id', targetId);

      const secretRows = (secretsData ?? []) as DbCidadeDormeSecretRow[];
      const viewerSecret = secretRows.find((s) => s.user_id === effectiveViewerId);

      let allyAssassinsFromRpc: string[] = [];
      if (
        viewerSecret?.secret_role === 'assassino' &&
        typeof client.rpc === 'function'
      ) {
        const { data: allyData, error: allyError } = await client.rpc(
          'cidade_dorme_get_ally_assassins',
          { p_room_id: targetId }
        );
        if (!allyError && Array.isArray(allyData)) {
          allyAssassinsFromRpc = allyData.filter(
            (item): item is string => typeof item === 'string'
          );
        }
      }

      this.activeRoomId = targetId;
      return this.mapRowToCidadeDormeRoom(
        data as {
          id: string;
          code: string;
          host_id: string;
          phase: string;
          version?: number;
          current_round: number;
          phase_ends_at?: string | null;
          narrator_caption?: string | null;
          config: Record<string, unknown> | null;
        },
        (playersData ?? []) as DbRoomPlayerRow[],
        secretRows,
        (actionsData ?? []) as DbCidadeDormeActionRow[],
        effectiveViewerId,
        allyAssassinsFromRpc
      );
    } catch (err: unknown) {
      return this.wrapError(
        err,
        'Falha ao sincronizar sala de Cidade Dorme no Supabase.'
      );
    }
  }

  async createCidadeDormeRoom(hostNickname: string): Promise<CidadeDormeRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      try {
        return await this.delegateService.createCidadeDormeRoom(hostNickname);
      } catch (err: unknown) {
        return this.wrapError(
          err,
          'Não foi possível criar sala de Cidade Dorme no Supabase.'
        );
      }
    }

    try {
      const client = this.getClient();
      const userId = await this.ensureAuthenticatedUserId();
      const code = generatePinCode();
      const cleanHost = hostNickname.trim();
      const initialConfig: CidadeDormeConfig = {
        narratorVoice: 'masculina',
        assassinCount: 1,
        dayDebateSeconds: 120,
        nightTurnSeconds: 15,
        revealRoleOnDeath: true,
      };
      const storedPayload = {
        config: initialConfig,
        phaseEndsAt: null,
        narratorCaption:
          'Sala criada! Escolha a voz do Narrador e aguarde os jogadores.',
        dawnReport: null,
        voteReport: null,
        winner: null,
      };

      const { data: created, error } = await client
        .from('rooms')
        .insert({
          code,
          game_type: 'cidade-dorme',
          host_id: userId,
          status: 'lobby',
          phase: 'lobby',
          current_round: 1,
          phase_ends_at: null,
          narrator_caption: storedPayload.narratorCaption,
          config: storedPayload,
        })
        .select('id')
        .single();

      if (error || !created) {
        throw new DataSourceError(
          'Não foi possível criar a sala de Cidade Dorme no Supabase.'
        );
      }

      const roomId = (created as { id: string }).id;
      const { error: playerError } = await client.from('room_players').insert({
        room_id: roomId,
        user_id: userId,
        nickname: cleanHost,
        is_host: true,
        is_alive: true,
        is_ready: false,
        has_voted: false,
        score: 0,
      });

      if (playerError) {
        throw new DataSourceError(
          'Sala criada, mas falhou ao registrar o Moderador.'
        );
      }

      this.activeRoomId = roomId;
      return await this.getCidadeDormeRoom(roomId);
    } catch (err: unknown) {
      return this.wrapError(
        err,
        'Não foi possível criar sala de Cidade Dorme no Supabase.'
      );
    }
  }

  async joinCidadeDormeRoom(
    code: string,
    nickname: string
  ): Promise<CidadeDormeRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      try {
        return await this.delegateService.joinCidadeDormeRoom(code, nickname);
      } catch (err: unknown) {
        return this.wrapError(
          err,
          'Não foi possível entrar na sala de Cidade Dorme.'
        );
      }
    }

    try {
      const client = this.getClient();
      let userId = await this.ensureAuthenticatedUserId();
      const normalizedCode = code.trim().toUpperCase();
      const cleanNickname = nickname.trim();

      const { data: roomData, error } = await client
        .from('rooms')
        .select(
          'id, code, host_id, phase, current_round, narrator_caption, config'
        )
        .eq('code', normalizedCode)
        .eq('game_type', 'cidade-dorme')
        .single();

      if (error || !roomData) {
        throw new DataSourceError(
          'Código de sala do Cidade Dorme não encontrado.'
        );
      }

      const targetRoom = roomData as {
        id: string;
        code: string;
        host_id: string;
        phase: string;
        current_round: number;
        narrator_caption?: string | null;
        config: Record<string, unknown> | null;
      };

      const { data: playersData, error: playersError } = await client
        .from('room_players')
        .select('id, room_id, user_id, nickname, is_host, score')
        .eq('room_id', targetRoom.id);

      if (playersError) {
        throw new DataSourceError(
          'Erro ao verificar jogadores da sala de Cidade Dorme.'
        );
      }

      const existingRows = (playersData ?? []) as DbRoomPlayerRow[];
      const rawRoomConfig = (targetRoom.config ?? {}) as Record<string, unknown>;
      const prevRemovedIds = Array.isArray(rawRoomConfig.removedPlayerIds)
        ? rawRoomConfig.removedPlayerIds.filter(
            (id): id is string => typeof id === 'string'
          )
        : [];
      const removedIdSet = new Set(prevRemovedIds);

      let sameUserRow = existingRows.find((p) => p.user_id === userId);
      const duplicateNickRow = existingRows.find(
        (p) =>
          p.user_id !== userId &&
          !removedIdSet.has(p.user_id) &&
          p.nickname.trim().toLowerCase() === cleanNickname.toLowerCase()
      );

      if (duplicateNickRow) {
        throw new ValidationError(
          'Já existe um participante com este apelido na sala. Escolha outro nome.'
        );
      }

      if (
        sameUserRow &&
        !removedIdSet.has(userId) &&
        sameUserRow.nickname.trim().toLowerCase() !==
          cleanNickname.toLowerCase()
      ) {
        // Evita que uma aba duplicada no navegador Web sobrescreva o líder/outro jogador.
        userId = await this.rotateAnonymousUserId();
        sameUserRow = undefined;
      }

      if (sameUserRow) {
        if (removedIdSet.has(userId) && targetRoom.phase !== 'lobby') {
          throw new ValidationError(
            'A partida já começou. Novos jogadores só podem entrar no Lobby.'
          );
        }
        if (
          sameUserRow.nickname.trim().toLowerCase() !==
          cleanNickname.toLowerCase()
        ) {
          const { error: updateError } = await client
            .from('room_players')
            .update({ nickname: cleanNickname })
            .eq('room_id', targetRoom.id)
            .eq('user_id', userId);

          if (updateError) {
            throw new DataSourceError(
              'Não foi possível atualizar seu apelido na sala.'
            );
          }
        }
      } else {
        if (targetRoom.phase !== 'lobby') {
          throw new ValidationError(
            'A partida já começou. Novos jogadores só podem entrar no Lobby.'
          );
        }
        const { error: insertError } = await client.from('room_players').insert({
          room_id: targetRoom.id,
          user_id: userId,
          nickname: cleanNickname,
          is_host: targetRoom.host_id === userId,
          is_alive: true,
          is_ready: false,
          has_voted: false,
          score: 0,
        });

        if (insertError) {
          throw new DataSourceError(
            'Não foi possível entrar na sala de Cidade Dorme.'
          );
        }
      }

      if (removedIdSet.has(userId)) {
        const nextRemovedIds = prevRemovedIds.filter((id) => id !== userId);
        await client
          .from('rooms')
          .update({
            config: {
              ...rawRoomConfig,
              removedPlayerIds: nextRemovedIds,
            },
          })
          .eq('id', targetRoom.id);
      }

      this.activeRoomId = targetRoom.id;
      const snapshot = await this.getCidadeDormeRoom(targetRoom.id);
      this.notifyCidadeDormeRoomBroadcast(targetRoom.id);
      return snapshot;
    } catch (err: unknown) {
      return this.wrapError(
        err,
        'Não foi possível entrar na sala de Cidade Dorme.'
      );
    }
  }

  async leaveCidadeDormeRoom(roomId: string, playerId: string): Promise<void> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.leaveCidadeDormeRoom(roomId, playerId);
    }

    if (this.activeRoomId === roomId) {
      this.activeRoomId = null;
    }

    try {
      const client = this.getClient();
      const { data: roomData } = await client
        .from('rooms')
        .select('id, host_id, phase, config')
        .eq('id', roomId)
        .single();

      const row = roomData as
        | {
            id: string;
            host_id: string;
            phase: string;
            config?: Record<string, unknown> | null;
          }
        | null;
      const prevCfg = row?.config ?? {};
      const prevRemoved = Array.isArray(prevCfg.removedPlayerIds)
        ? prevCfg.removedPlayerIds.filter(
            (id): id is string => typeof id === 'string'
          )
        : [];
      const wasRemovedByHost = prevRemoved.includes(playerId);

      if (
        row &&
        row.host_id !== playerId &&
        (row.phase === 'lobby' || wasRemovedByHost)
      ) {
        if (row.phase === 'lobby' && !wasRemovedByHost) {
          await client
            .from('rooms')
            .update({
              config: {
                ...prevCfg,
                removedPlayerIds: [...prevRemoved, playerId],
              },
            })
            .eq('id', roomId);
        }

        await client
          .from('room_players')
          .delete()
          .eq('room_id', roomId)
          .eq('user_id', playerId);

        this.notifyCidadeDormeRoomBroadcast(roomId);
      }
    } catch {
      // Saída em best-effort: não bloqueia o retorno do jogador ao Hub.
    }
  }

  async updateCidadeDormeConfig(
    roomId: string,
    partialConfig: Partial<CidadeDormeConfig>
  ): Promise<CidadeDormeRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.updateCidadeDormeConfig(roomId, partialConfig);
    }

    const current = await this.getCidadeDormeRoom(roomId);
    return this.saveCidadeDormeRoom({
      ...current,
      config: {
        ...current.config,
        ...partialConfig,
      },
    });
  }

  async saveCidadeDormeRoom(room: CidadeDormeRoom): Promise<CidadeDormeRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.saveCidadeDormeRoom(room);
    }

    try {
      const client = this.getClient();
      const nextStatus =
        room.phase === 'lobby'
          ? 'lobby'
          : room.phase === 'finished'
          ? 'finished'
          : 'playing';

      const [{ data: existingRoomRow }, { data: existingPlayerRows }] =
        await Promise.all([
          client.from('rooms').select('config').eq('id', room.id).single(),
          client
            .from('room_players')
            .select('user_id')
            .eq('room_id', room.id),
        ]);

      const keepPlayerIds = new Set(room.players.map((p) => p.id));
      const existingConfig =
        ((existingRoomRow as { config?: Record<string, unknown> | null } | null)
          ?.config ?? {}) as Record<string, unknown>;
      const prevRemovedIds = Array.isArray(existingConfig.removedPlayerIds)
        ? existingConfig.removedPlayerIds.filter(
            (id): id is string =>
              typeof id === 'string' && !keepPlayerIds.has(id)
          )
        : [];
      const removedSet = new Set(prevRemovedIds);

      const playerRowsToDelete: string[] = [];
      for (const existingRow of (existingPlayerRows ?? []) as Array<{
        user_id: string;
      }>) {
        if (!keepPlayerIds.has(existingRow.user_id)) {
          removedSet.add(existingRow.user_id);
          playerRowsToDelete.push(existingRow.user_id);
        }
      }

      // RNF11: Nunca gravar papéis, alvos noturnos, proteção, veredito ou votos individuais em rooms.config
      const storedPayload: Record<string, unknown> = {
        config: room.config,
        phaseEndsAt: room.phaseEndsAt ?? null,
        narratorCaption: room.narratorCaption,
        dawnReport: room.dawnReport,
        voteReport: room.voteReport,
        winner: room.winner,
      };
      if (removedSet.size > 0) {
        storedPayload.removedPlayerIds = Array.from(removedSet);
      }

      const { error } = await client
        .from('rooms')
        .update({
          phase: room.phase,
          status: nextStatus,
          current_round: room.currentRound,
          phase_ends_at: room.phaseEndsAt ?? null,
          narrator_caption: room.narratorCaption,
          config: storedPayload,
        })
        .eq('id', room.id);

      if (error) {
        throw new DataSourceError(
          'Falha ao salvar o estado da sala de Cidade Dorme.'
        );
      }

      for (const removedUserId of playerRowsToDelete) {
        await client
          .from('room_players')
          .delete()
          .eq('room_id', room.id)
          .eq('user_id', removedUserId);
      }

      for (const player of room.players) {
        await client
          .from('room_players')
          .update({
            is_alive: player.isAlive,
            is_ready: player.isReady,
            has_voted: player.hasVoted,
          })
          .eq('room_id', room.id)
          .eq('user_id', player.id);
      }

      this.activeRoomId = room.id;
      const snapshot = await this.getCidadeDormeRoom(room.id);
      this.notifyCidadeDormeRoomBroadcast(room.id);
      return snapshot;
    } catch (err: unknown) {
      return this.wrapError(
        err,
        'Falha ao salvar o estado da sala de Cidade Dorme.'
      );
    }
  }

  async startCidadeDormeMatch(
    roomId: string,
    assignedRolesByPlayerId: Record<string, CidadeDormeRole>,
    narratorCaption: string
  ): Promise<CidadeDormeRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.startCidadeDormeMatch(
        roomId,
        assignedRolesByPlayerId,
        narratorCaption
      );
    }

    try {
      await this.ensureAuthenticatedUserId();
      const client = this.getClient();

      const [{ data: roomCfgRow }, { data: currentDbPlayers }] =
        await Promise.all([
          client.from('rooms').select('config').eq('id', roomId).single(),
          client.from('room_players').select('user_id').eq('room_id', roomId),
        ]);

      const rawConfig =
        ((roomCfgRow as { config?: Record<string, unknown> | null } | null)
          ?.config ?? {}) as Record<string, unknown>;
      const prevRemovedIds = Array.isArray(rawConfig.removedPlayerIds)
        ? rawConfig.removedPlayerIds.filter(
            (id): id is string =>
              typeof id === 'string' &&
              !Object.prototype.hasOwnProperty.call(assignedRolesByPlayerId, id)
          )
        : [];
      const removedSet = new Set(prevRemovedIds);

      const safeAssignedRoles: Record<string, CidadeDormeRole> = {
        ...assignedRolesByPlayerId,
      };
      const orphanUserIds: string[] = [];

      for (const row of (currentDbPlayers ?? []) as Array<{ user_id: string }>) {
        if (
          !Object.prototype.hasOwnProperty.call(
            assignedRolesByPlayerId,
            row.user_id
          )
        ) {
          orphanUserIds.push(row.user_id);
          removedSet.add(row.user_id);
        }
      }

      for (const orphanId of orphanUserIds) {
        await client
          .from('room_players')
          .delete()
          .eq('room_id', roomId)
          .eq('user_id', orphanId);
      }

      const { data: remainingDbPlayers } = await client
        .from('room_players')
        .select('user_id')
        .eq('room_id', roomId);
      const remainingRemovedIds: string[] = [];

      for (const row of (remainingDbPlayers ?? []) as Array<{
        user_id: string;
      }>) {
        if (
          !Object.prototype.hasOwnProperty.call(safeAssignedRoles, row.user_id)
        ) {
          safeAssignedRoles[row.user_id] = 'cidadao';
          if (removedSet.has(row.user_id)) {
            remainingRemovedIds.push(row.user_id);
          }
        }
      }

      await this.invokeCidadeDormeRpc(
        'cidade_dorme_start_match',
        {
          p_room_id: roomId,
          p_assigned_roles: safeAssignedRoles,
          p_narrator_caption: narratorCaption,
        },
        'Não foi possível distribuir os papéis da partida.'
      );

      if (remainingRemovedIds.length > 0) {
        const { data: updatedRoomRow } = await client
          .from('rooms')
          .select('config')
          .eq('id', roomId)
          .single();
        const updatedConfig =
          ((
            updatedRoomRow as { config?: Record<string, unknown> | null } | null
          )?.config ?? {}) as Record<string, unknown>;
        await client
          .from('rooms')
          .update({
            config: {
              ...updatedConfig,
              removedPlayerIds: remainingRemovedIds,
            },
          })
          .eq('id', roomId);

        for (const removedId of remainingRemovedIds) {
          await client
            .from('room_players')
            .update({
              is_alive: false,
              is_ready: true,
              has_voted: true,
            })
            .eq('room_id', roomId)
            .eq('user_id', removedId);
        }
      }

      this.activeRoomId = roomId;
      const snapshot = await this.getCidadeDormeRoom(roomId);
      this.notifyCidadeDormeRoomBroadcast(roomId);
      return snapshot;
    } catch (err: unknown) {
      return this.wrapError(
        err,
        'Não foi possível distribuir os papéis da partida.'
      );
    }
  }

  async markCidadeDormePlayerReady(
    roomId: string,
    playerId: string,
    options?: {
      markCompanionsReady?: boolean;
      nightTurnEndsAt?: string | null;
      nightCaption?: string;
    }
  ): Promise<CidadeDormeRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.markCidadeDormePlayerReady(
        roomId,
        playerId,
        options
      );
    }

    try {
      await this.ensureAuthenticatedUserId();
      await this.invokeCidadeDormeRpc(
        'cidade_dorme_mark_ready',
        {
          p_room_id: roomId,
          p_mark_all: Boolean(options?.markCompanionsReady),
          p_night_turn_ends_at: options?.nightTurnEndsAt ?? null,
          p_night_caption: options?.nightCaption ?? null,
        },
        'Não foi possível confirmar visualização do papel.'
      );
      this.activeRoomId = roomId;
      let snapshot = await this.getCidadeDormeRoom(roomId, playerId);
      if (
        snapshot.phase === 'role_reveal' &&
        snapshot.players.length > 0 &&
        snapshot.players.every((p) => p.isReady)
      ) {
        await this.invokeCidadeDormeRpc(
          'cidade_dorme_mark_ready',
          {
            p_room_id: roomId,
            p_mark_all: true,
            p_night_turn_ends_at: options?.nightTurnEndsAt ?? null,
            p_night_caption: options?.nightCaption ?? null,
          },
          'Não foi possível confirmar visualização do papel.'
        );
        snapshot = await this.getCidadeDormeRoom(roomId, playerId);
      }
      this.notifyCidadeDormeRoomBroadcast(roomId);
      return snapshot;
    } catch (err: unknown) {
      return this.wrapError(
        err,
        'Não foi possível confirmar visualização do papel.'
      );
    }
  }

  async submitCidadeDormeNightAction(
    roomId: string,
    actorPlayerId: string,
    kind: 'night_assassin' | 'night_angel' | 'night_detective',
    targetPlayerId: string | null
  ): Promise<CidadeDormeRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.submitCidadeDormeNightAction(
        roomId,
        actorPlayerId,
        kind,
        targetPlayerId
      );
    }

    try {
      await this.ensureAuthenticatedUserId();
      await this.invokeCidadeDormeRpc(
        'cidade_dorme_submit_night_action',
        {
          p_room_id: roomId,
          p_kind: kind,
          p_target_id: targetPlayerId,
        },
        'Não foi possível registrar a ação noturna.'
      );
      this.activeRoomId = roomId;
      return await this.getCidadeDormeRoom(roomId, actorPlayerId);
    } catch (err: unknown) {
      return this.wrapError(err, 'Não foi possível registrar a ação noturna.');
    }
  }

  async submitCidadeDormeVote(
    roomId: string,
    voterPlayerId: string,
    targetPlayerIdOrSkip: string
  ): Promise<CidadeDormeRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.submitCidadeDormeVote(
        roomId,
        voterPlayerId,
        targetPlayerIdOrSkip
      );
    }

    try {
      await this.ensureAuthenticatedUserId();
      await this.invokeCidadeDormeRpc(
        'cidade_dorme_cast_vote',
        {
          p_room_id: roomId,
          p_target_id: targetPlayerIdOrSkip,
        },
        'Não foi possível registrar seu voto secreto.'
      );
      this.activeRoomId = roomId;
      const snapshot = await this.getCidadeDormeRoom(roomId, voterPlayerId);
      this.notifyCidadeDormeRoomBroadcast(roomId);
      return snapshot;
    } catch (err: unknown) {
      return this.wrapError(err, 'Não foi possível registrar seu voto secreto.');
    }
  }

  async resolveCidadeDormeDawn(
    roomId: string,
    options?: {
      debateEndsAt?: string | null;
    }
  ): Promise<CidadeDormeRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.resolveCidadeDormeDawn(roomId, options);
    }

    try {
      await this.ensureAuthenticatedUserId();
      await this.invokeCidadeDormeRpc(
        'cidade_dorme_resolve_dawn',
        {
          p_room_id: roomId,
          p_debate_ends_at: options?.debateEndsAt ?? null,
        },
        'Não foi possível apurar o amanhecer da cidade.'
      );
      this.activeRoomId = roomId;
      const snapshot = await this.getCidadeDormeRoom(roomId);
      this.notifyCidadeDormeRoomBroadcast(roomId);
      return snapshot;
    } catch (err: unknown) {
      return this.wrapError(
        err,
        'Não foi possível apurar o amanhecer da cidade.'
      );
    }
  }

  async tallyCidadeDormeVotes(roomId: string): Promise<CidadeDormeRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.tallyCidadeDormeVotes(roomId);
    }

    try {
      await this.ensureAuthenticatedUserId();
      await this.invokeCidadeDormeRpc(
        'cidade_dorme_tally_votes',
        {
          p_room_id: roomId,
        },
        'Não foi possível apurar os votos da cidade.'
      );
      this.activeRoomId = roomId;
      const snapshot = await this.getCidadeDormeRoom(roomId);
      this.notifyCidadeDormeRoomBroadcast(roomId);
      return snapshot;
    } catch (err: unknown) {
      return this.wrapError(err, 'Não foi possível apurar os votos da cidade.');
    }
  }

  subscribeToCidadeDormeRoom(
    roomId: string,
    onRoomUpdated: (room: CidadeDormeRoom) => void
  ): () => void {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.subscribeToCidadeDormeRoom(
        roomId,
        onRoomUpdated
      );
    }

    const client = this.getClient();
    const channelName = `cidade-dorme-room-${roomId}`;
    const previousChannel = this.activeChannels.get(channelName);
    if (previousChannel) {
      this.activeChannels.delete(channelName);
      void client.removeChannel(previousChannel);
    }

    let latestSeq = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    const clearReconnectTimer = () => {
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const refresh = () => {
      const seq = ++latestSeq;
      void this.getCidadeDormeRoom(roomId)
        .then((snapshot) => {
          if (seq === latestSeq) {
            onRoomUpdated(snapshot);
          }
        })
        .catch(() => {
          // Ignora falhas transitórias de rede em background.
        });
    };

    const channel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        refresh
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${roomId}`,
        },
        refresh
      )
      .on('broadcast', { event: 'room_updated' }, refresh)
      .subscribe((status?: string) => {
        if (status === 'SUBSCRIBED') {
          clearReconnectTimer();
          refresh();
          return;
        }
        if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT' ||
          status === 'CLOSED'
        ) {
          if (reconnectTimer === null) {
            reconnectTimer = setTimeout(() => {
              reconnectTimer = null;
              refresh();
            }, 1000);
          }
        }
      });

    this.activeChannels.set(channelName, channel);

    return () => {
      clearReconnectTimer();
      if (this.activeChannels.get(channelName) === channel) {
        this.activeChannels.delete(channelName);
      }
      void client.removeChannel(channel);
    };
  }

  private async broadcastDesenhoUpdate(roomId: string): Promise<void> {
    const channel = this.activeChannels.get(`desenho-room-${roomId}`);
    if (!channel) return;
    try {
      await channel.send({
        type: 'broadcast',
        event: 'room_updated',
        payload: { roomId, updatedAt: Date.now() },
      });
    } catch {
      // Falha transitória de broadcast não bloqueia a operação persistida.
    }
  }

  private async loadDesenhoSnapshot(
    roomId: string,
    viewerPlayerId?: string
  ): Promise<DesenhoRoom> {
    const client = this.getClient();
    const uid = viewerPlayerId ?? (await this.ensureAuthenticatedUserId());

    const { data: roomRow, error: roomError } = await client
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .eq('game_type', 'desenho')
      .single();

    if (roomError || !roomRow) {
      throw new DataSourceError('Sala de Desenho Relâmpago não encontrada.');
    }

    const { data: playerRows, error: playersError } = await client
      .from('room_players')
      .select('id, room_id, user_id, nickname, is_host, score')
      .eq('room_id', roomId)
      .order('is_host', { ascending: false })
      .order('id', { ascending: true });

    if (playersError) {
      throw new DataSourceError(
        'Não foi possível carregar os jogadores da sala de Desenho Relâmpago.'
      );
    }

    const rawConfig = (roomRow.config ?? {}) as Record<string, unknown>;
    const currentDrawerIndex =
      typeof rawConfig.currentDrawerIndex === 'number'
        ? rawConfig.currentDrawerIndex
        : 0;
    const currentDrawerId =
      typeof rawConfig.currentDrawerId === 'string'
        ? rawConfig.currentDrawerId
        : null;
    const drawerOrder = Array.isArray(rawConfig.drawerOrder)
      ? (rawConfig.drawerOrder as string[])
      : [];
    const usedCardIds = Array.isArray(rawConfig.usedCardIds)
      ? (rawConfig.usedCardIds as string[])
      : [];
    const elements = Array.isArray(rawConfig.elements)
      ? (rawConfig.elements as DrawingElement[])
      : [];
    const guessedPlayerIds = new Set<string>(
      Array.isArray(rawConfig.guessedPlayerIds)
        ? (rawConfig.guessedPlayerIds as string[])
        : []
    );
    const drawingScores =
      (rawConfig.drawingScoresByUserId as Record<string, number> | undefined) ??
      {};
    const firstCounts =
      (rawConfig.firstGuessCountsByUserId as
        | Record<string, number>
        | undefined) ?? {};
    const categories: DesenhoCategory[] = Array.isArray(rawConfig.categories)
      ? (rawConfig.categories as DesenhoCategory[])
      : ['Bíblico', 'Animais', 'Objetos', 'Comidas', 'Lugares e Natureza'];
    const turnDurationSeconds = (
      rawConfig.turnDurationSeconds === 60 ||
      rawConfig.turnDurationSeconds === 90 ||
      rawConfig.turnDurationSeconds === 120
        ? rawConfig.turnDurationSeconds
        : 90
    ) as DesenhoTurnDuration;
    const totalRounds =
      typeof rawConfig.totalRounds === 'number' &&
      rawConfig.totalRounds >= 1 &&
      rawConfig.totalRounds <= 5
        ? rawConfig.totalRounds
        : 2;

    const { data: guessRows } = await client
      .from('desenho_guesses')
      .select('*')
      .eq('room_id', roomId)
      .eq('round_number', roomRow.current_round ?? 1)
      .eq('drawer_index', currentDrawerIndex)
      .order('created_at', { ascending: true });

    const { data: secretRow } = await client
      .from('desenho_secrets')
      .select('secret_word, category, drawer_id')
      .eq('room_id', roomId)
      .maybeSingle();

    const phase = (roomRow.phase || 'lobby') as DesenhoPhase;
    const canSeeSecret =
      phase === 'turn_summary' ||
      phase === 'finished' ||
      (phase === 'drawing' && currentDrawerId === uid);

    const players: DesenhoPlayer[] = ((playerRows ?? []) as DbRoomPlayerRow[]).map(
      (p) => ({
        id: p.user_id,
        nickname: p.nickname,
        isHost: p.is_host,
        score: p.score,
        drawingScore: drawingScores[p.user_id] ?? 0,
        firstGuessCount: firstCounts[p.user_id] ?? 0,
        hasGuessedCurrentTurn: guessedPlayerIds.has(p.user_id),
      })
    );

    const guesses: DesenhoGuess[] = (
      (guessRows ?? []) as Array<{
        id: string;
        user_id: string;
        player_nickname: string;
        guess_text: string;
        is_correct: boolean;
        points_awarded: number;
        created_at: string;
      }>
    ).map((g) => ({
      id: g.id,
      playerId: g.user_id,
      playerNickname: g.player_nickname,
      text: g.guess_text,
      isCorrect: g.is_correct,
      pointsAwarded: g.points_awarded,
      createdAt: g.created_at,
    }));

    return {
      id: roomRow.id as string,
      code: roomRow.code as string,
      gameType: 'desenho',
      hostId: roomRow.host_id as string,
      phase,
      version: (roomRow.version as number | undefined) ?? 0,
      phaseEndsAt: (roomRow.phase_ends_at as string | null | undefined) ?? null,
      config: {
        turnDurationSeconds,
        totalRounds,
        categories,
      },
      currentRound: (roomRow.current_round as number | undefined) ?? 1,
      drawerOrder,
      currentDrawerIndex,
      currentDrawerId,
      currentCardCategory:
        (rawConfig.currentCardCategory as DesenhoCategory | null | undefined) ??
        (secretRow?.category as DesenhoCategory | undefined) ??
        null,
      currentSecretWord: canSeeSecret
        ? ((secretRow?.secret_word as string | undefined) ?? null)
        : null,
      usedCardIds,
      elements,
      guesses,
      players,
    };
  }

  async getDesenhoRoom(
    roomId?: string,
    viewerPlayerId?: string
  ): Promise<DesenhoRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.getDesenhoRoom(roomId, viewerPlayerId);
    }
    try {
      const targetId = roomId ?? this.activeRoomId;
      if (!targetId) {
        throw new DataSourceError('Nenhuma sala de Desenho Relâmpago ativa.');
      }
      return await this.loadDesenhoSnapshot(targetId, viewerPlayerId);
    } catch (err: unknown) {
      this.wrapError(
        err,
        'Não foi possível carregar a sala de Desenho Relâmpago.'
      );
    }
  }

  async createDesenhoRoom(
    hostNickname: string,
    initialCategories?: DesenhoCategory[]
  ): Promise<DesenhoRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.createDesenhoRoom(
        hostNickname,
        initialCategories
      );
    }
    try {
      const client = this.getClient();
      const userId = await this.ensureAuthenticatedUserId();
      const code = generatePinCode();
      const categories =
        initialCategories && initialCategories.length > 0
          ? [...initialCategories]
          : ['Bíblico', 'Animais', 'Objetos', 'Comidas', 'Lugares e Natureza'];

      const { data: roomRow, error: roomError } = await client
        .from('rooms')
        .insert({
          code,
          game_type: 'desenho',
          host_id: userId,
          status: 'lobby',
          phase: 'lobby',
          current_round: 1,
          config: {
            turnDurationSeconds: 90,
            totalRounds: 2,
            categories,
            drawerOrder: [],
            currentDrawerIndex: 0,
            currentDrawerId: null,
            currentCardCategory: null,
            usedCardIds: [],
            elements: [],
            guessedPlayerIds: [],
            drawingScoresByUserId: {},
            firstGuessCountsByUserId: {},
          },
        })
        .select('*')
        .single();

      if (roomError || !roomRow) {
        throw new DataSourceError(
          'Não foi possível criar a sala de Desenho Relâmpago no Supabase.'
        );
      }

      const { error: playerError } = await client.from('room_players').insert({
        room_id: roomRow.id,
        user_id: userId,
        nickname: hostNickname.trim(),
        is_host: true,
        score: 0,
      });

      if (playerError) {
        throw new DataSourceError(
          'Não foi possível registrar o anfitrião na sala.'
        );
      }

      this.activeRoomId = roomRow.id as string;
      return await this.loadDesenhoSnapshot(roomRow.id as string, userId);
    } catch (err: unknown) {
      this.wrapError(
        err,
        'Não foi possível criar a sala de Desenho Relâmpago.'
      );
    }
  }

  async joinDesenhoRoom(code: string, nickname: string): Promise<DesenhoRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.joinDesenhoRoom(code, nickname);
    }
    try {
      const client = this.getClient();
      const cleanCode = code.trim().toUpperCase();
      const userId = await this.ensureAuthenticatedUserId();

      const { data: roomRow, error: roomError } = await client
        .from('rooms')
        .select('*')
        .eq('code', cleanCode)
        .eq('game_type', 'desenho')
        .single();

      if (roomError || !roomRow) {
        throw new ValidationError(
          `Nenhuma sala de Desenho Relâmpago encontrada com o código "${cleanCode}".`
        );
      }
      if (roomRow.phase !== 'lobby') {
        throw new ValidationError(
          'Esta sala já iniciou a partida. Aguarde a próxima rodada no Lobby.'
        );
      }

      const { error: insertError } = await client.from('room_players').upsert(
        {
          room_id: roomRow.id,
          user_id: userId,
          nickname: nickname.trim(),
          is_host: roomRow.host_id === userId,
          score: 0,
        },
        { onConflict: 'room_id,user_id' }
      );

      if (insertError) {
        throw new DataSourceError(
          'Não foi possível entrar na sala de Desenho Relâmpago.'
        );
      }

      this.activeRoomId = roomRow.id as string;
      await this.broadcastDesenhoUpdate(roomRow.id as string);
      return await this.loadDesenhoSnapshot(roomRow.id as string, userId);
    } catch (err: unknown) {
      this.wrapError(
        err,
        'Não foi possível entrar na sala de Desenho Relâmpago.'
      );
    }
  }

  async leaveDesenhoRoom(roomId: string, playerId: string): Promise<void> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.leaveDesenhoRoom(roomId, playerId);
    }
    try {
      const client = this.getClient();
      await client
        .from('room_players')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', playerId);
      await this.broadcastDesenhoUpdate(roomId);
    } catch (err: unknown) {
      this.wrapError(err, 'Não foi possível sair da sala.');
    }
  }

  async updateDesenhoConfig(
    roomId: string,
    partialConfig: Partial<DesenhoConfig>
  ): Promise<DesenhoRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.updateDesenhoConfig(roomId, partialConfig);
    }
    try {
      const client = this.getClient();
      const { data: roomRow, error: readError } = await client
        .from('rooms')
        .select('config')
        .eq('id', roomId)
        .single();
      if (readError || !roomRow) {
        throw new DataSourceError('Sala de Desenho Relâmpago não encontrada.');
      }
      const nextConfig = {
        ...((roomRow.config ?? {}) as Record<string, unknown>),
        ...(partialConfig.turnDurationSeconds !== undefined
          ? { turnDurationSeconds: partialConfig.turnDurationSeconds }
          : {}),
        ...(partialConfig.totalRounds !== undefined
          ? { totalRounds: partialConfig.totalRounds }
          : {}),
        ...(partialConfig.categories !== undefined
          ? { categories: [...partialConfig.categories] }
          : {}),
      };
      const { error: updateError } = await client
        .from('rooms')
        .update({ config: nextConfig })
        .eq('id', roomId);
      if (updateError) {
        throw new DataSourceError(
          'Não foi possível salvar os parâmetros da sala.'
        );
      }
      await this.broadcastDesenhoUpdate(roomId);
      return await this.loadDesenhoSnapshot(roomId);
    } catch (err: unknown) {
      this.wrapError(err, 'Não foi possível atualizar a configuração da sala.');
    }
  }

  async startDesenhoTurn(
    roomId: string,
    input: StartDesenhoTurnInput
  ): Promise<DesenhoRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.startDesenhoTurn(roomId, input);
    }
    try {
      const client = this.getClient();
      const { error } = await client.rpc('desenho_start_turn', {
        p_room_id: roomId,
        p_drawer_id: input.drawerId,
        p_drawer_order: input.drawerOrder,
        p_drawer_index: input.currentDrawerIndex,
        p_round: input.currentRound,
        p_card_id: input.cardId,
        p_secret_word: input.secretWord,
        p_category: input.category,
        p_used_card_ids: input.usedCardIds,
        p_phase_ends_at: input.phaseEndsAt,
      });
      if (error) {
        throw new DataSourceError(error.message);
      }
      await this.broadcastDesenhoUpdate(roomId);
      return await this.loadDesenhoSnapshot(roomId);
    } catch (err: unknown) {
      this.wrapError(err, 'Não foi possível iniciar o turno de desenho.');
    }
  }

  private async updateDesenhoElements(
    roomId: string,
    drawerId: string,
    updater: (current: DrawingElement[]) => DrawingElement[]
  ): Promise<DesenhoRoom> {
    const client = this.getClient();
    const { data: roomRow, error: readError } = await client
      .from('rooms')
      .select('phase, config')
      .eq('id', roomId)
      .single();
    if (readError || !roomRow) {
      throw new DataSourceError('Sala de Desenho Relâmpago não encontrada.');
    }
    const rawConfig = (roomRow.config ?? {}) as Record<string, unknown>;
    if (roomRow.phase !== 'drawing') {
      throw new ConflictError('Não é possível editar fora da fase ativa.');
    }
    if (rawConfig.currentDrawerId !== drawerId) {
      throw new ValidationError('Apenas o desenhista da vez pode desenhar.');
    }
    const currentElements = Array.isArray(rawConfig.elements)
      ? (rawConfig.elements as DrawingElement[])
      : [];
    const nextConfig = {
      ...rawConfig,
      elements: updater(currentElements),
    };
    const { error: updateError } = await client
      .from('rooms')
      .update({ config: nextConfig })
      .eq('id', roomId);
    if (updateError) {
      throw new DataSourceError('Não foi possível sincronizar o desenho.');
    }
    await this.broadcastDesenhoUpdate(roomId);
    return await this.loadDesenhoSnapshot(roomId, drawerId);
  }

  async addDesenhoElement(
    roomId: string,
    drawerId: string,
    element: DrawingElement
  ): Promise<DesenhoRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.addDesenhoElement(roomId, drawerId, element);
    }
    try {
      return await this.updateDesenhoElements(roomId, drawerId, (curr) => [
        ...curr,
        element,
      ]);
    } catch (err: unknown) {
      this.wrapError(err, 'Não foi possível enviar o elemento desenhado.');
    }
  }

  async undoDesenhoElement(
    roomId: string,
    drawerId: string
  ): Promise<DesenhoRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.undoDesenhoElement(roomId, drawerId);
    }
    try {
      return await this.updateDesenhoElements(roomId, drawerId, (curr) =>
        curr.length > 0 ? curr.slice(0, -1) : curr
      );
    } catch (err: unknown) {
      this.wrapError(err, 'Não foi possível desfazer o último traço.');
    }
  }

  async clearDesenhoCanvas(
    roomId: string,
    drawerId: string
  ): Promise<DesenhoRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.clearDesenhoCanvas(roomId, drawerId);
    }
    try {
      return await this.updateDesenhoElements(roomId, drawerId, () => []);
    } catch (err: unknown) {
      this.wrapError(err, 'Não foi possível limpar a folha de desenho.');
    }
  }

  async submitDesenhoGuess(
    roomId: string,
    playerId: string,
    text: string
  ): Promise<SubmitDesenhoGuessResult> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.submitDesenhoGuess(roomId, playerId, text);
    }
    try {
      const client = this.getClient();
      const { data, error } = await client.rpc('desenho_submit_guess', {
        p_room_id: roomId,
        p_text: text.trim(),
      });
      if (error) {
        throw new ValidationError(error.message);
      }
      const payload = (data ?? {}) as {
        isCorrect?: boolean;
        pointsAwarded?: number;
      };
      await this.broadcastDesenhoUpdate(roomId);
      const room = await this.loadDesenhoSnapshot(roomId, playerId);
      return {
        room,
        isCorrect: Boolean(payload.isCorrect),
        pointsAwarded: payload.pointsAwarded ?? 0,
      };
    } catch (err: unknown) {
      this.wrapError(err, 'Não foi possível enviar o palpite.');
    }
  }

  async finishDesenhoTurn(roomId: string): Promise<DesenhoRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.finishDesenhoTurn(roomId);
    }
    try {
      const client = this.getClient();
      const { error } = await client
        .from('rooms')
        .update({ phase: 'turn_summary', phase_ends_at: null })
        .eq('id', roomId)
        .eq('phase', 'drawing');
      if (error) {
        throw new DataSourceError(error.message);
      }
      await this.broadcastDesenhoUpdate(roomId);
      return await this.loadDesenhoSnapshot(roomId);
    } catch (err: unknown) {
      this.wrapError(err, 'Não foi possível encerrar o turno de desenho.');
    }
  }

  async finishDesenhoMatch(roomId: string): Promise<DesenhoRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.finishDesenhoMatch(roomId);
    }
    try {
      const client = this.getClient();
      const { error } = await client
        .from('rooms')
        .update({ phase: 'finished', status: 'finished', phase_ends_at: null })
        .eq('id', roomId);
      if (error) {
        throw new DataSourceError(error.message);
      }
      await this.broadcastDesenhoUpdate(roomId);
      return await this.loadDesenhoSnapshot(roomId);
    } catch (err: unknown) {
      this.wrapError(err, 'Não foi possível encerrar a partida.');
    }
  }

  async restartDesenhoLobby(roomId: string): Promise<DesenhoRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.restartDesenhoLobby(roomId);
    }
    try {
      const client = this.getClient();
      const { data: roomRow } = await client
        .from('rooms')
        .select('config')
        .eq('id', roomId)
        .single();
      const rawConfig = ((roomRow?.config ?? {}) as Record<string, unknown>);
      await client
        .from('room_players')
        .update({ score: 0 })
        .eq('room_id', roomId);
      const { error } = await client
        .from('rooms')
        .update({
          phase: 'lobby',
          status: 'lobby',
          current_round: 1,
          phase_ends_at: null,
          config: {
            ...rawConfig,
            drawerOrder: [],
            currentDrawerIndex: 0,
            currentDrawerId: null,
            currentCardCategory: null,
            usedCardIds: [],
            elements: [],
            guessedPlayerIds: [],
            drawingScoresByUserId: {},
            firstGuessCountsByUserId: {},
          },
        })
        .eq('id', roomId);
      if (error) {
        throw new DataSourceError(error.message);
      }
      await this.broadcastDesenhoUpdate(roomId);
      return await this.loadDesenhoSnapshot(roomId);
    } catch (err: unknown) {
      this.wrapError(err, 'Não foi possível reiniciar o lobby.');
    }
  }

  subscribeToDesenhoRoom(
    roomId: string,
    onRoomUpdated: (room: DesenhoRoom) => void
  ): () => void {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.subscribeToDesenhoRoom(roomId, onRoomUpdated);
    }

    const client = this.getClient();
    const channelName = `desenho-room-${roomId}`;
    const previousChannel = this.activeChannels.get(channelName);
    if (previousChannel) {
      this.activeChannels.delete(channelName);
      void client.removeChannel(previousChannel);
    }

    let latestSeq = 0;
    const refresh = () => {
      const seq = ++latestSeq;
      void this.loadDesenhoSnapshot(roomId)
        .then((snapshot) => {
          if (seq === latestSeq) {
            onRoomUpdated(snapshot);
          }
        })
        .catch(() => {
          // Ignora falhas transitórias de rede em background.
        });
    };

    const channel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomId}`,
        },
        refresh
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${roomId}`,
        },
        refresh
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'desenho_guesses',
          filter: `room_id=eq.${roomId}`,
        },
        refresh
      )
      .on('broadcast', { event: 'room_updated' }, refresh)
      .subscribe((status?: string) => {
        if (status === 'SUBSCRIBED') {
          refresh();
        }
      });

    this.activeChannels.set(channelName, channel);

    return () => {
      if (this.activeChannels.get(channelName) === channel) {
        this.activeChannels.delete(channelName);
      }
      void client.removeChannel(channel);
    };
  }
}
