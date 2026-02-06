"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError("")

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    const data = await response.json()
    setLoading(false)

    if (!response.ok) {
      setError(data.message || "Unable to request password reset")
      return
    }

    router.push(`/auth/reset-password?email=${encodeURIComponent(email)}`)
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Forgot password</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input className="w-full border rounded p-2" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {error ? <p className="text-red-600 text-sm">{error}</p> : null}
        <button className="w-full bg-black text-white rounded p-2 disabled:opacity-50" disabled={loading}>{loading ? "Sending..." : "Send reset code"}</button>
      </form>
    </main>
  )
}
