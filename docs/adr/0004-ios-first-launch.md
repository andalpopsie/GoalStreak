# ADR-0004: iOS-first launch strategy

**Date:** 2024-11-01
**Status:** Accepted

## Context
Submitting to both App Store and Google Play simultaneously doubles the compliance, asset preparation, and review overhead. The target early adopter demographic skews iOS. Android support is already built (React Native), just not submitted.

## Decision
Launch on iOS App Store first. Android Play Store submission to follow post-launch once iOS is stable and initial user feedback is incorporated.

## Consequences
- Faster time to first real users
- Focused QA and submission effort on one platform
- Android users excluded from v1 launch
- React Native codebase already supports Android — no rework needed when the time comes

## Alternatives considered
- **Simultaneous iOS + Android** — doubles submission effort and review risk for no clear benefit at launch scale
- **Android-first** — no strong reason given target demographic
