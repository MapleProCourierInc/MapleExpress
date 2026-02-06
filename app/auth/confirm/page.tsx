"use client"

import { FormEvent, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function ConfirmSignupPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState(params.get("email") ?? "")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const confirm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    const response = await fetch("/api/auth/confirm-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    })

    const data = await response.json()
    setLoading(false)

    if (!response.ok) {
      setError(data.message || "Unable to confirm account")
      return
    }

    router.push("/auth/login")
  }

  const resend = async () => {
    setLoading(true)
    setError("")
    setMessage("")
    const response = await fetch("/api/auth/resend-signup-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    const data = await response.json()
    setLoading(false)

    if (!response.ok) {
      setError(data.message || "Unable to resend code")
      return
    }
    setMessage("A new confirmation code has been sent.")
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Confirm your email</h1>
      <form className="space-y-4" onSubmit={confirm}>
        <input className="w-full border rounded p-2" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full border rounded p-2" required placeholder="Confirmation code" value={code} onChange={(e) => setCode(e.target.value)} />
        {error ? <p className="text-red-600 text-sm">{error}</p> : null}
        {message ? <p className="text-green-700 text-sm">{message}</p> : null}
        <button className="w-full bg-black text-white rounded p-2 disabled:opacity-50" disabled={loading}>{loading ? "Confirming..." : "Confirm account"}</button>
      </form>
      <button className="underline text-sm" onClick={resend} disabled={loading}>Resend code</button>
    </main>
  )
}
