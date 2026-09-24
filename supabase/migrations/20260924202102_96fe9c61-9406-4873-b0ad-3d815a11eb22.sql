create or replace function public.is_admin_mfa() returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin(auth.uid()) and coalesce(auth.jwt()->>'aal','') = 'aal2'
$$;
create or replace function public.is_sales() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('SALES_AGENT','ADMIN','SUPER_ADMIN'))
$$;
revoke execute on function public.is_admin_mfa() from anon; revoke execute on function public.is_sales() from anon;

create or replace function private.touch() returns trigger language plpgsql set search_path = public as $$ begin new.updated_at := now(); return new; end $$;

-- site content
create table public.site_content (key text primary key, value jsonb not null default '""', updated_by uuid, updated_at timestamptz not null default now());
grant select on public.site_content to anon, authenticated; grant insert, update, delete on public.site_content to authenticated; grant all on public.site_content to service_role;
alter table public.site_content enable row level security;
create policy "public read content" on public.site_content for select to anon, authenticated using (true);
create policy "admin write content" on public.site_content for all to authenticated using (public.is_admin_mfa()) with check (public.is_admin_mfa());

create table public.site_content_history (id bigserial primary key, key text not null, old_value jsonb, new_value jsonb, changed_by uuid, changed_at timestamptz not null default now());
grant select on public.site_content_history to authenticated; grant all on public.site_content_history to service_role;
alter table public.site_content_history enable row level security;
create policy "admin read history" on public.site_content_history for select to authenticated using (public.is_admin_mfa());

create or replace function private.content_history() returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_by := auth.uid(); new.updated_at := now();
  insert into public.site_content_history(key, old_value, new_value, changed_by)
  values (new.key, case when tg_op='UPDATE' then old.value end, new.value, auth.uid());
  return new;
end $$;
create trigger site_content_hist before insert or update on public.site_content for each row execute function private.content_history();

-- generic admin-managed catalog tables
create table public.nav_sections (id uuid primary key default gen_random_uuid(), label text not null, href text not null, sort_order int not null default 0, visible boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.cities (id uuid primary key default gen_random_uuid(), name text not null unique, region text not null default '', sort_order int not null default 0, visible boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.new_units (id uuid primary key default gen_random_uuid(), title text not null, developer_id text references public.developers(id), project_id text references public.projects(id), city text not null default '', unit_type text not null default '', area numeric, bedrooms int, price numeric, down_payment numeric, installment_years int, delivery text not null default '', image_url text not null default '', description text not null default '', published boolean not null default false, sort_order int not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.project_opportunities (id uuid primary key default gen_random_uuid(), title text not null, developer_id text references public.developers(id), city text not null default '', stage text not null default '', min_investment numeric, image_url text not null default '', description text not null default '', published boolean not null default false, sort_order int not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.form_fields (id uuid primary key default gen_random_uuid(), form text not null, field_key text not null, label text not null, required boolean not null default false, visible boolean not null default true, sort_order int not null default 0, updated_at timestamptz not null default now(), unique(form, field_key));

do $$ declare t text; begin
  foreach t in array array['nav_sections','cities','new_units','project_opportunities','form_fields'] loop
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (public.is_admin_mfa()) with check (public.is_admin_mfa())', t);
    execute format('create trigger touch before update on public.%I for each row execute function private.touch()', t);
  end loop;
end $$;
create policy "public read" on public.nav_sections for select to anon, authenticated using (visible or public.is_admin_mfa());
create policy "public read" on public.cities for select to anon, authenticated using (visible or public.is_admin_mfa());
create policy "public read" on public.new_units for select to anon, authenticated using (published or public.is_admin_mfa());
create policy "public read" on public.project_opportunities for select to anon, authenticated using (published or public.is_admin_mfa());
create policy "public read" on public.form_fields for select to anon, authenticated using (true);

-- catalog admin writes
do $$ declare t text; begin
  foreach t in array array['developers','projects','phases','buildings'] loop
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (public.is_admin_mfa()) with check (public.is_admin_mfa())', t);
  end loop;
end $$;

-- CRM
create type public.lead_status as enum ('NEW','CONTACTED','INTERESTED','PURCHASE_REQUEST','WON','LOST');
create table public.leads (id uuid primary key default gen_random_uuid(), buyer_id uuid default auth.uid(), name text not null, phone text not null, email text not null default '', message text not null default '', section text not null default 'exit', opportunity_ref text not null default '', status public.lead_status not null default 'NEW', assigned_to uuid, next_follow_up date, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
grant insert on public.leads to anon, authenticated; grant select, update on public.leads to authenticated; grant all on public.leads to service_role;
alter table public.leads enable row level security;
create policy "anyone submits lead" on public.leads for insert to anon, authenticated with check (status = 'NEW' and assigned_to is null and length(name) between 2 and 100 and length(phone) between 6 and 20 and length(message) <= 2000);
create policy "sales read" on public.leads for select to authenticated using (public.is_admin_mfa() or (public.is_sales() and assigned_to = auth.uid()));
create policy "sales update" on public.leads for update to authenticated using (public.is_admin_mfa() or (public.is_sales() and assigned_to = auth.uid())) with check (public.is_admin_mfa() or (public.is_sales() and assigned_to = auth.uid()));
create trigger touch before update on public.leads for each row execute function private.touch();

create table public.lead_notes (id uuid primary key default gen_random_uuid(), lead_id uuid not null references public.leads(id) on delete cascade, author_id uuid not null default auth.uid(), body text not null check (length(body) between 1 and 4000), created_at timestamptz not null default now());
grant select, insert on public.lead_notes to authenticated; grant all on public.lead_notes to service_role;
alter table public.lead_notes enable row level security;
create policy "notes read" on public.lead_notes for select to authenticated using (exists (select 1 from public.leads l where l.id = lead_id));
create policy "notes add" on public.lead_notes for insert to authenticated with check (author_id = auth.uid() and exists (select 1 from public.leads l where l.id = lead_id));

create or replace function private.audit_row() returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform private.audit(tg_table_name || '.' || lower(tg_op), tg_table_name, coalesce((case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end)->>'id', (case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end)->>'key', ''),
    jsonb_build_object('before', case when tg_op<>'INSERT' then to_jsonb(old) end, 'after', case when tg_op<>'DELETE' then to_jsonb(new) end));
  return coalesce(new, old);
end $$;
do $$ declare t text; begin
  foreach t in array array['site_content','nav_sections','cities','new_units','project_opportunities','form_fields','developers','projects','phases','buildings'] loop
    execute format('create trigger audit_changes after insert or update or delete on public.%I for each row execute function private.audit_row()', t);
  end loop;
end $$;
create trigger audit_changes after update on public.leads for each row execute function private.audit_row();

insert into public.nav_sections(label, href, sort_order) values ('فرص الخروج','/exit-opportunities',1),('الوحدات الجديدة','/new-units',2),('فرص المشاريع','/project-opportunities',3);
insert into public.cities(name, sort_order) values ('القاهرة الجديدة',1),('الشيخ زايد',2),('6 أكتوبر',3),('العاصمة الإدارية',4),('الساحل الشمالي',5),('العين السخنة',6);
insert into public.form_fields(form, field_key, label, required, sort_order) values ('interest','name','الاسم',true,1),('interest','phone','رقم الموبايل',true,2),('interest','email','البريد الإلكتروني',false,3),('interest','message','رسالتك',false,4);