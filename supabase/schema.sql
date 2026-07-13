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
  modest boolean not null default false,
  sizes text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- Si la table existe déjà sans la colonne (migration) :
alter table public.products add column if not exists modest boolean not null default false;
alter table public.products add column if not exists sizes text[] not null default '{}';
alter table public.products add column if not exists colours text[] not null default '{}';
alter table public.products add column if not exists gender text not null default 'mixte'
  check (gender in ('femme', 'homme', 'mixte'));

create index if not exists products_price_idx on public.products (price);
create index if not exists products_tags_idx on public.products using gin (tags);
create index if not exists products_sizes_idx on public.products using gin (sizes);
create index if not exists products_colours_idx on public.products using gin (colours);
create index if not exists products_gender_idx on public.products (gender);

-- RLS : lecture publique (catalogue), écriture réservée au service_role (cron).
alter table public.products enable row level security;

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
  on public.products for select
  to anon, authenticated
  using (true);

-- Aucune policy insert/update/delete pour anon/authenticated : l'app ne peut
-- que lire. L'écriture se fait uniquement via scripts/import-awin.js, qui se
-- connecte en tant que rôle postgres (contourne RLS) avec SUPABASE_DB_PASSWORD.

-- Provenance du tagging morphologique (voir supabase/migrations/20260713060000_products_tag_source.sql)
alter table public.products
  add column if not exists tag_source text not null default 'heuristic'
  check (tag_source in ('gemini', 'heuristic'));
create index if not exists products_tag_source_idx on public.products (tag_source);

-- Traçabilité multi-source (voir supabase/migrations/20260713100000_products_source.sql)
alter table public.products add column if not exists source text not null default 'legacy';
create index if not exists products_source_idx on public.products (source);

-- ─────────────────────────────────────────────────────────────
-- CRON : rafraîchir le catalogue depuis Awin 2x/jour.
-- Géré par GitHub Actions (.github/workflows/sync-awin-feed.yml), pas par
-- pg_cron/Edge Function — le script scripts/import-awin.js tourne côté CI
-- et se connecte directement à Postgres. Rien à configurer ici.
