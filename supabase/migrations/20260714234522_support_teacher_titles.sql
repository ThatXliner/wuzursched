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
