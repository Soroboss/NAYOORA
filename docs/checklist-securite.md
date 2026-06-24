# Checklist sécurité — NAYOORA

| Point | État | Action requise |
| --- | --- | --- |
| Secrets dans `.env.local` | À configurer | Créer localement `.env.local` avec les clés InsForge non publiques. Ne jamais le commiter. |
| `.env.local` ignoré | Prêt | Couvert par `.gitignore`. |
| RLS sur les tables métier | Prêt en migrations | Appliquer et vérifier `00031_tenant_security_hardening.sql` après conversion des migrations vers InsForge. |
| Policies RLS | Prêt en migrations | Vérifier chaque policy avec deux organisations de test avant production. |
| Validation côté serveur | Partiel | Les routes vérifient rôle, tenant et champs requis. Étendre progressivement les validateurs de format par domaine. |
| Dépendances / audit npm | À vérifier | Générer et versionner `package-lock.json`, puis exécuter `npm audit --omit=dev`. |
| Middleware d’authentification | Prêt | Redirection des routes privées et limitation de débit API présentes. |
| Vérification email | Activée dans InsForge | Le projet InsForge exige déjà la vérification email. Ajouter l’URL Vercel finale aux redirections. |
| Rate limiting | Prêt, à renforcer | 60 requêtes/minute/IP/instance ; passer à Vercel KV ou Redis pour le mode multi-instance. |
| Sauvegardes | À configurer | Activer PITR, export chiffré quotidien et test de restauration mensuel. |

## Vérification InsForge avant production

Après migration, exécuter :

```bash
npx @insforge/cli db tables
npx @insforge/cli db policies
npx @insforge/cli db indexes
npx @insforge/cli db triggers
npx @insforge/cli diagnose advisor --category security
```

Les commandes doivent être exécutées contre un backend de branche ou de staging avant toute application sur la production.
