# Architecture produit — NAYOORA

## Découpage

- **Web** : Next.js App Router, pages publiques, application authentifiée et Server Components pour les données sensibles.
- **Identité** : InsForge Auth. Les données de profil restent séparées de `auth.users`.
- **Données** : PostgreSQL/InsForge. Toute table métier porte `organization_id`; les RLS vérifient l'adhésion active de l'utilisateur.
- **Domaine** : modules indépendants (`members`, `contributions`, `treasury`, `events`, `loans`, `communications`, `reports`). La configuration par `organization_type` décide quels modules et vocabulaires apparaissent, sans dupliquer les données.
- **Intégrations** : adaptateurs côté serveur pour paiement, SMS, WhatsApp et email. Les webhooks vérifient signature, idempotence (`provider_reference`) et journalisent chaque transition.
- **Exploitation** : Vercel (web), InsForge (DB/Auth/Storage), Sentry pour erreurs et sauvegardes Postgres quotidiennes avant la commercialisation.

## Organisation du code

```text
app/                  routes Next.js : marketing, auth, onboarding, espace privé
components/           composants d'interface sans accès direct aux secrets
lib/
  domain/             règles métier par module et vocabulaire par type
  insforge/           clients navigateur et serveur
  payments/           contrats Provider et adaptateurs Mobile Money
  notifications/      contrats SMS, WhatsApp, email et notifications internes
insforge/migrations/  schéma versionné, fonctions SQL et RLS
```

Les commandes financières, les imports et les webhooks sont des routes serveur. Elles contrôlent le rôle, valident le payload, exécutent l'écriture atomique et ajoutent un journal d'audit. Les pages clientes ne sont jamais l'autorité métier.

## Modèle de données cible

| Domaine | Tables |
| --- | --- |
| Identité et tenant | `users` (vue de `auth.users`), `organizations`, `organization_types`, `organization_members`, `roles`, `permissions`, `role_permissions`, `settings` |
| Membres | `member_profiles`, `member_cards`, `member_tags`, `member_custom_fields`, `member_custom_field_values` |
| Finances | `contribution_plans`, `contributions`, `payments`, `payment_methods`, `cash_transactions`, `debts`, `loans`, `loan_repayments`, `solidarity_cases`, `solidarity_contributions`, `disbursements` |
| Vie de l'organisation | `events`, `event_attendance`, `messages`, `message_recipients`, `documents`, `reports`, `audit_logs` |
| Coopératives | `plots`, `harvests`, `sales`, `inputs`, `member_payouts` |
| ONG | `projects`, `project_budgets`, `beneficiaries`, `donors`, `donations`, `volunteers`, `impact_indicators` |
| Syndicat | `sectors`, `claims`, `claim_updates` |
| Parti politique | `local_sections`, `federations`, `campaigns`, `field_actions` |

Toutes les tables métier ci-dessus doivent contenir `id`, `organization_id`, `created_at`, `updated_at` lorsque pertinent, et une clé vers l'auteur pour les opérations sensibles. Les pièces jointes vivent dans un bucket Storage privé avec chemin `organization_id/...` et policy correspondante.

La migration `00001` crée le noyau d'authentification, de tenant et de trésorerie. La migration `00002` complète le modèle commercial avec 48 tables supplémentaires et resserre les politiques initiales selon les rôles. Les tables de liaison portent également `organization_id` lorsque l'accès est exposé au tenant : cela facilite RLS, indexation et diagnostics d'isolation.

## Contrat de sécurité

1. L'application cliente utilise uniquement la clé anon InsForge.
2. La clé service ne vit que dans les routes serveur/webhooks, jamais dans le navigateur.
3. Les rôles sont vérifiés à la fois dans l'interface et dans les RLS/procédures SQL ; cacher un bouton ne suffit jamais.
4. Toute opération financière produit une entrée dans `audit_logs`; les écritures confirmées sont immuables et corrigées par contre-écriture.
5. Les identifiants de paiement sont uniques par fournisseur pour absorber les retries Mobile Money.

## Livraison par étapes

1. **Fondation (faite)** : Auth, tenant, RLS, onboarding et dashboard contextualisé.
2. **MVP finance/membres** : CRUD membres, import CSV validé, plans de cotisation, encaissement, retards et caisse.
3. **Vie organisationnelle** : cartes, événements, convocations, messagerie, documents et rapports PDF.
4. **Finance avancée** : prêts, créances, solidarité et historique financier.
5. **Canaux et paiements** : Orange Money, Wave, MTN, Moov, SMS/WhatsApp/email, avec webhooks et réconciliation.
