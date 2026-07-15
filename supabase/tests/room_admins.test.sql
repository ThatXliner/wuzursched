begin;

create extension if not exists pgtap with schema extensions;
select plan(12);

select is(
  public.create_room_with_admin(
    '00000000-0000-0000-0000-000000000018'::uuid,
    'original-admin-token-that-is-long-enough-18'
  ),
  '00000000-0000-0000-0000-000000000018'::uuid,
  'a room can be created with an admin credential'
);

select ok(
  public.verify_room_admin(
    '00000000-0000-0000-0000-000000000018'::uuid,
    'original-admin-token-that-is-long-enough-18'
  ),
  'the correct admin credential verifies'
);

select ok(
  not public.verify_room_admin(
    '00000000-0000-0000-0000-000000000018'::uuid,
    'incorrect-admin-token-that-is-long-enough'
  ),
  'an incorrect admin credential is rejected'
);

select throws_ok(
  $$
    select public.admin_update_room(
      '00000000-0000-0000-0000-000000000018'::uuid,
      'incorrect-admin-token-that-is-long-enough',
      'nope', false, 'preserve', 'preserve'
    )
  $$,
  '42501',
  'Invalid room admin credential',
  'non-admin room mutations are rejected'
);

select lives_ok(
  $$
    select public.admin_update_room(
      '00000000-0000-0000-0000-000000000018'::uuid,
      'original-admin-token-that-is-long-enough-18',
      'Follow the naming guide', false, 'title', 'preserve'
    )
  $$,
  'an admin can update room settings'
);

select results_eq(
  $$ select announcement, allow_class_creation, class_name_format, teacher_name_format
     from public.rooms where id = '00000000-0000-0000-0000-000000000018'::uuid $$,
  $$ values ('Follow the naming guide'::text, false, 'title'::text, 'preserve'::text) $$,
  'room settings are stored with safe, enumerated conventions'
);

select is(
  (
    select count(*)
    from public.admin_seed_classes(
      '00000000-0000-0000-0000-000000000018'::uuid,
      'original-admin-token-that-is-long-enough-18',
      '[{"name":"biology ii","teacher_first":"jANE","teacher_last":"dOE"}]'::jsonb
    )
  ),
  1::bigint,
  'an admin can seed classes'
);

select results_eq(
  $$ select name, teacher_first, teacher_last from public.classes
     where room = '00000000-0000-0000-0000-000000000018'::uuid $$,
  $$ values ('Biology Ii'::text, 'jANE'::text, 'dOE'::text) $$,
  'seeded classes use the configured safe display conventions'
);

insert into public.schedules (room, student, "1a", "2a", "3a", "4a", "1b", "2b", "3b", "4b")
select
  '00000000-0000-0000-0000-000000000018'::uuid,
  'Student One', id, id, id, id, id, id, id, id
from public.classes
where room = '00000000-0000-0000-0000-000000000018'::uuid;

select lives_ok(
  $$
    select public.admin_delete_schedule(
      '00000000-0000-0000-0000-000000000018'::uuid,
      'original-admin-token-that-is-long-enough-18',
      'Student One'
    )
  $$,
  'an admin can delete a schedule'
);

select ok(
  public.admin_rotate_token(
    '00000000-0000-0000-0000-000000000018'::uuid,
    'original-admin-token-that-is-long-enough-18',
    'replacement-admin-token-that-is-long-enough'
  ),
  'an admin can rotate the credential'
);

select ok(
  not public.verify_room_admin(
    '00000000-0000-0000-0000-000000000018'::uuid,
    'original-admin-token-that-is-long-enough-18'
  ) and public.verify_room_admin(
    '00000000-0000-0000-0000-000000000018'::uuid,
    'replacement-admin-token-that-is-long-enough'
  ),
  'rotation revokes the old credential'
);

select ok(
  (select count(*) >= 4 from public.room_audit_log
   where room = '00000000-0000-0000-0000-000000000018'::uuid),
  'admin mutations create public audit records'
);

select * from finish();
rollback;
