-- Migração 008: RPCs atômicas para traços do Desenho Relâmpago (UC12, RF41)
-- Elimina o padrão SELECT + UPDATE no cliente (evitando race conditions e reduzindo
-- de 6 round-trips sequenciais para 1 único RPC atômico por operação de canvas).

create or replace function public.desenho_append_element(
  p_room_id uuid,
  p_element jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.rooms%rowtype;
  v_elements jsonb;
  v_version integer;
begin
  if v_uid is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if p_element is null or jsonb_typeof(p_element) <> 'object' then
    raise exception 'VALIDATION_ERROR: Elemento de desenho inválido.'
      using errcode = 'P0001';
  end if;

  select * into v_room
  from public.rooms
  where id = p_room_id and game_type = 'desenho'
  for update;

  if not found then
    raise exception 'Sala de Desenho Relâmpago não encontrada.';
  end if;

  if v_room.phase <> 'drawing' then
    raise exception 'CONFLICT_PHASE: Não é possível editar fora da fase ativa.'
      using errcode = 'P0001';
  end if;

  if coalesce(v_room.config->>'currentDrawerId', '') <> v_uid::text then
    raise exception 'VALIDATION_ERROR: Apenas o desenhista da vez pode desenhar.'
      using errcode = 'P0001';
  end if;

  v_elements := coalesce(v_room.config->'elements', '[]'::jsonb) || jsonb_build_array(p_element);

  update public.rooms
  set config = jsonb_set(
    coalesce(v_room.config, '{}'::jsonb),
    '{elements}',
    v_elements,
    true
  )
  where id = p_room_id
  returning version into v_version;

  return jsonb_build_object(
    'version', v_version,
    'elementsCount', jsonb_array_length(v_elements)
  );
end;
$$;

create or replace function public.desenho_undo_element(
  p_room_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.rooms%rowtype;
  v_elements jsonb;
  v_len integer;
  v_version integer;
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

  if v_room.phase <> 'drawing' then
    raise exception 'CONFLICT_PHASE: Não é possível editar fora da fase ativa.'
      using errcode = 'P0001';
  end if;

  if coalesce(v_room.config->>'currentDrawerId', '') <> v_uid::text then
    raise exception 'VALIDATION_ERROR: Apenas o desenhista da vez pode desenhar.'
      using errcode = 'P0001';
  end if;

  v_elements := coalesce(v_room.config->'elements', '[]'::jsonb);
  v_len := jsonb_array_length(v_elements);
  if v_len > 0 then
    v_elements := v_elements - (v_len - 1);
  end if;

  update public.rooms
  set config = jsonb_set(
    coalesce(v_room.config, '{}'::jsonb),
    '{elements}',
    v_elements,
    true
  )
  where id = p_room_id
  returning version into v_version;

  return jsonb_build_object(
    'version', v_version,
    'elementsCount', jsonb_array_length(v_elements)
  );
end;
$$;

create or replace function public.desenho_clear_canvas(
  p_room_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_room public.rooms%rowtype;
  v_version integer;
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

  if v_room.phase <> 'drawing' then
    raise exception 'CONFLICT_PHASE: Não é possível editar fora da fase ativa.'
      using errcode = 'P0001';
  end if;

  if coalesce(v_room.config->>'currentDrawerId', '') <> v_uid::text then
    raise exception 'VALIDATION_ERROR: Apenas o desenhista da vez pode desenhar.'
      using errcode = 'P0001';
  end if;

  update public.rooms
  set config = jsonb_set(
    coalesce(v_room.config, '{}'::jsonb),
    '{elements}',
    '[]'::jsonb,
    true
  )
  where id = p_room_id
  returning version into v_version;

  return jsonb_build_object(
    'version', v_version,
    'elementsCount', 0
  );
end;
$$;

grant execute on function public.desenho_append_element(uuid, jsonb) to authenticated;
grant execute on function public.desenho_undo_element(uuid) to authenticated;
grant execute on function public.desenho_clear_canvas(uuid) to authenticated;
