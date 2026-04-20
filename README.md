# 🎵 Écho — Votre Hub Musical Privé

**Écho** est un dashboard d'analytics musicales premium conçu pour transformer vos données Last.fm en une expérience visuelle élégante, interactive et totalement privée. 

Initialement créé comme un outil personnel, il est désormais architecturé comme un **SaaS "Club Privé"** : partagez l'accès avec vos amis tout en gardant une isolation totale des données.

---

## ✨ Fonctionnalités Clés

- 🚀 **Turbo Sync** : Synchronisation incrémentielle ultra-rapide avec Last.fm.
- 🔐 **Authentification OAuth** : Connexion sécurisée via le flux officiel Last.fm.
- 🎟️ **Mode Club Privé** : Accès restreint par un code d'invitation secret.
- 📊 **Analytics Avancés** : Top artistes, titres, tendances horaires et quotidiennes.
- 🎨 **Aesthetic Design** : Interface moderne, responsive et centrée sur l'expérience utilisateur.
- ☁️ **Infrastructure Cloud** : Piloté par Next.js et PostgreSQL (Neon.tech).

---

## 🛠️ Stack Technique

- **Frontend** : Next.js (App Router), React, Lucide Icons.
- **Backend** : Next.js API Routes, Middleware de sécurité.
- **Base de Données** : PostgreSQL (Neon) avec isolation multi-utilisateurs.
- **API** : Last.fm Web Services.
- **Déploiement** : Vercel.

---

## 🚀 Installation & Déploiement

### Variables d'Environnement
Pour faire tourner le projet, vous aurez besoin des clés suivantes dans votre `.env.local` :

```bash
DATABASE_URL=votre_url_postgresql_neon
INVITE_CODE=votre_code_secret
LASTFM_API_KEY=votre_api_key
LASTFM_SHARED_SECRET=votre_shared_secret
```

### Lancement Local
```bash
npm install
npm run dev
```

### Déploiement Vercel
Le projet est configuré pour Vercel (voir `vercel.json`). N'oubliez pas d'ajouter les variables d'environnement dans l'interface Vercel.

---

## 🔒 Confidentialité
Les données sont stockées de manière isolée pour chaque utilisateur. L'accès est protégé par un code d'invitation secret défini par l'administrateur.

---
*Fait avec ❤️ pour les amoureux de la musique.*