-- Migration 004: RPCs atômicas para Adedonha (compare-and-set, upsert de respostas e dúvidas)

create or replace function public.adedonha_set_phase(
  p_room_id uuid,
  p_expected_phase text,
  p_next_phase text,
  p_phase_ends_at timestamptz default null
)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms;
begin
  update public.rooms
  set phase = p_next_phase,
      phase_ends_at = p_phase_ends_at,
      status = case
        when p_next_phase = 'finished' then 'finished'
        when p_next_phase = 'lobby' then 'waiting'
        else 'playing'
      end
  where id = p_room_id
    and game_type = 'adedonha'
    and phase = p_expected_phase
  returning * into v_room;

  if not found then
    raise exception 'CONFLICT_PHASE: A sala não está na fase esperada (%).', p_expected_phase
      using errcode = 'P0001';
  end if;

  return v_room;
end;
$$;

create or replace function public.adedonha_trigger_stop(
  p_room_id uuid
)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.rooms;
  v_player public.room_players;
  v_counts jsonb;
  v_prev_count int;
begin
  if v_uid is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select * into v_player
  from public.room_players
  where room_id = p_room_id and user_id = v_uid;

  if not found then
    raise exception 'Jogador não encontrado para acionar ADEDONHA.';
  end if;

  select * into v_room
  from public.rooms
  where id = p_room_id and game_type = 'adedonha'
  for update;

  if not found then
    raise exception 'Sala de Adedonha não encontrada.';
  end if;

  -- Idempotente se já estiver em stop_countdown
  if v_room.phase = 'stop_countdown' then
    return v_room;
  end if;

  if v_room.phase <> 'filling' then
    raise exception 'CONFLICT_PHASE: ADEDONHA só pode ser acionado durante o preenchimento.'
      using errcode = 'P0001';
  end if;

  v_counts := coalesce(v_room.config -> 'stopCountsByUserId', '{}'::jsonb);
  v_prev_count := coalesce((v_counts ->> v_uid::text)::int, 0);

  update public.rooms
  set phase = 'stop_countdown',
      phase_ends_at = now() + interval '5 seconds',
      config = jsonb_set(
        jsonb_set(
          coalesce(v_room.config, '{}'::jsonb),
          '{stopTriggeredBy}',
          to_jsonb(v_player.nickname),
          true
        ),
        '{stopCountsByUserId}',
        jsonb_set(v_counts, array[v_uid::text], to_jsonb(v_prev_count + 1), true),
        true
      )
  where id = p_room_id and phase = 'filling'
  returning * into v_room;

  return v_room;
end;
$$;

create or replace function public.adedonha_submit_answers(
  p_room_id uuid,
  p_answers jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.rooms;
  v_col text;
  v_val text;
begin
  if v_uid is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select * into v_room
  from public.rooms
  where id = p_room_id and game_type = 'adedonha';

  if not found then
    raise exception 'Sala de Adedonha não encontrada.';
  end if;

  if v_room.phase not in ('filling', 'stop_countdown') then
    raise exception 'CONFLICT_PHASE: Envio de respostas encerrado para esta rodada.'
      using errcode = 'P0001';
  end if;

  for v_col, v_val in
    select key, value from jsonb_each_text(coalesce(p_answers, '{}'::jsonb))
  loop
    insert into public.adedonha_submissions (
      room_id, round_number, user_id, column_name, answer_text, status, doubt_count, points
    )
    values (
      p_room_id, v_room.current_round, v_uid, v_col, btrim(coalesce(v_val, '')), 'pending', 0, 0
    )
    on conflict (room_id, round_number, user_id, column_name)
    do update set answer_text = excluded.answer_text;
  end loop;
end;
$$;

create or replace function public.adedonha_raise_doubt(
  p_room_id uuid,
  p_submission_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms;
begin
  select * into v_room
  from public.rooms
  where id = p_room_id and game_type = 'adedonha';

  if not found or v_room.phase <> 'tally' then
    raise exception 'CONFLICT_PHASE: Dúvidas só podem ser levantadas durante a apuração.'
      using errcode = 'P0001';
  end if;

  update public.adedonha_submissions
  set doubt_count = doubt_count + 1
  where id = p_submission_id and room_id = p_room_id;
end;
$$;
