-- RLS permits schedule submissions, but local database resets can leave the
-- table-level INSERT privilege absent after adding the table to Realtime.
GRANT INSERT ON TABLE public.schedules TO anon, authenticated;
