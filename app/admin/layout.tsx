import { redirect } from "next/navigation"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { getServerMe, isSuperAdmin } from "@/lib/server-me"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await getServerMe()

  if (!isSuperAdmin(me)) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <AdminHeader displayName={me?.displayName} />
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex gap-6">
          <AdminSidebar />
          <main className="min-w-0 flex-1 rounded-lg border bg-background p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
