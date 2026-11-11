import type {
  AdedonhaConfig,
  AdedonhaRoom,
  AdedonhaSubmission,
  AdedonhaTallyVerdict,
} from '@/model/entities/multiplayerSession';
import { AuthError, DataSourceError } from '@/model/errors';
import type { IMultiplayerRoomService } from '@/model/services/iMultiplayerRoomService';

export type SupabaseServiceConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export class SupabaseMultiplayerRoomService implements IMultiplayerRoomService {
  private readonly delegateService?: IMultiplayerRoomService;
  private readonly supabaseUrl: string;
  private readonly supabaseAnonKey: string;

  constructor(
    config: SupabaseServiceConfig = {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
    delegateService?: IMultiplayerRoomService
  ) {
    this.supabaseUrl = config.supabaseUrl.trim();
    this.supabaseAnonKey = config.supabaseAnonKey.trim();
    this.delegateService = delegateService;
  }

  private ensureTransport(): IMultiplayerRoomService {
    if (!this.supabaseUrl || !this.supabaseAnonKey) {
      throw new AuthError(
        'Credenciais do Supabase não configuradas para a sala multiplayer.'
      );
    }
    if (!this.delegateService) {
      throw new DataSourceError(
        'Transporte Realtime do Supabase indisponível neste ambiente.'
      );
    }
    return this.delegateService;
  }

  async getAdedonhaRoom(roomId?: string): Promise<AdedonhaRoom> {
    try {
      return await this.ensureTransport().getAdedonhaRoom(roomId);
    } catch (err: unknown) {
      if (err instanceof AuthError || err instanceof DataSourceError) {
        throw err;
      }
      throw new DataSourceError('Falha ao sincronizar sala no Supabase.');
    }
  }

  async createAdedonhaRoom(
    hostNickname: string,
    initialColumns?: string[]
  ): Promise<AdedonhaRoom> {
    try {
      return await this.ensureTransport().createAdedonhaRoom(
        hostNickname,
        initialColumns
      );
    } catch (err: unknown) {
      if (err instanceof AuthError || err instanceof DataSourceError) {
        throw err;
      }
      throw new DataSourceError('Não foi possível criar sala no Supabase.');
    }
  }

  async joinAdedonhaRoom(code: string, nickname: string): Promise<AdedonhaRoom> {
    try {
      return await this.ensureTransport().joinAdedonhaRoom(code, nickname);
    } catch (err: unknown) {
      if (err instanceof AuthError || err instanceof DataSourceError) {
        throw err;
      }
      throw new DataSourceError('Não foi possível entrar na sala via Supabase.');
    }
  }

  async updateAdedonhaColumns(
    roomId: string,
    columns: string[]
  ): Promise<AdedonhaRoom> {
    return this.ensureTransport().updateAdedonhaColumns(roomId, columns);
  }

  async updateAdedonhaConfig(
    roomId: string,
    partialConfig: Partial<Omit<AdedonhaConfig, 'columns'>>
  ): Promise<AdedonhaRoom> {
    return this.ensureTransport().updateAdedonhaConfig(roomId, partialConfig);
  }

  async spinAlphabetRoulette(
    roomId: string,
    drawnLetter: string
  ): Promise<AdedonhaRoom> {
    return this.ensureTransport().spinAlphabetRoulette(roomId, drawnLetter);
  }

  async openRoundFilling(roomId: string): Promise<AdedonhaRoom> {
    return this.ensureTransport().openRoundFilling(roomId);
  }

  async submitPlayerAnswers(
    roomId: string,
    playerId: string,
    answers: Record<string, string>
  ): Promise<AdedonhaRoom> {
    return this.ensureTransport().submitPlayerAnswers(
      roomId,
      playerId,
      answers
    );
  }

  async triggerAdedonhaStop(
    roomId: string,
    playerId: string
  ): Promise<AdedonhaRoom> {
    return this.ensureTransport().triggerAdedonhaStop(roomId, playerId);
  }

  async startTallyPhase(
    roomId: string,
    classifiedSubmissions: AdedonhaSubmission[]
  ): Promise<AdedonhaRoom> {
    return this.ensureTransport().startTallyPhase(
      roomId,
      classifiedSubmissions
    );
  }

  async raiseDoubt(roomId: string, submissionId: string): Promise<AdedonhaRoom> {
    return this.ensureTransport().raiseDoubt(roomId, submissionId);
  }

  async judgeSubmission(
    roomId: string,
    submissionId: string,
    verdict: AdedonhaTallyVerdict,
    points: number
  ): Promise<AdedonhaRoom> {
    return this.ensureTransport().judgeSubmission(
      roomId,
      submissionId,
      verdict,
      points
    );
  }

  async advanceTallyColumn(roomId: string): Promise<AdedonhaRoom> {
    return this.ensureTransport().advanceTallyColumn(roomId);
  }

  async advanceToNextRound(roomId: string): Promise<AdedonhaRoom> {
    return this.ensureTransport().advanceToNextRound(roomId);
  }
}
