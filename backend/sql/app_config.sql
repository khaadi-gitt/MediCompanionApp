create table if not exists public.app_config (
  id integer primary key,
  openai_enabled boolean not null default false,
  openai_model text not null default 'gpt-4o-mini',
  openai_api_key text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.app_config (id, openai_enabled, openai_model, openai_api_key)
values (1, false, 'gpt-4o-mini', '')
on conflict (id) do nothing;
