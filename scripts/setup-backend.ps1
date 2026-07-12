#Requires -Version 5.1
<#
.SYNOPSIS
  Configure Supabase (schéma + Edge Functions) et secrets Awin / Gemini pour Outfit with Zahra.

.USAGE
  1. supabase login
  2. .\scripts\setup-backend.ps1
     (ou avec les secrets :)
  3. .\scripts\setup-backend.ps1 -GeminiApiKey "AIza..." -AwinFeedUrl "https://productdata.awin.com/..."

  Clé Gemini gratuite : https://aistudio.google.com/apikey
  URL flux Awin : Awin → Toolbox → Create-a-Feed → CSV → copier l'URL
#>
param(
  [string]$ProjectRef = "cuwtknywzfyvhuuvvrpd",
  [string]$DbPassword,
  [string]$GeminiApiKey,
  [string]$AwinFeedUrl
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Load-DotEnv {
  if (-not (Test-Path ".env")) { return }
  Get-Content ".env" | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) { return }
    $eq = $line.IndexOf('=')
    if ($eq -lt 1) { return }
    $k = $line.Substring(0, $eq).Trim()
    $v = $line.Substring($eq + 1).Trim()
    if (-not (Get-Item -Path "Env:$k" -ErrorAction SilentlyContinue)) {
      Set-Item -Path "Env:$k" -Value $v
    }
  }
}

Load-DotEnv

if (-not $DbPassword -and $env:SUPABASE_DB_PASSWORD) { $DbPassword = $env:SUPABASE_DB_PASSWORD }
if (-not $GeminiApiKey -and $env:GEMINI_API_KEY) { $GeminiApiKey = $env:GEMINI_API_KEY }
if (-not $AwinFeedUrl -and $env:AWIN_FEED_URL) { $AwinFeedUrl = $env:AWIN_FEED_URL }

function Require-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Commande introuvable : $name. Installe-la puis relance ce script."
  }
}

Write-Host "==> Vérification Supabase CLI..." -ForegroundColor Cyan
Require-Command supabase

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "    .env créé depuis .env.example" -ForegroundColor Yellow
}

Write-Host "==> Liaison au projet Supabase $ProjectRef..." -ForegroundColor Cyan
supabase link --project-ref $ProjectRef

Write-Host "==> Application du schéma (migrations)..." -ForegroundColor Cyan
$pwd = if ($DbPassword) { $DbPassword } else { $env:SUPABASE_DB_PASSWORD }
if ($pwd) {
  $env:SUPABASE_DB_PASSWORD = $pwd
  node -e "const { Client } = require('pg'); const fs = require('fs'); const sql = fs.readFileSync('supabase/migrations/20260712150000_init_products.sql','utf8'); const client = new Client({ connectionString: 'postgresql://postgres:' + process.env.SUPABASE_DB_PASSWORD + '@db.$ProjectRef.supabase.co:5432/postgres', ssl: { rejectUnauthorized: false } }); client.connect().then(() => client.query(sql)).then(() => client.end()).then(() => console.log('Schema OK via PostgreSQL')).catch(e => { console.error(e.message); process.exit(1); });"
} else {
  supabase db push
}

Write-Host "==> Déploiement des Edge Functions..." -ForegroundColor Cyan
supabase functions deploy tag-morphology --no-verify-jwt
supabase functions deploy sync-awin-feed --no-verify-jwt

if ($GeminiApiKey) {
  Write-Host "==> Secret GEMINI_API_KEY..." -ForegroundColor Cyan
  supabase secrets set "GEMINI_API_KEY=$GeminiApiKey"
} else {
  Write-Host "    GEMINI_API_KEY non fournie — styliste IA inactif tant que non configurée." -ForegroundColor Yellow
  Write-Host "    Obtenir une clé gratuite : https://aistudio.google.com/apikey" -ForegroundColor Yellow
}

if ($AwinFeedUrl) {
  Write-Host "==> Secret AWIN_FEED_URL..." -ForegroundColor Cyan
  supabase secrets set "AWIN_FEED_URL=$AwinFeedUrl"
  Write-Host "==> Import initial du catalogue Awin..." -ForegroundColor Cyan
  node scripts/import-awin.js
} else {
  Write-Host "    AWIN_FEED_URL non fournie — catalogue démo jusqu'à configuration." -ForegroundColor Yellow
  Write-Host "    Awin → Toolbox → Create-a-Feed → format CSV → copier l'URL du flux." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Terminé. Lance l'app : npx expo start" -ForegroundColor Green
Write-Host "Test IA : onglet Mon style → Styliste IA" -ForegroundColor Green
Write-Host "Test catalogue : pull-to-refresh sur l'onglet Shopping" -ForegroundColor Green
