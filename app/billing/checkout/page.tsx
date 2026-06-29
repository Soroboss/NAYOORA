import { redirect } from "next/navigation";
import { createClient } from "@/lib/insforge/server";
import { SubscriptionCheckout } from "@/components/subscription-checkout";

export default async function BillingCheckoutPage({ searchParams }: { searchParams: Promise<{ invoice?: string; payment?: string }> }) {
  const { invoice: invoiceId, payment } = await searchParams;
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/login");
  if (!invoiceId) redirect("/dashboard");
  const { data: invoice } = await client.from("saas_invoices").select("id,organization_id,subscription_id,amount,currency,status,due_at,organization:organizations(name)").eq("id", invoiceId).maybeSingle();
  if (!invoice) redirect("/dashboard");
  const { data: subscription } = await client.from("saas_subscriptions").select("plan:saas_plans(name,code,price_xof)").eq("id", invoice.subscription_id).maybeSingle();
  return <SubscriptionCheckout invoice={invoice} plan={(subscription?.plan as any) || null} paymentStatus={payment || null} />;
}
