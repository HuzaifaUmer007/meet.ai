import { SidebarProvider } from "@/components/ui/sidebar";

import { DashboardNavbar } from "@/modules/dashboard/ui/components/dashboard-navbar";
import { DashboardSidebar } from "@/modules/dashboard/ui/components/dashboard-sidebar";
import { getUserUsage } from "@/app/actions/subscriptions";
import { SuccessNotification } from "@/components/success-notification";

interface Props {
  children: React.ReactNode;
}

const Layout = async ({ children }: Props) => {
  const usage = await getUserUsage();

  return ( 
    <SidebarProvider>
      <SuccessNotification />
      <DashboardSidebar initialUsage={usage} />
      <main className="flex flex-col h-screen w-screen bg-muted">
        <DashboardNavbar />
        {children}
      </main>
    </SidebarProvider>
  );
};
 
export default Layout;
