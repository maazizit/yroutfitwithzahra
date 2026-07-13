-- Trace la provenance du tagging morphologique de chaque produit :
-- 'gemini' = tagué par l'IA (fiable, critères de style précis) ;
-- 'heuristic' = filet de secours par mots-clés (moins fiable, utilisé
-- seulement quand Gemini est indisponible ou hors quota).
-- Sert aussi de cache : un produit déjà tagué par Gemini n'est jamais
-- re-tagué (économise le quota gratuit) — voir scripts/import-awin.js.
alter table public.products
  add column if not exists tag_source text not null default 'heuristic'
  check (tag_source in ('gemini', 'heuristic'));

create index if not exists products_tag_source_idx on public.products (tag_source);
