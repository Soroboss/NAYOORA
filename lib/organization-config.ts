import type { OrganizationType } from "@/lib/types";

export const organizationTypes: Record<OrganizationType, {
  label: string;
  description: string;
  icon: string;
  navigation: string[];
  metrics: { label: string; value: string; trend?: string }[];
  actions: string[];
}> = {
  mutuelle: {
    label: "Mutuelle", icon: "✦", description: "Solidarité, cotisations et protection des membres.",
    navigation: ["Membres", "Cotisations", "Prêts", "Solidarité", "Caisse", "Assemblées", "Rapports"],
    metrics: [{ label: "Membres actifs", value: "0" }, { label: "Cotisations ce mois", value: "0 FCFA" }, { label: "Fonds de solidarité", value: "0 FCFA" }, { label: "Retards", value: "0" }],
    actions: ["Ajouter un membre", "Enregistrer un paiement", "Créer un soutien"]
  },
  association: {
    label: "Association", icon: "◎", description: "Animez votre communauté et vos activités.",
    navigation: ["Membres", "Cotisations", "Événements", "Projets", "Réunions", "Messages", "Rapports"],
    metrics: [{ label: "Membres actifs", value: "0" }, { label: "Cotisations ce mois", value: "0 FCFA" }, { label: "Événements à venir", value: "0" }, { label: "Projets actifs", value: "0" }],
    actions: ["Ajouter un membre", "Créer un événement", "Envoyer un message"]
  },
  cooperative: {
    label: "Coopérative", icon: "◒", description: "Pilotez producteurs, récoltes et revenus.",
    navigation: ["Producteurs", "Cotisations", "Parcelles", "Récoltes", "Ventes", "Intrants", "Rapports"],
    metrics: [{ label: "Producteurs actifs", value: "0" }, { label: "Récoltes déclarées", value: "0" }, { label: "Ventes du mois", value: "0 FCFA" }, { label: "Paiements à effectuer", value: "0" }],
    actions: ["Ajouter un producteur", "Déclarer une récolte", "Enregistrer une vente"]
  },
  tontine: {
    label: "Tontine", icon: "◍", description: "Gérez les tours, les encaissements, les bénéficiaires et les reversements.",
    navigation: ["Membres", "Tontine", "Encaissements", "Reversements", "Commissions", "Caisse", "Rapports"],
    metrics: [{ label: "Participants actifs", value: "0" }, { label: "À encaisser", value: "0 FCFA" }, { label: "Prochain bénéficiaire", value: "À définir" }, { label: "Commissions", value: "0 FCFA" }],
    actions: ["Créer un groupe tontine", "Ajouter un participant", "Planifier un reversement"]
  },
  syndicat: {
    label: "Syndicat", icon: "↗", description: "Fédérez les adhérents et portez leurs voix.",
    navigation: ["Adhérents", "Cotisations", "Secteurs", "Revendications", "Réunions", "Documents", "Rapports"],
    metrics: [{ label: "Adhérents actifs", value: "0" }, { label: "Cotisations ce mois", value: "0 FCFA" }, { label: "Revendications ouvertes", value: "0" }, { label: "Réunions prévues", value: "0" }],
    actions: ["Ajouter un adhérent", "Créer une revendication", "Planifier une réunion"]
  },
  ong: {
    label: "ONG", icon: "♥", description: "Mesurez l'impact de vos programmes avec rigueur.",
    navigation: ["Membres", "Bénéficiaires", "Projets", "Donateurs", "Volontaires", "Budgets", "Rapports"],
    metrics: [{ label: "Bénéficiaires", value: "0" }, { label: "Projets actifs", value: "0" }, { label: "Budget engagé", value: "0 FCFA" }, { label: "Volontaires", value: "0" }],
    actions: ["Ajouter un bénéficiaire", "Créer un projet", "Ajouter un donateur"]
  },
  parti_politique: {
    label: "Parti politique", icon: "◆", description: "Structurez les territoires et mobilisez les militants.",
    navigation: ["Militants", "Cotisations", "Sections locales", "Fédérations", "Campagnes", "Mobilisation", "Rapports"],
    metrics: [{ label: "Militants actifs", value: "0" }, { label: "Sections locales", value: "0" }, { label: "Cotisations ce mois", value: "0 FCFA" }, { label: "Actions terrain", value: "0" }],
    actions: ["Ajouter un militant", "Créer une section", "Lancer une campagne"]
  }
};
