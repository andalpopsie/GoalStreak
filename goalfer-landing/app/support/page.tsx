import type { Metadata } from "next"
import { Mail, MessageCircle, Shield, ShieldOff } from "lucide-react"
import { LegalShell } from "@/components/legal-shell"

export const metadata: Metadata = {
  title: "Support — Goalfer",
  description: "Get help with Goalfer. Contact support, find answers, and learn how to stay safe.",
}

const SUPPORT_EMAIL = "hello@goalfer.app"

const faqs = [
  {
    q: "How do I create a habit?",
    a: "Tap the + button on the dashboard, name your habit, pick a category and how often you want to do it, then save. Your streak starts the first day you mark it complete.",
  },
  {
    q: "What does Goalfer Pro include?",
    a: "Pro lets you track up to 15 habits (the free plan includes 6), with more Pro features on the way. You can subscribe monthly or annually from the upgrade screen.",
  },
  {
    q: "How do I restore my subscription?",
    a: "Open Profile, then tap Restore Purchases. Your Pro access is tied to your Apple ID and will restore automatically after a reinstall or on a new device.",
  },
  {
    q: "How do I delete my account?",
    a: "Go to Profile, then Account settings, and choose Delete Account. This permanently removes your habits, streaks, and social data.",
  },
]

export default function SupportPage() {
  return (
    <LegalShell>
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Support</h1>
      <p className="text-base leading-relaxed text-muted-foreground mb-8">
        We&apos;re here to help you build habits that stick. Most questions are answered below — if
        you need anything else, reach out and we&apos;ll get back to you.
      </p>

      {/* Contact */}
      <section className="rounded-xl border border-border bg-card p-6 mb-10">
        <div className="flex items-center gap-3 mb-2">
          <Mail className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Contact us</h2>
        </div>
        <p className="text-muted-foreground">
          Email{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-primary underline hover:opacity-80 transition-opacity"
          >
            {SUPPORT_EMAIL}
          </a>{" "}
          and we typically reply within 1–2 business days.
        </p>
      </section>

      {/* FAQ */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-semibold text-foreground">Frequently asked questions</h2>
        </div>
        <div className="space-y-6">
          {faqs.map((item) => (
            <div key={item.q}>
              <h3 className="text-lg font-semibold text-foreground mb-1">{item.q}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Safety */}
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-semibold text-foreground">Safety, reporting &amp; blocking</h2>
        </div>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Goalfer has zero tolerance for objectionable content or abusive behavior. You can report or
          block other users directly in the app:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
          <li>
            <strong className="text-foreground">Report content</strong> — tap the ⋯ menu on any
            activity, group post, or chat message and choose Report.
          </li>
          <li>
            <strong className="text-foreground">Block a user</strong> — from a group member list or
            by long-pressing their chat message, choose Block. You&apos;ll immediately stop seeing
            each other.
          </li>
          <li className="flex items-start gap-1">
            <ShieldOff className="w-4 h-4 mt-1 shrink-0 text-muted-foreground" />
            <span>
              <strong className="text-foreground">Manage blocks</strong> — Profile → Blocked Users
              lets you review and unblock anyone.
            </span>
          </li>
        </ul>
        <p className="text-muted-foreground leading-relaxed">
          Reports are reviewed within 24 hours. To report abuse outside the app, email{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="text-primary underline hover:opacity-80 transition-opacity"
          >
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </section>

      <p className="text-sm text-muted-foreground">
        See also our{" "}
        <a href="/privacy" className="text-primary underline hover:opacity-80 transition-opacity">
          Privacy Policy
        </a>{" "}
        and{" "}
        <a href="/terms" className="text-primary underline hover:opacity-80 transition-opacity">
          Terms of Service
        </a>
        .
      </p>
    </LegalShell>
  )
}
