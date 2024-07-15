create policy "Enable read access for all users"
on "public"."rooms"
as permissive
for select
to public
using (true);



