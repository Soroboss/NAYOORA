import { redirect } from "next/navigation";
import { createClient } from "@/lib/insforge/server";
import { SubscriptionCheckout } from "@/components/subscription-checkout";

export default async function BillingCheckoutPage({ searchParams }: { searchParams: Promise<{ invoice?: string; payment?: string }> }) {
  const { invoice: invoiceId, payment } = await searchParams;
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/login");
  if (!invoiceId) redirect("/dashboard");
  const { data: invoice } = await client.from("saas_invoices").select("id,organization_id,subscription_id,plan_id,amount,currency,status,due_at,organization:organizations(name),plan:saas_plans(name,code,price_xof)").eq("id", invoiceId).maybeSingle();
  if (!invoice) redirect("/dashboard");
  return <SubscriptionCheckout invoice={invoice} plan={(invoice.plan as any) || null} paymentStatus={payment || null} />;
}
