create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  session_id text not null,
  event_type text not null,
  cat_id text,
  value jsonb,
  created_at timestamptz default now()
);
-- RLS: utilizadores só vêem os seus próprios eventos.
-- Admin (service role) vê tudo para análise.
alter table analytics_events enable row level security;
create policy "analytics_insert" on analytics_events
  for insert with check (true); -- qualquer utilizador autenticado pode inserir
create policy "analytics_select_own" on analytics_events
  for select using (auth.uid() = user_id);
