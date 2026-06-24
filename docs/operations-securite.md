# Exploitation et sécurité multi-tenant — NAYOORA

## Isolation des tenants

`organization_id` est la clé tenant canonique. Toute table métier doit l’avoir, être indexée dessus et disposer de RLS. Ne créez pas de second `tenant_id` : il dupliquerait le risque et compliquerait les jointures.

Les seules données volontairement globales sont l’identité (`auth.users`, `user_profiles`), le catalogue de permissions, les plans SaaS et les administrateurs de plateforme. Elles ne portent jamais les données métier d’une organisation.

## RLS et permissions

- Toute lecture/écriture tenant vérifie l’adhésion active à `organization_members`.
- Les opérations financières utilisent `can_manage_finance`.
- Les opérations d’administration utilisent `can_manage_organization`.
- `organization_role_permissions` permet des permissions par organisation, sans partager une configuration entre tenants.
- Les triggers `assert_same_organization` empêchent les références croisées, même lorsqu’un identifiant est connu.

## Sauvegardes automatiques

À activer avant production dans Supabase :

1. Point-in-Time Recovery et sauvegardes quotidiennes du projet.
2. Export logique chiffré quotidien de PostgreSQL vers un bucket privé hors projet, conservé au moins 30 jours.
3. Test mensuel de restauration sur un projet Supabase de préproduction.
4. Alertes en cas d’échec de backup ou de restauration.

Les secrets d’accès au bucket, aux exports et aux prestataires de paiement vivent uniquement dans les secrets Supabase/Vercel, jamais dans le navigateur ni dans les tables applicatives.
