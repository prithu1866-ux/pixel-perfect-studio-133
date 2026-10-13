create type public.app_role as enum ('farmer','veterinarian','field_worker','admin');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  village text,
  district text,
  state text,
  preferred_language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'veterinarian'));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare r text := coalesce(new.raw_user_meta_data->>'requested_role','farmer');
begin
  insert into public.profiles (id, full_name, district, state, preferred_language)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'district', new.raw_user_meta_data->>'state', coalesce(new.raw_user_meta_data->>'preferred_language','en'));
  if r not in ('farmer','veterinarian','field_worker') then r := 'farmer'; end if;
  insert into public.user_roles (user_id, role) values (new.id, r::app_role);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create table public.animals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  tag_id text,
  name text not null,
  species text not null,
  breed text,
  sex text,
  age_months int,
  weight_kg numeric,
  health_status text not null default 'healthy',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.animals to authenticated;
grant all on public.animals to service_role;
alter table public.animals enable row level security;
create policy "owner manage animals" on public.animals for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "vets read animals" on public.animals for select to authenticated using (public.has_role(auth.uid(),'veterinarian'));
create trigger animals_touch before update on public.animals for each row execute function public.touch_updated_at();

create table public.symptom_reports (
  id uuid primary key default gen_random_uuid(),
  client_id text unique,
  owner_id uuid not null,
  animal_id uuid not null references public.animals(id) on delete cascade,
  symptoms text[] not null default '{}',
  temperature_c numeric,
  duration_days int,
  affected_count int not null default 1,
  notes text,
  risk_level text not null,
  risk_score int not null default 0,
  triage_reasons jsonb not null default '[]',
  suspected_conditions text[] not null default '{}',
  status text not null default 'submitted',
  district text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.symptom_reports to authenticated;
grant all on public.symptom_reports to service_role;
alter table public.symptom_reports enable row level security;
create policy "owner read reports" on public.symptom_reports for select to authenticated using (owner_id = auth.uid());
create policy "owner insert reports" on public.symptom_reports for insert to authenticated with check (owner_id = auth.uid() and exists (select 1 from public.animals a where a.id = animal_id and a.owner_id = auth.uid()));
create policy "vets read reports" on public.symptom_reports for select to authenticated using (public.has_role(auth.uid(),'veterinarian'));
create policy "vets update reports" on public.symptom_reports for update to authenticated using (public.has_role(auth.uid(),'veterinarian')) with check (public.has_role(auth.uid(),'veterinarian'));
create trigger reports_touch before update on public.symptom_reports for each row execute function public.touch_updated_at();

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.symptom_reports(id) on delete cascade,
  vet_id uuid not null,
  provisional_diagnosis text not null,
  treatment text,
  advice text,
  follow_up_date date,
  created_at timestamptz not null default now()
);
grant select, insert on public.assessments to authenticated;
grant all on public.assessments to service_role;
alter table public.assessments enable row level security;
create policy "vets insert assessments" on public.assessments for insert to authenticated with check (vet_id = auth.uid() and public.has_role(auth.uid(),'veterinarian'));
create policy "vets read assessments" on public.assessments for select to authenticated using (public.has_role(auth.uid(),'veterinarian'));
create policy "owner read assessments" on public.assessments for select to authenticated using (exists (select 1 from public.symptom_reports r where r.id = report_id and r.owner_id = auth.uid()));

create table public.vaccinations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  animal_id uuid not null references public.animals(id) on delete cascade,
  vaccine text not null,
  disease text,
  administered_on date,
  next_due_on date,
  administered_by text,
  notes text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.vaccinations to authenticated;
grant all on public.vaccinations to service_role;
alter table public.vaccinations enable row level security;
create policy "owner manage vaccinations" on public.vaccinations for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid() and exists (select 1 from public.animals a where a.id = animal_id and a.owner_id = auth.uid()));
create policy "vets read vaccinations" on public.vaccinations for select to authenticated using (public.has_role(auth.uid(),'veterinarian'));

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "own notifications read" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "own notifications update" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.on_report_created() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, title, body, link)
  values (new.owner_id, 'Report submitted', 'Risk level: ' || new.risk_level || '. A veterinarian will review it.', '/reports/' || new.id);
  if new.risk_level in ('high','urgent') then
    update public.animals set health_status = 'under_observation' where id = new.animal_id;
  end if;
  return new;
end $$;
create trigger report_created after insert on public.symptom_reports for each row execute function public.on_report_created();

create or replace function public.on_assessment_created() returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  update public.symptom_reports set status = 'assessed' where id = new.report_id returning owner_id into owner;
  insert into public.notifications (user_id, title, body, link)
  values (owner, 'Veterinarian responded', new.provisional_diagnosis, '/reports/' || new.report_id);
  return new;
end $$;
create trigger assessment_created after insert on public.assessments for each row execute function public.on_assessment_created();