# Architecture de déploiement — NAYOORA

## Cibles

```text
GitHub (source + CI)
        |
        +--> Vercel: Next.js, pages publiques, UI, routes serveur
        |
        +--> InsForge: Auth, PostgreSQL, RLS, Storage, Edge Functions, schedules
```

## Git et CI

- Branche protégée `main` : fusion seulement après build et contrôle TypeScript.
- Branche `staging` : tests d’intégration et migrations sur un backend InsForge de branche.
- Les fichiers `.env*`, `.insforge/`, exports et dépendances ne doivent jamais être commités.
- Les migrations sont immuables : une correction est une nouvelle migration, jamais une réécriture de l’historique appliqué.

## Vercel

Variables publiques uniquement : URL backend et clé anon. Les secrets (service key, clés de paiement, fournisseurs SMS/email) restent dans les variables serveur Vercel ou dans InsForge.

Configurer au minimum :

```text
NEXT_PUBLIC_APP_URL=https://<domaine-nayoora>
NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Les routes server-side qui gèrent paiements, webhooks et automatisations ne doivent jamais recevoir de clé admin dans le navigateur.

## InsForge : stratégie de migration

Le code actuel s’appuie sur `@supabase/ssr` et `@supabase/supabase-js`. Avant de pointer la production vers InsForge, choisir explicitement l’une des deux voies :

1. **Conserver Supabase** : Vercel + Supabase restent la cible de production immédiate.
2. **Migrer vers InsForge** : créer un projet InsForge de branche, convertir/valider les migrations sous le format InsForge, puis remplacer les clients Supabase par l’adaptateur InsForge dans une branche dédiée.

Ne mélangez pas les deux backends dans une même production. L’authentification, les RLS et les webhooks doivent appartenir à une seule source de vérité.

## Ordre de mise en production

1. Créer le dépôt Git privé et pousser le code sans secrets.
2. Installer les dépendances, produire `package-lock.json`, réussir `npm run build`. Tant que le lockfile n'est pas versionné, la CI utilise provisoirement `npm install`; passez à `npm ci` avant la production.
3. Créer un projet backend de staging, appliquer les migrations et tester les RLS avec deux organisations.
4. Configurer les URLs de redirection via `insforge.toml` et `config apply`.
5. Déployer Vercel en preview, renseigner les variables d’environnement, tester l’onboarding et les paiements.
6. Activer les sauvegardes/PITR, les alertes et les Cron Jobs.
7. Promouvoir vers `main` et production après une restauration testée.
