import Link from "next/link"
import type { ReactNode } from "react"

/**
 * Shared shell for legal/support pages: branded header, centered content
 * column, and a footer with cross-links. Matches the landing page theme.
 */
export function LegalShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="Goalfer" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-bold text-foreground">Goalfer</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-12 px-4">
        <article className="container mx-auto max-w-3xl">{children}</article>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border bg-muted/20">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            © 2026 Evangeline Andal. All rights reserved.
          </span>
          <nav className="flex space-x-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/support" className="hover:text-foreground transition-colors">
              Support
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
