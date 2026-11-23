-- Migration 006: Limpeza de jogadores removidos e prevenção de secret_role NULL em cidade_dorme_start_match

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
  v_removed_ids text[];
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

  -- Remove fisicamente linhas órfãs marcadas em removedPlayerIds antes do sorteio
  select coalesce(array_agg(elem), '{}'::text[])
  into v_removed_ids
  from jsonb_array_elements_text(coalesce(v_room.config->'removedPlayerIds', '[]'::jsonb)) as elem;

  if coalesce(array_length(v_removed_ids, 1), 0) > 0 then
    delete from public.room_players
    where room_id = p_room_id
      and user_id::text = any(v_removed_ids)
      and user_id <> v_room.host_id;
  end if;

  -- Se o cliente enviou o mapa explícito de papéis, remove participantes ausentes dele (expulsos do Lobby)
  if p_assigned_roles is not null then
    delete from public.room_players
    where room_id = p_room_id
      and user_id <> v_room.host_id
      and not (p_assigned_roles ? user_id::text);
  end if;

  select count(*) into v_total
  from public.room_players
  where room_id = p_room_id;

  if v_total < 5 or v_total > 16 then
    raise exception 'O Cidade Dorme requer entre 5 e 16 jogadores.';
  end if;

  v_assassin_count := coalesce((v_room.config->'config'->>'assassinCount')::int, 1);

  -- Inicializa o pool sempre como fallback seguro para impedir secret_role NULL
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
      v_role := nullif(trim(coalesce(p_assigned_roles->>v_player.user_id::text, '')), '');
    else
      v_role := null;
    end if;

    v_role := coalesce(v_role, v_pool[v_idx], 'cidadao');

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
