-- Migration 003: versionamento monotônico de salas e phase_ends_at para Adedonha

alter table public.rooms
  add column if not exists version integer not null default 0,
  add column if not exists phase_ends_at timestamptz;

create or replace function public.increment_room_version()
returns trigger
language plpgsql
as $$
begin
  new.version := coalesce(old.version, 0) + 1;
  return new;
end;
$$;

drop trigger if exists trg_rooms_increment_version on public.rooms;

create trigger trg_rooms_increment_version
before update on public.rooms
for each row
execute function public.increment_room_version();
