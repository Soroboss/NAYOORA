import { getCurrentOrganizationContext } from "@/lib/current-organization";
import { PaywallScreen } from "@/components/paywall-screen";
import { headers } from "next/headers";
import { MobileSidebarToggle } from "@/components/mobile-sidebar-toggle";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Catch the current headers (Next.js layout runs per page load)
  const headersList = await headers();
  const currentPath = headersList.get("x-invoke-path") || "";
  
  // We don't block the actual organization switch or generic insights sometimes, 
  // but for now let's block everything if isLimitReached.
  const { isLimitReached } = await getCurrentOrganizationContext();

  if (isLimitReached) {
    return <PaywallScreen />;
  }

  return (
    <>
      <MobileSidebarToggle />
      {children}
    </>
  );
}
