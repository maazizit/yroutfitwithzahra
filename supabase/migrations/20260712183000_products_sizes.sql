-- Tailles disponibles par article (depuis flux Awin Fashion:size ou heuristique titre)
alter table public.products add column if not exists sizes text[] not null default '{}';

create index if not exists products_sizes_idx on public.products using gin (sizes);
