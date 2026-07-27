import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

/**
 * Renders a legal/markdown document with Tailwind-styled elements.
 * Used by the /privacy and /terms pages. No typography plugin required —
 * element styling is mapped explicitly so it matches the site theme.
 */
export function LegalContent({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-xl font-semibold text-foreground mt-8 mb-3">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="text-base leading-relaxed text-muted-foreground mb-4">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-6 mb-4 space-y-2 text-muted-foreground">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-6 mb-4 space-y-2 text-muted-foreground">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        a: ({ href, children }) => (
          <a href={href} className="text-primary underline hover:opacity-80 transition-opacity">
            {children}
          </a>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        hr: () => <hr className="my-8 border-border" />,
        table: ({ children }) => (
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-left border-collapse">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-border px-3 py-2 font-semibold text-foreground">{children}</th>
        ),
        td: ({ children }) => (
          <td className="border border-border px-3 py-2 text-muted-foreground">{children}</td>
        ),
        code: ({ children }) => (
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm text-foreground">{children}</code>
        ),
      }}
    >
      {markdown}
    </ReactMarkdown>
  )
}
