import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  return (
    <AdminShell userName={session.user.name ?? "Admin"} userRole={(session.user as { role?: string }).role ?? "MANAGER"}>
      {children}
    </AdminShell>
  );
}
