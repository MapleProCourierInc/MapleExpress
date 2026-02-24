import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerMe, isSuperAdmin } from "@/lib/server-me"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await getServerMe()

  if (!isSuperAdmin(me)) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex gap-6">
          <aside className="w-56 shrink-0 rounded-lg border bg-background p-4">
            <h1 className="mb-4 text-lg font-semibold">Admin Portal</h1>
            <nav className="space-y-2 text-sm">
              <Link href="/admin/drivers" className="block rounded-md px-3 py-2 hover:bg-muted">
                Drivers
              </Link>
              <div className="rounded-md px-3 py-2 text-muted-foreground">More tools coming soon</div>
            </nav>
          </aside>
          <main className="min-w-0 flex-1 rounded-lg border bg-background p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
