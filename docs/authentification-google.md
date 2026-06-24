# Connexion Google — NAYOORA

Le bouton **Continuer avec Google** de `/login` et `/signup` utilise InsForge. Il reste volontairement inactif tant que la clé publique InsForge n’est pas présente : aucun identifiant administrateur n’est exposé au navigateur.

## Variables Vercel

Ajoutez ces variables dans **Vercel → Project Settings → Environment Variables** (Production, Preview et Development) :

```bash
NEXT_PUBLIC_INSFORGE_URL=https://c6xceve3.us-west.insforge.app
NEXT_PUBLIC_INSFORGE_ANON_KEY=<clé ANON_KEY InsForge>
```

La clé anonyme se récupère localement avec `npx @insforge/cli secrets get ANON_KEY`. Ne jamais utiliser ni publier la clé API administrateur.

## URLs de redirection

Dans `insforge.toml`, remplacez `https://nayoora.vercel.app/**` par l’URL finale du projet Vercel, puis appliquez la configuration :

```bash
npx @insforge/cli config plan
npx @insforge/cli config apply
```

Conservez également `http://localhost:3000/**` pour le développement. Le parcours OAuth retourne vers `/login` après l’autorisation Google.

## Google Cloud Console

Dans le client OAuth Google lié à InsForge, la redirection autorisée doit être exactement :

```text
https://c6xceve3.us-west.insforge.app/api/auth/oauth/google/callback
```

Le fournisseur Google est déjà activé dans le projet InsForge. Il faut toutefois vérifier que les identifiants OAuth du projet Google sont bien enregistrés côté InsForge avant la mise en production.

## Point d’intégration actuel

Le nouveau bouton Google est intégré à InsForge. Les parcours historiques par email et les modules métier sont encore reliés au client InsForge présent dans l’application. Avant de diriger un compte Google vers les modules privés, la prochaine étape est de migrer l’authentification de session et les tables multi-tenant vers InsForge, puis de tester le parcours complet création d’organisation → tableau de bord.
