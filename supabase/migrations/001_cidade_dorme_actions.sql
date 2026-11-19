-- Migração 001: Ações atômicas e sincronização temporal do Cidade Dorme (Issues #38 e #41)

alter table public.rooms
  add column if not exists phase_ends_at timestamptz;

alter table public.room_players
  add column if not exists is_alive boolean not null default true,
  add column if not exists is_ready boolean not null default false,
  add column if not exists has_voted boolean not null default false;

create table if not exists public.cidade_dorme_actions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  round_number int not null,
  user_id uuid not null,
  kind varchar(30) not null check (
    kind in ('ready', 'night_assassin', 'night_angel', 'night_detective', 'vote')
  ),
  target_id text,
  created_at timestamptz not null default now(),
  unique (room_id, round_number, user_id, kind)
);

create index if not exists idx_cidade_dorme_actions_room_round
  on public.cidade_dorme_actions (room_id, round_number, kind);

alter table public.cidade_dorme_actions enable row level security;

drop policy if exists "Autor lê apenas suas próprias ações no Cidade Dorme"
  on public.cidade_dorme_actions;
create policy "Autor lê apenas suas próprias ações no Cidade Dorme"
  on public.cidade_dorme_actions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Autor registra apenas suas próprias ações no Cidade Dorme"
  on public.cidade_dorme_actions;
create policy "Autor registra apenas suas próprias ações no Cidade Dorme"
  on public.cidade_dorme_actions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Autor atualiza apenas suas próprias ações no Cidade Dorme"
  on public.cidade_dorme_actions;
create policy "Autor atualiza apenas suas próprias ações no Cidade Dorme"
  on public.cidade_dorme_actions
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.cidade_dorme_mark_ready(
  p_room_id uuid,
  p_mark_all boolean default false,
  p_night_turn_ends_at timestamptz default null,
  p_night_caption text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.rooms%rowtype;
  v_total int;
  v_ready int;
  v_next_caption text;
  v_next_ends_at timestamptz;
  v_next_config jsonb;
begin
  if v_uid is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select * into v_room
  from public.rooms
  where id = p_room_id
  for update;

  if not found then
    raise exception 'Sala de Cidade Dorme não encontrada.';
  end if;

  if v_room.phase <> 'role_reveal' then
    raise exception 'A confirmação de papel só pode ocorrer na fase de revelação.';
  end if;

  if not exists (
    select 1 from public.room_players
    where room_id = p_room_id and user_id = v_uid
  ) then
    raise exception 'Jogador não encontrado na sala.';
  end if;

  if p_mark_all then
    update public.room_players
    set is_ready = true
    where room_id = p_room_id;

    insert into public.cidade_dorme_actions (room_id, round_number, user_id, kind, target_id)
    select p_room_id, v_room.current_round, rp.user_id, 'ready', null
    from public.room_players rp
    where rp.room_id = p_room_id
    on conflict (room_id, round_number, user_id, kind)
    do update set created_at = now();
  else
    update public.room_players
    set is_ready = true
    where room_id = p_room_id and user_id = v_uid;

    insert into public.cidade_dorme_actions (room_id, round_number, user_id, kind, target_id)
    values (p_room_id, v_room.current_round, v_uid, 'ready', null)
    on conflict (room_id, round_number, user_id, kind)
    do update set created_at = now();
  end if;

  select count(*), count(*) filter (where is_ready)
  into v_total, v_ready
  from public.room_players
  where room_id = p_room_id;

  if v_total > 0 and v_ready >= v_total then
    v_next_caption := coalesce(
      p_night_caption,
      'A cidade dorme... Todos fecham os olhos. Assassino, acorde e escolha sua vítima.'
    );
    v_next_ends_at := coalesce(
      p_night_turn_ends_at,
      now() + (coalesce((v_room.config->'config'->>'nightTurnSeconds')::int, 15) * interval '1 second')
    );
    v_next_config := coalesce(v_room.config, '{}'::jsonb) || jsonb_build_object(
      'phaseEndsAt', to_char(v_next_ends_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'narratorCaption', v_next_caption
    );

    update public.rooms
    set phase = 'night_assassin',
        status = 'playing',
        phase_ends_at = v_next_ends_at,
        narrator_caption = v_next_caption,
        config = v_next_config
    where id = p_room_id and phase = 'role_reveal';
  end if;

  return jsonb_build_object(
    'roomId', p_room_id,
    'readyCount', v_ready,
    'totalPlayers', v_total
  );
end;
$$;

create or replace function public.cidade_dorme_cast_vote(
  p_room_id uuid,
  p_target_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.rooms%rowtype;
  v_voter public.room_players%rowtype;
  v_choice text := trim(coalesce(p_target_id, ''));
  v_target_alive boolean;
begin
  if v_uid is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select * into v_room
  from public.rooms
  where id = p_room_id;

  if not found then
    raise exception 'Sala de Cidade Dorme não encontrada.';
  end if;

  if v_room.phase <> 'day_voting' then
    raise exception 'A sala não está em fase de votação.';
  end if;

  select * into v_voter
  from public.room_players
  where room_id = p_room_id and user_id = v_uid;

  if not found then
    raise exception 'Jogador votante não encontrado na sala.';
  end if;

  if not v_voter.is_alive then
    raise exception 'Você foi eliminado e está no Modo Espectador — acompanhe em silêncio.';
  end if;

  if v_choice = '' then
    raise exception 'Selecione um suspeito vivo ou escolha Abster-se / Pular Voto.';
  end if;

  if v_choice <> 'skip' then
    if v_choice = v_uid::text then
      raise exception 'Você não pode votar em si mesmo na votação da cidade.';
    end if;

    select is_alive into v_target_alive
    from public.room_players
    where room_id = p_room_id and user_id::text = v_choice;

    if not coalesce(v_target_alive, false) then
      raise exception 'Selecione um suspeito vivo ou escolha Abster-se / Pular Voto.';
    end if;
  end if;

  insert into public.cidade_dorme_actions (room_id, round_number, user_id, kind, target_id)
  values (p_room_id, v_room.current_round, v_uid, 'vote', v_choice)
  on conflict (room_id, round_number, user_id, kind)
  do update set target_id = excluded.target_id, created_at = now();

  update public.room_players
  set has_voted = true
  where room_id = p_room_id and user_id = v_uid;

  return jsonb_build_object(
    'roomId', p_room_id,
    'roundNumber', v_room.current_round,
    'voterId', v_uid
  );
end;
$$;
