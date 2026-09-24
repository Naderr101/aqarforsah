-- ===== private helpers (not exposed through the API) =====
create schema if not exists private;
grant usage on schema private to authenticated, service_role;

-- ===== roles =====
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  granted_by uuid,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_staff(_user_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('VERIFICATION_AGENT','ADMIN','SUPER_ADMIN'))
$$;
create or replace function public.is_admin(_user_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('ADMIN','SUPER_ADMIN'))
$$;
revoke execute on function public.has_role(uuid, public.app_role), public.is_staff(uuid), public.is_admin(uuid) from public, anon;
grant execute on function public.has_role(uuid, public.app_role), public.is_staff(uuid), public.is_admin(uuid) to authenticated;

create policy "read own or admin" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- ===== audit log (append-only) =====
create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select on public.audit_events to authenticated;
grant select, insert on public.audit_events to service_role;
alter table public.audit_events enable row level security;
create policy "admins read audit" on public.audit_events for select to authenticated using (public.is_admin(auth.uid()));
create or replace function private.no_audit_changes() returns trigger language plpgsql as $$
begin raise exception 'AUDIT_APPEND_ONLY'; end $$;
create trigger audit_no_update before update or delete on public.audit_events for each row execute function private.no_audit_changes();

create or replace function private.audit(_action text, _entity_type text, _entity_id text, _details jsonb default '{}'::jsonb) returns void
language sql security definer set search_path = public as $$
  insert into public.audit_events(actor_id, action, entity_type, entity_id, details) values (auth.uid(), _action, _entity_type, _entity_id, coalesce(_details,'{}'::jsonb))
$$;
revoke execute on function private.audit(text,text,text,jsonb) from public;
grant execute on function private.audit(text,text,text,jsonb) to authenticated, service_role;

-- default roles for the signed-in user (BUYER + SELLER only)
create or replace function public.ensure_default_roles() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  insert into public.user_roles(user_id, role) values (auth.uid(),'BUYER'),(auth.uid(),'SELLER') on conflict do nothing;
  insert into public.profiles(id) values (auth.uid()) on conflict do nothing;
end $$;
revoke execute on function public.ensure_default_roles() from public, anon;
grant execute on function public.ensure_default_roles() to authenticated;

create or replace function public.set_user_role(_user uuid, _role public.app_role, _grant boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin(auth.uid()) then raise exception 'FORBIDDEN'; end if;
  if _role in ('ADMIN','SUPER_ADMIN') and not public.has_role(auth.uid(),'SUPER_ADMIN') then raise exception 'FORBIDDEN'; end if;
  if _user = auth.uid() and not _grant and _role in ('ADMIN','SUPER_ADMIN') then raise exception 'CANNOT_REMOVE_OWN_ADMIN'; end if;
  if _grant then
    insert into public.user_roles(user_id, role, granted_by) values (_user, _role, auth.uid()) on conflict do nothing;
  else
    delete from public.user_roles where user_id = _user and role = _role;
  end if;
  perform private.audit(case when _grant then 'role.grant' else 'role.revoke' end, 'user', _user::text, jsonb_build_object('role', _role));
end $$;
revoke execute on function public.set_user_role(uuid, public.app_role, boolean) from public, anon;
grant execute on function public.set_user_role(uuid, public.app_role, boolean) to authenticated;

-- ===== account status =====
alter table public.profiles add column account_status public.account_status not null default 'ACTIVE';
create or replace function private.guard_profile() returns trigger language plpgsql set search_path = public as $$
begin
  if current_user not in ('authenticated','anon') then return new; end if;
  if tg_op = 'INSERT' then
    if not public.is_admin(auth.uid()) then new.account_status := 'ACTIVE'; end if;
  elsif new.account_status is distinct from old.account_status then
    if not public.is_admin(auth.uid()) or new.id = auth.uid() then raise exception 'FORBIDDEN'; end if;
    perform private.audit('account.status', 'user', new.id::text, jsonb_build_object('from', old.account_status, 'to', new.account_status));
  end if;
  return new;
end $$;
create trigger profiles_guard before insert or update on public.profiles for each row execute function private.guard_profile();
create policy "staff read profiles" on public.profiles for select to authenticated using (public.is_staff(auth.uid()));
create policy "admin update profiles" on public.profiles for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create or replace function public.is_active_account(_user_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select account_status = 'ACTIVE' from public.profiles where id = _user_id), true)
$$;
revoke execute on function public.is_active_account(uuid) from public, anon;
grant execute on function public.is_active_account(uuid) to authenticated;

-- ===== settings =====
create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  description text not null default '',
  updated_by uuid,
  updated_at timestamptz not null default now()
);
grant select on public.platform_settings to anon, authenticated;
grant update on public.platform_settings to authenticated;
grant all on public.platform_settings to service_role;
alter table public.platform_settings enable row level security;
create policy "read settings" on public.platform_settings for select to anon, authenticated using (true);
create policy "admin edits settings" on public.platform_settings for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create or replace function private.audit_setting() returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now(); new.updated_by := auth.uid();
  perform private.audit('setting.change', 'setting', new.key, jsonb_build_object('from', old.value, 'to', new.value));
  return new;
end $$;
create trigger settings_audit before update on public.platform_settings for each row execute function private.audit_setting();
insert into public.platform_settings(key, value, description) values
 ('buyer_exit_fee_rate', '"0.0125"', 'رسوم المنصة على المشتري في فرص الخروج (نسبة من قيمة الصفقة)'),
 ('seller_fee_rate', '"0"', 'رسوم البائع'),
 ('reservation_hours', '72', 'مدة الحجز بالساعات'),
 ('purchase_request_expiry_hours', '48', 'مدة صلاحية طلب الشراء بالساعات'),
 ('listing_expiry_days', '90', 'مدة صلاحية الإعلان بالأيام'),
 ('verification_sla_hours', '48', 'مدة المراجعة المستهدفة بالساعات'),
 ('valuation_max_age_days', '90', 'أقصى عمر لتقييم سعر السوق بالأيام'),
 ('buyer_verification_before_purchase', '"phone+email"', 'التحقق المطلوب من المشتري قبل طلب الشراء'),
 ('national_id_stage', '"transaction"', 'مرحلة طلب الرقم القومي'),
 ('fee_due_trigger', '"developer_approval"', 'موعد استحقاق الرسوم'),
 ('sales_visibility', '"assigned_only"', 'ظهور العملاء لفريق المبيعات'),
 ('new_units_fee', '"none"', 'رسوم الوحدات الجديدة'),
 ('new_unit_negotiation', 'false', 'التفاوض في الوحدات الجديدة');

-- ===== exit opportunity: staff columns =====
alter table public.exit_opportunities
  add column verified_remaining_balance numeric(14,2) check (verified_remaining_balance is null or verified_remaining_balance >= 0),
  add column exit_amount_confirmed_at timestamptz,
  add column published_at timestamptz,
  add column rejection_reason text not null default '',
  add column staff_notes text not null default '';

-- ===== documents =====
create table public.exit_documents (
  id uuid primary key default gen_random_uuid(),
  exit_opportunity_id uuid not null references public.exit_opportunities(id) on delete cascade,
  owner_id uuid not null default auth.uid(),
  kind public.document_kind not null,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null check (mime_type in ('application/pdf','image/jpeg','image/png','image/webp','image/heic')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 15728640),
  status public.document_status not null default 'UPLOADED',
  version int not null default 1,
  replaces_id uuid references public.exit_documents(id) on delete set null,
  superseded boolean not null default false,
  review_notes text not null default '',
  reviewer_id uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.exit_documents(exit_opportunity_id);
grant select, insert, update, delete on public.exit_documents to authenticated;
grant all on public.exit_documents to service_role;
alter table public.exit_documents enable row level security;

create or replace function public.exit_accepts_documents(_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.exit_opportunities where id = _id and seller_id = auth.uid() and status in ('draft','documents_required'))
$$;
revoke execute on function public.exit_accepts_documents(uuid) from public, anon;
grant execute on function public.exit_accepts_documents(uuid) to authenticated;

create policy "owner or staff read docs" on public.exit_documents for select to authenticated using (owner_id = auth.uid() or public.is_staff(auth.uid()));
create policy "owner uploads docs" on public.exit_documents for insert to authenticated with check (owner_id = auth.uid() and public.exit_accepts_documents(exit_opportunity_id));
create policy "owner deletes fresh docs" on public.exit_documents for delete to authenticated using (owner_id = auth.uid() and status = 'UPLOADED' and public.exit_is_editable(exit_opportunity_id));
create policy "staff reviews docs" on public.exit_documents for update to authenticated using (public.is_staff(auth.uid()) and owner_id <> auth.uid()) with check (public.is_staff(auth.uid()));

create or replace function private.supersede_document(_old uuid, _owner uuid, _opp uuid) returns int
language plpgsql security definer set search_path = public as $$
declare v int;
begin
  update public.exit_documents set superseded = true where id = _old and owner_id = _owner and exit_opportunity_id = _opp returning version into v;
  return coalesce(v, 0);
end $$;
revoke execute on function private.supersede_document(uuid,uuid,uuid) from public;
grant execute on function private.supersede_document(uuid,uuid,uuid) to authenticated;

create or replace function private.guard_document() returns trigger language plpgsql set search_path = public as $$
declare v int;
begin
  if current_user not in ('authenticated','anon') then return new; end if;
  if tg_op = 'INSERT' then
    new.owner_id := auth.uid(); new.status := 'UPLOADED'; new.superseded := false; new.reviewer_id := null; new.reviewed_at := null; new.review_notes := '';
    if new.storage_path not like auth.uid()::text || '/' || new.exit_opportunity_id::text || '/%' then raise exception 'BAD_PATH'; end if;
    if new.replaces_id is not null then
      v := private.supersede_document(new.replaces_id, auth.uid(), new.exit_opportunity_id);
      if v = 0 then raise exception 'BAD_REPLACEMENT'; end if;
      new.version := v + 1;
    else new.version := 1; end if;
    return new;
  end if;
  -- staff review: only review fields may change
  if (to_jsonb(new) - array['status','review_notes','reviewer_id','reviewed_at']) is distinct from (to_jsonb(old) - array['status','review_notes','reviewer_id','reviewed_at']) then
    raise exception 'FORBIDDEN';
  end if;
  new.reviewer_id := auth.uid(); new.reviewed_at := now();
  perform private.audit('document.review', 'document', new.id::text, jsonb_build_object('status', new.status, 'notes', new.review_notes));
  return new;
end $$;
create trigger exit_documents_guard before insert or update on public.exit_documents for each row execute function private.guard_document();

-- ===== payment verification =====
alter table public.payment_records
  add column verified_amount numeric(14,2) check (verified_amount is null or verified_amount >= 0),
  add column verified_principal numeric(14,2) check (verified_principal is null or verified_principal >= 0),
  add column verified_category public.payment_category,
  add column verification_notes text not null default '',
  add column verified_by uuid,
  add column verified_at timestamptz;

create or replace function public.guard_payment_record() returns trigger language plpgsql set search_path = public as $$
begin
  if current_user not in ('authenticated','anon') then return new; end if;
  if tg_op = 'INSERT' then
    new.verification_status := 'CLAIMED'; new.owner_id := auth.uid();
    new.verified_amount := null; new.verified_principal := null; new.verified_category := null; new.verification_notes := ''; new.verified_by := null; new.verified_at := null;
    return new;
  end if;
  if public.is_staff(auth.uid()) and old.owner_id <> auth.uid() then
    -- claims are preserved; only verification fields change
    if (to_jsonb(new) - array['verification_status','verified_amount','verified_principal','verified_category','verification_notes','verified_by','verified_at'])
       is distinct from (to_jsonb(old) - array['verification_status','verified_amount','verified_principal','verified_category','verification_notes','verified_by','verified_at']) then
      raise exception 'CLAIMS_IMMUTABLE';
    end if;
    if new.verification_status in ('VERIFIED','ADJUSTED') and new.verified_amount is null then raise exception 'VERIFIED_AMOUNT_REQUIRED'; end if;
    new.verified_by := auth.uid(); new.verified_at := now();
    perform private.audit('payment.verify', 'payment', new.id::text, jsonb_build_object('status', new.verification_status, 'amount', new.verified_amount, 'principal', new.verified_principal));
    return new;
  end if;
  new.verification_status := 'CLAIMED'; new.verified_amount := null; new.verified_principal := null; new.verified_category := null; new.verification_notes := ''; new.verified_by := null; new.verified_at := null;
  return new;
end $$;

create policy "staff read payments" on public.payment_records for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff verifies payments" on public.payment_records for update to authenticated using (public.is_staff(auth.uid()) and owner_id <> auth.uid()) with check (public.is_staff(auth.uid()));

-- ===== verification checks =====
create table public.exit_verification_checks (
  id uuid primary key default gen_random_uuid(),
  exit_opportunity_id uuid not null references public.exit_opportunities(id) on delete cascade,
  check_type public.verification_check_type not null,
  status public.verification_check_status not null default 'PENDING',
  reviewer_id uuid,
  reviewed_at timestamptz,
  notes text not null default '',
  evidence_document_id uuid references public.exit_documents(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (exit_opportunity_id, check_type)
);
grant select, insert, update on public.exit_verification_checks to authenticated;
grant all on public.exit_verification_checks to service_role;
alter table public.exit_verification_checks enable row level security;
create policy "seller reads own checks" on public.exit_verification_checks for select to authenticated
  using (exists (select 1 from public.exit_opportunities e where e.id = exit_opportunity_id and e.seller_id = auth.uid()));
create policy "staff reads checks" on public.exit_verification_checks for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff creates checks" on public.exit_verification_checks for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "staff updates checks" on public.exit_verification_checks for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create or replace function private.guard_check() returns trigger language plpgsql set search_path = public as $$
begin
  if current_user not in ('authenticated','anon') then return new; end if;
  if exists (select 1 from public.exit_opportunities e where e.id = new.exit_opportunity_id and e.seller_id = auth.uid()) then raise exception 'SELF_REVIEW_FORBIDDEN'; end if;
  if tg_op = 'UPDATE' then
    new.reviewer_id := auth.uid(); new.reviewed_at := now();
    perform private.audit('check.update', 'exit_opportunity', new.exit_opportunity_id::text, jsonb_build_object('check', new.check_type, 'status', new.status, 'notes', new.notes));
  end if;
  return new;
end $$;
create trigger checks_guard before insert or update on public.exit_verification_checks for each row execute function private.guard_check();

-- ===== market valuation =====
create table public.market_valuations (
  id uuid primary key default gen_random_uuid(),
  exit_opportunity_id uuid not null references public.exit_opportunities(id) on delete cascade,
  value numeric(14,2) not null check (value > 0),
  currency public.currency_code not null default 'EGP',
  valuation_date date not null,
  source public.valuation_source not null,
  method text not null default '',
  reviewer_id uuid default auth.uid(),
  notes text not null default '',
  status public.valuation_status not null default 'DRAFT',
  created_at timestamptz not null default now()
);
create index on public.market_valuations(exit_opportunity_id);
grant select, insert, update on public.market_valuations to authenticated;
grant all on public.market_valuations to service_role;
alter table public.market_valuations enable row level security;
create policy "seller reads own valuations" on public.market_valuations for select to authenticated
  using (status = 'VERIFIED' and exists (select 1 from public.exit_opportunities e where e.id = exit_opportunity_id and e.seller_id = auth.uid()));
create policy "staff reads valuations" on public.market_valuations for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff adds valuations" on public.market_valuations for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "staff updates valuations" on public.market_valuations for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
create or replace function private.guard_valuation() returns trigger language plpgsql set search_path = public as $$
begin
  if current_user not in ('authenticated','anon') then return new; end if;
  if exists (select 1 from public.exit_opportunities e where e.id = new.exit_opportunity_id and e.seller_id = auth.uid()) then raise exception 'SELF_REVIEW_FORBIDDEN'; end if;
  new.reviewer_id := auth.uid();
  perform private.audit('valuation.' || lower(tg_op), 'exit_opportunity', new.exit_opportunity_id::text, jsonb_build_object('value', new.value, 'source', new.source, 'status', new.status));
  return new;
end $$;
create trigger valuations_guard before insert or update on public.market_valuations for each row execute function private.guard_valuation();
create or replace function private.supersede_valuations() returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'VERIFIED' then
    update public.market_valuations set status = 'SUPERSEDED' where exit_opportunity_id = new.exit_opportunity_id and id <> new.id and status = 'VERIFIED';
  end if;
  return null;
end $$;
create trigger valuations_single_current after insert or update of status on public.market_valuations for each row execute function private.supersede_valuations();

-- ===== staff access to opportunities & children =====
create policy "staff reads opportunities" on public.exit_opportunities for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff updates opportunities" on public.exit_opportunities for update to authenticated using (public.is_staff(auth.uid()) and seller_id <> auth.uid()) with check (public.is_staff(auth.uid()));
drop policy "seller edits own draft" on public.exit_opportunities;
create policy "seller updates own request" on public.exit_opportunities for update to authenticated
  using (seller_id = auth.uid() and status in ('draft','documents_required','verified') and public.is_active_account(auth.uid()))
  with check (seller_id = auth.uid());
drop policy "seller creates draft" on public.exit_opportunities;
create policy "seller creates draft" on public.exit_opportunities for insert to authenticated
  with check (seller_id = auth.uid() and status = 'draft' and public.is_active_account(auth.uid()));
create policy "staff reads units" on public.units for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff reads contracts" on public.contracts for select to authenticated using (public.is_staff(auth.uid()));

-- ===== verified principal & financial engine (single source of truth) =====
create or replace function private.verified_principal(_id uuid) returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce(sum(coalesce(verified_principal, verified_amount)), 0)::numeric(14,2)
  from public.payment_records
  where exit_opportunity_id = _id
    and verification_status in ('VERIFIED','ADJUSTED')
    and coalesce(verified_category, category) = 'PRINCIPAL'
$$;
revoke execute on function private.verified_principal(uuid) from public;
grant execute on function private.verified_principal(uuid) to authenticated, service_role;

create or replace function public.exit_financials(_id uuid)
returns table (verified_principal numeric, exit_amount numeric, remaining_balance numeric, transaction_value numeric, buyer_fee_rate numeric, buyer_fee numeric, seller_fee_rate numeric, market_value numeric, market_value_date date, estimated_saving numeric, currency public.currency_code)
language plpgsql stable security definer set search_path = public as $$
declare o public.exit_opportunities; r numeric; sr numeric; maxage int; mv record;
begin
  select * into o from public.exit_opportunities where id = _id;
  if not found then return; end if;
  if not (o.seller_id = auth.uid() or public.is_staff(auth.uid()) or o.status = 'published') then return; end if;
  select (value #>> '{}')::numeric into r from public.platform_settings where key = 'buyer_exit_fee_rate';
  select (value #>> '{}')::numeric into sr from public.platform_settings where key = 'seller_fee_rate';
  select (value #>> '{}')::int into maxage from public.platform_settings where key = 'valuation_max_age_days';
  select v.value, v.valuation_date into mv from public.market_valuations v
    where v.exit_opportunity_id = _id and v.status = 'VERIFIED' and v.valuation_date >= current_date - coalesce(maxage, 90)
    order by v.valuation_date desc limit 1;
  verified_principal := private.verified_principal(_id);
  exit_amount := o.exit_amount;
  remaining_balance := o.verified_remaining_balance;
  currency := coalesce(o.exit_amount_currency, 'EGP');
  buyer_fee_rate := coalesce(r, 0.0125);
  seller_fee_rate := coalesce(sr, 0);
  if o.exit_amount is not null and o.verified_remaining_balance is not null then
    transaction_value := o.exit_amount + o.verified_remaining_balance;
    buyer_fee := round(transaction_value * buyer_fee_rate, 2);
    if mv.value is not null then
      market_value := mv.value; market_value_date := mv.valuation_date;
      estimated_saving := mv.value - transaction_value - buyer_fee;
    end if;
  end if;
  return next;
end $$;
revoke execute on function public.exit_financials(uuid) from public;
grant execute on function public.exit_financials(uuid) to anon, authenticated;

create or replace function public.recalculate_exit_amount(_id uuid) returns numeric
language plpgsql security definer set search_path = public as $$
declare o public.exit_opportunities; vp numeric; cur public.currency_code;
begin
  if not public.is_staff(auth.uid()) then raise exception 'FORBIDDEN'; end if;
  select * into o from public.exit_opportunities where id = _id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if o.seller_id = auth.uid() then raise exception 'SELF_REVIEW_FORBIDDEN'; end if;
  if o.status not in ('under_verification','documents_required','verified','published') then raise exception 'BAD_STATUS'; end if;
  vp := private.verified_principal(_id);
  select currency into cur from public.contracts where exit_opportunity_id = _id;
  if o.exit_amount is distinct from vp then
    update public.exit_opportunities set exit_amount = vp, exit_amount_currency = coalesce(cur,'EGP'), exit_amount_confirmed_at = null,
      published_at = case when status = 'published' then null else published_at end,
      status = case when status in ('verified','published') then 'under_verification' else status end,
      updated_at = now()
    where id = _id;
    perform private.audit('exit_amount.calculated', 'exit_opportunity', _id::text, jsonb_build_object('from', o.exit_amount, 'to', vp));
  end if;
  return vp;
end $$;
revoke execute on function public.recalculate_exit_amount(uuid) from public, anon;
grant execute on function public.recalculate_exit_amount(uuid) to authenticated;

-- ===== status workflow guard =====
create or replace function public.guard_exit_opportunity() returns trigger
language plpgsql set search_path = public as $$
declare
  keep text[] := array['status','exit_amount_confirmed_at','submitted_at','published_at','updated_at'];
  staff_cols text[] := array['verified_remaining_balance','rejection_reason','staff_notes'];
begin
  if current_user not in ('authenticated','anon') then new.updated_at := now(); return new; end if;

  if tg_op = 'INSERT' then
    if new.exit_amount is not null or new.exit_amount_currency is not null or new.verified_remaining_balance is not null or new.exit_amount_confirmed_at is not null then
      raise exception 'EXIT_AMOUNT_FORBIDDEN';
    end if;
    new.status := 'draft'; new.submitted_at := null; new.published_at := null; new.seller_id := auth.uid();
    new.rejection_reason := ''; new.staff_notes := '';
    new.updated_at := now();
    return new;
  end if;

  if new.seller_id <> old.seller_id then raise exception 'OWNER_CHANGE_FORBIDDEN'; end if;
  if new.exit_amount is distinct from old.exit_amount or new.exit_amount_currency is distinct from old.exit_amount_currency then
    raise exception 'EXIT_AMOUNT_FORBIDDEN';
  end if;

  if old.seller_id = auth.uid() then
    -- ---- seller path ----
    if (to_jsonb(new) -> 'verified_remaining_balance') is distinct from (to_jsonb(old) -> 'verified_remaining_balance')
       or new.rejection_reason is distinct from old.rejection_reason or new.staff_notes is distinct from old.staff_notes then
      raise exception 'FORBIDDEN';
    end if;
    if old.status <> 'draft' and (to_jsonb(new) - keep) is distinct from (to_jsonb(old) - keep) then raise exception 'LOCKED'; end if;
    if new.exit_amount_confirmed_at is distinct from old.exit_amount_confirmed_at then
      if old.exit_amount_confirmed_at is not null or old.status <> 'verified' or old.exit_amount is null or new.exit_amount_confirmed_at is null then
        raise exception 'CONFIRM_FORBIDDEN';
      end if;
      new.exit_amount_confirmed_at := now();
      perform private.audit('exit_amount.confirmed', 'exit_opportunity', new.id::text, jsonb_build_object('amount', old.exit_amount));
    end if;
    if new.published_at is distinct from old.published_at and new.status = old.status then raise exception 'FORBIDDEN'; end if;
    if new.status is distinct from old.status then
      if old.status in ('draft','documents_required') and new.status = 'pending_review' then
        if new.developer_id is null or new.project_id is null or new.unit_id is null
          or not exists (select 1 from public.contracts c where c.exit_opportunity_id = new.id and c.contract_number <> '')
          or not exists (select 1 from public.payment_records p where p.exit_opportunity_id = new.id)
          or not exists (select 1 from public.profiles pr where pr.id = new.seller_id and pr.full_name <> '' and pr.phone <> '')
          or not exists (select 1 from public.exit_documents d where d.exit_opportunity_id = new.id and d.kind = 'CONTRACT' and not d.superseded)
          or not exists (select 1 from public.exit_documents d where d.exit_opportunity_id = new.id and d.kind = 'RECEIPT' and not d.superseded) then
          raise exception 'SUBMIT_INCOMPLETE';
        end if;
        new.submitted_at := now();
      elsif old.status = 'verified' and new.status = 'published' then
        if new.exit_amount_confirmed_at is null then raise exception 'CONFIRM_REQUIRED'; end if;
        if exists (select 1 from public.exit_verification_checks c where c.exit_opportunity_id = new.id and c.status <> 'PASSED')
           or (select count(*) from public.exit_verification_checks c where c.exit_opportunity_id = new.id) < 8 then
          raise exception 'CHECKS_INCOMPLETE';
        end if;
        new.published_at := now();
      else
        raise exception 'STATUS_CHANGE_FORBIDDEN';
      end if;
    end if;
  elsif public.is_staff(auth.uid()) then
    -- ---- staff path ----
    if (to_jsonb(new) - (keep || staff_cols)) is distinct from (to_jsonb(old) - (keep || staff_cols)) then raise exception 'FORBIDDEN'; end if;
    if new.exit_amount_confirmed_at is distinct from old.exit_amount_confirmed_at and new.exit_amount_confirmed_at is not null then raise exception 'FORBIDDEN'; end if;
    if new.verified_remaining_balance is distinct from old.verified_remaining_balance then
      new.exit_amount_confirmed_at := null;
      perform private.audit('remaining_balance.verified', 'exit_opportunity', new.id::text, jsonb_build_object('from', old.verified_remaining_balance, 'to', new.verified_remaining_balance));
      if old.status in ('verified','published') and new.status = old.status then new.status := 'under_verification'; new.published_at := null; end if;
    end if;
    if new.status is distinct from old.status then
      if not (
        (old.status = 'pending_review' and new.status in ('under_verification','rejected')) or
        (old.status = 'under_verification' and new.status in ('documents_required','verified','rejected')) or
        (old.status = 'documents_required' and new.status in ('under_verification','rejected')) or
        (old.status in ('verified','published') and new.status = 'under_verification')
      ) then raise exception 'STATUS_CHANGE_FORBIDDEN'; end if;
      if new.status = 'verified' then
        if new.exit_amount is null or new.verified_remaining_balance is null then raise exception 'FINANCIALS_INCOMPLETE'; end if;
        if new.exit_amount is distinct from private.verified_principal(new.id) then raise exception 'EXIT_AMOUNT_STALE'; end if;
        if exists (select 1 from public.exit_verification_checks c where c.exit_opportunity_id = new.id and c.status <> 'PASSED')
           or (select count(*) from public.exit_verification_checks c where c.exit_opportunity_id = new.id) < 8 then
          raise exception 'CHECKS_INCOMPLETE';
        end if;
      end if;
      if new.status = 'under_verification' then new.published_at := null; new.exit_amount_confirmed_at := case when old.status in ('verified','published') then null else new.exit_amount_confirmed_at end; end if;
      if new.status = 'rejected' and coalesce(new.rejection_reason,'') = '' then raise exception 'REASON_REQUIRED'; end if;
    end if;
  else
    raise exception 'FORBIDDEN';
  end if;
  new.updated_at := now();
  return new;
end $$;

create or replace function private.after_exit_change() returns trigger language plpgsql set search_path = public as $$
begin
  if new.status is distinct from old.status then
    perform private.audit('exit.status', 'exit_opportunity', new.id::text, jsonb_build_object('from', old.status, 'to', new.status));
    if new.status = 'under_verification' then
      insert into public.exit_verification_checks(exit_opportunity_id, check_type)
      select new.id, t from unnest(enum_range(null::public.verification_check_type)) t
      on conflict (exit_opportunity_id, check_type) do nothing;
    end if;
  end if;
  return null;
end $$;
create trigger exit_after_change after update on public.exit_opportunities for each row execute function private.after_exit_change();

-- staff-driven payment changes on a verified/published listing send it back to verification
create or replace function private.payment_changed_reverify() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.exit_opportunities set status = 'under_verification', published_at = null, exit_amount_confirmed_at = null
   where id = new.exit_opportunity_id and status in ('verified','published');
  return null;
end $$;
create trigger payment_reverify after update on public.payment_records for each row
  when (old.verification_status is distinct from new.verification_status or old.verified_amount is distinct from new.verified_amount or old.verified_principal is distinct from new.verified_principal or old.verified_category is distinct from new.verified_category)
  execute function private.payment_changed_reverify();

-- ===== public listings (published only, no seller data) =====
create or replace function public.public_exit_listings()
returns table (id uuid, project text, developer text, location text, unit_type text, area numeric, bedrooms int, bathrooms int, delivery_date text, published_at timestamptz)
language sql stable security definer set search_path = public as $$
  select e.id, p.name, d.name, p.location, u.unit_type, u.area, u.bedrooms, u.bathrooms, u.delivery_date, e.published_at
  from public.exit_opportunities e
  join public.projects p on p.id = e.project_id
  join public.developers d on d.id = e.developer_id
  left join public.units u on u.id = e.unit_id
  where e.status = 'published'
  order by e.published_at desc
$$;
revoke execute on function public.public_exit_listings() from public;
grant execute on function public.public_exit_listings() to anon, authenticated;