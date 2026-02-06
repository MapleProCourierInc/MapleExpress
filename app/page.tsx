import Link from "next/link"
import { Header } from "@/components/shared/header"

export default function LandingPage() {
  return (
    <div>
      <Header />
      <main className="mx-auto max-w-4xl p-8 space-y-6">
        <h1 className="text-4xl font-bold">MapleXpress</h1>
        <p className="text-lg text-muted-foreground">Fast, reliable courier services across Canada.</p>
        <div className="flex gap-3">
          <Link className="px-4 py-2 rounded bg-black text-white" href="/auth/signup">Create account</Link>
          <Link className="px-4 py-2 rounded border" href="/auth/login">Login</Link>
        </div>
      </main>
    </div>
  )
}
