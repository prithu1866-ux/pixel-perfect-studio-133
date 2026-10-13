alter table public.assessments add column medications jsonb not null default '[]'::jsonb;
alter table public.assessments add column priority text;