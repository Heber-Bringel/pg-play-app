import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseMultiplayerRoomService } from '@/infra/services/supabaseMultiplayerRoomService';
import { AuthError, DataSourceError } from '@/model/errors';

type MockTableState = {
  rooms: Record<string, unknown>[];
  room_players: Record<string, unknown>[];
  adedonha_submissions: Record<string, unknown>[];
};

function createFakeSupabaseClient(initial?: Partial<MockTableState>) {
  const db: MockTableState = {
    rooms: initial?.rooms ?? [],
    room_players: initial?.room_players ?? [],
    adedonha_submissions: initial?.adedonha_submissions ?? [],
  };

  const channelOnHandlers: Array<() => void> = [];
  type MockChannel = {
    on: jest.Mock<MockChannel, [string, unknown, () => void]>;
    subscribe: jest.Mock<MockChannel, []>;
  };
  const mockChannel: MockChannel = {
    on: jest.fn(
      (_event: string, _filter: unknown, cb: () => void): MockChannel => {
        channelOnHandlers.push(cb);
        return mockChannel;
      }
    ),
    subscribe: jest.fn((): MockChannel => mockChannel),
  };

  type FilterQuery = {
    eq: jest.Mock<FilterQuery, [string, unknown]>;
    then: (resolve: (val: { data: unknown; error: unknown }) => void) => void;
  };

  type QueryBuilder = {
    select: jest.Mock<QueryBuilder, [string?]>;
    eq: jest.Mock<QueryBuilder, [string, unknown]>;
    single: jest.Mock<Promise<{ data: unknown; error: unknown }>, []>;
    then: (resolve: (val: { data: unknown; error: unknown }) => void) => void;
    insert: jest.Mock<unknown, [Record<string, unknown> | Record<string, unknown>[]]>;
    upsert: jest.Mock<Promise<{ data: unknown; error: unknown }>, [Record<string, unknown>]>;
    update: jest.Mock<FilterQuery, [Record<string, unknown>]>;
    delete: jest.Mock<FilterQuery, []>;
  };

  const client = {
    auth: {
      getSession: jest.fn(async () => ({
        data: { session: null },
        error: null,
      })),
      signInAnonymously: jest.fn(async () => ({
        data: { user: { id: 'user-anon-1' } },
        error: null,
      })),
    },
    channel: jest.fn(() => mockChannel),
    removeChannel: jest.fn(async () => 'ok'),
    from: jest.fn((table: keyof MockTableState): QueryBuilder => {
      const filters: Array<(row: Record<string, unknown>) => boolean> = [];

      const applyFilters = () =>
        db[table].filter((row) => filters.every((fn) => fn(row)));

      const queryBuilder: QueryBuilder = {
        select: jest.fn((): QueryBuilder => queryBuilder),
        eq: jest.fn((col: string, val: unknown): QueryBuilder => {
          filters.push((row) => row[col] === val);
          return queryBuilder;
        }),
        single: jest.fn(async () => {
          const rows = applyFilters();
          if (rows.length === 0) {
            return { data: null, error: { message: 'Not found' } };
          }
          return { data: rows[0], error: null };
        }),
        then: (
          resolve: (val: { data: unknown; error: unknown }) => void
        ) => {
          resolve({ data: applyFilters(), error: null });
        },
        insert: jest.fn((payload: Record<string, unknown> | Record<string, unknown>[]) => {
          const items = Array.isArray(payload) ? payload : [payload];
          const inserted = items.map((item, idx) => ({
            id: `${table}-${db[table].length + idx + 1}`,
            ...item,
          }));
          db[table].push(...inserted);
          return {
            select: () => ({
              single: async () => ({ data: inserted[0], error: null }),
            }),
            then: (resolve: (val: { data: unknown; error: unknown }) => void) => {
              resolve({ data: inserted, error: null });
            },
          };
        }),
        upsert: jest.fn(async (payload: Record<string, unknown>) => {
          const existingIdx = db[table].findIndex(
            (r) =>
              r.room_id === payload.room_id && r.user_id === payload.user_id
          );
          if (existingIdx >= 0) {
            db[table][existingIdx] = { ...db[table][existingIdx], ...payload };
          } else {
            db[table].push({
              id: `${table}-${db[table].length + 1}`,
              score: 0,
              ...payload,
            });
          }
          return { data: payload, error: null };
        }),
        update: jest.fn((patch: Record<string, unknown>): FilterQuery => {
          const updateFilters: Array<(row: Record<string, unknown>) => boolean> =
            [];
          const updateBuilder: FilterQuery = {
            eq: jest.fn((col: string, val: unknown): FilterQuery => {
              updateFilters.push((row) => row[col] === val);
              return updateBuilder;
            }),
            then: (
              resolve: (val: { data: unknown; error: unknown }) => void
            ) => {
              db[table] = db[table].map((row) =>
                updateFilters.every((fn) => fn(row))
                  ? { ...row, ...patch }
                  : row
              );
              resolve({ data: null, error: null });
            },
          };
          return updateBuilder;
        }),
        delete: jest.fn((): FilterQuery => {
          const deleteFilters: Array<(row: Record<string, unknown>) => boolean> =
            [];
          const deleteBuilder: FilterQuery = {
            eq: jest.fn((col: string, val: unknown): FilterQuery => {
              deleteFilters.push((row) => row[col] === val);
              return deleteBuilder;
            }),
            then: (
              resolve: (val: { data: unknown; error: unknown }) => void
            ) => {
              db[table] = db[table].filter(
                (row) => !deleteFilters.every((fn) => fn(row))
              );
              resolve({ data: null, error: null });
            },
          };
          return deleteBuilder;
        }),
      };

      return queryBuilder;
    }),
  };

  return {
    client: client as unknown as SupabaseClient,
    rawClient: client,
    db,
    mockChannel,
    channelOnHandlers,
  };
}

describe('SupabaseMultiplayerRoomService — Integração Postgres, Auth Anônima e Realtime', () => {
  it('deve autenticar anonimamente, criar sala e registrar o Moderador', async () => {
    const fake = createFakeSupabaseClient();
    const service = new SupabaseMultiplayerRoomService(
      {
        supabaseUrl: 'https://proj.supabase.co',
        supabaseAnonKey: 'anon-key',
      },
      undefined,
      fake.client
    );

    const room = await service.createAdedonhaRoom('Heber');
    expect(room.hostId).toBe('user-anon-1');
    expect(room.code).toHaveLength(6);
    expect(room.players).toHaveLength(1);
    expect(room.players[0].nickname).toBe('Heber');
    expect(room.players[0].isHost).toBe(true);

    const localId = await service.getLocalPlayerId(room.id);
    expect(localId).toBe('user-anon-1');
    expect(fake.rawClient.auth.signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it('deve entrar em sala pelo código PIN, submeter respostas e registrar veredito', async () => {
    const fake = createFakeSupabaseClient({
      rooms: [
        {
          id: 'room-uuid-1',
          code: 'PG2026',
          game_type: 'adedonha',
          host_id: 'host-uuid',
          status: 'lobby',
          phase: 'lobby',
          config: {
            columns: ['Personagem Bíblico'],
            roundDurationSeconds: 90,
            totalRounds: 5,
            excludeHardLetters: true,
            usedLetters: [],
            currentTallyColumnIndex: 0,
            stopTriggeredBy: null,
            stopCountsByUserId: {},
          },
          current_round: 1,
          current_letter: null,
        },
      ],
      room_players: [
        {
          id: 'rp-1',
          room_id: 'room-uuid-1',
          user_id: 'host-uuid',
          nickname: 'Moderador',
          is_host: true,
          score: 0,
        },
      ],
    });

    const service = new SupabaseMultiplayerRoomService(
      {
        supabaseUrl: 'https://proj.supabase.co',
        supabaseAnonKey: 'anon-key',
      },
      undefined,
      fake.client
    );

    const joined = await service.joinAdedonhaRoom('pg2026', 'Ana');
    expect(joined.players).toHaveLength(2);
    expect(joined.players.some((p) => p.nickname === 'Ana')).toBe(true);

    await service.spinAlphabetRoulette(joined.id, 'D');
    await service.openRoundFilling(joined.id);
    const afterSubmit = await service.submitPlayerAnswers(
      joined.id,
      'user-anon-1',
      { 'Personagem Bíblico': 'Davi' }
    );
    expect(afterSubmit.submissions).toHaveLength(1);
    expect(afterSubmit.submissions[0].answerText).toBe('Davi');

    const subId = afterSubmit.submissions[0].id;
    const afterJudge = await service.judgeSubmission(
      joined.id,
      subId,
      'unique',
      10
    );
    expect(afterJudge.submissions[0].points).toBe(10);
    expect(
      afterJudge.players.find((p) => p.id === 'user-anon-1')?.score
    ).toBe(10);
  });

  it('deve assinar mudanças Realtime da sala e cancelar inscrição ao limpar', () => {
    const fake = createFakeSupabaseClient();
    const service = new SupabaseMultiplayerRoomService(
      {
        supabaseUrl: 'https://proj.supabase.co',
        supabaseAnonKey: 'anon-key',
      },
      undefined,
      fake.client
    );

    const unsubscribe = service.subscribeToRoom('room-uuid-1', jest.fn());
    expect(fake.rawClient.channel).toHaveBeenCalledWith(
      'adedonha-room-room-uuid-1'
    );
    expect(fake.mockChannel.on).toHaveBeenCalledTimes(3);
    expect(fake.mockChannel.subscribe).toHaveBeenCalledTimes(1);

    unsubscribe();
    expect(fake.rawClient.removeChannel).toHaveBeenCalledWith(fake.mockChannel);
  });

  it('deve lançar AuthError quando falha autenticação anônima e DataSourceError quando PIN não existe', async () => {
    const fakeFailAuth = createFakeSupabaseClient();
    fakeFailAuth.rawClient.auth.signInAnonymously = jest.fn(async () => ({
      data: { user: null as unknown as { id: string } },
      error: { message: 'Anonymous sign-ins disabled' } as unknown as null,
    }));

    const serviceFailAuth = new SupabaseMultiplayerRoomService(
      {
        supabaseUrl: 'https://proj.supabase.co',
        supabaseAnonKey: 'anon-key',
      },
      undefined,
      fakeFailAuth.client
    );
    await expect(serviceFailAuth.createAdedonhaRoom('Heber')).rejects.toThrow(
      AuthError
    );

    const fakeEmpty = createFakeSupabaseClient();
    const serviceMissingRoom = new SupabaseMultiplayerRoomService(
      {
        supabaseUrl: 'https://proj.supabase.co',
        supabaseAnonKey: 'anon-key',
      },
      undefined,
      fakeEmpty.client
    );
    await expect(
      serviceMissingRoom.joinAdedonhaRoom('INVALI', 'Ana')
    ).rejects.toThrow(DataSourceError);
  });
});
