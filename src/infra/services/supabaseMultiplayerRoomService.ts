import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
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
  CidadeDormeConfig,
  CidadeDormeRoom,
} from '@/model/entities/multiplayerSession';
import { AuthError, DataSourceError, ValidationError } from '@/model/errors';
import type { IMultiplayerRoomService } from '@/model/services/iMultiplayerRoomService';

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
  score: number;
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

    const refresh = () => {
      void this.loadRoomSnapshot(roomId)
        .then((snapshot) => onRoomUpdated(snapshot))
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
      const userId = await this.ensureAuthenticatedUserId();
      const normalizedCode = code.trim().toUpperCase();

      const { data: roomData, error: roomError } = await client
        .from('rooms')
        .select('id, host_id')
        .eq('code', normalizedCode)
        .eq('game_type', 'adedonha')
        .single();

      if (roomError || !roomData) {
        throw new DataSourceError(
          'Código de sala não encontrado. Confira o PIN com o Moderador.'
        );
      }

      const targetRoom = roomData as { id: string; host_id: string };
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
      const sameUserRow = existingPlayers.find((p) => p.user_id === userId);
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

  async openRoundFilling(roomId: string): Promise<AdedonhaRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.openRoundFilling(roomId);
    }

    try {
      const client = this.getClient();
      const { error } = await client
        .from('rooms')
        .update({ phase: 'filling', status: 'playing' })
        .eq('id', roomId);

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
    classifiedSubmissions: AdedonhaSubmission[]
  ): Promise<AdedonhaRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.startTallyPhase(
        roomId,
        classifiedSubmissions
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

  async advanceToNextRound(roomId: string): Promise<AdedonhaRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      return this.delegateService.advanceToNextRound(roomId);
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
      current_round: number;
      narrator_caption?: string | null;
      config: Record<string, unknown> | null;
    },
    playerRows: DbRoomPlayerRow[] = []
  ): CidadeDormeRoom {
    const raw = (row.config ?? {}) as Partial<CidadeDormeRoom> & {
      config?: CidadeDormeConfig;
    };
    const defaultCfg: CidadeDormeConfig = {
      narratorVoice: 'masculina',
      assassinCount: 1,
      dayDebateSeconds: 120,
      nightTurnSeconds: 15,
      revealRoleOnDeath: true,
    };

    const storedPlayers = Array.isArray(raw.players)
      ? raw.players.map((p) => ({ ...p }))
      : [];
    const storedById = new Map(storedPlayers.map((p) => [p.id, p]));

    let mergedPlayers: CidadeDormeRoom['players'];
    if (playerRows.length > 0) {
      mergedPlayers = playerRows.map((pRow) => {
        const existingMeta = storedById.get(pRow.user_id);
        return {
          id: pRow.user_id,
          nickname: pRow.nickname,
          isHost: pRow.is_host || pRow.user_id === row.host_id,
          isAlive: existingMeta?.isAlive ?? true,
          isReady: existingMeta?.isReady ?? false,
          role:
            existingMeta?.role ??
            (pRow.is_host || pRow.user_id === row.host_id
              ? 'detetive'
              : 'cidadao'),
          hasVoted: existingMeta?.hasVoted ?? false,
        };
      });
    } else {
      mergedPlayers = storedPlayers;
    }

    return {
      id: row.id,
      code: row.code,
      gameType: 'cidade-dorme',
      hostId: row.host_id,
      phase: (row.phase || raw.phase || 'lobby') as CidadeDormeRoom['phase'],
      config: {
        ...defaultCfg,
        ...(raw.config ?? {}),
      },
      currentRound: row.current_round ?? raw.currentRound ?? 1,
      narratorCaption:
        row.narrator_caption ??
        raw.narratorCaption ??
        'Sala pronta no Lobby.',
      players: mergedPlayers,
      nightTargetId: raw.nightTargetId ?? null,
      nightProtectedId: raw.nightProtectedId ?? null,
      detectiveVerdict: raw.detectiveVerdict
        ? { ...raw.detectiveVerdict }
        : null,
      votesByPlayerId: raw.votesByPlayerId ? { ...raw.votesByPlayerId } : {},
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

  async getCidadeDormeRoom(roomId?: string): Promise<CidadeDormeRoom> {
    this.ensureCredentials();
    if (this.delegateService) {
      try {
        return await this.delegateService.getCidadeDormeRoom(roomId);
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
      await this.ensureAuthenticatedUserId();
      const { data, error } = await client
        .from('rooms')
        .select(
          'id, code, host_id, phase, current_round, narrator_caption, config'
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
        .select('id, room_id, user_id, nickname, is_host, score')
        .eq('room_id', targetId);

      if (playersError) {
        throw new DataSourceError(
          'Erro ao carregar jogadores da sala de Cidade Dorme.'
        );
      }

      this.activeRoomId = targetId;
      return this.mapRowToCidadeDormeRoom(
        data as {
          id: string;
          code: string;
          host_id: string;
          phase: string;
          current_round: number;
          narrator_caption?: string | null;
          config: Record<string, unknown> | null;
        },
        (playersData ?? []) as DbRoomPlayerRow[]
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
      const initialPlayers: CidadeDormeRoom['players'] = [
        {
          id: userId,
          nickname: cleanHost,
          isHost: true,
          isAlive: true,
          isReady: false,
          role: 'detetive',
          hasVoted: false,
        },
      ];
      const storedPayload = {
        config: initialConfig,
        players: initialPlayers,
        narratorCaption:
          'Sala criada! Escolha a voz do Narrador e aguarde os jogadores.',
        nightTargetId: null,
        nightProtectedId: null,
        detectiveVerdict: null,
        votesByPlayerId: {},
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
      const userId = await this.ensureAuthenticatedUserId();
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
      const sameUserRow = existingRows.find((p) => p.user_id === userId);
      const duplicateNickRow = existingRows.find(
        (p) =>
          p.user_id !== userId &&
          p.nickname.trim().toLowerCase() === cleanNickname.toLowerCase()
      );

      if (duplicateNickRow) {
        throw new ValidationError(
          'Já existe um participante com este apelido na sala. Escolha outro nome.'
        );
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
        const { error: insertError } = await client.from('room_players').insert({
          room_id: targetRoom.id,
          user_id: userId,
          nickname: cleanNickname,
          is_host: targetRoom.host_id === userId,
          is_alive: true,
          is_ready: false,
          score: 0,
        });

        if (insertError) {
          throw new DataSourceError(
            'Não foi possível entrar na sala de Cidade Dorme.'
          );
        }
      }

      this.activeRoomId = targetRoom.id;
      return await this.getCidadeDormeRoom(targetRoom.id);
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

      const storedPayload = {
        config: room.config,
        players: room.players,
        narratorCaption: room.narratorCaption,
        nightTargetId: room.nightTargetId,
        nightProtectedId: room.nightProtectedId,
        detectiveVerdict: room.detectiveVerdict,
        votesByPlayerId: room.votesByPlayerId,
        dawnReport: room.dawnReport,
        voteReport: room.voteReport,
        winner: room.winner,
      };

      const { error } = await client
        .from('rooms')
        .update({
          phase: room.phase,
          status: nextStatus,
          current_round: room.currentRound,
          narrator_caption: room.narratorCaption,
          config: storedPayload,
        })
        .eq('id', room.id);

      if (error) {
        throw new DataSourceError(
          'Falha ao salvar o estado da sala de Cidade Dorme.'
        );
      }
      this.activeRoomId = room.id;
      return await this.getCidadeDormeRoom(room.id);
    } catch (err: unknown) {
      return this.wrapError(
        err,
        'Falha ao salvar o estado da sala de Cidade Dorme.'
      );
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

    const refresh = () => {
      void this.getCidadeDormeRoom(roomId)
        .then((snapshot) => onRoomUpdated(snapshot))
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
      .subscribe();

    this.activeChannels.set(channelName, channel);

    return () => {
      if (this.activeChannels.get(channelName) === channel) {
        this.activeChannels.delete(channelName);
      }
      void client.removeChannel(channel);
    };
  }
}
