create table if not exists feed_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  display_name text not null,
  cat_id text not null,
  cat_name text not null,
  title text not null,
  emoji text not null,
  action_type text not null, -- 'started', 'marked_today', 'finished', 'recommended'
  img text,
  rating numeric,
  is_public boolean default true,
  created_at timestamptz default now()
);
-- RLS
alter table feed_events enable row level security;
-- Leitura: utilizador vê os seus próprios eventos + eventos públicos de qualquer user
create policy "feed_events_select" on feed_events
  for select using (is_public = true or auth.uid() = user_id);
-- Escrita: só o próprio utilizador pode inserir os seus eventos
create policy "feed_events_insert" on feed_events
  for insert with check (auth.uid() = user_id);
-- Update: só o próprio pode actualizar (para desligar is_public)
create policy "feed_events_update" on feed_events
  for update using (auth.uid() = user_id);
-- Delete: só o próprio pode apagar
create policy "feed_events_delete" on feed_events
  for delete using (auth.uid() = user_id);
