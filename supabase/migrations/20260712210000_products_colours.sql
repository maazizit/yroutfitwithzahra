alter table public.products add column if not exists colours text[] not null default '{}';
create index if not exists products_colours_idx on public.products using gin (colours);
