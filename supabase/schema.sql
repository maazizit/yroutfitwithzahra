-- Schéma Outfit with Zahra — à exécuter dans Supabase (SQL Editor)

create table if not exists public.products (
  id text primary key,
  name text not null,
  brand text not null,
  price numeric(10, 2) not null check (price >= 0),
  original_price numeric(10, 2),
  currency text not null default 'EUR',
  image text,
  url text not null,
  awin_mid text,
  tags text[] not null default '{}',
  category text not null default 'Hauts',
  updated_at timestamptz not null default now()
);

create index if not exists products_price_idx on public.products (price);
create index if not exists products_tags_idx on public.products using gin (tags);

-- RLS : lecture publique (catalogue), écriture réservée au service_role (cron).
alter table public.products enable row level security;

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
  on public.products for select
  to anon, authenticated
  using (true);

-- Aucune policy insert/update/delete pour anon/authenticated :
-- seule la service_role key (Edge Function sync-awin-feed) peut écrire.

-- ─────────────────────────────────────────────────────────────
-- CRON : rafraîchir le catalogue depuis le flux Awin 2x/jour.
-- Prérequis : extensions pg_cron + pg_net activées (Dashboard → Database → Extensions),
-- puis remplace <PROJECT_REF> et <SERVICE_ROLE_KEY> avant d'exécuter :
--
-- select cron.schedule(
--   'sync-awin-feed-twice-daily',
--   '0 6,18 * * *',
--   $$
--   select net.http_post(
--     url := 'https://<PROJECT_REF>.supabase.co/functions/v1/sync-awin-feed',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );
