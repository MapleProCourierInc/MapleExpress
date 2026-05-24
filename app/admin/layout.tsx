import { redirect } from "next/navigation"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { getServerMe, isSuperAdmin } from "@/lib/server-me"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await getServerMe()

  if (!isSuperAdmin(me)) {
    redirect("/dashboard?section=shipments")
  }

  return (
    <div className="admin-shell min-h-screen">
      <AdminHeader displayName={me?.displayName} />
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex gap-6">
          <AdminSidebar />
          <main className="admin-main min-w-0 flex-1 rounded-lg border p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
