"use client"

import { FormEvent, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function ResetPasswordPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState(params.get("email") ?? "")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError("")

    const response = await fetch("/api/auth/forgot-password-submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, newPassword }),
    })

    const data = await response.json()
    setLoading(false)

    if (!response.ok) {
      setError(data.message || "Unable to reset password")
      return
    }

    router.push("/auth/login")
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Reset password</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input className="w-full border rounded p-2" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full border rounded p-2" required placeholder="Reset code" value={code} onChange={(e) => setCode(e.target.value)} />
        <input className="w-full border rounded p-2" type="password" required placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <p className="text-sm text-gray-600">Use a strong password with 8+ characters, uppercase, lowercase, number, and symbol.</p>
        {error ? <p className="text-red-600 text-sm">{error}</p> : null}
        <button className="w-full bg-black text-white rounded p-2 disabled:opacity-50" disabled={loading}>{loading ? "Updating..." : "Set new password"}</button>
      </form>
    </main>
  )
}
