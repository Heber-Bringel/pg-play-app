import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseMultiplayerRoomService } from '@/infra/services/supabaseMultiplayerRoomService';
import { AuthError, DataSourceError, ValidationError } from '@/model/errors';

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
              const updated = db[table].map((row) =>
                updateFilters.every((fn) => fn(row))
                  ? { ...row, ...patch }
                  : row
              );
              db[table].splice(0, db[table].length, ...updated);
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
              const remaining = db[table].filter(
                (row) => !deleteFilters.every((fn) => fn(row))
              );
              db[table].splice(0, db[table].length, ...remaining);
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

  it('deve permitir sair e reentrar no mesmo lobby com o mesmo nome sem erro e bloquear apelido duplicado de outro usuário', async () => {
    const fake = createFakeSupabaseClient();
    const hostService = new SupabaseMultiplayerRoomService(
      {
        supabaseUrl: 'https://proj.supabase.co',
        supabaseAnonKey: 'anon-key',
      },
      undefined,
      fake.client
    );

    const created = await hostService.createAdedonhaRoom('Heber');

    // Simula jogador 2 entrando, saindo no lobby e voltando com o mesmo nome
    const fakePlayer2 = createFakeSupabaseClient({
      rooms: fake.db.rooms,
      room_players: fake.db.room_players,
      adedonha_submissions: fake.db.adedonha_submissions,
    });
    fakePlayer2.rawClient.auth.signInAnonymously = jest.fn(async () => ({
      data: { user: { id: 'user-anon-2' } },
      error: null,
    }));
    const player2Service = new SupabaseMultiplayerRoomService(
      {
        supabaseUrl: 'https://proj.supabase.co',
        supabaseAnonKey: 'anon-key',
      },
      undefined,
      fakePlayer2.client
    );

    const joinedOnce = await player2Service.joinAdedonhaRoom(
      created.code,
      'Ana'
    );
    expect(joinedOnce.players).toHaveLength(2);

    // Reentrar sem sair (mesmo userId, mesmo nickname) não deve falhar nem duplicar
    const rejoinedSame = await player2Service.joinAdedonhaRoom(
      created.code,
      'Ana'
    );
    expect(rejoinedSame.players).toHaveLength(2);

    // Sair no lobby remove da lista e permite voltar com o mesmo nome
    await player2Service.leaveAdedonhaRoom(created.id, 'user-anon-2');
    const afterLeave = await hostService.getAdedonhaRoom(created.id);
    expect(afterLeave.players).toHaveLength(1);

    const rejoinedAfterLeave = await player2Service.joinAdedonhaRoom(
      created.code,
      'Ana'
    );
    expect(rejoinedAfterLeave.players).toHaveLength(2);

    // Outro usuário (user-anon-3) tentando entrar com o mesmo nome "Ana" deve receber ValidationError
    const fakePlayer3 = createFakeSupabaseClient({
      rooms: fakePlayer2.db.rooms,
      room_players: fakePlayer2.db.room_players,
      adedonha_submissions: fakePlayer2.db.adedonha_submissions,
    });
    fakePlayer3.rawClient.auth.signInAnonymously = jest.fn(async () => ({
      data: { user: { id: 'user-anon-3' } },
      error: null,
    }));
    const player3Service = new SupabaseMultiplayerRoomService(
      {
        supabaseUrl: 'https://proj.supabase.co',
        supabaseAnonKey: 'anon-key',
      },
      undefined,
      fakePlayer3.client
    );

    await expect(
      player3Service.joinAdedonhaRoom(created.code, 'ana')
    ).rejects.toThrow(ValidationError);

    // Jogador 3 com nome distinto entra normalmente (3+ jogadores sem sobrescrever)
    const joined3 = await player3Service.joinAdedonhaRoom(
      created.code,
      'Lucas'
    );
    expect(joined3.players).toHaveLength(3);
    expect(joined3.players.map((p) => p.nickname)).toEqual([
      'Heber',
      'Ana',
      'Lucas',
    ]);
  });

  it('deve suportar 3+ jogadores no Cidade Dorme via room_players sem sobrescrever o último logado e manter status lobby', async () => {
    const fake = createFakeSupabaseClient();
    const hostService = new SupabaseMultiplayerRoomService(
      {
        supabaseUrl: 'https://proj.supabase.co',
        supabaseAnonKey: 'anon-key',
      },
      undefined,
      fake.client
    );

    const created = await hostService.createCidadeDormeRoom('Heber');
    expect(created.players).toHaveLength(1);

    const joinAs = async (uid: string, nick: string) => {
      const clientFake = createFakeSupabaseClient({
        rooms: fake.db.rooms,
        room_players: fake.db.room_players,
        adedonha_submissions: fake.db.adedonha_submissions,
      });
      clientFake.rawClient.auth.signInAnonymously = jest.fn(async () => ({
        data: { user: { id: uid } },
        error: null,
      }));
      const svc = new SupabaseMultiplayerRoomService(
        {
          supabaseUrl: 'https://proj.supabase.co',
          supabaseAnonKey: 'anon-key',
        },
        undefined,
        clientFake.client
      );
      return { svc, room: await svc.joinCidadeDormeRoom(created.code, nick) };
    };

    const p2 = await joinAs('user-cd-2', 'Ana');
    expect(p2.room.players).toHaveLength(2);

    const p3 = await joinAs('user-cd-3', 'Lucas');
    expect(p3.room.players).toHaveLength(3);
    expect(p3.room.players.map((p) => p.nickname)).toEqual([
      'Heber',
      'Ana',
      'Lucas',
    ]);

    // Atualizar config no lobby preserva status 'lobby' e todos os 3 jogadores
    const updated = await hostService.updateCidadeDormeConfig(created.id, {
      narratorVoice: 'feminina',
    });
    expect(updated.players).toHaveLength(3);
    expect(fake.db.rooms[0].status).toBe('lobby');

    // Sair e reentrar com o mesmo nome no Cidade Dorme
    await p2.svc.leaveCidadeDormeRoom(created.id, 'user-cd-2');
    const afterLeave = await hostService.getCidadeDormeRoom(created.id);
    expect(afterLeave.players).toHaveLength(2);

    const rejoined = await p2.svc.joinCidadeDormeRoom(created.code, 'Ana');
    expect(rejoined.players).toHaveLength(3);
  });
});
