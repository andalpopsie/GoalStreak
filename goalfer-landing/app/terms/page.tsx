import { readFileSync } from "fs"
import { join } from "path"
import type { Metadata } from "next"
import { LegalShell } from "@/components/legal-shell"
import { LegalContent } from "@/components/legal-content"

export const metadata: Metadata = {
  title: "Terms of Service — Goalfer",
  description: "The terms that govern your use of Goalfer.",
}

export default function TermsPage() {
  const markdown = readFileSync(join(process.cwd(), "content", "terms.md"), "utf8")
  return (
    <LegalShell>
      <LegalContent markdown={markdown} />
    </LegalShell>
  )
}
