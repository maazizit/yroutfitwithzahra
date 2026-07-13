# Tagging morphologique — comment ça marche, comment le valider

Le matching **morphologie → vêtement** est le cœur du produit : c'est lui qui décide quel article
mérite le badge « Idéal pour Silhouette » et dans quel ordre le feed est trié
(`src/lib/products.ts` → `matchesMorphology` / `shoppingFeed`). Si les tags sont mauvais, l'app perd
sa valeur. Ce document explique le pipeline actuel, l'audit qui a mené à sa réécriture, et comment
valider la qualité avant de scaler un import.

## Architecture — deux systèmes, un seul utilisé en production

| Système | Fichier | Déclenché par | Utilise Gemini ? |
|---|---|---|---|
| **Import catalogue** (celui qui alimente vraiment l'app) | `scripts/import-awin.js` | Cron GitHub Actions 2×/jour + `npm run import:awin` | ✅ Oui (depuis le 2026-07-13) |
| **Styliste IA** (outil ponctuel du profil) | `supabase/functions/tag-morphology` | Bouton « Analyser avec l'IA » dans Mon style | ✅ Oui |

**Historique** : avant le 2026-07-13, seul le second système appelait Gemini. Le premier (celui qui
tague *réellement* tout le catalogue affiché dans « Pour toi » et « Ventes Privées ») utilisait 5
règles regex avec un **fallback biaisé** — tout article dont le titre ne matchait aucun mot-clé
recevait automatiquement `['sablier', 'rectangle']`. Résultat : Pomme et Triangle inversé étaient
quasi absentes du catalogue, et Sablier/Rectangle étaient sur-badgées à tort. Voir la section
[Audit initial](#audit-initial--ce-qui-a-été-corrigé) plus bas pour le détail des cas testés.

## Le pipeline aujourd'hui

1. `import-awin.js` télécharge le flux Awin et parse chaque ligne (nom, prix, taille, couleur…).
2. Pour chaque produit, un tag heuristique est d'abord calculé (`inferTags()`) — c'est le **filet de
   secours**, jamais la source principale si Gemini est disponible.
3. Avant d'insérer en base, le script interroge `products` pour connaître le `tag_source` déjà
   enregistré pour chaque id présent dans le flux :
   - `tag_source = 'gemini'` → le produit est **déjà** tagué par l'IA lors d'un run précédent → on
     garde ses tags tels quels, **aucun nouvel appel Gemini** (cache, économise le quota gratuit).
   - Sinon (nouveau produit ou encore en `heuristic`) → éligible à un appel Gemini, dans la limite
     de `GEMINI_TAG_LIMIT` appels par run (200 par défaut, réglable en variable d'environnement).
4. `tagWithGemini()` envoie la description à `gemini-2.0-flash` avec le même prompt que l'Edge
   Function `tag-morphology` (dupliqué volontairement — Deno vs Node, pas de fichier partagé
   simple ; **les deux copies doivent rester alignées**, voir le commentaire en tête de fonction).
5. Si l'appel réussit → `tag_source = 'gemini'`. S'il échoue (réseau, quota, clé absente) → on garde
   les tags heuristiques et `tag_source = 'heuristic'`, **sans jamais bloquer l'import**.
6. Upsert en base avec `ON CONFLICT (id) DO UPDATE` — les colonnes `tags`, `category`, `tag_source`
   sont mises à jour à chaque run (sauf cas 3a ci-dessus, où elles sont préservées).

```
Flux Awin (CSV)
   │
   ▼
inferTags() ── heuristique (filet de secours)
   │
   ▼
déjà tag_source='gemini' en base ? ──oui──▶ garder tel quel (cache)
   │ non
   ▼
quota GEMINI_TAG_LIMIT atteint ? ──oui──▶ garder l'heuristique, tag_source='heuristic'
   │ non
   ▼
tagWithGemini() ──succès──▶ tag_source='gemini'
   │ échec
   ▼
garder l'heuristique, tag_source='heuristic'
```

## Le prompt Gemini — critères par morphologie

Le prompt (`SYSTEM_PROMPT` dans `tag-morphology/index.ts`, dupliqué dans `GEMINI_SYSTEM_PROMPT` dans
`import-awin.js`) donne pour chaque morphologie ce qui la **favorise** et ce qui la **défavorise** —
pas juste une définition d'une ligne :

| Morphologie | Favorisé par | Défavorisé par |
|---|---|---|
| **Sablier** | Taille marquée : cintré, portefeuille, ceinturé, bodycon | Coupes droites/amples sans marquage de taille |
| **Poire** | Volume en haut : épaules structurées, manches ballon, col bateau, épaulettes ; bas fluides/évasés | Hauts moulants sans structure ; jupes crayon serrées sur les hanches |
| **Pomme** | Coupes qui ne serrent pas la taille : empire, fluide, drapé, col V profond | Moulant/ceinturé à la taille naturelle |
| **Rectangle** | Ce qui crée des courbes : péplum, volants, ceinture marquée | Coupes très droites sans détail structurant |
| **Triangle inversé** | Volume en bas : jupe/pantalon évasé, palazzo, wide leg ; hauts sans structure d'épaule | Tout ce qui ajoute du volume aux épaules — **même si excellent pour Poire** |

Le prompt inclut aussi :
- **5 exemples few-shot** (garment → JSON attendu) pour calibrer la précision.
- Une règle explicite pour les **vêtements neutres** (t-shirt basique, jean droit sans détail) : les
  5 tags plutôt qu'un choix arbitraire de 1 à 3.
- Une règle pour les **accessoires sans lien structurel** (boucles d'oreilles, collier) : `tags: []`
  plutôt qu'une réponse inventée.
- Un `responseSchema` Gemini (types stricts + enum) en plus des instructions texte, pour réduire le
  risque de dérive de format.

## Mode debug

L'Edge Function accepte un paramètre `debug: true` dans le body :

```json
{ "description": "Robe portefeuille cintrée", "debug": true }
```

La réponse inclut alors `debugRawText` — le texte brut renvoyé par Gemini avant parsing, utile pour
diagnostiquer un cas où le JSON ne correspond pas à ce qui était attendu.

## Auditer un échantillon avant de scaler

```bash
npm run audit:tags
```

Envoie 13 descriptions de vêtements tests (voir `scripts/audit-tags.js`) à `tag-morphology` en mode
debug, affiche les tags reçus dans le terminal à côté d'un avis de référence, et sauvegarde le
résultat complet dans `audit-tags-result.json` (non commité, ignoré par git).

Pour auditer tes propres descriptions :

```bash
node scripts/audit-tags.js --file mon-echantillon.json
```

avec `mon-echantillon.json` au format `[{ "description": "..." }, ...]`.

**Prérequis** : `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_KEY` dans `.env`, et la fonction
`tag-morphology` déployée avec le secret `GEMINI_API_KEY` configuré côté Supabase.

## Audit initial — ce qui a été corrigé (2026-07-13)

Échantillon de 13 vêtements passés en revue manuellement contre l'ancienne heuristique regex
(`import-awin.js` avant correctif) :

| # | Vêtement | Tag correct (guide de style) | Ancienne heuristique | Verdict |
|---|---|---|---|---|
| 1 | Robe portefeuille cintrée, satinée | Sablier | Sablier | ✅ |
| 2 | Jean taille haute coupe droite | Sablier, Rectangle | Sablier, Rectangle (par hasard — fallback) | ✅ par chance |
| 3 | Blazer oversize épaules structurées | Poire, Rectangle, Pomme — **pas** Triangle inversé | Sablier, Rectangle (fallback) | ❌ |
| 4 | Jupe trapèze taille haute évasée | Poire, Triangle inversé, Rectangle | Poire, Triangle inversé | ✅ incomplet |
| 5 | Haut col bateau structuré | Poire — mauvais pour Triangle inversé | Sablier, Rectangle (fallback) | ❌ |
| 6 | Robe empire manches ballon fluide | Pomme | Pomme | ✅ |
| 7 | Pantalon palazzo taille haute | Triangle inversé, Poire | Triangle inversé, Poire | ✅ |
| 8 | Top crop côtelé moulant | Sablier | Sablier | ✅ |
| 9 | Robe bustier jupon plissé | Sablier, Poire, Rectangle | Sablier, Rectangle (fallback) | ⚠️ partiel |
| 10 | Gilet long droit sans manches | Pomme, Rectangle | Sablier, Rectangle (fallback) | ❌ |
| 11 | Ceinture fine dorée (accessoire) | Neutre — aucune morpho pertinente en soi | Sablier, Rectangle (fallback) | ❌ structurel |
| 12 | Blouse satinée col V profond fluide | Pomme (+ Sablier, Poire en secondaire) | Pomme | ✅ trop étroit |
| 13 | Robe droite mi-longue crayon | Rectangle — pas vraiment Sablier | Sablier, Rectangle (fallback) | ⚠️ partiel |

**Score : 5 erreurs nettes sur 13 (38%), toutes dues au fallback `['sablier', 'rectangle']` par
défaut.** Corrigé par le pipeline décrit ci-dessus (Gemini en source principale + fallback élargi et
non biaisé en dernier recours).

## Variables d'environnement liées au tagging

| Variable | Rôle | Défaut |
|---|---|---|
| `GEMINI_API_KEY` | Clé API Gemini (AI Studio, gratuite) — sans elle, tagging heuristique uniquement | — |
| `GEMINI_TAG_LIMIT` | Nombre max d'appels Gemini par run d'import | `200` |

## Schéma — colonne `tag_source`

```sql
alter table public.products
  add column if not exists tag_source text not null default 'heuristic'
  check (tag_source in ('gemini', 'heuristic'));
```

Voir `supabase/migrations/20260713060000_products_tag_source.sql`. Cette colonne sert à la fois de
**traçabilité** (savoir quels produits ont un tagging fiable) et de **cache** (ne jamais gaspiller du
quota Gemini sur un produit déjà bien tagué).
