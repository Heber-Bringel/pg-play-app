import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseMultiplayerRoomService } from '@/infra/services/supabaseMultiplayerRoomService';
import { AuthError, DataSourceError, ValidationError } from '@/model/errors';

type MockTableState = {
  rooms: Record<string, unknown>[];
  room_players: Record<string, unknown>[];
  adedonha_submissions: Record<string, unknown>[];
  cidade_dorme_secrets: Record<string, unknown>[];
  cidade_dorme_actions: Record<string, unknown>[];
};

function createFakeSupabaseClient(
  initial?: Partial<MockTableState> & { authUserId?: string }
) {
  const db: MockTableState = {
    rooms: initial?.rooms ?? [],
    room_players: initial?.room_players ?? [],
    adedonha_submissions: initial?.adedonha_submissions ?? [],
    cidade_dorme_secrets: initial?.cidade_dorme_secrets ?? [],
    cidade_dorme_actions: initial?.cidade_dorme_actions ?? [],
  };
  const authUserId = initial?.authUserId ?? 'user-anon-1';

  const channelOnHandlers: Array<() => void> = [];
  type MockChannel = {
    on: jest.Mock<MockChannel, [string, unknown, () => void]>;
    subscribe: jest.Mock<MockChannel, [((status?: string) => void)?]>;
    send: jest.Mock<Promise<'ok'>, [unknown]>;
  };
  const mockChannel: MockChannel = {
    on: jest.fn(
      (_event: string, _filter: unknown, cb: () => void): MockChannel => {
        channelOnHandlers.push(cb);
        return mockChannel;
      }
    ),
    subscribe: jest.fn((_cb?: (status?: string) => void): MockChannel => mockChannel),
    send: jest.fn(async (_payload: unknown) => 'ok' as const),
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
        data: { user: { id: authUserId } },
        error: null,
      })),
    },
    channel: jest.fn(() => mockChannel),
    removeChannel: jest.fn(async () => 'ok'),
    rpc: jest.fn(
      async (
        fnName: string,
        params: Record<string, unknown>
      ): Promise<{ data: unknown; error: { message: string; code?: string } | null }> => {
        const roomId = params.p_room_id as string;
        const room = db.rooms.find((r) => r.id === roomId);
        if (!room) {
          return { data: null, error: { message: 'Sala não encontrada.' } };
        }

        if (fnName === 'cidade_dorme_start_match') {
          const roles = (params.p_assigned_roles ?? {}) as Record<
            string,
            string
          >;
          const caption =
            (params.p_narrator_caption as string) ??
            'Papéis secretos distribuídos!';
          const remainingSecrets = db.cidade_dorme_secrets.filter(
            (s) => s.room_id !== roomId
          );
          db.cidade_dorme_secrets.splice(
            0,
            db.cidade_dorme_secrets.length,
            ...remainingSecrets
          );
          const remainingActions = db.cidade_dorme_actions.filter(
            (a) => a.room_id !== roomId
          );
          db.cidade_dorme_actions.splice(
            0,
            db.cidade_dorme_actions.length,
            ...remainingActions
          );
          for (const rp of db.room_players.filter(
            (p) => p.room_id === roomId
          )) {
            rp.is_alive = true;
            rp.is_ready = false;
            rp.has_voted = false;
            db.cidade_dorme_secrets.push({
              room_id: roomId,
              user_id: rp.user_id,
              secret_role: roles[rp.user_id as string] ?? 'cidadao',
              detective_verdict: null,
            });
          }
          const prevCfg = (room.config as Record<string, unknown>) ?? {};
          room.phase = 'role_reveal';
          room.status = 'playing';
          room.current_round = 1;
          room.phase_ends_at = null;
          room.narrator_caption = caption;
          room.config = {
            config: prevCfg.config,
            phaseEndsAt: null,
            narratorCaption: caption,
            dawnReport: null,
            voteReport: null,
            winner: null,
          };
          return { data: { roomId }, error: null };
        }

        if (fnName === 'cidade_dorme_mark_ready') {
          const markAll = Boolean(params.p_mark_all);
          const roomPlayers = db.room_players.filter(
            (p) => p.room_id === roomId
          );
          for (const rp of roomPlayers) {
            if (markAll || rp.user_id === authUserId) {
              rp.is_ready = true;
              const idx = db.cidade_dorme_actions.findIndex(
                (a) =>
                  a.room_id === roomId &&
                  a.round_number === room.current_round &&
                  a.user_id === rp.user_id &&
                  a.kind === 'ready'
              );
              const act = {
                id: `act-${db.cidade_dorme_actions.length + 1}`,
                room_id: roomId,
                round_number: room.current_round,
                user_id: rp.user_id,
                kind: 'ready',
                target_id: null,
                created_at: new Date().toISOString(),
              };
              if (idx >= 0) db.cidade_dorme_actions[idx] = act;
              else db.cidade_dorme_actions.push(act);
            }
          }
          if (roomPlayers.every((p) => Boolean(p.is_ready))) {
            const nextEnds = (params.p_night_turn_ends_at as string | null) ?? null;
            const nextCaption =
              (params.p_night_caption as string | null) ??
              'A cidade dorme... Todos fecham os olhos. Assassino, acorde e escolha sua vítima.';
            room.phase = 'night_assassin';
            room.phase_ends_at = nextEnds;
            room.narrator_caption = nextCaption;
            const prevCfg = (room.config as Record<string, unknown>) ?? {};
            room.config = {
              ...prevCfg,
              phaseEndsAt: nextEnds,
              narratorCaption: nextCaption,
            };
          }
          return { data: { roomId }, error: null };
        }

        if (fnName === 'cidade_dorme_submit_night_action') {
          const kind = params.p_kind as string;
          const targetId = (params.p_target_id as string | null) ?? null;
          const idx = db.cidade_dorme_actions.findIndex(
            (a) =>
              a.room_id === roomId &&
              a.round_number === room.current_round &&
              a.user_id === authUserId &&
              a.kind === kind
          );
          const act = {
            id: `act-${db.cidade_dorme_actions.length + 1}`,
            room_id: roomId,
            round_number: room.current_round,
            user_id: authUserId,
            kind,
            target_id: targetId,
            created_at: new Date().toISOString(),
          };
          if (idx >= 0) db.cidade_dorme_actions[idx] = act;
          else db.cidade_dorme_actions.push(act);

          if (kind === 'night_detective' && targetId) {
            const targetPlayer = db.room_players.find(
              (p) => p.room_id === roomId && p.user_id === targetId
            );
            const targetSecret = db.cidade_dorme_secrets.find(
              (s) => s.room_id === roomId && s.user_id === targetId
            );
            const mySecret = db.cidade_dorme_secrets.find(
              (s) => s.room_id === roomId && s.user_id === authUserId
            );
            if (mySecret && targetPlayer) {
              mySecret.detective_verdict = {
                targetPlayerId: targetId,
                targetNickname: targetPlayer.nickname,
                isAssassin: targetSecret?.secret_role === 'assassino',
                roundNumber: room.current_round,
              };
            }
          }
          return { data: { roomId }, error: null };
        }

        if (fnName === 'cidade_dorme_cast_vote') {
          const targetId = params.p_target_id as string;
          const idx = db.cidade_dorme_actions.findIndex(
            (a) =>
              a.room_id === roomId &&
              a.round_number === room.current_round &&
              a.user_id === authUserId &&
              a.kind === 'vote'
          );
          const act = {
            id: `act-${db.cidade_dorme_actions.length + 1}`,
            room_id: roomId,
            round_number: room.current_round,
            user_id: authUserId,
            kind: 'vote',
            target_id: targetId,
            created_at: new Date().toISOString(),
          };
          if (idx >= 0) db.cidade_dorme_actions[idx] = act;
          else db.cidade_dorme_actions.push(act);

          const voter = db.room_players.find(
            (p) => p.room_id === roomId && p.user_id === authUserId
          );
          if (voter) voter.has_voted = true;
          return { data: { roomId }, error: null };
        }

        if (fnName === 'cidade_dorme_get_ally_assassins') {
          const mySecret = db.cidade_dorme_secrets.find(
            (s) => s.room_id === roomId && s.user_id === authUserId
          );
          if (mySecret?.secret_role !== 'assassino') {
            return { data: [], error: null };
          }
          const allies = db.cidade_dorme_secrets
            .filter(
              (s) =>
                s.room_id === roomId &&
                s.secret_role === 'assassino' &&
                s.user_id !== authUserId
            )
            .map((s) => s.user_id);
          return { data: allies, error: null };
        }

        if (fnName === 'cidade_dorme_resolve_dawn') {
          const round = room.current_round as number;
          const assassinAct = db.cidade_dorme_actions.find(
            (a) =>
              a.room_id === roomId &&
              a.round_number === round &&
              a.kind === 'night_assassin'
          );
          const angelAct = db.cidade_dorme_actions.find(
            (a) =>
              a.room_id === roomId &&
              a.round_number === round &&
              a.kind === 'night_angel'
          );
          const attackedId = (assassinAct?.target_id as string | null) ?? null;
          const protectedId = (angelAct?.target_id as string | null) ?? null;
          const saved = Boolean(attackedId && protectedId === attackedId);
          const attackedPlayer = attackedId
            ? db.room_players.find(
                (p) => p.room_id === roomId && p.user_id === attackedId
              )
            : undefined;
          if (!saved && attackedPlayer) {
            attackedPlayer.is_alive = false;
          }
          for (const rp of db.room_players.filter(
            (p) => p.room_id === roomId
          )) {
            rp.has_voted = false;
          }
          const dawnReport = {
            roundNumber: round,
            attackedPlayerId: attackedId,
            attackedNickname: (attackedPlayer?.nickname as string) ?? null,
            savedByAngel: saved,
            eliminatedPlayerId: saved ? null : attackedId,
            eliminatedNickname: saved
              ? null
              : ((attackedPlayer?.nickname as string) ?? null),
            eliminatedRole: null,
          };
          const prevCfg = (room.config as Record<string, unknown>) ?? {};
          room.phase = 'day_debate';
          room.phase_ends_at = (params.p_debate_ends_at as string | null) ?? null;
          room.config = {
            ...prevCfg,
            dawnReport,
            phaseEndsAt: room.phase_ends_at,
          };
          return { data: { roomId }, error: null };
        }

        if (fnName === 'cidade_dorme_tally_votes') {
          const round = room.current_round as number;
          const votes = db.cidade_dorme_actions.filter(
            (a) =>
              a.room_id === roomId &&
              a.round_number === round &&
              a.kind === 'vote'
          );
          const voteCounts: Record<string, number> = {};
          let skipCount = 0;
          for (const v of votes) {
            const t = v.target_id as string;
            if (t === 'skip') skipCount += 1;
            else voteCounts[t] = (voteCounts[t] ?? 0) + 1;
          }
          const sorted = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
          const maxV = sorted[0]?.[1] ?? 0;
          const tie =
            maxV === 0 ||
            (sorted[1] && sorted[1][1] === maxV) ||
            skipCount >= maxV;
          const eliminatedId = !tie ? sorted[0][0] : null;
          const eliminatedPlayer = eliminatedId
            ? db.room_players.find(
                (p) => p.room_id === roomId && p.user_id === eliminatedId
              )
            : undefined;
          if (eliminatedPlayer) {
            eliminatedPlayer.is_alive = false;
          }
          const secrets = db.cidade_dorme_secrets.filter(
            (s) => s.room_id === roomId
          );
          const aliveAssassins = db.room_players.filter(
            (p) =>
              p.room_id === roomId &&
              p.is_alive !== false &&
              secrets.find((s) => s.user_id === p.user_id)?.secret_role ===
                'assassino'
          ).length;
          const winner = aliveAssassins === 0 ? 'cidade' : null;
          const voteReport = {
            roundNumber: round,
            eliminatedPlayerId: eliminatedId,
            eliminatedNickname: (eliminatedPlayer?.nickname as string) ?? null,
            eliminatedRole: null,
            tieOrSkipped: Boolean(tie),
            voteCounts,
            skipCount,
          };
          const prevCfg = (room.config as Record<string, unknown>) ?? {};
          room.phase = winner ? 'finished' : 'vote_result';
          room.status = winner ? 'finished' : 'playing';
          room.phase_ends_at = null;
          room.config = {
            ...prevCfg,
            voteReport,
            winner,
            phaseEndsAt: null,
          };
          return { data: { roomId }, error: null };
        }

        return { data: null, error: null };
      }
    ),
    from: jest.fn((table: keyof MockTableState): QueryBuilder => {
      const filters: Array<(row: Record<string, unknown>) => boolean> = [];

      const applyFilters = () => {
        let rows = db[table].filter((row) => filters.every((fn) => fn(row)));
        if (table === 'cidade_dorme_secrets') {
          rows = rows.filter((row) => {
            const room = db.rooms.find((r) => r.id === row.room_id);
            return room?.phase === 'finished' || row.user_id === authUserId;
          });
        }
        return rows;
      };

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

    // Remover jogador no lobby (inclusive se DELETE na tabela não ocorrer por RLS) e permitir reentrada
    await hostService.saveCidadeDormeRoom({
      ...afterLeave,
      players: afterLeave.players.slice(0, 1),
    });
    const afterKick = await hostService.getCidadeDormeRoom(created.id);
    expect(afterKick.players).toHaveLength(1);

    const rejoined = await p2.svc.joinCidadeDormeRoom(created.code, 'Ana');
    expect(rejoined.players).toHaveLength(2);
  });

  it('deve assinar rooms, room_players e broadcast no Cidade Dorme, isolar segredos de rooms.config (RNF11) e usar RPCs atômicas (#38, #40)', async () => {
    const fake = createFakeSupabaseClient({ authUserId: 'host-uuid' });
    const hostService = new SupabaseMultiplayerRoomService(
      {
        supabaseUrl: 'https://proj.supabase.co',
        supabaseAnonKey: 'anon-key',
      },
      undefined,
      fake.client
    );

    const created = await hostService.createCidadeDormeRoom('Heber');

    // Verificar inscrição Realtime em rooms, room_players e broadcast room_updated
    const unsubscribe = hostService.subscribeToCidadeDormeRoom(
      created.id,
      jest.fn()
    );
    expect(fake.mockChannel.on).toHaveBeenCalledTimes(3);
    expect(fake.mockChannel.on).toHaveBeenNthCalledWith(
      1,
      'postgres_changes',
      expect.objectContaining({ table: 'rooms' }),
      expect.any(Function)
    );
    expect(fake.mockChannel.on).toHaveBeenNthCalledWith(
      2,
      'postgres_changes',
      expect.objectContaining({ table: 'room_players' }),
      expect.any(Function)
    );
    expect(fake.mockChannel.on).toHaveBeenNthCalledWith(
      3,
      'broadcast',
      { event: 'room_updated' },
      expect.any(Function)
    );
    unsubscribe();

    // Adicionar mais 4 jogadores
    const playerIds = ['p2', 'p3', 'p4', 'p5'];
    const playerServices: Record<string, SupabaseMultiplayerRoomService> = {};
    for (let i = 0; i < playerIds.length; i++) {
      const uid = playerIds[i];
      const pFake = createFakeSupabaseClient({
        rooms: fake.db.rooms,
        room_players: fake.db.room_players,
        cidade_dorme_secrets: fake.db.cidade_dorme_secrets,
        cidade_dorme_actions: fake.db.cidade_dorme_actions,
        authUserId: uid,
      });
      const svc = new SupabaseMultiplayerRoomService(
        {
          supabaseUrl: 'https://proj.supabase.co',
          supabaseAnonKey: 'anon-key',
        },
        undefined,
        pFake.client
      );
      await svc.joinCidadeDormeRoom(created.code, `Jogador${i + 2}`);
      playerServices[uid] = svc;
    }

    // Iniciar partida via RPC segura e conferir que rooms.config não vaza roles/segredos
    const started = await hostService.startCidadeDormeMatch(
      created.id,
      {
        'host-uuid': 'detetive',
        p2: 'assassino',
        p3: 'anjo',
        p4: 'cidadao',
        p5: 'cidadao',
      },
      'Papéis distribuídos!'
    );

    const storedRoomConfig = fake.db.rooms[0].config as Record<
      string,
      unknown
    >;
    expect(storedRoomConfig.players).toBeUndefined();
    expect(storedRoomConfig.nightTargetId).toBeUndefined();
    expect(storedRoomConfig.nightProtectedId).toBeUndefined();
    expect(storedRoomConfig.detectiveVerdict).toBeUndefined();
    expect(storedRoomConfig.votesByPlayerId).toBeUndefined();

    // Host vê apenas seu próprio papel ('detetive') e os demais como null
    expect(started.players.find((p) => p.id === 'host-uuid')?.role).toBe(
      'detetive'
    );
    expect(started.players.find((p) => p.id === 'p2')?.role).toBeNull();

    // Jogador 2 vê apenas seu próprio papel ('assassino')
    const p2Room = await playerServices.p2.getCidadeDormeRoom(created.id);
    expect(p2Room.players.find((p) => p.id === 'p2')?.role).toBe('assassino');
    expect(p2Room.players.find((p) => p.id === 'host-uuid')?.role).toBeNull();

    // 5 confirmações simultâneas via RPC atômica
    await Promise.all([
      hostService.markCidadeDormePlayerReady(created.id, 'host-uuid'),
      ...playerIds.map((uid) =>
        playerServices[uid].markCidadeDormePlayerReady(created.id, uid)
      ),
    ]);
    const nightRoom = await hostService.getCidadeDormeRoom(created.id);
    expect(nightRoom.phase).toBe('night_assassin');
    expect(nightRoom.players.every((p) => p.isReady)).toBe(true);

    // Ação do Detetive e isolamento do veredito
    await hostService.submitCidadeDormeNightAction(
      created.id,
      'host-uuid',
      'night_detective',
      'p2'
    );
    const hostDetectiveView = await hostService.getCidadeDormeRoom(created.id);
    expect(hostDetectiveView.detectiveVerdict?.isAssassin).toBe(true);
    const p3DetectiveView = await playerServices.p3.getCidadeDormeRoom(
      created.id
    );
    expect(p3DetectiveView.detectiveVerdict).toBeNull();
    expect(
      (fake.db.rooms[0].config as Record<string, unknown>).detectiveVerdict
    ).toBeUndefined();

    // Amanhecer + Votação simultânea eliminando o Assassino (p2)
    await hostService.resolveCidadeDormeDawn(created.id);
    const currentRoom = await hostService.getCidadeDormeRoom(created.id);
    await hostService.saveCidadeDormeRoom({
      ...currentRoom,
      phase: 'day_voting',
    });

    await Promise.all([
      hostService.submitCidadeDormeVote(created.id, 'host-uuid', 'p2'),
      playerServices.p2.submitCidadeDormeVote(created.id, 'p2', 'p3'),
      playerServices.p3.submitCidadeDormeVote(created.id, 'p3', 'p2'),
      playerServices.p4.submitCidadeDormeVote(created.id, 'p4', 'p2'),
      playerServices.p5.submitCidadeDormeVote(created.id, 'p5', 'p2'),
    ]);

    const votingSnapshot = await hostService.getCidadeDormeRoom(created.id);
    expect(votingSnapshot.players.every((p) => p.hasVoted)).toBe(true);
    expect(votingSnapshot.votesByPlayerId).toEqual({});

    const finished = await hostService.tallyCidadeDormeVotes(created.id);
    expect(finished.phase).toBe('finished');
    expect(finished.winner).toBe('cidade');
    // Após finished, todos os papéis são revelados
    expect(finished.players.every((p) => p.role !== null)).toBe(true);
  });
});
