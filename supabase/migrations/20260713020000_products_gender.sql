-- Genre des articles : femme, homme, mixte (unisexe)
alter table public.products add column if not exists gender text not null default 'mixte'
  check (gender in ('femme', 'homme', 'mixte'));

create index if not exists products_gender_idx on public.products (gender);
