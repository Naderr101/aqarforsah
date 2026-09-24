-- ===== developer membership =====
create table public.developer_members (id uuid primary key default gen_random_uuid(), user_id uuid not null, developer_id text not null references public.developers(id) on delete cascade, verified boolean not null default false, created_at timestamptz not null default now(), unique(user_id, developer_id));
grant select on public.developer_members to authenticated; grant insert, update, delete on public.developer_members to authenticated; grant all on public.developer_members to service_role;
alter table public.developer_members enable row level security;
create policy "own membership read" on public.developer_members for select to authenticated using (user_id = auth.uid() or public.is_admin_mfa());
create policy "admin manage" on public.developer_members for all to authenticated using (public.is_admin_mfa()) with check (public.is_admin_mfa());
create trigger audit_changes after insert or update or delete on public.developer_members for each row execute function private.audit_row();

create or replace function public.is_developer_of(_dev text) returns boolean language sql stable security invoker set search_path = public as $$
  select public.has_role(auth.uid(),'DEVELOPER') and exists (select 1 from public.developer_members m where m.user_id = auth.uid() and m.developer_id = _dev and m.verified)
$$;
create or replace function public.is_reviewer() returns boolean language sql stable security invoker set search_path = public as $$
  select coalesce(auth.jwt()->>'aal','') = 'aal2' and public.is_staff(auth.uid())
$$;

-- ===== new units =====
create type public.new_unit_status as enum ('DRAFT','PENDING_APPROVAL','APPROVED','PUBLISHED','RESERVED','SOLD','REJECTED','PAUSED','UNAVAILABLE');
drop policy "public read" on public.new_units;
drop policy "admin write" on public.new_units;
alter table public.new_units drop column published;
alter table public.new_units
  add column status public.new_unit_status not null default 'DRAFT',
  add column phase_id text references public.phases(id), add column building_id text references public.buildings(id),
  add column unit_code text not null default '', add column bathrooms int, add column floor text not null default '',
  add column finishing text not null default '', add column installment_plan text not null default '',
  add column availability text not null default '', add column currency public.currency_code not null default 'EGP',
  add column review_notes text not null default '', add column created_by uuid default auth.uid();
create index new_units_status_idx on public.new_units(status, sort_order);
create index new_units_dev_idx on public.new_units(developer_id);
create policy "public read published" on public.new_units for select to anon, authenticated using (status in ('PUBLISHED','RESERVED','SOLD'));
create policy "developer read own" on public.new_units for select to authenticated using (public.is_developer_of(developer_id) or public.is_reviewer() or public.is_admin_mfa());
create policy "developer insert own" on public.new_units for insert to authenticated with check (public.is_developer_of(developer_id) or public.is_admin_mfa());
create policy "developer update own" on public.new_units for update to authenticated using (public.is_developer_of(developer_id) or public.is_reviewer() or public.is_admin_mfa()) with check (public.is_developer_of(developer_id) or public.is_reviewer() or public.is_admin_mfa());
create policy "admin delete" on public.new_units for delete to authenticated using (public.is_admin_mfa());

create or replace function private.guard_new_unit() returns trigger language plpgsql security definer set search_path = public as $$
declare staff boolean := public.is_staff(auth.uid()) and coalesce(auth.jwt()->>'aal','') = 'aal2';
begin
  if current_user not in ('authenticated','anon') then return new; end if;
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    if not staff then new.status := case when new.status = 'PENDING_APPROVAL' then 'PENDING_APPROVAL' else 'DRAFT' end; new.review_notes := ''; end if;
    return new;
  end if;
  if not staff then
    if new.developer_id is distinct from old.developer_id then raise exception 'FORBIDDEN'; end if;
    new.review_notes := old.review_notes;
    if new.status is distinct from old.status and not (
      (old.status in ('DRAFT','REJECTED') and new.status = 'PENDING_APPROVAL') or
      (old.status = 'PUBLISHED' and new.status in ('PAUSED','UNAVAILABLE','RESERVED','SOLD')) or
      (old.status in ('PAUSED','UNAVAILABLE') and new.status = 'PUBLISHED') or
      (old.status = 'RESERVED' and new.status in ('PUBLISHED','SOLD'))
    ) then raise exception 'STATUS_CHANGE_FORBIDDEN'; end if;
    if old.status in ('APPROVED','PUBLISHED','PAUSED','UNAVAILABLE','RESERVED') and (
      new.price is distinct from old.price or new.down_payment is distinct from old.down_payment or
      new.installment_years is distinct from old.installment_years or new.installment_plan is distinct from old.installment_plan or new.currency is distinct from old.currency) then
      new.status := 'PENDING_APPROVAL';
    end if;
    if old.status = 'SOLD' then raise exception 'LOCKED'; end if;
  end if;
  return new;
end $$;
create trigger new_units_guard before insert or update on public.new_units for each row execute function private.guard_new_unit();

-- ===== project opportunities =====
create type public.project_opp_type as enum ('DEVELOPMENT_PROJECT','LAND_PLUS_DEVELOPMENT','BUILDING_PORTFOLIO','INVESTMENT_OPPORTUNITY','DEVELOPMENT_PARTNERSHIP');
create type public.project_opp_status as enum ('DRAFT','PENDING_REVIEW','VERIFIED','PUBLISHED','PAUSED','CLOSED','REJECTED');
drop policy "public read" on public.project_opportunities;
drop policy "admin write" on public.project_opportunities;
alter table public.project_opportunities drop column published;
alter table public.project_opportunities
  add column status public.project_opp_status not null default 'DRAFT',
  add column opp_type public.project_opp_type not null default 'DEVELOPMENT_PROJECT',
  add column owner_id uuid default auth.uid(), add column location text not null default '',
  add column size_sqm numeric, add column development_status text not null default '',
  add column investment_value numeric, add column currency public.currency_code not null default 'EGP',
  add column terms text not null default '', add column review_notes text not null default '';
create index project_opps_status_idx on public.project_opportunities(status, sort_order);

create table public.feature_flags (key text primary key, enabled boolean not null default false, label text not null default '', updated_at timestamptz not null default now());
grant select on public.feature_flags to anon, authenticated; grant update on public.feature_flags to authenticated; grant all on public.feature_flags to service_role;
alter table public.feature_flags enable row level security;
create policy "public read flags" on public.feature_flags for select to anon, authenticated using (true);
create policy "admin update flags" on public.feature_flags for update to authenticated using (public.is_admin_mfa()) with check (public.is_admin_mfa());
create trigger audit_changes after update on public.feature_flags for each row execute function private.audit_row();
create trigger touch before update on public.feature_flags for each row execute function private.touch();
insert into public.feature_flags(key, enabled, label) values
 ('project_opportunities', false, 'قسم فرص المشاريع'),
 ('new_units', true, 'قسم الوحدات الجديدة'),
 ('new_listings', true, 'استقبال طلبات خروج جديدة'),
 ('interest_requests', true, 'استقبال طلبات الاهتمام'),
 ('maintenance_mode', false, 'وضع الصيانة (الموقع مقفول للزوار)');

create or replace function public.flag_on(_key text) returns boolean language sql stable security invoker set search_path = public as $$
  select coalesce((select enabled from public.feature_flags where key = _key), false)
$$;

create policy "public read published" on public.project_opportunities for select to anon, authenticated using (status = 'PUBLISHED' and public.flag_on('project_opportunities'));
create policy "owner read" on public.project_opportunities for select to authenticated using (owner_id = auth.uid() or public.is_reviewer() or public.is_admin_mfa());
create policy "verified owner insert" on public.project_opportunities for insert to authenticated with check (
  public.is_admin_mfa() or (owner_id = auth.uid() and public.has_role(auth.uid(),'DEVELOPER') and exists (select 1 from public.developer_members m where m.user_id = auth.uid() and m.verified)));
create policy "owner update" on public.project_opportunities for update to authenticated using (owner_id = auth.uid() or public.is_reviewer() or public.is_admin_mfa()) with check (owner_id = auth.uid() or public.is_reviewer() or public.is_admin_mfa());
create policy "admin delete" on public.project_opportunities for delete to authenticated using (public.is_admin_mfa());

create or replace function private.guard_project_opp() returns trigger language plpgsql security definer set search_path = public as $$
declare staff boolean := public.is_staff(auth.uid()) and coalesce(auth.jwt()->>'aal','') = 'aal2';
begin
  if current_user not in ('authenticated','anon') then return new; end if;
  if tg_op = 'INSERT' then
    if not staff then new.owner_id := auth.uid(); new.status := case when new.status = 'PENDING_REVIEW' then 'PENDING_REVIEW' else 'DRAFT' end; new.review_notes := ''; end if;
    return new;
  end if;
  if not staff then
    if new.owner_id is distinct from old.owner_id then raise exception 'FORBIDDEN'; end if;
    new.review_notes := old.review_notes;
    if old.status in ('PENDING_REVIEW','VERIFIED','CLOSED') and (to_jsonb(new) - array['status','updated_at']) is distinct from (to_jsonb(old) - array['status','updated_at']) then raise exception 'LOCKED'; end if;
    if new.status is distinct from old.status and not (
      (old.status in ('DRAFT','REJECTED') and new.status = 'PENDING_REVIEW') or
      (old.status = 'PUBLISHED' and new.status in ('PAUSED','CLOSED')) or
      (old.status = 'PAUSED' and new.status in ('PUBLISHED','CLOSED'))
    ) then raise exception 'STATUS_CHANGE_FORBIDDEN'; end if;
    if old.status in ('PUBLISHED','PAUSED') and (new.investment_value is distinct from old.investment_value or new.terms is distinct from old.terms) then
      new.status := 'PENDING_REVIEW';
    end if;
  elsif new.status is distinct from old.status then
    if new.status = 'PUBLISHED' and old.status not in ('VERIFIED','PAUSED') then raise exception 'VERIFY_FIRST'; end if;
    if new.status = 'REJECTED' and coalesce(new.review_notes,'') = '' then raise exception 'REASON_REQUIRED'; end if;
  end if;
  return new;
end $$;
create trigger project_opps_guard before insert or update on public.project_opportunities for each row execute function private.guard_project_opp();

-- ===== policies & consent =====
create type public.policy_kind as enum ('TERMS','PRIVACY','FEES','CANCELLATION');
create table public.policy_versions (id uuid primary key default gen_random_uuid(), kind public.policy_kind not null, version int not null, body text not null, published boolean not null default false, created_by uuid default auth.uid(), created_at timestamptz not null default now(), unique(kind, version));
grant select on public.policy_versions to anon, authenticated; grant insert, update on public.policy_versions to authenticated; grant all on public.policy_versions to service_role;
alter table public.policy_versions enable row level security;
create policy "public read published" on public.policy_versions for select to anon, authenticated using (published or public.is_admin_mfa());
create policy "admin write" on public.policy_versions for insert to authenticated with check (public.is_admin_mfa());
create policy "admin publish" on public.policy_versions for update to authenticated using (public.is_admin_mfa() and not published) with check (public.is_admin_mfa());
create trigger audit_changes after insert or update on public.policy_versions for each row execute function private.audit_row();

create table public.policy_acceptances (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), policy_id uuid not null references public.policy_versions(id), context text not null default '', accepted_at timestamptz not null default now(), unique(user_id, policy_id, context));
grant select, insert on public.policy_acceptances to authenticated; grant all on public.policy_acceptances to service_role;
alter table public.policy_acceptances enable row level security;
create policy "own accept" on public.policy_acceptances for insert to authenticated with check (user_id = auth.uid() and length(context) <= 60 and exists (select 1 from public.policy_versions p where p.id = policy_id and p.published));
create policy "own read" on public.policy_acceptances for select to authenticated using (user_id = auth.uid() or public.is_admin_mfa());

-- ===== privacy requests =====
create type public.privacy_request_kind as enum ('EXPORT','CORRECTION','DELETION');
create type public.privacy_request_status as enum ('OPEN','IN_PROGRESS','COMPLETED','REJECTED');
create table public.privacy_requests (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), kind public.privacy_request_kind not null, details text not null default '' check (length(details) <= 2000), status public.privacy_request_status not null default 'OPEN', legal_hold boolean not null default false, decision text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
grant select, insert on public.privacy_requests to authenticated; grant update on public.privacy_requests to authenticated; grant all on public.privacy_requests to service_role;
alter table public.privacy_requests enable row level security;
create policy "own create" on public.privacy_requests for insert to authenticated with check (user_id = auth.uid() and status = 'OPEN' and not legal_hold and decision = '');
create policy "own read" on public.privacy_requests for select to authenticated using (user_id = auth.uid() or public.is_admin_mfa());
create policy "admin handle" on public.privacy_requests for update to authenticated using (public.is_admin_mfa()) with check (public.is_admin_mfa());
create trigger audit_changes after update on public.privacy_requests for each row execute function private.audit_row();
create trigger touch before update on public.privacy_requests for each row execute function private.touch();

-- ===== analytics events (real tracking) =====
create table public.analytics_events (id bigserial primary key, kind text not null check (kind in ('view','search','favorite','signup')), section text not null default '' check (length(section) <= 40), ref text not null default '' check (length(ref) <= 120), meta jsonb not null default '{}' check (length(meta::text) <= 1000), user_id uuid default auth.uid(), created_at timestamptz not null default now());
create index analytics_events_kind_idx on public.analytics_events(kind, created_at desc);
grant insert on public.analytics_events to anon, authenticated; grant select on public.analytics_events to authenticated; grant all on public.analytics_events to service_role;
grant usage, select on sequence public.analytics_events_id_seq to anon, authenticated;
alter table public.analytics_events enable row level security;
create policy "anyone logs" on public.analytics_events for insert to anon, authenticated with check (user_id is not distinct from auth.uid());
create policy "admin read" on public.analytics_events for select to authenticated using (public.is_admin_mfa());

-- interest gated by flag
drop policy "anyone submits lead" on public.leads;
create policy "anyone submits lead" on public.leads for insert to anon, authenticated with check (public.flag_on('interest_requests') and status = 'NEW' and assigned_to is null and length(name) between 2 and 100 and length(phone) between 6 and 20 and length(message) <= 2000);
create index if not exists leads_status_idx on public.leads(status, created_at desc);