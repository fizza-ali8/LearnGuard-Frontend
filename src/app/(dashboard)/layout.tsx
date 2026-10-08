import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardProviders } from "@/providers/dashboard-providers";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProviders>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProviders>
  );
}
