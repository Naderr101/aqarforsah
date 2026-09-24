create or replace function public.is_admin_mfa() returns boolean language sql stable security invoker set search_path = public as $$
  select coalesce(auth.jwt()->>'aal','') = 'aal2' and public.is_admin(auth.uid())
$$;
create or replace function public.is_sales() returns boolean language sql stable security invoker set search_path = public as $$
  select public.has_role(auth.uid(),'SALES_AGENT') or public.is_admin(auth.uid())
$$;