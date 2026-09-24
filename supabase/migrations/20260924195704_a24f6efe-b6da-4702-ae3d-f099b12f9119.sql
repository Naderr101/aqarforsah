create type public.exit_status as enum ('draft','pending_review');
create type public.payment_category as enum ('PRINCIPAL','MAINTENANCE','TRANSFER_FEE','ADMIN_FEE','PENALTY','INTEREST','OTHER');
create type public.payment_kind as enum ('down_payment','installment','other_charge');
create type public.payment_verification_status as enum ('CLAIMED','VERIFIED','REJECTED');
create type public.currency_code as enum ('EGP','USD');

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;

-- Profiles
create table public.profiles (
  id uuid primary key,
  full_name text not null default '',
  phone text not null default '',
  email text not null default '',
  national_id text not null default '',
  city text not null default '',
  preferred_contact text not null default 'phone',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- Reference catalogue
create table public.developers (id text primary key, name text not null, created_at timestamptz not null default now());
create table public.projects (id text primary key, developer_id text not null references public.developers(id) on delete cascade, name text not null, location text not null default '', created_at timestamptz not null default now());
create table public.phases (id text primary key, project_id text not null references public.projects(id) on delete cascade, name text not null, sort_order int not null default 0);
create table public.buildings (id text primary key, phase_id text not null references public.phases(id) on delete cascade, name text not null, sort_order int not null default 0);
create index on public.projects(developer_id);
create index on public.phases(project_id);
create index on public.buildings(phase_id);
grant select on public.developers, public.projects, public.phases, public.buildings to anon, authenticated;
grant all on public.developers, public.projects, public.phases, public.buildings to service_role;
alter table public.developers enable row level security;
alter table public.projects enable row level security;
alter table public.phases enable row level security;
alter table public.buildings enable row level security;
create policy "public read" on public.developers for select to anon, authenticated using (true);
create policy "public read" on public.projects for select to anon, authenticated using (true);
create policy "public read" on public.phases for select to anon, authenticated using (true);
create policy "public read" on public.buildings for select to anon, authenticated using (true);

-- Units (seller-described)
create table public.units (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  project_id text not null references public.projects(id),
  phase_id text references public.phases(id),
  building_id text references public.buildings(id),
  unit_number text not null default '',
  unit_type text not null default '',
  area numeric(10,2) check (area is null or area > 0),
  bedrooms int check (bedrooms is null or bedrooms >= 0),
  bathrooms int check (bathrooms is null or bathrooms >= 0),
  floor text not null default '',
  view text not null default '',
  finishing text not null default '',
  furnished text not null default '',
  delivery_date text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.units(owner_id);
create trigger units_touch before update on public.units for each row execute function public.touch_updated_at();

-- Exit opportunities
create table public.exit_opportunities (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null default auth.uid(),
  status public.exit_status not null default 'draft',
  current_step int not null default 0,
  max_step int not null default 0,
  developer_id text references public.developers(id),
  project_id text references public.projects(id),
  unit_id uuid references public.units(id) on delete set null,
  claimed_remaining_balance numeric(14,2) check (claimed_remaining_balance is null or claimed_remaining_balance >= 0),
  claimed_remaining_currency public.currency_code not null default 'EGP',
  transfer jsonb not null default '{}'::jsonb,
  documents jsonb not null default '{}'::jsonb,
  exit_amount numeric(14,2),
  exit_amount_currency public.currency_code,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.exit_opportunities(seller_id);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  exit_opportunity_id uuid not null unique references public.exit_opportunities(id) on delete cascade,
  owner_id uuid not null default auth.uid(),
  version int not null default 1,
  contract_number text not null default '',
  contract_date date,
  original_value numeric(14,2) check (original_value is null or original_value >= 0),
  currency public.currency_code not null default 'EGP',
  installment_amount numeric(14,2) check (installment_amount is null or installment_amount >= 0),
  installment_frequency text not null default '',
  remaining_installments int check (remaining_installments is null or remaining_installments >= 0),
  next_installment_date date,
  maintenance_status text not null default '',
  assignment_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger contracts_touch before update on public.contracts for each row execute function public.touch_updated_at();

create table public.payment_records (
  id uuid primary key default gen_random_uuid(),
  exit_opportunity_id uuid not null references public.exit_opportunities(id) on delete cascade,
  owner_id uuid not null default auth.uid(),
  kind public.payment_kind not null,
  category public.payment_category not null,
  paid_on date,
  amount_claimed numeric(14,2) not null check (amount_claimed >= 0),
  principal_claimed numeric(14,2) check (principal_claimed is null or principal_claimed >= 0),
  currency public.currency_code not null default 'EGP',
  reference text not null default '',
  verification_status public.payment_verification_status not null default 'CLAIMED',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index on public.payment_records(exit_opportunity_id);

-- Helper: seller owns this draft and it is still editable
create or replace function public.exit_is_editable(_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.exit_opportunities where id = _id and seller_id = auth.uid() and status = 'draft')
$$;

-- Guard: sellers can never set exit amount, and can only move draft -> pending_review with minimum data
create or replace function public.guard_exit_opportunity() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user not in ('authenticated','anon') then
    new.updated_at := now();
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.exit_amount is not null or new.exit_amount_currency is not null then
      raise exception 'EXIT_AMOUNT_FORBIDDEN';
    end if;
    new.status := 'draft';
    new.submitted_at := null;
    new.seller_id := auth.uid();
  else
    if new.exit_amount is distinct from old.exit_amount or new.exit_amount_currency is distinct from old.exit_amount_currency then
      raise exception 'EXIT_AMOUNT_FORBIDDEN';
    end if;
    if new.seller_id <> old.seller_id then raise exception 'OWNER_CHANGE_FORBIDDEN'; end if;
    if new.status is distinct from old.status then
      if not (old.status = 'draft' and new.status = 'pending_review') then
        raise exception 'STATUS_CHANGE_FORBIDDEN';
      end if;
      if new.developer_id is null or new.project_id is null or new.unit_id is null then
        raise exception 'SUBMIT_INCOMPLETE';
      end if;
      if not exists (select 1 from public.contracts c where c.exit_opportunity_id = new.id and c.contract_number <> '') then
        raise exception 'SUBMIT_INCOMPLETE';
      end if;
      if not exists (select 1 from public.payment_records p where p.exit_opportunity_id = new.id) then
        raise exception 'SUBMIT_INCOMPLETE';
      end if;
      if not exists (select 1 from public.profiles pr where pr.id = new.seller_id and pr.full_name <> '' and pr.phone <> '') then
        raise exception 'SUBMIT_INCOMPLETE';
      end if;
      new.submitted_at := now();
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger exit_opportunities_guard before insert or update on public.exit_opportunities for each row execute function public.guard_exit_opportunity();

create or replace function public.guard_payment_record() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated','anon') then
    new.verification_status := 'CLAIMED';
    new.owner_id := auth.uid();
  end if;
  return new;
end $$;
create trigger payment_records_guard before insert or update on public.payment_records for each row execute function public.guard_payment_record();

create or replace function public.guard_owned_row() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('authenticated','anon') then new.owner_id := auth.uid(); end if;
  return new;
end $$;
create trigger contracts_owner before insert on public.contracts for each row execute function public.guard_owned_row();
create trigger units_owner before insert on public.units for each row execute function public.guard_owned_row();

-- Grants + RLS
grant select, insert, update, delete on public.units, public.exit_opportunities, public.contracts, public.payment_records to authenticated;
grant all on public.units, public.exit_opportunities, public.contracts, public.payment_records to service_role;
alter table public.units enable row level security;
alter table public.exit_opportunities enable row level security;
alter table public.contracts enable row level security;
alter table public.payment_records enable row level security;

create policy "seller reads own" on public.exit_opportunities for select to authenticated using (seller_id = auth.uid());
create policy "seller creates draft" on public.exit_opportunities for insert to authenticated with check (seller_id = auth.uid() and status = 'draft');
create policy "seller edits own draft" on public.exit_opportunities for update to authenticated using (seller_id = auth.uid() and status = 'draft') with check (seller_id = auth.uid());
create policy "seller deletes own draft" on public.exit_opportunities for delete to authenticated using (seller_id = auth.uid() and status = 'draft');

create policy "owner reads units" on public.units for select to authenticated using (owner_id = auth.uid());
create policy "owner creates units" on public.units for insert to authenticated with check (owner_id = auth.uid());
create policy "owner edits draft units" on public.units for update to authenticated
  using (owner_id = auth.uid() and not exists (select 1 from public.exit_opportunities e where e.unit_id = units.id and e.status <> 'draft'))
  with check (owner_id = auth.uid());

create policy "owner reads contracts" on public.contracts for select to authenticated using (owner_id = auth.uid());
create policy "owner writes draft contracts" on public.contracts for insert to authenticated with check (owner_id = auth.uid() and public.exit_is_editable(exit_opportunity_id));
create policy "owner edits draft contracts" on public.contracts for update to authenticated using (owner_id = auth.uid() and public.exit_is_editable(exit_opportunity_id)) with check (owner_id = auth.uid() and public.exit_is_editable(exit_opportunity_id));

create policy "owner reads payments" on public.payment_records for select to authenticated using (owner_id = auth.uid());
create policy "owner adds draft payments" on public.payment_records for insert to authenticated with check (owner_id = auth.uid() and public.exit_is_editable(exit_opportunity_id));
create policy "owner edits draft payments" on public.payment_records for update to authenticated using (owner_id = auth.uid() and public.exit_is_editable(exit_opportunity_id)) with check (owner_id = auth.uid() and public.exit_is_editable(exit_opportunity_id));
create policy "owner deletes draft payments" on public.payment_records for delete to authenticated using (owner_id = auth.uid() and public.exit_is_editable(exit_opportunity_id));

-- Seed catalogue
insert into public.developers (id, name) values
 ('palm-hills','بالم هيلز'),('sodic','سوديك'),('emaar','إعمار مصر'),('ora','أورا للتطوير'),('mountain-view','ماونتن فيو');
insert into public.projects (id, developer_id, name, location) values
 ('ph-october','palm-hills','بالم هيلز أكتوبر','٦ أكتوبر'),
 ('hacienda-west','palm-hills','هاسيندا ويست','الساحل الشمالي'),
 ('badya','palm-hills','باديا','٦ أكتوبر'),
 ('sodic-east','sodic','سوديك إيست','الشروق'),
 ('villette','sodic','فيليت','القاهرة الجديدة'),
 ('mivida','emaar','ميفيدا','القاهرة الجديدة'),
 ('marassi','emaar','مراسي','الساحل الشمالي'),
 ('zed-east','ora','زِد إيست','القاهرة الجديدة'),
 ('zed-west','ora','زِد ويست','الشيخ زايد'),
 ('mv-icity','mountain-view','ماونتن فيو آي سيتي','القاهرة الجديدة'),
 ('mv-sokhna','mountain-view','ماونتن فيو السخنة','العين السخنة');
insert into public.phases (id, project_id, name, sort_order)
 select p.id || '-' || v.code, p.id, v.name, v.ord from public.projects p
 cross join (values ('p1','المرحلة الأولى',1),('p2','المرحلة الثانية',2),('p3','المرحلة الثالثة',3)) as v(code,name,ord);
insert into public.buildings (id, phase_id, name, sort_order)
 select ph.id || '-' || v.code, ph.id, v.name, v.ord from public.phases ph
 cross join (values ('a','مبنى A',1),('b','مبنى B',2),('c','مبنى C',3)) as v(code,name,ord);