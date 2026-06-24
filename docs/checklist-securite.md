# Checklist sécurité — NAYOORA

| Point | État | Action requise |
| --- | --- | --- |
| Secrets dans `.env.local` | À compléter en local | Le dépôt fournit `.env.example`; les secrets de production sont configurés dans Vercel et ne sont pas versionnés. Créer un `.env.local` local avant de développer hors Vercel. |
| `.env.local` ignoré | Validé | `.env`, `.env.local` et les variantes locales sont couverts par `.gitignore`. |
| RLS sur les tables métier | Validé dans le schéma | Les migrations activent RLS et imposent `organization_id` sur les données métier. Le diagnostic InsForge du 24 juin 2026 ne relève aucune alerte de sécurité. |
| Policies RLS | Validé dans le schéma | Les policies séparent lecture membre, gestion organisation, gestion financière et administration SaaS. Un test croisé à deux organisations reste recommandé avant l’ouverture commerciale. |
| Validation côté serveur | Partiel, en place pour les flux sensibles | Les routes contrôlent la session, le rôle, l’organisation, les limites d’offre et les champs requis. Ajouter des schémas de validation complets par domaine au fil des nouveaux modules. |
| Dépendances / audit npm | Attention requise | `package-lock.json` est versionné. Audit du 24 juin 2026 : 2 alertes modérées transitives (`postcss` via Next.js 15.5.19), aucune haute ou critique. Ne pas exécuter `npm audit fix --force` sans recette de régression. |
| Middleware d’authentification | Validé | Les routes privées sont protégées et les API sont limitées par IP. Les routes serveur vérifient aussi la session auprès d’InsForge. |
| Vérification email | Activée | InsForge exige la vérification par code. Vérifier en production que `https://nayoora.vercel.app/api/auth/callback` est autorisée dans les redirections InsForge. |
| Rate limiting | En place, à distribuer avant forte charge | Limite mémoire : 60 requêtes/minute/IP/instance. Passer à Vercel KV ou Redis avant un déploiement multi-instance à forte charge. |
| Sauvegardes | À configurer | Activer PITR, export chiffré quotidien et test de restauration mensuel dans InsForge. |
| Ancien domaine Vercel | Retiré | L’alias `organisation360-afrique.vercel.app` a été supprimé. L’alias à utiliser est `https://nayoora.vercel.app`. |

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
