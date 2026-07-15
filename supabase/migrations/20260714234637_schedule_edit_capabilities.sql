create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table private.schedule_edit_capabilities (
    student text not null,
    room uuid not null,
    edit_token_hash bytea not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (student, room),
    constraint schedule_edit_capabilities_schedule_fkey
        foreign key (student, room)
        references public.schedules (student, room)
        on update cascade
        on delete cascade
);

comment on table private.schedule_edit_capabilities is
    'Hashed, room-scoped bearer capabilities used to edit anonymous schedules.';

revoke all on table private.schedule_edit_capabilities from public, anon, authenticated;

drop policy if exists "Enable insertion for all users" on public.schedules;
revoke insert, update, delete on public.schedules from anon, authenticated;
grant select on public.schedules to anon, authenticated;

create or replace function public.create_schedule(
    p_room uuid,
    p_student text,
    p_period_1a uuid,
    p_period_2a uuid,
    p_period_3a uuid,
    p_period_4a uuid,
    p_period_1b uuid,
    p_period_2b uuid,
    p_period_3b uuid,
    p_period_4b uuid
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
    v_student text := trim(p_student);
    v_token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
    if v_student = '' then
        raise exception using errcode = '22023', message = 'Student name cannot be empty';
    end if;

    if exists (
        select 1
        from unnest(array[
            p_period_1a, p_period_2a, p_period_3a, p_period_4a,
            p_period_1b, p_period_2b, p_period_3b, p_period_4b
        ]) as selected(class_id)
        left join public.classes on classes.id = selected.class_id
        where classes.id is null or classes.room <> p_room
    ) then
        raise exception using errcode = '23503', message = 'Every selected class must belong to this room';
    end if;

    insert into public.schedules (
        room, student, "1a", "2a", "3a", "4a", "1b", "2b", "3b", "4b"
    ) values (
        p_room, v_student, p_period_1a, p_period_2a, p_period_3a, p_period_4a,
        p_period_1b, p_period_2b, p_period_3b, p_period_4b
    );

    insert into private.schedule_edit_capabilities (student, room, edit_token_hash)
    values (v_student, p_room, extensions.digest(v_token, 'sha256'));

    return v_token;
end;
$$;

create or replace function public.verify_schedule_edit_capability(
    p_room uuid,
    p_student text,
    p_edit_token text
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
    select coalesce(
        p_edit_token <> '' and exists (
            select 1
            from private.schedule_edit_capabilities
            where room = p_room
              and student = p_student
              and edit_token_hash = extensions.digest(p_edit_token, 'sha256')
        ),
        false
    );
$$;

create or replace function public.update_schedule(
    p_room uuid,
    p_current_student text,
    p_edit_token text,
    p_student text,
    p_period_1a uuid,
    p_period_2a uuid,
    p_period_3a uuid,
    p_period_4a uuid,
    p_period_1b uuid,
    p_period_2b uuid,
    p_period_3b uuid,
    p_period_4b uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
    v_student text := trim(p_student);
begin
    perform 1
    from private.schedule_edit_capabilities
    where room = p_room
      and student = p_current_student
      and edit_token_hash = extensions.digest(coalesce(p_edit_token, ''), 'sha256')
    for update;

    if not found then
        raise exception using errcode = '28000', message = 'Invalid schedule edit key';
    end if;

    if v_student = '' then
        raise exception using errcode = '22023', message = 'Student name cannot be empty';
    end if;

    if exists (
        select 1
        from unnest(array[
            p_period_1a, p_period_2a, p_period_3a, p_period_4a,
            p_period_1b, p_period_2b, p_period_3b, p_period_4b
        ]) as selected(class_id)
        left join public.classes on classes.id = selected.class_id
        where classes.id is null or classes.room <> p_room
    ) then
        raise exception using errcode = '23503', message = 'Every selected class must belong to this room';
    end if;

    update public.schedules
    set student = v_student,
        "1a" = p_period_1a,
        "2a" = p_period_2a,
        "3a" = p_period_3a,
        "4a" = p_period_4a,
        "1b" = p_period_1b,
        "2b" = p_period_2b,
        "3b" = p_period_3b,
        "4b" = p_period_4b
    where room = p_room and student = p_current_student;

    if not found then
        raise exception using errcode = 'P0002', message = 'Schedule no longer exists';
    end if;
end;
$$;

create or replace function public.rotate_schedule_edit_capability(
    p_room uuid,
    p_student text,
    p_edit_token text
)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
    v_token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
    update private.schedule_edit_capabilities
    set edit_token_hash = extensions.digest(v_token, 'sha256'),
        updated_at = now()
    where room = p_room
      and student = p_student
      and edit_token_hash = extensions.digest(coalesce(p_edit_token, ''), 'sha256');

    if not found then
        raise exception using errcode = '28000', message = 'Invalid schedule edit key';
    end if;

    return v_token;
end;
$$;

revoke all on function public.create_schedule(uuid, text, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid) from public;
revoke all on function public.verify_schedule_edit_capability(uuid, text, text) from public;
revoke all on function public.update_schedule(uuid, text, text, text, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid) from public;
revoke all on function public.rotate_schedule_edit_capability(uuid, text, text) from public;

grant execute on function public.create_schedule(uuid, text, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid) to anon, authenticated;
grant execute on function public.verify_schedule_edit_capability(uuid, text, text) to anon, authenticated;
grant execute on function public.update_schedule(uuid, text, text, text, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid) to anon, authenticated;
grant execute on function public.rotate_schedule_edit_capability(uuid, text, text) to anon, authenticated;
