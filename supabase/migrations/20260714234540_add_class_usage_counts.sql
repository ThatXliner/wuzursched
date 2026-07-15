create index schedules_room_idx on public.schedules (room);

create function public.get_classes_with_usage(room_id uuid)
returns table (
    id uuid,
    name text,
    teacher_first text,
    teacher_last text,
    room uuid,
    schedule_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
select
    classes.id,
    classes.name,
    classes.teacher_first,
    classes.teacher_last,
    classes.room,
    (count(distinct (schedules.room, schedules.student))
        filter (where schedules.student is not null))::bigint as schedule_count
from public.classes
left join public.schedules
    on schedules.room = room_id
    and classes.id = any (array[
        schedules."1a",
        schedules."1b",
        schedules."2a",
        schedules."2b",
        schedules."3a",
        schedules."3b",
        schedules."4a",
        schedules."4b"
    ])
where classes.room = room_id
group by
    classes.id,
    classes.name,
    classes.teacher_first,
    classes.teacher_last,
    classes.room
$$;

revoke all on function public.get_classes_with_usage(uuid) from public;
grant execute on function public.get_classes_with_usage(uuid) to anon, authenticated, service_role;
