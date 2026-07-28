"use client"

import { useState, type FormEvent } from "react"

/**
 * Email capture with an inline "Join waitlist" button.
 *
 * Submits to Loops.so via its public newsletter-form endpoint (no API key
 * required — safe for a static client). The form id is public; it can be
 * overridden with NEXT_PUBLIC_LOOPS_FORM_ID but falls back to the Goalfer
 * waitlist form so it works without extra config.
 */
const LOOPS_FORM_ID = process.env.NEXT_PUBLIC_LOOPS_FORM_ID ?? "cms33zhuj00cf0j6igvycqh8q"
const LOOPS_ENDPOINT = `https://app.loops.so/api/newsletter-form/${LOOPS_FORM_ID}`

// Loops rate-limits signups to one per minute per browser.
const RATE_LIMIT_MS = 60_000

export function WaitlistForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [error, setError] = useState("")

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!valid) {
      setStatus("error")
      setError("Please enter a valid email address.")
      return
    }

    // Client-side rate limit (mirrors Loops' own embed behaviour).
    const now = Date.now()
    const previous = Number(localStorage.getItem("loops-form-timestamp") ?? 0)
    if (previous && previous + RATE_LIMIT_MS > now) {
      setStatus("error")
      setError("You just signed up — please try again in a minute.")
      return
    }
    localStorage.setItem("loops-form-timestamp", String(now))

    setStatus("loading")
    setError("")

    try {
      const body = `userGroup=&mailingLists=&email=${encodeURIComponent(email)}`
      const res = await fetch(LOOPS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      })

      if (res.ok) {
        setStatus("success")
        return
      }

      const data = await res.json().catch(() => null)
      setStatus("error")
      setError(data?.message ?? "Couldn't sign you up. Please try again.")
      localStorage.setItem("loops-form-timestamp", "")
    } catch {
      setStatus("error")
      setError("Network error. Please try again.")
      localStorage.setItem("loops-form-timestamp", "")
    }
  }

  if (status === "success") {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card px-6 py-4 text-center">
        <p className="font-medium text-foreground">You&apos;re on the list! 🎉</p>
        <p className="text-sm text-muted-foreground mt-1">
          We&apos;ll email {email} with launch news and early access.
        </p>
      </div>
    )
  }

  const loading = status === "loading"

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md" noValidate>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          aria-label="Email address"
          disabled={loading}
          className="flex-1 bg-transparent px-3 py-2 text-base text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-70"
        >
          {loading ? "Joining…" : "Join waitlist"}
        </button>
      </div>
      {status === "error" ? (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Be first to know when Android launches.</p>
      )}
    </form>
  )
}
