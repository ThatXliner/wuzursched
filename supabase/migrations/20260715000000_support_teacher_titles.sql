alter table public.classes
add column teacher_title text;

alter table public.classes
alter column teacher_first drop not null;

-- Canonicalize titles that users entered in the old required first-name field.
update public.classes
set
  teacher_title = lower(btrim(teacher_first)),
  teacher_first = null
where lower(btrim(teacher_first)) in ('mr', 'mrs', 'ms', 'mx', 'dr', 'coach');

alter table public.classes
drop constraint classes_name_teacher_first_teacher_last_room_key;

alter table public.classes
add constraint classes_teacher_identity_check check (
  btrim(teacher_last) <> ''
  and (
    (nullif(btrim(teacher_first), '') is not null)::integer
    + (nullif(btrim(teacher_title), '') is not null)::integer
  ) = 1
  and (
    teacher_title is null
    or lower(btrim(teacher_title)) in ('mr', 'mrs', 'ms', 'mx', 'dr', 'coach')
  )
  and (
    teacher_first is null
    or lower(btrim(teacher_first)) not in ('mr', 'mrs', 'ms', 'mx', 'dr', 'coach')
  )
);

create unique index classes_identity_unique
on public.classes (
  room,
  lower(btrim(name)),
  lower(btrim(teacher_last)),
  coalesce(lower(btrim(teacher_first)), ''),
  coalesce(lower(btrim(teacher_title)), '')
);

-- Keep secure admin seeding compatible with the title-based identity and its
-- normalized expression index.
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
  raw_title text;
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
    raw_title := btrim(coalesce(item->>'teacher_title', ''));

    if raw_title = '' and lower(regexp_replace(raw_first, '\.$', '')) in ('mr', 'mrs', 'ms', 'mx', 'dr', 'coach') then
      raw_title := regexp_replace(raw_first, '\.$', '');
      raw_first := '';
    end if;

    if raw_name = '' or raw_last = '' or ((raw_first = '') = (raw_title = '')) then
      raise exception 'Every class requires name, last name, and exactly one first name or title' using errcode = '22023';
    end if;
    if raw_title <> '' and lower(raw_title) not in ('mr', 'mrs', 'ms', 'mx', 'dr', 'coach') then
      raise exception 'Unsupported teacher title' using errcode = '22023';
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
      raw_title := initcap(lower(raw_title));
    end if;

    inserted := null;
    insert into public.classes (name, teacher_first, teacher_last, teacher_title, room)
    values (raw_name, nullif(raw_first, ''), raw_last, nullif(raw_title, ''), p_room)
    on conflict do nothing
    returning * into inserted;

    if inserted.id is null then
      select * into inserted
      from public.classes
      where room = p_room
        and lower(btrim(name)) = lower(btrim(raw_name))
        and lower(btrim(teacher_last)) = lower(btrim(raw_last))
        and coalesce(lower(btrim(teacher_first)), '') = coalesce(lower(btrim(nullif(raw_first, ''))), '')
        and coalesce(lower(btrim(teacher_title)), '') = coalesce(lower(btrim(nullif(raw_title, ''))), '')
      limit 1;
    end if;

    insert into public.room_audit_log (room, action, affected_table, affected_record)
    values (p_room, 'seed', 'classes', to_jsonb(inserted));
    return next inserted;
  end loop;
end;
$$;
