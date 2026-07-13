# Catalogue multi-source — ne plus dépendre d'un seul marchand

L'app dépendait entièrement du programme d'affiliation Shein via Awin : si ce programme était
résilié ou son flux tombait en panne, le catalogue entier disparaissait du jour au lendemain. Ce
document explique le refactor qui rend l'import "multi-marchands" — même si un seul flux est actif
aujourd'hui.

## Avant / après

**Avant** : `scripts/import-awin.js` ne lisait qu'une seule variable `AWIN_FEED_URL`. Ajouter Zara,
H&M ou Mango demandait d'éditer le code (dupliquer la logique, ou relancer le script à la main en
changeant la variable — écrasant le run précédent). Aucune colonne ne permettait de savoir quel
produit venait de quel marchand : impossible de purger proprement le catalogue d'un marchand dont le
programme est résilié.

**Après** : le script boucle sur une liste de flux configurée en dehors du code. Ajouter un
marchand = ajouter une ligne dans un secret GitHub, pas éditer `import-awin.js`.

## Configuration

Deux options, une seule est nécessaire :

```bash
# Option A — un seul marchand (rétrocompatible)
AWIN_FEED_URL=https://productdata.awin.com/datafeed/download/.../shein

# Option B — plusieurs marchands (prioritaire sur AWIN_FEED_URL si les deux sont présentes)
AWIN_FEEDS=
shein=https://productdata.awin.com/datafeed/download/.../shein
mango=https://productdata.awin.com/datafeed/download/.../mango
hm=https://productdata.awin.com/datafeed/download/.../hm
```

`AWIN_FEEDS` accepte une ligne `clé=url` par marchand (lignes vides et commentaires `#` ignorés). La
**clé** sert à deux choses :

1. **Préfixer les ids en base** : `shein-12345`, `mango-67890` — élimine tout risque de collision si
   deux marchands réutilisent le même `aw_product_id`.
2. **Remplir la colonne `source`** de chaque produit — permet de filtrer/purger un marchand
   proprement (`DELETE FROM products WHERE source = 'shein'`) sans dépendre du préfixe de l'id.

⚠️ **Rétrocompatibilité** : si seule `AWIN_FEED_URL` est définie (ton setup actuel), la clé utilisée
est `awin` — exactement le préfixe qu'utilisaient déjà tes produits importés avant ce refactor. Rien
à re-migrer, le prochain import met simplement à jour les mêmes lignes.

## Ce qui est partagé entre tous les flux d'un run

- **Le quota Gemini** (`GEMINI_TAG_LIMIT`, 200 par défaut) est un budget **global**, pas par flux —
  sinon 3 marchands × 200 appels dépasserait vite le quota gratuit journalier. Le premier flux
  consomme en priorité, les suivants héritent du reste.
- **Le cache `tag_source`** fonctionne pareil qu'avant : un produit déjà tagué par Gemini n'est
  jamais re-tagué, quel que soit son marchand.
- **La connexion Postgres** est ouverte une fois pour tout le run (pas une par flux).
- **Un flux en panne n'interrompt pas les autres** : si le flux Mango échoue (URL expirée, réseau),
  le script logue l'erreur et continue avec les flux suivants — pas d'échec en cascade.

## Fallback de marque

Quand un flux ne fournit pas de `brand_name` (colonne vide), le script utilise un nom de marque par
défaut basé sur la clé du flux (`SOURCE_BRAND_HINTS` dans `import-awin.js` : `shein` → `SHEIN`,
`mango` → `MANGO`, etc.). Une clé inconnue retombe sur la clé elle-même en majuscules.

## Ce qui n'a pas changé

- `src/lib/affiliate.ts` (`buildPurchaseUrl`) fonctionnait déjà correctement pour plusieurs
  marchands Awin : il construit un deep-link si `awinMid` est présent, sinon retombe sur l'URL
  directe. Aucune modification nécessaire.
- Le format CSV reste celui d'Awin ("Create-a-Feed"). Si un jour un marchand est rejoint via un
  **autre réseau d'affiliation** (Rakuten, CJ, Admitad — formats de colonnes différents), il faudra
  un nouveau parseur dédié à ce réseau ; la colonne `source` et le principe de préfixage des ids
  restent valables tels quels.

## Nettoyage : suppression de `sync-awin-feed`

L'Edge Function `supabase/functions/sync-awin-feed` était une **copie obsolète** de la même logique
d'import (pas de tagging Gemini, pas de colonnes couleurs/genre/tag_source), jamais appelée par rien
— le cron GitHub Actions exécute `scripts/import-awin.js` directement. Elle a été supprimée pour
éviter la confusion entre deux pipelines qui semblaient faire la même chose (voir l'audit du
tagging morphologique, qui a justement révélé ce genre de duplication).

## Prochaine étape suggérée (non implémentée)

Si un jour plusieurs flux tournent en parallèle, un tableau de bord simple `SELECT source,
count(*), max(updated_at) FROM products GROUP BY source` permettrait de repérer un flux resté
silencieux (programme résilié, URL expirée) avant que ça se voie dans l'app. Pas construit pour
l'instant — un seul flux actif ne le justifie pas encore.
