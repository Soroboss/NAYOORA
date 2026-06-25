export type OrganizationType =
  | "mutuelle"
  | "association"
  | "cooperative"
  | "tontine"
  | "syndicat"
  | "ong"
  | "parti_politique";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  organization_type: OrganizationType;
  currency: string;
};

export type DashboardMetric = { label: string; value: string; trend?: string };
