import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "../(auth)/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);

  if (!session) {
    redirect("/api/auth/guest");
  }

  // TODO: Add admin role check
  // if (session.user.role !== 'admin') {
  //   redirect('/');
  // }

  const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AdminSidebar user={session?.user} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
