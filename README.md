# NAYOORA

SaaS multi-tenant pour la gestion d'organisations africaines.

## Démarrer

1. Créez un projet InsForge puis exécutez les migrations dans l'ordre : `00001_initial_schema.sql`, puis `00002_complete_domain_schema.sql`.
2. Copiez `.env.example` vers `.env.local` et renseignez les clés publiques InsForge.
3. Installez les dépendances : `npm install`.
4. Lancez l'application : `npm run dev`.

L'inscription dirige vers l'onboarding. Après création de l'organisation, le dashboard adapte ses libellés et raccourcis au type choisi.

## Décisions d'architecture

- `organization_id` est obligatoire sur toute donnée métier.
- Les règles RLS utilisent l'appartenance active dans `organization_members`.
- Les écritures métier passent par des API Routes / Server Actions, jamais par une clé de service côté navigateur.
- Les paiements sont modélisés avec un statut et un fournisseur : le raccordement Wave, Orange, MTN ou Moov se fera via webhooks vérifiés et une couche `payments/providers`.
