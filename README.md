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
  Triangle inversé) + curseur de budget max + **Mode Pudeur 🧕** (looks char3i :
  pièces couvrantes, amples et élégantes — hijabs, abayas modernes, robes longues).
- Flux shopping : grille élégante (photo, marque, prix, badge « Idéal pour Silhouette … »),
  bouton **Acheter** → lien d'affiliation Awin.
- Filtres par catégorie (Robes, Hauts, Bas, Vestes, Accessoires).

**Lot 1.5 — IA & Ventes Privées**
- **Styliste IA** (Gemini 2.0 Flash via Supabase Edge Function) : décris un vêtement,
  l'IA renvoie un JSON strict avec les morphologies qu'il met en valeur.
- Onglet **Ventes Privées** : articles à -30 % et plus, triés par compatibilité
  morphologique puis remise, toujours dans ton budget.
- Onglet **« Conseils with Zahra »** : chatbot styliste avec l'avatar de Zahra —
  répond via Gemini (fonction `ask-zahra`) quand elle est déployée, sinon via le
  moteur de conseils intégré (entretien, mariage, soirée, couleurs, jean…),
  toujours personnalisé selon la silhouette et le budget.
  Pour afficher ta vraie photo dans le chat : ajoute `assets/zahra.jpg` puis
  modifie la constante `PHOTO` dans `src/components/ZahraAvatar.tsx`.

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
cp .env.example .env   # déjà fait si tu utilises ce repo en local
npx expo start         # scanne le QR code avec Expo Go
```

## 🔌 Connexion Supabase + Awin + IA (à faire une fois)

1. **Table + sécurité** : ouvre le [SQL Editor](https://supabase.com/dashboard) de ton
   projet et exécute `supabase/schema.sql`.
2. **Fonctions IA** :
   ```bash
   supabase functions deploy tag-morphology
   supabase functions deploy ask-zahra
   supabase secrets set GEMINI_API_KEY=<clé_créée_sur_aistudio.google.com>
   ```
3. **Cron du flux Awin** (quand le programme Shein est approuvé) :
   ```bash
   supabase functions deploy sync-awin-feed
   supabase secrets set AWIN_FEED_URL=<url_create-a-feed_awin>
   ```
   puis planifie le cron `pg_cron` (instructions en bas de `supabase/schema.sql`).

### Option rapide (recommandée) — script automatique

```powershell
# 1. Connexion Supabase CLI (ouvre le navigateur) — requis pour déployer les Edge Functions
supabase login

# 2. Déploie table + Edge Functions + secrets
#    (le schéma peut aussi passer par mot de passe PostgreSQL si pas encore fait)
.\scripts\setup-backend.ps1 -DbPassword "TON_MDP_POSTGRES"

# Avec toutes les clés :
.\scripts\setup-backend.ps1 -DbPassword "TON_MDP" -GeminiApiKey "AIza..." -AwinFeedUrl "https://productdata.awin.com/..."
```

> Le mot de passe PostgreSQL ne va **jamais** dans `.env` ni sur GitHub — uniquement en argument du script ou variable d'environnement locale.

| Secret | Où l'obtenir |
|---|---|
| `GEMINI_API_KEY` | Gratuit sur [Google AI Studio](https://aistudio.google.com/apikey) — tier gratuit Gemini 2.0 Flash |
| `AWIN_FEED_URL` | [Awin](https://ui.awin.com/user) → **Outils → Create-a-Feed** → format **CSV** → copier l'URL du flux |

> **Compte Awin `yroutfitwithzahra` (2982087)** : si Create-a-Feed est bloqué, complète d'abord le
> profil éditeur (site web, espaces publicitaires, paiement) puis rejoins le programme **SHEIN**
> (Annonceurs → S'inscrire à des programmes).

### Option manuelle (dashboard Supabase)

1. **Table** : [SQL Editor](https://supabase.com/dashboard/project/cuwtknywzfyvhuuvvrpd/sql/new) → coller et exécuter `supabase/schema.sql`.
2. **IA** : [Edge Functions](https://supabase.com/dashboard/project/cuwtknywzfyvhuuvvrpd/functions) → déployer `tag-morphology` → [Secrets](https://supabase.com/dashboard/project/cuwtknywzfyvhuuvvrpd/functions/secrets) → `GEMINI_API_KEY`.
3. **Catalogue Awin** : déployer `sync-awin-feed` → secret `AWIN_FEED_URL` → invoquer la fonction une fois.

Tant que la table `products` est vide, l'app affiche le catalogue de démonstration — elle reste utilisable sur mobile.

### Variables GitHub Actions (Secrets)

| Secret GitHub | Variable `.env` | Usage |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | idem | App mobile |
| `EXPO_PUBLIC_SUPABASE_KEY` | idem | App mobile |
| `SUPABASE_DB_PASSWORD` | idem | Scripts import / migrations |
| `GEMINI_API_KEY` | idem | Styliste IA (Edge Function) |
| `AWIN_FEED_URL` | idem | Import catalogue Awin |
| `SUPABASE_ACCESS_TOKEN` | optionnel (`sbp_...`) | Déploiement CLI Edge Functions |

Import manuel du catalogue :

```bash
npm run import:awin
```

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
