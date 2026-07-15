create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

alter table public.rooms
  add column announcement text not null default '',
  add column allow_class_creation boolean not null default true,
  add column class_name_format text not null default 'normalized'
    check (class_name_format in ('normalized', 'title', 'preserve')),
  add column teacher_name_format text not null default 'title'
    check (teacher_name_format in ('title', 'preserve'));

create table private.room_admins (
  room uuid primary key references public.rooms(id) on delete cascade,
  secret_hash text not null,
  created_at timestamptz not null default now(),
  rotated_at timestamptz
);

alter table private.room_admins enable row level security;
revoke all on private.room_admins from public, anon, authenticated;

create table public.room_audit_log (
  id bigint generated always as identity primary key,
  room uuid not null references public.rooms(id) on delete cascade,
  created_at timestamptz not null default now(),
  action text not null,
  affected_table text not null,
  affected_record jsonb not null
);

alter table public.room_audit_log enable row level security;
grant select on public.room_audit_log to anon, authenticated;
grant all on public.room_audit_log to service_role;

create policy "Room audit logs are public"
on public.room_audit_log for select
to anon, authenticated
using (true);

create or replace function private.valid_admin_token(p_room uuid, p_token text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select extensions.crypt(p_token, secret_hash) = secret_hash
     from private.room_admins
     where room = p_room),
    false
  );
$$;

revoke all on function private.valid_admin_token(uuid, text) from public, anon, authenticated;

create or replace function private.require_admin(p_room uuid, p_token text)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_token is null or not private.valid_admin_token(p_room, p_token) then
    raise exception 'Invalid room admin credential' using errcode = '42501';
  end if;
end;
$$;

revoke all on function private.require_admin(uuid, text) from public, anon, authenticated;

create or replace function public.create_room_with_admin(p_id uuid, p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if length(p_token) < 32 then
    raise exception 'Admin credential must contain at least 32 characters' using errcode = '22023';
  end if;

  insert into public.rooms (id) values (p_id);
  insert into private.room_admins (room, secret_hash)
    values (p_id, extensions.crypt(p_token, extensions.gen_salt('bf', 12)));
  return p_id;
end;
$$;

revoke all on function public.create_room_with_admin(uuid, text) from public;
grant execute on function public.create_room_with_admin(uuid, text) to anon, authenticated;

create or replace function public.verify_room_admin(p_room uuid, p_token text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.valid_admin_token(p_room, p_token);
$$;

revoke all on function public.verify_room_admin(uuid, text) from public;
grant execute on function public.verify_room_admin(uuid, text) to anon, authenticated;

create or replace function public.admin_update_room(
  p_room uuid,
  p_token text,
  p_announcement text,
  p_allow_class_creation boolean,
  p_class_name_format text,
  p_teacher_name_format text
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed public.rooms;
begin
  perform private.require_admin(p_room, p_token);
  if p_class_name_format not in ('normalized', 'title', 'preserve')
     or p_teacher_name_format not in ('title', 'preserve') then
    raise exception 'Invalid display convention' using errcode = '22023';
  end if;

  update public.rooms
  set announcement = left(coalesce(p_announcement, ''), 2000),
      allow_class_creation = p_allow_class_creation,
      class_name_format = p_class_name_format,
      teacher_name_format = p_teacher_name_format
  where id = p_room
  returning * into changed;

  insert into public.room_audit_log (room, action, affected_table, affected_record)
  values (p_room, 'update', 'rooms', to_jsonb(changed));
  return changed;
end;
$$;

revoke all on function public.admin_update_room(uuid, text, text, boolean, text, text) from public;
grant execute on function public.admin_update_room(uuid, text, text, boolean, text, text) to anon, authenticated;

create or replace function public.admin_seed_classes(p_room uuid, p_token text, p_classes jsonb)
returns setof public.classes
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  inserted public.classes;
  raw_name text;
  raw_first text;
  raw_last text;
  name_format text;
  teacher_format text;
begin
  perform private.require_admin(p_room, p_token);
  if jsonb_typeof(p_classes) <> 'array' or jsonb_array_length(p_classes) > 1000 then
    raise exception 'Classes must be an array of at most 1000 entries' using errcode = '22023';
  end if;

  select class_name_format, teacher_name_format
  into name_format, teacher_format
  from public.rooms where id = p_room;

  for item in select value from jsonb_array_elements(p_classes)
  loop
    raw_name := btrim(coalesce(item->>'name', ''));
    raw_first := btrim(coalesce(item->>'teacher_first', ''));
    raw_last := btrim(coalesce(item->>'teacher_last', ''));
    if raw_name = '' or raw_first = '' or raw_last = '' then
      raise exception 'Every class requires name, teacher_first, and teacher_last' using errcode = '22023';
    end if;

    if name_format = 'normalized' then
      raw_name := lower(regexp_replace(raw_name, '\s+', ' ', 'g'));
      raw_name := regexp_replace(raw_name, ' iii$', ' 3', 'i');
      raw_name := regexp_replace(raw_name, ' ii$', ' 2', 'i');
      raw_name := regexp_replace(raw_name, ' i$', ' 1', 'i');
    elsif name_format = 'title' then
      raw_name := initcap(lower(regexp_replace(raw_name, '\s+', ' ', 'g')));
    end if;

    if teacher_format = 'title' then
      raw_first := initcap(lower(raw_first));
      raw_last := initcap(lower(raw_last));
    end if;

    insert into public.classes (name, teacher_first, teacher_last, room)
    values (raw_name, raw_first, raw_last, p_room)
    on conflict (name, teacher_first, teacher_last, room) do update set name = excluded.name
    returning * into inserted;

    insert into public.room_audit_log (room, action, affected_table, affected_record)
    values (p_room, 'seed', 'classes', to_jsonb(inserted));
    return next inserted;
  end loop;
end;
$$;

revoke all on function public.admin_seed_classes(uuid, text, jsonb) from public;
grant execute on function public.admin_seed_classes(uuid, text, jsonb) to anon, authenticated;

create or replace function public.admin_update_schedule(
  p_room uuid,
  p_token text,
  p_student text,
  p_schedule jsonb
)
returns public.schedules
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed public.schedules;
  new_student text := btrim(coalesce(p_schedule->>'student', p_student));
begin
  perform private.require_admin(p_room, p_token);
  if new_student = '' then
    raise exception 'Student name is required' using errcode = '22023';
  end if;

  update public.schedules set
    student = new_student,
    "1a" = (p_schedule->>'1a')::uuid,
    "2a" = (p_schedule->>'2a')::uuid,
    "3a" = (p_schedule->>'3a')::uuid,
    "4a" = (p_schedule->>'4a')::uuid,
    "1b" = (p_schedule->>'1b')::uuid,
    "2b" = (p_schedule->>'2b')::uuid,
    "3b" = (p_schedule->>'3b')::uuid,
    "4b" = (p_schedule->>'4b')::uuid
  where room = p_room and student = p_student
  returning * into changed;

  if changed is null then
    raise exception 'Schedule not found' using errcode = 'P0002';
  end if;
  insert into public.room_audit_log (room, action, affected_table, affected_record)
  values (p_room, 'update', 'schedules', to_jsonb(changed));
  return changed;
end;
$$;

revoke all on function public.admin_update_schedule(uuid, text, text, jsonb) from public;
grant execute on function public.admin_update_schedule(uuid, text, text, jsonb) to anon, authenticated;

create or replace function public.admin_delete_schedule(p_room uuid, p_token text, p_student text)
returns public.schedules
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed public.schedules;
begin
  perform private.require_admin(p_room, p_token);
  delete from public.schedules
  where room = p_room and student = p_student
  returning * into removed;
  if removed is null then
    raise exception 'Schedule not found' using errcode = 'P0002';
  end if;
  insert into public.room_audit_log (room, action, affected_table, affected_record)
  values (p_room, 'delete', 'schedules', to_jsonb(removed));
  return removed;
end;
$$;

revoke all on function public.admin_delete_schedule(uuid, text, text) from public;
grant execute on function public.admin_delete_schedule(uuid, text, text) to anon, authenticated;

create or replace function public.admin_rotate_token(p_room uuid, p_token text, p_new_token text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_admin(p_room, p_token);
  if length(p_new_token) < 32 then
    raise exception 'Admin credential must contain at least 32 characters' using errcode = '22023';
  end if;
  update private.room_admins
  set secret_hash = extensions.crypt(p_new_token, extensions.gen_salt('bf', 12)), rotated_at = now()
  where room = p_room;
  insert into public.room_audit_log (room, action, affected_table, affected_record)
  values (p_room, 'rotate credential', 'room_admins', jsonb_build_object('room', p_room));
  return true;
end;
$$;

revoke all on function public.admin_rotate_token(uuid, text, text) from public;
grant execute on function public.admin_rotate_token(uuid, text, text) to anon, authenticated;

drop policy "Enable insertion for all users" on public.classes;
create policy "Room settings allow class creation"
on public.classes for insert
to anon, authenticated
with check (
  exists (
    select 1 from public.rooms
    where rooms.id = classes.room and rooms.allow_class_creation
  )
);

alter table public.rooms replica identity full;
alter table public.schedules replica identity full;
alter table public.room_audit_log replica identity full;

alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_audit_log;
