# ADR-0003: TypeScript with strict mode enabled

**Date:** 2024-08-01
**Status:** Accepted

## Context
The app has 14 Firebase services, 11 screens, and complex data models (habits, streaks, social graph). Without type safety, refactoring and onboarding become error-prone at this scale.

## Decision
Use TypeScript throughout with `strict: true` in tsconfig. All components, services, hooks, and utilities are typed. No `any` except where explicitly justified with a comment.

## Consequences
- Catches data shape mismatches at compile time (especially important for Firestore document mapping)
- Refactoring is safer and faster
- Slightly higher upfront cost when writing new code
- IDE autocomplete is significantly better

## Alternatives considered
- **Plain JavaScript** — faster to start but would accumulate technical debt quickly given the complexity of the data layer
- **TypeScript without strict** — easier initially but leaves the most common error classes unchecked
