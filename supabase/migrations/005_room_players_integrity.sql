-- Migration 005: integridade de room_players (apelido único e entrada apenas no lobby)

create unique index if not exists idx_room_players_unique_nickname
  on public.room_players (room_id, lower(btrim(nickname)));

create unique index if not exists idx_adedonha_submissions_unique_cell
  on public.adedonha_submissions (room_id, round_number, user_id, column_name);

create or replace function public.join_room_safe(
  p_code text,
  p_game_type text,
  p_nickname text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.rooms;
  v_existing public.room_players;
  v_clean_nick text := btrim(p_nickname);
begin
  if v_uid is null then
    raise exception 'Usuário não autenticado.';
  end if;

  select * into v_room
  from public.rooms
  where code = upper(btrim(p_code)) and game_type = p_game_type;

  if not found then
    raise exception 'Código de sala não encontrado.';
  end if;

  select * into v_existing
  from public.room_players
  where room_id = v_room.id and user_id = v_uid;

  if found then
    if lower(btrim(v_existing.nickname)) <> lower(v_clean_nick) then
      update public.room_players
      set nickname = v_clean_nick
      where id = v_existing.id;
    end if;
    return v_room.id;
  end if;

  if v_room.phase <> 'lobby' then
    raise exception 'A partida já começou. Novos jogadores só podem entrar no Lobby.';
  end if;

  insert into public.room_players (room_id, user_id, nickname, is_host, is_alive, is_ready, has_voted, score)
  values (v_room.id, v_uid, v_clean_nick, v_room.host_id = v_uid, true, p_game_type = 'adedonha', false, 0);

  return v_room.id;
end;
$$;
