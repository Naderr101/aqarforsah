create or replace function public.ensure_default_roles()
 returns void language plpgsql security definer set search_path to 'public' as $function$
begin
  if auth.uid() is null then return; end if;
  insert into public.user_roles(user_id, role) values (auth.uid(),'BUYER'),(auth.uid(),'SELLER') on conflict do nothing;
  insert into public.profiles(id) values (auth.uid()) on conflict do nothing;
  if lower(coalesce(auth.jwt()->>'email','')) = 'handawy188@gmail.com'
     and exists (select 1 from auth.users u where u.id = auth.uid() and u.email_confirmed_at is not null)
     and not exists (select 1 from public.user_roles where role = 'SUPER_ADMIN') then
    insert into public.user_roles(user_id, role) values (auth.uid(),'SUPER_ADMIN') on conflict do nothing;
    perform private.audit('role.bootstrap_owner', 'user', auth.uid()::text, '{}'::jsonb);
  end if;
end $function$;