-- Migração 007: Sala Multiplayer do Desenho Relâmpago (UC12, RF41–RF44, RNF11)
-- Libera game_type = 'desenho' em public.rooms, cria tabelas de segredo e palpites com RLS + Realtime + RPCs atômicas.

alter table public.rooms
  drop constraint if exists rooms_game_type_check;

alter table public.rooms
  add constraint rooms_game_type_check
  check (game_type in ('cidade-dorme', 'adedonha', 'desenho'));

create table if not exists public.desenho_secrets (
  room_id uuid primary key references public.rooms(id) on delete cascade,
  drawer_id uuid not null,
  card_id text not null,
  category text not null,
  secret_word text not null,
  updated_at timestamptz not null default now()
);

create index if not exists idx_desenho_secrets_drawer_id
  on public.desenho_secrets (drawer_id);

create table if not exists public.desenho_guesses (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  round_number integer not null,
  drawer_index integer not null,
  user_id uuid not null,
  player_nickname text not null,
  guess_text text not null,
  is_correct boolean not null default false,
  points_awarded integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_desenho_guesses_room_turn
  on public.desenho_guesses (room_id, round_number, drawer_index, created_at);

alter table public.desenho_secrets enable row level security;
alter table public.desenho_guesses enable row level security;

drop policy if exists "Desenhista lê palavra secreta no turno e sala lê após encerrar"
  on public.desenho_secrets;
create policy "Desenhista lê palavra secreta no turno e sala lê após encerrar"
  on public.desenho_secrets
  for select
  to authenticated
  using (
    (select auth.uid()) = drawer_id
    or exists (
      select 1 from public.rooms r
      where r.id = room_id and r.phase in ('turn_summary', 'finished')
    )
  );

drop policy if exists "Jogadores da sala leem palpites do Desenho Relâmpago"
  on public.desenho_guesses;
create policy "Jogadores da sala leem palpites do Desenho Relâmpago"
  on public.desenho_guesses
  for select
  to authenticated
  using (
    exists (
      select 1 from public.room_players rp
      where rp.room_id = desenho_guesses.room_id
        and rp.user_id = (select auth.uid())
    )
  );

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'desenho_guesses'
  ) then
    alter publication supabase_realtime add table public.desenho_guesses;
  end if;
end
$$;

create or replace function public.desenho_normalize_guess(p_input text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    translate(
      lower(btrim(coalesce(p_input, ''))),
      'áàâãäéèêëíìîïóòôõöúùûüçñ',
      'aaaaaeeeeiiiiooooouuuucn'
    ),
    '\s+',
    ' ',
    'g'
  );
$$;

create or replace function public.desenho_start_turn(
  p_room_id uuid,
  p_drawer_id uuid,
  p_drawer_order jsonb,
  p_drawer_index int,
  p_round int,
  p_card_id text,
  p_secret_word text,
  p_category text,
  p_used_card_ids jsonb,
  p_phase_ends_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.rooms%rowtype;
  v_clean_config jsonb;
begin
  if v_uid is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select * into v_room
  from public.rooms
  where id = p_room_id and game_type = 'desenho'
  for update;

  if not found then
    raise exception 'Sala de Desenho Relâmpago não encontrada.';
  end if;

  if v_room.host_id <> v_uid then
    raise exception 'Somente o Anfitrião pode iniciar ou avançar o turno.';
  end if;

  insert into public.desenho_secrets (room_id, drawer_id, card_id, category, secret_word, updated_at)
  values (p_room_id, p_drawer_id, p_card_id, p_category, p_secret_word, now())
  on conflict (room_id)
  do update set
    drawer_id = excluded.drawer_id,
    card_id = excluded.card_id,
    category = excluded.category,
    secret_word = excluded.secret_word,
    updated_at = now();

  delete from public.desenho_guesses
  where room_id = p_room_id
    and round_number = p_round
    and drawer_index = p_drawer_index;

  v_clean_config := coalesce(v_room.config, '{}'::jsonb) || jsonb_build_object(
    'drawerOrder', coalesce(p_drawer_order, '[]'::jsonb),
    'currentDrawerIndex', p_drawer_index,
    'currentDrawerId', p_drawer_id::text,
    'currentCardCategory', p_category,
    'usedCardIds', coalesce(p_used_card_ids, '[]'::jsonb),
    'elements', '[]'::jsonb,
    'guessedPlayerIds', '[]'::jsonb
  );

  update public.rooms
  set phase = 'drawing',
      status = 'playing',
      current_round = p_round,
      phase_ends_at = p_phase_ends_at,
      config = v_clean_config
  where id = p_room_id;

  return jsonb_build_object('roomId', p_room_id, 'phase', 'drawing');
end;
$$;

create or replace function public.desenho_submit_guess(
  p_room_id uuid,
  p_text text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.rooms%rowtype;
  v_player public.room_players%rowtype;
  v_secret public.desenho_secrets%rowtype;
  v_clean_text text := btrim(coalesce(p_text, ''));
  v_is_correct boolean;
  v_drawer_index int;
  v_correct_count int := 0;
  v_guesser_points int := 0;
  v_drawer_points int := 0;
  v_total_guessers int := 0;
  v_guessed_ids jsonb;
  v_drawing_scores jsonb;
  v_first_counts jsonb;
  v_next_phase text := 'drawing';
begin
  if v_uid is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if length(v_clean_text) = 0 then
    raise exception 'Digite um palpite antes de enviar.';
  end if;

  select * into v_room
  from public.rooms
  where id = p_room_id and game_type = 'desenho'
  for update;

  if not found or v_room.phase <> 'drawing' then
    raise exception 'A sala não está aceitando palpites neste momento.';
  end if;

  select * into v_player
  from public.room_players
  where room_id = p_room_id and user_id = v_uid;

  if not found then
    raise exception 'Jogador não encontrado na sala.';
  end if;

  select * into v_secret
  from public.desenho_secrets
  where room_id = p_room_id;

  if not found then
    raise exception 'Nenhuma palavra ativa para este turno.';
  end if;

  if v_secret.drawer_id = v_uid then
    raise exception 'O desenhista da vez não pode enviar palpites.';
  end if;

  v_drawer_index := coalesce((v_room.config->>'currentDrawerIndex')::int, 0);

  if exists (
    select 1 from public.desenho_guesses
    where room_id = p_room_id
      and round_number = v_room.current_round
      and drawer_index = v_drawer_index
      and user_id = v_uid
      and is_correct = true
  ) then
    raise exception 'Você já acertou a palavra deste turno.';
  end if;

  v_is_correct := (
    public.desenho_normalize_guess(v_clean_text) =
    public.desenho_normalize_guess(v_secret.secret_word)
  );

  if v_is_correct then
    select count(*) into v_correct_count
    from public.desenho_guesses
    where room_id = p_room_id
      and round_number = v_room.current_round
      and drawer_index = v_drawer_index
      and is_correct = true;

    if v_correct_count = 0 then
      v_guesser_points := 20;
      v_drawer_points := 10;
    elsif v_correct_count = 1 then
      v_guesser_points := 15;
      v_drawer_points := 5;
    else
      v_guesser_points := 10;
      v_drawer_points := 5;
    end if;

    insert into public.desenho_guesses (
      room_id, round_number, drawer_index, user_id, player_nickname,
      guess_text, is_correct, points_awarded
    )
    values (
      p_room_id, v_room.current_round, v_drawer_index, v_uid, v_player.nickname,
      'Acertou a palavra!', true, v_guesser_points
    );

    update public.room_players
    set score = score + v_guesser_points
    where room_id = p_room_id and user_id = v_uid;

    update public.room_players
    set score = score + v_drawer_points
    where room_id = p_room_id and user_id = v_secret.drawer_id;

    v_guessed_ids := coalesce(v_room.config->'guessedPlayerIds', '[]'::jsonb) || to_jsonb(v_uid::text);
    v_drawing_scores := coalesce(v_room.config->'drawingScoresByUserId', '{}'::jsonb);
    v_drawing_scores := jsonb_set(
      v_drawing_scores,
      array[v_secret.drawer_id::text],
      to_jsonb(coalesce((v_drawing_scores->>v_secret.drawer_id::text)::int, 0) + v_drawer_points),
      true
    );

    v_first_counts := coalesce(v_room.config->'firstGuessCountsByUserId', '{}'::jsonb);
    if v_correct_count = 0 then
      v_first_counts := jsonb_set(
        v_first_counts,
        array[v_uid::text],
        to_jsonb(coalesce((v_first_counts->>v_uid::text)::int, 0) + 1),
        true
      );
    end if;

    select count(*) into v_total_guessers
    from public.room_players
    where room_id = p_room_id and user_id <> v_secret.drawer_id;

    if (v_correct_count + 1) >= greatest(v_total_guessers, 1) then
      v_next_phase := 'turn_summary';
    end if;

    update public.rooms
    set phase = v_next_phase,
        phase_ends_at = case when v_next_phase = 'turn_summary' then null else phase_ends_at end,
        config = coalesce(v_room.config, '{}'::jsonb) || jsonb_build_object(
          'guessedPlayerIds', v_guessed_ids,
          'drawingScoresByUserId', v_drawing_scores,
          'firstGuessCountsByUserId', v_first_counts
        )
    where id = p_room_id;
  else
    insert into public.desenho_guesses (
      room_id, round_number, drawer_index, user_id, player_nickname,
      guess_text, is_correct, points_awarded
    )
    values (
      p_room_id, v_room.current_round, v_drawer_index, v_uid, v_player.nickname,
      v_clean_text, false, 0
    );
  end if;

  return jsonb_build_object(
    'isCorrect', v_is_correct,
    'pointsAwarded', v_guesser_points,
    'phase', v_next_phase
  );
end;
$$;
