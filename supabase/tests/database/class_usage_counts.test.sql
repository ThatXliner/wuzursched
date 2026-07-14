begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(5);

insert into public.rooms (id)
values
    ('00000000-0000-0000-0000-000000000001'),
    ('00000000-0000-0000-0000-000000000002');

insert into public.classes (id, name, teacher_first, teacher_last, room)
values
    ('10000000-0000-0000-0000-000000000001', 'unused', 'zero', 'teacher', '00000000-0000-0000-0000-000000000001'),
    ('10000000-0000-0000-0000-000000000002', 'repeated', 'one', 'teacher', '00000000-0000-0000-0000-000000000001'),
    ('10000000-0000-0000-0000-000000000003', 'single', 'two', 'teacher', '00000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000001', 'other room', 'three', 'teacher', '00000000-0000-0000-0000-000000000002');

insert into public.schedules (room, student, "1a", "1b", "2a", "2b", "3a", "3b", "4a", "4b")
values
    (
        '00000000-0000-0000-0000-000000000001', 'first student',
        '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
        '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002'
    ),
    (
        '00000000-0000-0000-0000-000000000001', 'second student',
        '10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003',
        '10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003'
    ),
    (
        '00000000-0000-0000-0000-000000000002', 'other room student',
        '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
        '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'
    );

select extensions.is(
    (select schedule_count from public.get_classes_with_usage('00000000-0000-0000-0000-000000000001') where id = '10000000-0000-0000-0000-000000000001'),
    0::bigint,
    'classes with no schedules have a zero count'
);

select extensions.is(
    (select schedule_count from public.get_classes_with_usage('00000000-0000-0000-0000-000000000001') where id = '10000000-0000-0000-0000-000000000002'),
    2::bigint,
    'a schedule is counted once when a class appears in multiple periods'
);

select extensions.is(
    (select schedule_count from public.get_classes_with_usage('00000000-0000-0000-0000-000000000001') where id = '10000000-0000-0000-0000-000000000003'),
    1::bigint,
    'a class used by one schedule has a count of one'
);

select extensions.is(
    (select schedule_count from public.get_classes_with_usage('00000000-0000-0000-0000-000000000002') where id = '20000000-0000-0000-0000-000000000001'),
    1::bigint,
    'counts include schedules from the class room only'
);

select extensions.is(
    (select count(*) from public.get_classes_with_usage('00000000-0000-0000-0000-000000000001')),
    3::bigint,
    'one room query returns all of that room classes'
);

select * from extensions.finish();

rollback;
