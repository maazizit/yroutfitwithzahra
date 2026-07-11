# Outfit with Zahra 🌸

> *"You're gorgeous. Just learn how to embrace your shape."*
> *"Tu es magnifique. Apprends juste à te mettre en valeur."*
> *"أنتِ رائعة، فقط تعلّمي كيف تبرزين جمالك."*

Application mobile de **shopping intelligent par morphologie et budget** : tu choisis ta
silhouette et ton budget max, l'app te montre uniquement des articles de grandes marques
(Shein, Zara, H&M, Mango…) qui te vont **et** que tu peux te payer — avec prix et lien
d'achat affilié.

## ✨ Fonctionnalités

**Lot 1 — MVP**
- Onboarding : sélection visuelle de la morphologie (Sablier, Poire, Pomme, Rectangle,
  Triangle inversé) + curseur de budget max.
- Flux shopping : grille élégante (photo, marque, prix, badge « Idéal pour Silhouette … »),
  bouton **Acheter** → lien d'affiliation Awin.
- Filtres par catégorie (Robes, Hauts, Bas, Vestes, Accessoires).

**Lot 1.5 — IA & Ventes Privées**
- **Styliste IA** (Gemini 2.0 Flash via Supabase Edge Function) : décris un vêtement,
  l'IA renvoie un JSON strict avec les morphologies qu'il met en valeur.
- Onglet **Ventes Privées** : articles à -30 % et plus, triés par compatibilité
  morphologique puis remise, toujours dans ton budget.

## 🧱 Stack

| Couche | Techno |
|---|---|
| Mobile | Expo (React Native) + expo-router + TypeScript |
| Backend | Supabase (PostgreSQL + RLS + Edge Functions) |
| IA | Gemini 2.0 Flash (tier gratuit, clé côté serveur uniquement) |
| Monétisation | Affiliation Awin (publisher ID `2982087`) |

## 🚀 Démarrage

```bash
npm install
cp .env.example .env   # puis vérifie les valeurs
npx expo start         # scanne le QR code avec Expo Go
```

## 🗄️ Configuration Supabase (une seule fois)

1. **Table + sécurité** : ouvre le [SQL Editor](https://supabase.com/dashboard) de ton
   projet et exécute `supabase/schema.sql`.
2. **Fonction IA** :
   ```bash
   supabase functions deploy tag-morphology
   supabase secrets set GEMINI_API_KEY=<clé_créée_sur_aistudio.google.com>
   ```
3. **Cron du flux Awin** (quand le programme Shein est approuvé) :
   ```bash
   supabase functions deploy sync-awin-feed
   supabase secrets set AWIN_FEED_URL=<url_create-a-feed_awin>
   ```
   puis planifie le cron `pg_cron` (instructions en bas de `supabase/schema.sql`).

Tant que la table `products` est vide, l'app affiche automatiquement le catalogue de
démonstration (`src/data/sample-products.ts`) — l'app fonctionne donc dès le premier
lancement.

## 🔗 Affiliation Awin

- Compte publisher : ID `2982087`.
- Rejoindre le programme Shein : Awin → *Advertisers* → rechercher **Shein** → *Join*.
- Récupérer le flux : Awin → *Toolbox* → *Create-a-Feed* → copier l'URL du flux CSV
  → la mettre dans le secret `AWIN_FEED_URL`.

## 🔐 Sécurité — règles non négociables

- Le fichier `.env` n'est **jamais** commité (déjà dans `.gitignore`).
- L'URL Supabase et la **publishable key** sont publiques par design — la sécurité des
  données repose sur les policies **RLS** (`supabase/schema.sql`).
- Le **mot de passe PostgreSQL** et la **service_role key** ne vont ni dans l'app, ni
  sur GitHub, ni dans un chat. Si l'un d'eux a fuité : Dashboard → Settings → réinitialiser
  immédiatement.
- La clé **Gemini** vit uniquement dans les secrets Supabase (côté serveur).
