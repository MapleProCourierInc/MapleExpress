"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError("")

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()
    setLoading(false)

    if (!response.ok) {
      setError(data.message || "Unable to login.")
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Log in</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input className="w-full border rounded p-2" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full border rounded p-2" type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <p className="text-sm text-gray-600">Password must be at least 8 characters with uppercase, lowercase, number, and symbol.</p>
        {error ? <p className="text-red-600 text-sm">{error}</p> : null}
        <button className="w-full bg-black text-white rounded p-2 disabled:opacity-50" disabled={loading}>{loading ? "Logging in..." : "Log in"}</button>
      </form>
      <div className="text-sm mt-4 space-y-1">
        <p><Link className="underline" href="/auth/forgot-password">Forgot password?</Link></p>
        <p>Need an account? <Link className="underline" href="/auth/signup">Sign up</Link></p>
      </div>
    </main>
  )
}
