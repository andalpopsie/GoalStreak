"use client"

import { useState, type FormEvent } from "react"

/**
 * Email capture with an inline "Join waitlist" button (matches the hero
 * reference layout). On submit it validates the address and shows a
 * confirmation.
 *
 * NOTE: this currently only confirms client-side. Before launch, wire
 * `onSubmit` to a real provider (e.g. a Formspree endpoint, Mailchimp, or a
 * Firebase callable) so addresses are actually stored.
 */
export function WaitlistForm() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!valid) {
      setError("Please enter a valid email address.")
      return
    }
    setError("")
    setSubmitted(true)
    // TODO: POST `email` to the waitlist provider here.
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-card px-6 py-4 text-center">
        <p className="font-medium text-foreground">You&apos;re on the list! 🎉</p>
        <p className="text-sm text-muted-foreground mt-1">
          We&apos;ll email {email} with launch news and early access.
        </p>
      </div>
    )
  }

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
          className="flex-1 bg-transparent px-3 py-2 text-base text-foreground placeholder:text-muted-foreground outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Join waitlist
        </button>
      </div>
      {error ? (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">Be first to know when Android launches.</p>
      )}
    </form>
  )
}
