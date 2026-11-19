-- Migração 002: Isolamento RNF11, sorteio seguro e RPCs server-side do Cidade Dorme (Issues #39, #40, #41 e #42)

alter table public.cidade_dorme_secrets
  add column if not exists detective_verdict jsonb;

alter table public.cidade_dorme_secrets enable row level security;

drop policy if exists "Jogador ou anfitrião pode sair ou remover no lobby"
  on public.room_players;
create policy "Jogador ou anfitrião pode sair ou remover no lobby"
  on public.room_players
  for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.rooms r
      where r.id = room_id and r.host_id = auth.uid()
    )
  );

drop policy if exists "Jogador lê apenas seu próprio papel secreto"
  on public.cidade_dorme_secrets;
create policy "Jogador lê apenas seu próprio papel secreto"
  on public.cidade_dorme_secrets
  for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.rooms r
      where r.id = room_id and r.phase = 'finished'
    )
  );

create or replace function public.cidade_dorme_start_match(
  p_room_id uuid,
  p_assigned_roles jsonb default null,
  p_narrator_caption text default null
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
  v_assassin_count int;
  v_player record;
  v_idx int := 0;
  v_pool text[];
  v_role text;
  v_caption text;
  v_clean_config jsonb;
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

  if v_room.host_id <> v_uid then
    raise exception 'Somente o Moderador pode iniciar a partida.';
  end if;

  select count(*) into v_total
  from public.room_players
  where room_id = p_room_id;

  if v_total < 5 or v_total > 16 then
    raise exception 'O Cidade Dorme requer entre 5 e 16 jogadores.';
  end if;

  v_assassin_count := coalesce((v_room.config->'config'->>'assassinCount')::int, 1);

  if p_assigned_roles is null then
    v_pool := array['detetive', 'anjo'];
    for v_idx in 1..v_assassin_count loop
      v_pool := array_append(v_pool, 'assassino');
    end loop;
    while coalesce(array_length(v_pool, 1), 0) < v_total loop
      v_pool := array_append(v_pool, 'cidadao');
    end loop;

    select array_agg(role_item order by random())
    into v_pool
    from unnest(v_pool) as role_item;
  end if;

  delete from public.cidade_dorme_secrets where room_id = p_room_id;
  delete from public.cidade_dorme_actions where room_id = p_room_id;

  v_idx := 0;
  for v_player in
    select user_id
    from public.room_players
    where room_id = p_room_id
    order by random()
  loop
    v_idx := v_idx + 1;
    if p_assigned_roles is not null and (p_assigned_roles ? v_player.user_id::text) then
      v_role := p_assigned_roles->>v_player.user_id::text;
    else
      v_role := v_pool[v_idx];
    end if;

    insert into public.cidade_dorme_secrets (room_id, user_id, secret_role, detective_verdict)
    values (p_room_id, v_player.user_id, v_role, null)
    on conflict (room_id, user_id)
    do update set secret_role = excluded.secret_role, detective_verdict = null;
  end loop;

  update public.room_players
  set is_alive = true,
      is_ready = false,
      has_voted = false
  where room_id = p_room_id;

  v_caption := coalesce(
    p_narrator_caption,
    'Papéis secretos distribuídos! Revele seu papel sem mostrar aos colegas e confirme que está pronto.'
  );

  v_clean_config := (coalesce(v_room.config, '{}'::jsonb)
    - 'players'
    - 'removedPlayerIds'
    - 'nightTargetId'
    - 'nightProtectedId'
    - 'detectiveVerdict'
    - 'votesByPlayerId')
    || jsonb_build_object(
      'narratorCaption', v_caption,
      'phaseEndsAt', null,
      'dawnReport', null,
      'voteReport', null,
      'winner', null
    );

  update public.rooms
  set phase = 'role_reveal',
      status = 'playing',
      current_round = 1,
      phase_ends_at = null,
      narrator_caption = v_caption,
      config = v_clean_config
  where id = p_room_id;

  return jsonb_build_object('roomId', p_room_id, 'phase', 'role_reveal');
end;
$$;

create or replace function public.cidade_dorme_submit_night_action(
  p_room_id uuid,
  p_kind text,
  p_target_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.rooms%rowtype;
  v_actor public.room_players%rowtype;
  v_actor_secret public.cidade_dorme_secrets%rowtype;
  v_target public.room_players%rowtype;
  v_target_role text;
  v_expected_phase text;
  v_expected_role text;
  v_verdict jsonb := null;
  v_clean_target text := nullif(trim(coalesce(p_target_id, '')), '');
begin
  if v_uid is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if p_kind = 'night_assassin' then
    v_expected_phase := 'night_assassin';
    v_expected_role := 'assassino';
  elsif p_kind = 'night_angel' then
    v_expected_phase := 'night_angel';
    v_expected_role := 'anjo';
  elsif p_kind = 'night_detective' then
    v_expected_phase := 'night_detective';
    v_expected_role := 'detetive';
  else
    raise exception 'Tipo de ação noturna inválido.';
  end if;

  select * into v_room from public.rooms where id = p_room_id;
  if not found or v_room.phase <> v_expected_phase then
    raise exception 'A sala não está no turno noturno correspondente.';
  end if;

  select * into v_actor
  from public.room_players
  where room_id = p_room_id and user_id = v_uid;

  if not found or not v_actor.is_alive then
    raise exception 'Jogadores eliminados não podem realizar ações noturnas.';
  end if;

  select * into v_actor_secret
  from public.cidade_dorme_secrets
  where room_id = p_room_id and user_id = v_uid;

  if not found or v_actor_secret.secret_role <> v_expected_role then
    raise exception 'Este jogador não possui o papel ativo deste turno noturno.';
  end if;

  if v_clean_target is null then
    raise exception 'Selecione um jogador vivo válido para esta ação.';
  end if;

  select * into v_target
  from public.room_players
  where room_id = p_room_id and user_id::text = v_clean_target;

  if not found or not v_target.is_alive then
    raise exception 'O alvo selecionado deve ser um jogador vivo da sala.';
  end if;

  if p_kind = 'night_assassin' then
    if v_clean_target = v_uid::text then
      raise exception 'O Assassino não pode escolher a si mesmo como vítima.';
    end if;

    select secret_role into v_target_role
    from public.cidade_dorme_secrets
    where room_id = p_room_id and user_id = v_target.user_id;

    if v_target_role = 'assassino' then
      raise exception 'O Assassino não pode atacar outro Assassino parceiro.';
    end if;
  elsif p_kind = 'night_detective' then
    if v_clean_target = v_uid::text then
      raise exception 'O Detetive não pode investigar a si mesmo.';
    end if;

    if exists (
      select 1 from public.cidade_dorme_actions
      where room_id = p_room_id
        and round_number = v_room.current_round
        and user_id = v_uid
        and kind = 'night_detective'
    ) then
      raise exception 'O Detetive só pode investigar um suspeito por noite.';
    end if;

    select secret_role into v_target_role
    from public.cidade_dorme_secrets
    where room_id = p_room_id and user_id = v_target.user_id;

    v_verdict := jsonb_build_object(
      'targetPlayerId', v_target.user_id,
      'targetNickname', v_target.nickname,
      'isAssassin', (v_target_role = 'assassino'),
      'roundNumber', v_room.current_round
    );

    update public.cidade_dorme_secrets
    set detective_verdict = v_verdict
    where room_id = p_room_id and user_id = v_uid;
  end if;

  insert into public.cidade_dorme_actions (room_id, round_number, user_id, kind, target_id)
  values (p_room_id, v_room.current_round, v_uid, p_kind, v_clean_target)
  on conflict (room_id, round_number, user_id, kind)
  do update set target_id = excluded.target_id, created_at = now();

  return jsonb_build_object(
    'roomId', p_room_id,
    'kind', p_kind,
    'detectiveVerdict', v_verdict
  );
end;
$$;

create or replace function public.cidade_dorme_resolve_dawn(
  p_room_id uuid,
  p_debate_ends_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
  v_attacked_id uuid;
  v_protected_id uuid;
  v_attacked_nick text := null;
  v_attacked_role text := null;
  v_saved boolean := false;
  v_reveal_role boolean := true;
  v_alive_assassins int := 0;
  v_alive_innocents int := 0;
  v_winner text := null;
  v_caption text;
  v_dawn_report jsonb;
  v_next_phase text;
  v_next_status text;
  v_next_ends_at timestamptz;
begin
  select * into v_room from public.rooms where id = p_room_id for update;
  if not found or v_room.phase <> 'night_detective' then
    raise exception 'O amanhecer só ocorre após a conclusão dos turnos da noite.';
  end if;

  v_reveal_role := coalesce((v_room.config->'config'->>'revealRoleOnDeath')::boolean, true);

  select nullif(target_id, '')::uuid into v_attacked_id
  from public.cidade_dorme_actions
  where room_id = p_room_id and round_number = v_room.current_round and kind = 'night_assassin'
  order by created_at desc
  limit 1;

  select nullif(target_id, '')::uuid into v_protected_id
  from public.cidade_dorme_actions
  where room_id = p_room_id and round_number = v_room.current_round and kind = 'night_angel'
  order by created_at desc
  limit 1;

  if v_attacked_id is not null then
    select rp.nickname, s.secret_role
    into v_attacked_nick, v_attacked_role
    from public.room_players rp
    left join public.cidade_dorme_secrets s
      on s.room_id = rp.room_id and s.user_id = rp.user_id
    where rp.room_id = p_room_id and rp.user_id = v_attacked_id;

    v_saved := (v_protected_id is not null and v_protected_id = v_attacked_id);
    if not v_saved then
      update public.room_players
      set is_alive = false, has_voted = false
      where room_id = p_room_id and user_id = v_attacked_id;
    end if;
  end if;

  update public.room_players
  set has_voted = false
  where room_id = p_room_id;

  select
    count(*) filter (where s.secret_role = 'assassino'),
    count(*) filter (where coalesce(s.secret_role, 'cidadao') <> 'assassino')
  into v_alive_assassins, v_alive_innocents
  from public.room_players rp
  left join public.cidade_dorme_secrets s
    on s.room_id = rp.room_id and s.user_id = rp.user_id
  where rp.room_id = p_room_id and rp.is_alive = true;

  if v_alive_assassins = 0 then
    v_winner := 'cidade';
  elsif v_alive_assassins >= v_alive_innocents then
    v_winner := 'infiltrados';
  end if;

  v_dawn_report := jsonb_build_object(
    'roundNumber', v_room.current_round,
    'attackedPlayerId', v_attacked_id,
    'attackedNickname', v_attacked_nick,
    'savedByAngel', v_saved,
    'eliminatedPlayerId', case when v_saved then null else v_attacked_id end,
    'eliminatedNickname', case when v_saved then null else v_attacked_nick end,
    'eliminatedRole', case when not v_saved and v_attacked_id is not null and v_reveal_role then v_attacked_role else null end
  );

  if v_winner = 'infiltrados' then
    v_caption := case
      when v_attacked_nick is not null then format('A cidade acorda! Triste notícia na cidade: %s foi eliminado durante a noite. Os Assassinos atingiram a paridade e venceram a partida!', v_attacked_nick)
      else 'A cidade acorda! Os Assassinos atingiram a paridade numérica e venceram a partida!'
    end;
  elsif v_winner = 'cidade' then
    v_caption := 'A cidade acorda! Todos os Assassinos foram neutralizados. Vitória da Cidade!';
  elsif v_saved then
    v_caption := 'A cidade acorda! Todos podem abrir os olhos. A madrugada foi tensa, mas o Anjo protegeu a vítima a tempo! Ninguém foi eliminado!';
  elsif v_attacked_nick is not null then
    v_caption := format('A cidade acorda! Todos podem abrir os olhos. Triste notícia na cidade: %s foi eliminado durante a noite.', v_attacked_nick);
  else
    v_caption := 'A cidade acorda! Todos podem abrir os olhos. Ninguém foi eliminado durante a noite.';
  end if;

  v_next_phase := case when v_winner is not null then 'finished' else 'day_debate' end;
  v_next_status := case when v_winner is not null then 'finished' else 'playing' end;
  v_next_ends_at := case
    when v_winner is not null then null
    else coalesce(p_debate_ends_at, now() + (coalesce((v_room.config->'config'->>'dayDebateSeconds')::int, 120) * interval '1 second'))
  end;

  update public.rooms
  set phase = v_next_phase,
      status = v_next_status,
      phase_ends_at = v_next_ends_at,
      narrator_caption = v_caption,
      config = coalesce(v_room.config, '{}'::jsonb) || jsonb_build_object(
        'dawnReport', v_dawn_report,
        'voteReport', null,
        'winner', v_winner,
        'narratorCaption', v_caption,
        'phaseEndsAt', case when v_next_ends_at is null then null else to_char(v_next_ends_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') end
      )
  where id = p_room_id;

  return jsonb_build_object('roomId', p_room_id, 'phase', v_next_phase, 'dawnReport', v_dawn_report);
end;
$$;

create or replace function public.cidade_dorme_tally_votes(
  p_room_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms%rowtype;
  v_total_votes int := 0;
  v_skip_count int := 0;
  v_vote_counts jsonb := '{}'::jsonb;
  v_max_votes int := 0;
  v_leaders text[] := '{}';
  v_tie_or_skipped boolean;
  v_eliminated_id uuid := null;
  v_eliminated_nick text := null;
  v_eliminated_role text := null;
  v_reveal_role boolean := true;
  v_alive_assassins int := 0;
  v_alive_innocents int := 0;
  v_winner text := null;
  v_caption text;
  v_vote_report jsonb;
  v_next_phase text;
  v_next_status text;
  v_row record;
begin
  select * into v_room from public.rooms where id = p_room_id for update;
  if not found or v_room.phase <> 'day_voting' then
    raise exception 'A apuração só pode ser realizada durante a fase de votação.';
  end if;

  v_reveal_role := coalesce((v_room.config->'config'->>'revealRoleOnDeath')::boolean, true);

  select count(*) into v_total_votes
  from public.cidade_dorme_actions
  where room_id = p_room_id and round_number = v_room.current_round and kind = 'vote';

  if v_total_votes = 0 then
    raise exception 'Registre pelo menos um voto antes de apurar a votação.';
  end if;

  select count(*) into v_skip_count
  from public.cidade_dorme_actions
  where room_id = p_room_id and round_number = v_room.current_round and kind = 'vote' and target_id = 'skip';

  for v_row in
    select target_id, count(*)::int as cnt
    from public.cidade_dorme_actions
    where room_id = p_room_id and round_number = v_room.current_round and kind = 'vote' and target_id <> 'skip'
    group by target_id
  loop
    v_vote_counts := v_vote_counts || jsonb_build_object(v_row.target_id, v_row.cnt);
    if v_row.cnt > v_max_votes then
      v_max_votes := v_row.cnt;
      v_leaders := array[v_row.target_id];
    elsif v_row.cnt = v_max_votes then
      v_leaders := array_append(v_leaders, v_row.target_id);
    end if;
  end loop;

  v_tie_or_skipped := (v_max_votes = 0 or coalesce(array_length(v_leaders, 1), 0) <> 1 or v_skip_count >= v_max_votes);

  if not v_tie_or_skipped then
    v_eliminated_id := v_leaders[1]::uuid;
    select rp.nickname, s.secret_role
    into v_eliminated_nick, v_eliminated_role
    from public.room_players rp
    left join public.cidade_dorme_secrets s
      on s.room_id = rp.room_id and s.user_id = rp.user_id
    where rp.room_id = p_room_id and rp.user_id = v_eliminated_id;

    update public.room_players
    set is_alive = false
    where room_id = p_room_id and user_id = v_eliminated_id;
  end if;

  select
    count(*) filter (where s.secret_role = 'assassino'),
    count(*) filter (where coalesce(s.secret_role, 'cidadao') <> 'assassino')
  into v_alive_assassins, v_alive_innocents
  from public.room_players rp
  left join public.cidade_dorme_secrets s
    on s.room_id = rp.room_id and s.user_id = rp.user_id
  where rp.room_id = p_room_id and rp.is_alive = true;

  if v_alive_assassins = 0 then
    v_winner := 'cidade';
  elsif v_alive_assassins >= v_alive_innocents then
    v_winner := 'infiltrados';
  end if;

  v_vote_report := jsonb_build_object(
    'roundNumber', v_room.current_round,
    'eliminatedPlayerId', v_eliminated_id,
    'eliminatedNickname', v_eliminated_nick,
    'eliminatedRole', case when v_eliminated_id is not null and v_reveal_role then v_eliminated_role else null end,
    'tieOrSkipped', v_tie_or_skipped,
    'voteCounts', v_vote_counts,
    'skipCount', v_skip_count
  );

  if v_winner = 'cidade' then
    v_caption := case
      when v_eliminated_nick is not null then format('A cidade votou e eliminou %s! Todos os Assassinos foram descobertos: Vitória da Cidade!', v_eliminated_nick)
      else 'Todos os Assassinos foram descobertos: Vitória da Cidade!'
    end;
  elsif v_winner = 'infiltrados' then
    v_caption := case
      when v_eliminated_nick is not null then format('A cidade eliminou %s, e os Assassinos atingiram paridade numérica: Vitória dos Assassinos!', v_eliminated_nick)
      else 'Os Assassinos atingiram paridade numérica com os inocentes: Vitória dos Assassinos!'
    end;
  elsif v_tie_or_skipped or v_eliminated_id is null then
    v_caption := 'A cidade não chegou a um consenso na votação. Ninguém foi eliminado hoje!';
  else
    v_caption := format('A cidade decidiu por maioria simples: %s foi eliminado na votação!', v_eliminated_nick);
  end if;

  v_next_phase := case when v_winner is not null then 'finished' else 'vote_result' end;
  v_next_status := case when v_winner is not null then 'finished' else 'playing' end;

  update public.rooms
  set phase = v_next_phase,
      status = v_next_status,
      phase_ends_at = null,
      narrator_caption = v_caption,
      config = coalesce(v_room.config, '{}'::jsonb) || jsonb_build_object(
        'voteReport', v_vote_report,
        'winner', v_winner,
        'narratorCaption', v_caption,
        'phaseEndsAt', null
      )
  where id = p_room_id;

  return jsonb_build_object('roomId', p_room_id, 'phase', v_next_phase, 'voteReport', v_vote_report);
end;
$$;

create or replace function public.cidade_dorme_get_ally_assassins(
  p_room_id uuid
)
returns uuid[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_my_role text;
  v_allies uuid[];
begin
  if v_uid is null then
    return '{}'::uuid[];
  end if;

  select secret_role into v_my_role
  from public.cidade_dorme_secrets
  where room_id = p_room_id and user_id = v_uid;

  if v_my_role <> 'assassino' then
    return '{}'::uuid[];
  end if;

  select coalesce(array_agg(user_id), '{}'::uuid[])
  into v_allies
  from public.cidade_dorme_secrets
  where room_id = p_room_id
    and secret_role = 'assassino'
    and user_id <> v_uid;

  return v_allies;
end;
$$;
