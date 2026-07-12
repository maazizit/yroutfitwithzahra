-- Migration initiale : table products + RLS lecture publique
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

alter table public.products enable row level security;

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read"
  on public.products for select
  to anon, authenticated
  using (true);

-- Mode Pudeur : colonne modest (ajout idempotent)
alter table public.products add column if not exists modest boolean not null default false;
