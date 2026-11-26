import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseMultiplayerRoomService } from '@/infra/services/supabaseMultiplayerRoomService';
import type { DrawingElement } from '@/model/entities/drawingChallenge';
import { ConflictError, ValidationError } from '@/model/errors';

type ChannelHandler = (payload?: unknown) => void;

function createDesenhoFakeSupabase(authUserId: string) {
  const fromCalls: string[] = [];
  const rpcCalls: Array<{ fn: string; params: Record<string, unknown> }> = [];
  const broadcastSent: Array<Record<string, unknown>> = [];
  const channelHandlers: Record<string, ChannelHandler[]> = {};

  const roomRow = {
    id: 'room-desenho-1',
    code: 'DES123',
    game_type: 'desenho',
    host_id: 'drawer-1',
    status: 'playing',
    phase: 'drawing',
    version: 3,
    phase_ends_at: new Date(Date.now() + 90_000).toISOString(),
    current_round: 1,
    config: {
      turnDurationSeconds: 90,
      totalRounds: 2,
      categories: ['Bíblico'],
      drawerOrder: ['drawer-1', 'guesser-2'],
      currentDrawerIndex: 0,
      currentDrawerId: 'drawer-1',
      currentCardCategory: 'Bíblico',
      usedCardIds: ['c-1'],
      elements: [] as DrawingElement[],
      guessedPlayerIds: [] as string[],
      drawingScoresByUserId: {},
      firstGuessCountsByUserId: {},
    },
  };

  const playerRows = [
    {
      id: 'rp-1',
      room_id: 'room-desenho-1',
      user_id: 'drawer-1',
      nickname: 'Roger',
      is_host: true,
      score: 0,
    },
    {
      id: 'rp-2',
      room_id: 'room-desenho-1',
      user_id: 'guesser-2',
      nickname: 'Ana',
      is_host: false,
      score: 0,
    },
  ];

  const secretRow = {
    room_id: 'room-desenho-1',
    drawer_id: 'drawer-1',
    category: 'Bíblico',
    secret_word: 'Arca de Noé',
  };

  const rpcMock = jest.fn(
    async (fn: string, params: Record<string, unknown>) => {
      rpcCalls.push({ fn, params });
      if (fn === 'desenho_append_element') {
        roomRow.version += 1;
        roomRow.config.elements = [
          ...roomRow.config.elements,
          params.p_element as DrawingElement,
        ];
        return {
          data: {
            version: roomRow.version,
            elementsCount: roomRow.config.elements.length,
          },
          error: null,
        };
      }
      if (fn === 'desenho_undo_element') {
        roomRow.version += 1;
        roomRow.config.elements = roomRow.config.elements.slice(0, -1);
        return {
          data: {
            version: roomRow.version,
            elementsCount: roomRow.config.elements.length,
          },
          error: null,
        };
      }
      if (fn === 'desenho_clear_canvas') {
        roomRow.version += 1;
        roomRow.config.elements = [];
        return {
          data: {
            version: roomRow.version,
            elementsCount: 0,
          },
          error: null,
        };
      }
      return { data: null, error: { message: `RPC não suportada: ${fn}` } };
    }
  );

  type FakeChannel = {
    on: jest.Mock<
      FakeChannel,
      [string, { event?: string; table?: string }, ChannelHandler]
    >;
    subscribe: jest.Mock<FakeChannel, [((status: string) => void)?]>;
    send: jest.Mock<Promise<string>, [Record<string, unknown>]>;
  };

  const channelMock: FakeChannel = {
    on: jest.fn(
      (
        type: string,
        filter: { event?: string; table?: string },
        cb: ChannelHandler
      ): FakeChannel => {
        const key =
          type === 'broadcast'
            ? `broadcast:${filter.event ?? ''}`
            : `pg:${filter.table ?? ''}`;
        channelHandlers[key] = [...(channelHandlers[key] ?? []), cb];
        return channelMock;
      }
    ),
    subscribe: jest.fn((cb?: (status: string) => void): FakeChannel => {
      cb?.('SUBSCRIBED');
      return channelMock;
    }),
    send: jest.fn(async (msg: Record<string, unknown>): Promise<string> => {
      broadcastSent.push(msg);
      return 'ok';
    }),
  };

  const makeQueryBuilder = (table: string) => {
    const resolveTable = () => {
      if (table === 'rooms') return { data: roomRow, error: null };
      if (table === 'room_players') return { data: playerRows, error: null };
      if (table === 'desenho_guesses') return { data: [], error: null };
      if (table === 'desenho_secrets') return { data: secretRow, error: null };
      return { data: null, error: null };
    };
    const builder: Record<string, unknown> = {
      select: jest.fn(() => builder),
      eq: jest.fn(() => builder),
      order: jest.fn(() => builder),
      single: jest.fn(async () => resolveTable()),
      maybeSingle: jest.fn(async () => resolveTable()),
      then: (
        resolve: (value: { data: unknown; error: unknown }) => void
      ) => {
        resolve(resolveTable());
      },
    };
    return builder;
  };

  const client = {
    auth: {
      getSession: jest.fn(async () => ({
        data: { session: { user: { id: authUserId } } },
        error: null,
      })),
      signInAnonymously: jest.fn(async () => ({
        data: { user: { id: authUserId } },
        error: null,
      })),
    },
    from: jest.fn((table: string) => {
      fromCalls.push(table);
      return makeQueryBuilder(table);
    }),
    rpc: rpcMock,
    channel: jest.fn(() => channelMock),
    removeChannel: jest.fn(async () => 'ok'),
  } as unknown as SupabaseClient;

  return {
    client,
    rpcMock,
    fromCalls,
    rpcCalls,
    broadcastSent,
    channelHandlers,
  };
}

const SAMPLE_STROKE: DrawingElement = {
  id: 'el-1',
  tool: 'freehand',
  points: [
    { x: 10, y: 10 },
    { x: 30, y: 35 },
  ],
  colorId: 'ink',
  widthId: 'thin',
};

describe('SupabaseMultiplayerRoomService — Desenho Relâmpago (RPC atômica e delta Realtime)', () => {
  it('deve usar RPCs atômicas + broadcast canvas_delta sem reconsultar tabelas a cada traço, desfazer ou limpar', async () => {
    const fake = createDesenhoFakeSupabase('drawer-1');
    const service = new SupabaseMultiplayerRoomService(
      {
        supabaseUrl: 'https://proj.supabase.co',
        supabaseAnonKey: 'anon-key',
      },
      undefined,
      fake.client
    );

    const onUpdate = jest.fn();
    const unsubscribe = service.subscribeToDesenhoRoom('room-desenho-1', onUpdate);
    await Promise.resolve();
    await Promise.resolve();

    // Carrega snapshot inicial no cache
    const initial = await service.getDesenhoRoom('room-desenho-1', 'drawer-1');
    expect(initial.elements).toHaveLength(0);
    expect(initial.version).toBe(3);

    // Zera contagem de chamadas a tabelas antes de desenhar
    fake.fromCalls.length = 0;

    const afterAdd = await service.addDesenhoElement(
      'room-desenho-1',
      'drawer-1',
      SAMPLE_STROKE
    );
    expect(afterAdd.elements).toEqual([SAMPLE_STROKE]);
    expect(afterAdd.version).toBe(4);
    expect(fake.rpcCalls[0]).toEqual({
      fn: 'desenho_append_element',
      params: { p_room_id: 'room-desenho-1', p_element: SAMPLE_STROKE },
    });
    // Zero queries extras em rooms/room_players/desenho_guesses/desenho_secrets
    expect(fake.fromCalls).toHaveLength(0);
    expect(fake.broadcastSent).toContainEqual(
      expect.objectContaining({
        type: 'broadcast',
        event: 'canvas_delta',
        payload: expect.objectContaining({
          roomId: 'room-desenho-1',
          senderId: 'drawer-1',
          op: 'append',
          element: SAMPLE_STROKE,
          version: 4,
        }),
      })
    );

    const afterUndo = await service.undoDesenhoElement(
      'room-desenho-1',
      'drawer-1'
    );
    expect(afterUndo.elements).toHaveLength(0);
    expect(afterUndo.version).toBe(5);
    expect(fake.fromCalls).toHaveLength(0);

    await service.addDesenhoElement('room-desenho-1', 'drawer-1', SAMPLE_STROKE);
    const afterClear = await service.clearDesenhoCanvas(
      'room-desenho-1',
      'drawer-1'
    );
    expect(afterClear.elements).toHaveLength(0);
    expect(afterClear.version).toBe(7);
    expect(fake.fromCalls).toHaveLength(0);

    unsubscribe();
  });

  it('deve aplicar canvas_delta no adivinhador sem disparar refresh e ignorar postgres_changes redundante da mesma versão', async () => {
    const fake = createDesenhoFakeSupabase('guesser-2');
    const service = new SupabaseMultiplayerRoomService(
      {
        supabaseUrl: 'https://proj.supabase.co',
        supabaseAnonKey: 'anon-key',
      },
      undefined,
      fake.client
    );

    const updates: number[] = [];
    const receivedElementCounts: number[] = [];
    const unsubscribe = service.subscribeToDesenhoRoom(
      'room-desenho-1',
      (room) => {
        updates.push(room.version);
        receivedElementCounts.push(room.elements.length);
      }
    );

    // Aguarda o snapshot inicial do SUBSCRIBED popular o cache
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(updates).toEqual([3]);
    expect(receivedElementCounts).toEqual([0]);

    fake.fromCalls.length = 0;

    // Adivinhador recebe broadcast canvas_delta do desenhista
    const deltaHandlers = fake.channelHandlers['broadcast:canvas_delta'] ?? [];
    expect(deltaHandlers.length).toBeGreaterThan(0);
    deltaHandlers.forEach((h) =>
      h({
        payload: {
          roomId: 'room-desenho-1',
          senderId: 'drawer-1',
          op: 'append',
          element: SAMPLE_STROKE,
          version: 4,
        },
      })
    );

    expect(updates).toEqual([3, 4]);
    expect(receivedElementCounts).toEqual([0, 1]);
    expect(fake.fromCalls).toHaveLength(0);

    // Em seguida chega o postgres_changes em rooms da mesma versão 4: deve ser ignorado!
    const roomChangeHandlers = fake.channelHandlers['pg:rooms'] ?? [];
    roomChangeHandlers.forEach((h) =>
      h({ new: { version: 4, phase: 'drawing' } })
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fake.fromCalls).toHaveLength(0);

    unsubscribe();
  });

  it('deve mapear erros CONFLICT_PHASE e VALIDATION_ERROR das RPCs de desenho', async () => {
    const fake = createDesenhoFakeSupabase('guesser-2');
    const service = new SupabaseMultiplayerRoomService(
      {
        supabaseUrl: 'https://proj.supabase.co',
        supabaseAnonKey: 'anon-key',
      },
      undefined,
      fake.client
    );

    fake.rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'CONFLICT_PHASE: Não é possível editar fora da fase ativa.' },
    });
    await expect(
      service.addDesenhoElement('room-desenho-1', 'guesser-2', SAMPLE_STROKE)
    ).rejects.toThrow(ConflictError);

    fake.rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'VALIDATION_ERROR: Apenas o desenhista da vez pode desenhar.' },
    });
    await expect(
      service.undoDesenhoElement('room-desenho-1', 'guesser-2')
    ).rejects.toThrow(ValidationError);
  });
});
