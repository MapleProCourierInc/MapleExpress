"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError("")

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()
    setLoading(false)

    if (!response.ok) {
      setError(data.message || "Unable to sign up.")
      return
    }

    router.push(`/auth/confirm?email=${encodeURIComponent(email)}`)
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Create account</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input className="w-full border rounded p-2" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full border rounded p-2" type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <p className="text-sm text-gray-600">Password must be at least 8 characters with uppercase, lowercase, number, and symbol.</p>
        {error ? <p className="text-red-600 text-sm">{error}</p> : null}
        <button className="w-full bg-black text-white rounded p-2 disabled:opacity-50" disabled={loading}>{loading ? "Creating..." : "Sign up"}</button>
      </form>
      <p className="text-sm mt-4">Already have an account? <Link className="underline" href="/auth/login">Log in</Link></p>
    </main>
  )
}
