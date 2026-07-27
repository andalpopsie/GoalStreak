import { readFileSync } from "fs"
import { join } from "path"
import type { Metadata } from "next"
import { LegalShell } from "@/components/legal-shell"
import { LegalContent } from "@/components/legal-content"

export const metadata: Metadata = {
  title: "Privacy Policy — Goalfer",
  description: "How Goalfer collects, uses, and protects your information.",
}

export default function PrivacyPage() {
  const markdown = readFileSync(join(process.cwd(), "content", "privacy.md"), "utf8")
  return (
    <LegalShell>
      <LegalContent markdown={markdown} />
    </LegalShell>
  )
}
