-- Traçabilité multi-source : d'où vient chaque produit (ex. 'awin' pour le
-- flux historique unique, ou 'shein' / 'mango' / ... une fois le catalogue
-- Awin éclaté en plusieurs flux — voir scripts/import-awin.js et
-- docs/multi-source-catalogue.md).
--
-- Permet de purger/désactiver proprement les produits d'un marchand donné
-- si son programme d'affiliation est résilié ou son flux tombe en panne,
-- sans dépendre du préfixe de l'id (fragile, non interrogeable en SQL).
alter table public.products add column if not exists source text not null default 'legacy';

create index if not exists products_source_idx on public.products (source);
