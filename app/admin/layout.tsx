import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { getServerMe, isSuperAdmin } from "@/lib/server-me"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await getServerMe()

  if (!isSuperAdmin(me)) {
    redirect("/dashboard?section=shipments")
  }

  return (
    <div className="admin-shell min-h-screen">
      <div className="flex h-screen overflow-hidden">
        <AdminSidebar displayName={me?.displayName} />
        <main className="admin-main min-w-0 flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
