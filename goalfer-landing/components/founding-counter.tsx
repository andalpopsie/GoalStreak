"use client"

import { useEffect, useState } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

// ---------------------------------------------------------------------------
// Pure view-model helper (fully unit-testable, no I/O)
// ---------------------------------------------------------------------------

export type CounterStatus = "loading" | "available" | "sold-out" | "hidden"

export interface FoundingCounterView {
  status: CounterStatus
  /** cap − claimed, clamped to ≥ 0 */
  remaining: number
}

/**
 * Derives the counter view state from the raw Firestore value.
 *
 * @param claimed  Integer from `counters/foundingMembers.claimed`, or `null`
 *                 when the document could not be read (R10.4).
 * @param cap      Founding_Cap (100).
 */
export function computeCounterView(
  claimed: number | null,
  cap: number,
): FoundingCounterView {
  // Read failure → hide the indicator (R10.4)
  if (claimed === null) {
    return { status: "hidden", remaining: 0 }
  }

  // cap === 0 is always sold out (R11.4)
  if (cap === 0) {
    return { status: "sold-out", remaining: 0 }
  }

  const remaining = Math.max(0, cap - claimed)

  // All slots claimed → sold-out state, show 0 remaining (R10.6, R11.1)
  if (claimed >= cap) {
    return { status: "sold-out", remaining: 0 }
  }

  // Spots still available (R10.2)
  return { status: "available", remaining }
}

// ---------------------------------------------------------------------------
// React component
// ---------------------------------------------------------------------------

const FOUNDING_CAP = 100
/** Spots remaining at or below which the urgency (orange) styling activates. */
const URGENCY_THRESHOLD = 10

/**
 * Live scarcity counter for the landing page hero.
 *
 * Subscribes to `counters/foundingMembers` via `onSnapshot` so the display
 * updates in real-time without a page reload (R10.3, R11.2).
 *
 * States:
 *   loading   — initial render before the first Firestore response
 *   available — "X of 100 founding spots left"             (R10.2)
 *   sold-out  — "0 of 100 · Founding spots are gone"       (R10.6, R11.1)
 *   hidden    — read failed; indicator removed silently     (R10.4)
 *
 * The RevenueCat secret is never referenced here (R10.5).
 */
export function FoundingCounter() {
  const [view, setView] = useState<FoundingCounterView>({
    status: "loading",
    remaining: 0,
  })

  useEffect(() => {
    const counterRef = doc(db, "counters", "foundingMembers")

    const unsubscribe = onSnapshot(
      counterRef,
      (snap) => {
        if (!snap.exists()) {
          // Document hasn't been created yet — treat as 0 claimed (program not started)
          setView(computeCounterView(0, FOUNDING_CAP))
          return
        }
        const claimed = snap.data()?.claimed
        // Validate that claimed is a finite number; treat unexpected values as read failure
        const parsedClaimed =
          typeof claimed === "number" && isFinite(claimed) ? Math.floor(claimed) : null
        setView(computeCounterView(parsedClaimed, FOUNDING_CAP))
      },
      (_error) => {
        // Firestore read failed → hide the indicator (R10.4)
        setView(computeCounterView(null, FOUNDING_CAP))
      },
    )

    return () => unsubscribe()
  }, [])

  // Hidden state: render nothing — download + waitlist CTAs remain in the
  // parent (R10.4, R11.3). Loading state also renders nothing (no flash).
  if (view.status === "hidden" || view.status === "loading") {
    return null
  }

  if (view.status === "sold-out") {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Founding spots sold out"
        className="inline-flex flex-col items-center gap-1"
      >
        {/* Zero-remaining pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2">
          {/* Sold-out dot */}
          <span className="h-2 w-2 rounded-full bg-muted-foreground/50" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">
            <strong>0 of {FOUNDING_CAP}</strong> founding spots left
          </span>
        </div>
        {/* Sold-out messaging (R11.1) */}
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Founding spots are gone
        </p>
      </div>
    )
  }

  // available state — show remaining count (R10.2)
  const isLastFew = view.remaining <= URGENCY_THRESHOLD

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`${view.remaining} of ${FOUNDING_CAP} founding spots remaining`}
      className="inline-flex flex-col items-center gap-1"
    >
      <div
        className={[
          "inline-flex items-center gap-2 rounded-full border px-4 py-2 transition-colors",
          isLastFew
            ? "border-orange-200 bg-orange-50 dark:border-orange-800/40 dark:bg-orange-950/30"
            : "border-border bg-muted/50",
        ].join(" ")}
      >
        {/* Urgency dot — pulses when ≤10 spots remain */}
        <span
          className={[
            "h-2 w-2 rounded-full",
            isLastFew ? "animate-pulse bg-orange-500" : "bg-primary",
          ].join(" ")}
          aria-hidden="true"
        />
        <span
          className={[
            "text-sm font-semibold",
            isLastFew ? "text-orange-700 dark:text-orange-400" : "text-foreground",
          ].join(" ")}
        >
          <strong>{view.remaining} of {FOUNDING_CAP}</strong> founding spots left
        </span>
      </div>
      {isLastFew && (
        <p className="text-xs font-medium uppercase tracking-wide text-orange-600 dark:text-orange-500">
          Almost gone — secure yours now
        </p>
      )}
    </div>
  )
}
